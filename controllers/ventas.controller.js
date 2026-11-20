import { Producto, Venta, reservarComprador, siguienteId } from "../models/index.js";
import { idValido, textoValido } from "../models/validaciones.js";

class ErrorVenta extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

function responderError(res, error, mensaje) {
  if (error instanceof ErrorVenta) return res.status(error.estado).json({ error: error.message });
  return res.status(500).json({ error: mensaje });
}

function validarDetalle(productos) {
  if (!Array.isArray(productos) || !productos.length) {
    throw new ErrorVenta(400, "Enviá una lista no vacía de productos.");
  }
  if (productos.some((item) => !idValido(item?.id_producto) || !idValido(item?.cantidad))) {
    throw new ErrorVenta(400, "Cada producto requiere id_producto y cantidad enteros positivos.");
  }
}

async function prepararDetalle(productos, session, anteriores = []) {
  const ids = [...new Set(productos.map((item) => item.id_producto))];
  await Producto.updateMany({ id: { $in: ids } }, { $inc: { revisionVentas: 1 } }, { session });
  const catalogo = await Producto.find({ id: { $in: ids } }).select("id precio").session(session);
  const precios = new Map(catalogo.map(({ id, precio }) => [id, precio]));
  const faltante = ids.find((id) => !precios.has(id));
  if (faltante !== undefined) throw new ErrorVenta(404, `Producto ${faltante} no encontrado.`);

  const historicos = new Map();
  for (const { id_producto, precio } of anteriores) {
    if (!historicos.has(id_producto)) historicos.set(id_producto, []);
    historicos.get(id_producto).push(precio);
  }
  const detalle = productos.map(({ id_producto, cantidad }) => {
    const precio = historicos.get(id_producto)?.shift() ?? precios.get(id_producto);
    return { id_producto, cantidad, precio };
  });
  const total = detalle.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  if (!Number.isFinite(total)) throw new ErrorVenta(400, "El total de la venta es demasiado grande.");
  return { productos: detalle, total };
}

export async function listarVentas(_req, res) {
  try {
    res.json(await Venta.find().sort({ id: 1 }));
  } catch {
    res.status(500).json({ error: "No se pudieron leer las ventas." });
  }
}

export async function obtenerVenta(req, res) {
  try {
    const venta = await Venta.findOne({ id: Number(req.params.id) || 0 });
    if (!venta) return res.status(404).json({ error: "Venta no encontrada." });
    res.json(venta);
  } catch {
    res.status(500).json({ error: "No se pudo leer la venta." });
  }
}

async function guardarVenta(res, id_usuario, datos) {
  try {
    const { direccion, productos, entregado } = datos;
    if (!idValido(id_usuario) || !textoValido(direccion) || typeof entregado !== "boolean") {
      throw new ErrorVenta(400, "Ingresá un usuario, una dirección y un estado de entrega válidos.");
    }
    validarDetalle(productos);

    const venta = await Venta.db.transaction(async (session) => {
      const { matchedCount } = await reservarComprador(id_usuario, session);
      if (!matchedCount) throw new ErrorVenta(404, "Usuario no encontrado.");

      const detalle = await prepararDetalle(productos, session);
      const id = await siguienteId(Venta, session);
      const [creada] = await Venta.create([{
        id, id_usuario, fecha: new Date().toISOString().slice(0, 10), direccion, entregado, ...detalle
      }], { session });
      return creada;
    });
    res.status(201).json(venta);
  } catch (error) {
    responderError(res, error, "No se pudo guardar la venta.");
  }
}

export function crearVenta(req, res) {
  const { direccion, productos } = req.body || {};
  return guardarVenta(res, req.idUsuario, { direccion, productos, entregado: false });
}

export function crearVentaAdmin(req, res) {
  const { id_usuario, direccion, productos, entregado = false } = req.body || {};
  return guardarVenta(res, id_usuario, { direccion, productos, entregado });
}

export async function actualizarVenta(req, res) {
  try {
    const { id_usuario, direccion, productos, entregado } = req.body || {};
    if ([id_usuario, direccion, productos, entregado].every((valor) => valor === undefined)) {
      throw new ErrorVenta(400, "Enviá al menos un campo editable de la venta.");
    }
    if ((id_usuario !== undefined && !idValido(id_usuario))
      || (direccion !== undefined && !textoValido(direccion))
      || (entregado !== undefined && typeof entregado !== "boolean")) {
      throw new ErrorVenta(400, "Los datos de la venta no son válidos.");
    }
    if (productos !== undefined) validarDetalle(productos);

    const venta = await Venta.db.transaction(async (session) => {
      const actual = await Venta.findOne({ id: Number(req.params.id) || 0 }).session(session);
      if (!actual) throw new ErrorVenta(404, "Venta no encontrada.");

      if (id_usuario !== undefined && id_usuario !== actual.id_usuario) {
        const { matchedCount } = await reservarComprador(id_usuario, session);
        if (!matchedCount) throw new ErrorVenta(404, "Usuario no encontrado.");
        actual.id_usuario = id_usuario;
      }
      if (direccion !== undefined) actual.direccion = direccion;
      if (entregado !== undefined) actual.entregado = entregado;
      if (productos !== undefined) {
        actual.set(await prepararDetalle(productos, session, actual.productos));
      }
      return actual.save({ session });
    });
    res.json(venta);
  } catch (error) {
    responderError(res, error, "No se pudo actualizar la venta.");
  }
}

export async function eliminarVenta(req, res) {
  try {
    const { deletedCount } = await Venta.deleteOne({ id: Number(req.params.id) || 0 });
    if (!deletedCount) return res.status(404).json({ error: "Venta no encontrada." });
    res.json({ mensaje: "Venta eliminada." });
  } catch {
    res.status(500).json({ error: "No se pudo eliminar la venta." });
  }
}
