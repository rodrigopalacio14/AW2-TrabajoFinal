import jwt from "jsonwebtoken";
import { Usuario } from "../models/Usuario.js";
import { idValido } from "../models/validaciones.js";

export function crearToken(id) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(id),
    expiresIn: "1h"
  });
}

export function autenticar(req, res, next) {
  const bearer = /^Bearer\s+(\S+)$/i.exec(req.get("Authorization") ?? "");
  let datos;
  try {
    if (bearer) datos = jwt.verify(bearer[1], process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    // La misma respuesta aplica a un token vencido y a uno inválido.
  }
  const id = Number(datos?.sub);
  if (!idValido(id) || !Number.isFinite(datos?.exp)) {
    return res.status(401).json({ error: "Iniciá sesión con un token válido." });
  }
  req.idUsuario = id;
  next();
}

async function esAdministrador(id) {
  return Boolean(await Usuario.exists({ id, rol: "admin", activo: true }));
}

export async function autorizarAdmin(req, res, next) {
  if (!await esAdministrador(req.idUsuario)) {
    return res.status(403).json({ error: "Se requiere una cuenta administradora activa." });
  }
  next();
}

export async function autorizarCuenta(req, res, next) {
  if (req.idUsuario !== Number(req.params.id) && !await esAdministrador(req.idUsuario)) {
    return res.status(403).json({ error: "Esta operación requiere ser titular de la cuenta o administrador." });
  }
  next();
}
