import { Schema, model } from "mongoose";

export const Contador = model("Contador", new Schema({
  _id: String,
  ultimoId: Number,
  migrados: { type: [Number], default: undefined }
}, { versionKey: false }), "contadores");
