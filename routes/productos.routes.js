import { Router } from "express";
import { readFile, writeFile } from "fs/promises";

const router = Router();
const archivoProductos = "./data/productos.json";

const leerProductos = async () => {
  const datos = await readFile(archivoProductos, "utf-8");
  return JSON.parse(datos);
};

const guardarProductos = async (productos) => {
  await writeFile(archivoProductos, JSON.stringify(productos, null, 2));
};

const datosValidos = (producto) => {
  const textos = [producto.nombre, producto.descripcion, producto.categoria, producto.imagen];
  return textos.every((texto) => typeof texto === "string" && texto.trim() !== "")
    && Number.isFinite(producto.precio) && producto.precio >= 0
    && Number.isInteger(producto.stock) && producto.stock >= 0
    && typeof producto.disponible === "boolean";
};

router.get("/", async (req, res) => {
  try {
    res.status(200).json(await leerProductos());
  } catch (error) {
    res.status(500).json({ error: "No se pudieron leer los productos." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const productos = await leerProductos();
    const producto = productos.find((p) => p.id === Number(req.params.id));
    if (!producto) return res.status(404).json({ error: "Producto no encontrado." });
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ error: "No se pudo leer el producto." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, descripcion, categoria, precio, stock, imagen, disponible } = req.body || {};
    const nuevoProducto = { nombre, descripcion, categoria, precio, stock, imagen, disponible };
    if (!datosValidos(nuevoProducto)) {
      return res.status(400).json({ error: "Completá los textos, precio no negativo, stock entero no negativo y disponible (booleano)." });
    }
    const productos = await leerProductos();
    nuevoProducto.id = Math.max(0, ...productos.map((p) => p.id)) + 1;
    productos.push(nuevoProducto);
    await guardarProductos(productos);
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: "No se pudo guardar el producto." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const productos = await leerProductos();
    const producto = productos.find((p) => p.id === Number(req.params.id));
    if (!producto) return res.status(404).json({ error: "Producto no encontrado." });
    const datos = req.body || {};
    const campos = ["nombre", "descripcion", "categoria", "precio", "stock", "imagen", "disponible"];
    if (!campos.some((campo) => datos[campo] !== undefined)) {
      return res.status(400).json({ error: "Enviá al menos un campo editable del producto." });
    }
    const actualizado = { ...producto };
    for (const campo of campos) {
      if (datos[campo] !== undefined) actualizado[campo] = datos[campo];
    }
    if (!datosValidos(actualizado)) {
      return res.status(400).json({ error: "Los datos del producto no son válidos." });
    }
    Object.assign(producto, actualizado);
    await guardarProductos(productos);
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el producto." });
  }
});

export default router;
