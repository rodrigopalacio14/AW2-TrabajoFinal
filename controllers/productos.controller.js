import { Producto, Venta, siguienteId } from "../models/index.js";
import { datosProductoValidos } from "../models/validaciones.js";

import { ErrorImagen, prepararImagenLocal } from "../config/imagenes.js";

const campos = ["nombre", "descripcion", "categoria", "precio", "stock", "imagen", "disponible"];

export async function listarProductos(_req, res) {
  try {
    res.status(200).json(await Producto.find().sort({ id: 1 }));
  } catch {
    res.status(500).json({ error: "No se pudieron leer los productos." });
  }
}

export async function obtenerProducto(req, res) {
  try {
    const producto = await Producto.findOne({ id: Number(req.params.id) || 0 });
    if (!producto) return res.status(404).json({ error: "Producto no encontrado." });
    res.status(200).json(producto);
  } catch {
    res.status(500).json({ error: "No se pudo leer el producto." });
  }
}

export async function crearProducto(req, res) {
  let imagenGuardada;
  try {
    const { nombre, descripcion, categoria, precio, stock, imagen, disponible } = req.body || {};
    const archivo = prepararImagenLocal(req);
    const nuevoProducto = { nombre, descripcion, categoria, precio, stock, imagen: archivo?.ruta ?? imagen, disponible };
    if (!datosProductoValidos(nuevoProducto)) {
      return res.status(400).json({ error: "Completá los textos, precio no negativo, stock entero no negativo y disponible (booleano)." });
    }
    nuevoProducto.id = await siguienteId(Producto);
    await archivo?.guardar();
    imagenGuardada = archivo;
    const creado = await Producto.create(nuevoProducto);
    imagenGuardada = undefined;
    res.status(201).json(creado);
  } catch (error) {
    await imagenGuardada?.descartar();
    if (error instanceof ErrorImagen) return res.status(error.estado).json({ error: error.message });
    res.status(500).json({ error: "No se pudo guardar el producto." });
  }
}

export async function actualizarProducto(req, res) {
  let imagenGuardada;
  try {
    const producto = await Producto.findOne({ id: Number(req.params.id) || 0 });
    if (!producto) return res.status(404).json({ error: "Producto no encontrado." });
    const datos = req.body || {};
    const cambios = Object.fromEntries(campos.filter((campo) => datos[campo] !== undefined)
      .map((campo) => [campo, datos[campo]]));
    const archivo = prepararImagenLocal(req);
    if (archivo) cambios.imagen = archivo.ruta;
    if (!Object.keys(cambios).length) {
      return res.status(400).json({ error: "Enviá al menos un campo editable del producto." });
    }
    if (!datosProductoValidos({ ...producto.toJSON(), ...cambios })) {
      return res.status(400).json({ error: "Los datos del producto no son válidos." });
    }
    await archivo?.guardar();
    imagenGuardada = archivo;
    producto.set(cambios);
    await producto.save();
    imagenGuardada = undefined;
    res.status(200).json(producto);
  } catch (error) {
    await imagenGuardada?.descartar();
    if (error instanceof ErrorImagen) return res.status(error.estado).json({ error: error.message });
    res.status(500).json({ error: "No se pudo actualizar el producto." });
  }
}

export async function eliminarProducto(req, res) {
  try {
    const id = Number(req.params.id) || 0;
    const estado = await Producto.db.transaction(async (session) => {
      const { matchedCount } = await Producto.updateOne(
        { id }, { $inc: { revisionVentas: 1 } }, { session }
      );
      if (!matchedCount) return 404;
      if (await Venta.exists({ "productos.id_producto": id }).session(session)) return 409;
      await Producto.deleteOne({ id }, { session });
      return 200;
    });
    if (estado === 404) return res.status(404).json({ error: "Producto no encontrado." });
    if (estado === 409) return res.status(409).json({ error: "El producto está asociado a ventas. Podés marcarlo como no disponible." });
    res.json({ mensaje: "Producto eliminado." });
  } catch {
    res.status(500).json({ error: "No se pudo eliminar el producto." });
  }
}
