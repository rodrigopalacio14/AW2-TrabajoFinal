import { model } from "mongoose";
import { Schema, texto, booleano, id, opciones } from "./esquema.js";

export const Usuario = model("Usuario", new Schema({
  id,
  nombre: texto,
  apellido: texto,
  email: { ...texto, unique: true },
  password: { ...texto, select: false },
  direccion: texto,
  activo: booleano,
  rol: { type: String, enum: ["cliente", "admin"], default: "cliente" },
  revisionCompras: { type: Number, select: false }
}, opciones), "usuarios");
