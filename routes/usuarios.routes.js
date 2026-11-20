import { Router } from "express";
import { autenticar, autorizarAdmin, autorizarCuenta } from "../middlewares/auth.middleware.js";
import {
  listarUsuarios,
  obtenerUsuario,
  login,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} from "../controllers/usuarios.controller.js";

const router = Router();

router.get("/", autenticar, autorizarAdmin, listarUsuarios);
router.get("/:id", autenticar, autorizarCuenta, obtenerUsuario);
router.post("/login", login);
router.post("/", crearUsuario);
router.put("/:id", autenticar, autorizarCuenta, actualizarUsuario);
router.delete("/:id", autenticar, autorizarCuenta, eliminarUsuario);

export default router;
