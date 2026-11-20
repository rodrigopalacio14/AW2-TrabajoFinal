import { model } from "mongoose";
import { Schema, texto, enteroPositivo, importe, booleano, id, opciones } from "./esquema.js";

export const Producto = model("Producto", new Schema({
  id,
  nombre: texto,
  descripcion: texto,
  categoria: texto,
  precio: importe,
  stock: { ...enteroPositivo, min: 0 },
  imagen: texto,
  disponible: booleano,
  revisionVentas: { type: Number, select: false }
}, opciones), "productos");
