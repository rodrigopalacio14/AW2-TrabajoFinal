import { Router } from "express";
import { readFile, writeFile } from "fs/promises";

const router = Router();
const archivoVentas = "./data/ventas.json";

const leerVentas = async () => {
  const datos = await readFile(archivoVentas, "utf-8");
  return JSON.parse(datos);
};

router.get("/", async (req, res) => {
  try {
    res.status(200).json(await leerVentas());
  } catch (error) {
    res.status(500).json({ error: "No se pudieron leer las ventas." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const ventas = await leerVentas();
    const venta = ventas.find((v) => v.id === Number(req.params.id));
    if (!venta) return res.status(404).json({ error: "Venta no encontrada." });
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ error: "No se pudo leer la venta." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id_usuario, direccion, productos } = req.body || {};
    if (!Number.isInteger(id_usuario) || id_usuario <= 0
      || typeof direccion !== "string" || !direccion.trim()
      || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: "Enviá id_usuario entero positivo, direccion y una lista no vacía de productos." });
    }
    const usuarios = JSON.parse(await readFile("./data/usuarios.json", "utf-8"));
    if (!usuarios.find((u) => u.id === id_usuario)) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    const catalogo = JSON.parse(await readFile("./data/productos.json", "utf-8"));
    const detalle = [];
    let total = 0;
    for (const item of productos) {
      if (!item || !Number.isInteger(item.id_producto) || item.id_producto <= 0
        || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        return res.status(400).json({ error: "Cada producto requiere id_producto y cantidad enteros positivos." });
      }
      const producto = catalogo.find((p) => p.id === item.id_producto);
      if (!producto) {
        return res.status(404).json({ error: `Producto ${item.id_producto} no encontrado.` });
      }
      // El precio se copia del catálogo para conservar el valor de esta venta.
      detalle.push({ id_producto: producto.id, cantidad: item.cantidad, precio: producto.precio });
      total += producto.precio * item.cantidad;
    }
    if (!Number.isFinite(total)) {
      return res.status(400).json({ error: "El total de la venta es demasiado grande." });
    }
    const ventas = await leerVentas();
    const nuevaVenta = {
      id: Math.max(0, ...ventas.map((v) => v.id)) + 1,
      id_usuario,
      fecha: new Date().toISOString().slice(0, 10),
      total,
      direccion,
      entregado: false,
      productos: detalle
    };
    ventas.push(nuevaVenta);
    await writeFile(archivoVentas, JSON.stringify(ventas, null, 2));
    res.status(201).json(nuevaVenta);
  } catch (error) {
    res.status(500).json({ error: "No se pudo guardar la venta." });
  }
});

export default router;
