import { Router } from "express";
import { readFile, writeFile } from "fs/promises";

const router = Router();
const archivoUsuarios = "./data/usuarios.json";
const archivoVentas = "./data/ventas.json";

const leerUsuarios = async () => {
  const datos = await readFile(archivoUsuarios, "utf-8");
  return JSON.parse(datos);
};

const guardarUsuarios = async (usuarios) => {
  await writeFile(archivoUsuarios, JSON.stringify(usuarios, null, 2));
};

// Se validan los mismos campos para crear y actualizar.
const datosValidos = (usuario) => {
  const textos = [usuario.nombre, usuario.apellido, usuario.email,
    usuario.password, usuario.direccion];
  return textos.every((texto) => typeof texto === "string" && texto.trim() !== "")
    && usuario.email.includes("@") && typeof usuario.activo === "boolean";
};

router.get("/", async (req, res) => {
  try {
    res.status(200).json(await leerUsuarios());
  } catch (error) {
    res.status(500).json({ error: "No se pudieron leer los usuarios." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const usuarios = await leerUsuarios();
    const usuario = usuarios.find((u) => u.id === Number(req.params.id));
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado." });
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: "No se pudo leer el usuario." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || !email.trim()
      || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ error: "Se requieren email y password." });
    }
    const usuarios = await leerUsuarios();
    const usuario = usuarios.find((u) =>
      u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!usuario) return res.status(401).json({ error: "Credenciales incorrectas." });
    res.status(200).json({ mensaje: `Bienvenido, ${usuario.nombre}.` });
  } catch (error) {
    res.status(500).json({ error: "No se pudo verificar el login." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, email, password, direccion, activo } = req.body || {};
    const nuevoUsuario = { nombre, apellido, email, password, direccion, activo };
    if (!datosValidos(nuevoUsuario)) {
      return res.status(400).json({ error: "Completá nombre, apellido, email, password, direccion y activo (booleano)." });
    }
    nuevoUsuario.email = email.trim().toLowerCase();
    const usuarios = await leerUsuarios();
    if (usuarios.find((u) => u.email.toLowerCase() === nuevoUsuario.email)) {
      return res.status(409).json({ error: "Ya existe un usuario con ese email." });
    }
    // Se usa el mayor ID, porque pueden haberse eliminado registros intermedios.
    nuevoUsuario.id = Math.max(0, ...usuarios.map((u) => u.id)) + 1;
    usuarios.push(nuevoUsuario);
    await guardarUsuarios(usuarios);
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    res.status(500).json({ error: "No se pudo guardar el usuario." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const usuarios = await leerUsuarios();
    const usuario = usuarios.find((u) => u.id === Number(req.params.id));
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado." });
    const datos = req.body || {};
    const campos = ["nombre", "apellido", "email", "password", "direccion", "activo"];
    if (!campos.some((campo) => datos[campo] !== undefined)) {
      return res.status(400).json({ error: "Enviá al menos un campo editable del usuario." });
    }
    const actualizado = { ...usuario };
    for (const campo of campos) {
      if (datos[campo] !== undefined) actualizado[campo] = datos[campo];
    }
    if (!datosValidos(actualizado)) {
      return res.status(400).json({ error: "Los datos del usuario no son válidos." });
    }
    actualizado.email = actualizado.email.trim().toLowerCase();
    if (usuarios.find((u) => u.id !== usuario.id && u.email.toLowerCase() === actualizado.email)) {
      return res.status(409).json({ error: "Ya existe un usuario con ese email." });
    }
    Object.assign(usuario, actualizado);
    await guardarUsuarios(usuarios);
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el usuario." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const usuarios = await leerUsuarios();
    const id = Number(req.params.id);
    if (!usuarios.find((u) => u.id === id)) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    const ventas = JSON.parse(await readFile(archivoVentas, "utf-8"));
    if (ventas.find((venta) => venta.id_usuario === id)) {
      return res.status(409).json({ error: "El usuario tiene ventas relacionadas y no puede eliminarse." });
    }
    const restantes = usuarios.filter((u) => u.id !== id);
    await guardarUsuarios(restantes);
    res.status(200).json({ mensaje: "Usuario eliminado." });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el usuario." });
  }
});

export default router;
