import bcrypt from "bcryptjs";
import { Usuario, Venta, reservarComprador, siguienteId } from "../models/index.js";
import { datosUsuarioValidos, normalizarEmail, passwordValida, textoValido } from "../models/validaciones.js";
import { crearToken } from "../middlewares/auth.middleware.js";

const campos = ["nombre", "apellido", "email", "password", "direccion", "activo"];

export async function listarUsuarios(_req, res) {
  try {
    res.status(200).json(await Usuario.find().sort({ id: 1 }));
  } catch {
    res.status(500).json({ error: "No se pudieron leer los usuarios." });
  }
}

export async function obtenerUsuario(req, res) {
  try {
    const usuario = await Usuario.findOne({ id: Number(req.params.id) || 0 });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado." });
    res.status(200).json(usuario);
  } catch {
    res.status(500).json({ error: "No se pudo leer el usuario." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!textoValido(email) || !textoValido(password)) {
      return res.status(400).json({ error: "Se requieren email y password." });
    }

    const usuario = await Usuario.findOne({ email: normalizarEmail(email) }).select("+password");
    if (!usuario || !passwordValida(password) || !(await bcrypt.compare(password, usuario.password))) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    res.status(200).json({
      mensaje: `Bienvenido, ${usuario.nombre}.`,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.activo ? usuario.rol : "cliente" },
      token: crearToken(usuario.id)
    });
  } catch {
    res.status(500).json({ error: "No se pudo verificar el login." });
  }
}

export async function crearUsuario(req, res) {
  try {
    const { nombre, apellido, email, password, direccion, activo } = req.body || {};
    if (!datosUsuarioValidos({ nombre, apellido, email, direccion, activo }) || !passwordValida(password)) {
      return res.status(400).json({ error: "Completá nombre, apellido, email, password (hasta 72 bytes), direccion y activo (booleano)." });
    }

    const hash = await bcrypt.hash(password, 12);
    const usuario = await Usuario.create({
      id: await siguienteId(Usuario),
      nombre, apellido, email: normalizarEmail(email), password: hash, direccion, activo
    });
    res.status(201).json(usuario);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ error: "Ya existe un usuario con ese email." });
    }
    res.status(500).json({ error: "No se pudo guardar el usuario." });
  }
}

export async function actualizarUsuario(req, res) {
  try {
    const usuario = await Usuario.findOne({ id: Number(req.params.id) });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado." });

    const datos = req.body || {};
    const cambios = Object.fromEntries(campos.filter((campo) => datos[campo] !== undefined)
      .map((campo) => [campo, datos[campo]]));
    if (!Object.keys(cambios).length) {
      return res.status(400).json({ error: "Enviá al menos un campo editable del usuario." });
    }
    if (!datosUsuarioValidos({ ...usuario.toJSON(), ...cambios })
      || ("password" in cambios && !passwordValida(cambios.password))) {
      return res.status(400).json({ error: "Los datos del usuario no son válidos. La contraseña admite hasta 72 bytes." });
    }

    if ("email" in cambios) cambios.email = normalizarEmail(cambios.email);
    if ("password" in cambios) cambios.password = await bcrypt.hash(cambios.password, 12);
    usuario.set(cambios);
    await usuario.save();
    res.status(200).json(usuario);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ error: "Ya existe un usuario con ese email." });
    }
    res.status(500).json({ error: "No se pudo actualizar el usuario." });
  }
}

export async function eliminarUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    const estado = await Usuario.db.transaction(async (session) => {
      const { matchedCount } = await reservarComprador(id, session);
      if (!matchedCount) return 404;
      if (await Venta.exists({ id_usuario: id }).session(session)) return 409;

      await Usuario.deleteOne({ id }, { session });
      return 200;
    });

    if (estado === 404) return res.status(404).json({ error: "Usuario no encontrado." });
    if (estado === 409) {
      return res.status(409).json({ error: "El usuario tiene ventas relacionadas y no puede eliminarse." });
    }
    res.status(200).json({ mensaje: "Usuario eliminado." });
  } catch {
    res.status(500).json({ error: "No se pudo eliminar el usuario." });
  }
}
