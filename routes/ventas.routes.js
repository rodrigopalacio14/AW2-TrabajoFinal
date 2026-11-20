import { Router } from "express";
import { autenticar, autorizarAdmin } from "../middlewares/auth.middleware.js";
import {
  listarVentas, obtenerVenta, crearVenta, crearVentaAdmin, actualizarVenta, eliminarVenta
} from "../controllers/ventas.controller.js";

const router = Router();

router.get("/", autenticar, autorizarAdmin, listarVentas);
router.get("/:id", autenticar, autorizarAdmin, obtenerVenta);
router.post("/", autenticar, crearVenta);
router.post("/admin", autenticar, autorizarAdmin, crearVentaAdmin);
router.put("/:id", autenticar, autorizarAdmin, actualizarVenta);
router.delete("/:id", autenticar, autorizarAdmin, eliminarVenta);

export default router;
