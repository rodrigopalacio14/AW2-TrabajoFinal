import { Router, json } from "express";
import { autenticar, autorizarAdmin } from "../middlewares/auth.middleware.js";
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from "../controllers/productos.controller.js";

const router = Router();
const leerProducto = json({ limit: "3mb" });

router.get("/", listarProductos);
router.get("/:id", obtenerProducto);
router.post("/", autenticar, autorizarAdmin, leerProducto, crearProducto);
router.put("/:id", autenticar, autorizarAdmin, leerProducto, actualizarProducto);
router.delete("/:id", autenticar, autorizarAdmin, eliminarProducto);

router.use((error, _req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "La solicitud es demasiado grande. El límite de imagen es 2 MB." });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la solicitud debe ser JSON válido." });
  }
  next(error);
});

export default router;
