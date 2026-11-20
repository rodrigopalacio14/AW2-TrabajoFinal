import { model } from "mongoose";
import { Schema, texto, enteroPositivo, importe, booleano, id, opciones } from "./esquema.js";

const detalle = new Schema({
  id_producto: enteroPositivo,
  cantidad: enteroPositivo,
  precio: importe
}, { _id: false });

export const Venta = model("Venta", new Schema({
  id,
  id_usuario: { ...enteroPositivo, index: true },
  fecha: texto,
  total: importe,
  direccion: texto,
  entregado: booleano,
  productos: { type: [detalle], required: true }
}, opciones).index({ "productos.id_producto": 1 }), "ventas");
