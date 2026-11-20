import mongoose from "mongoose";

const { Schema } = mongoose;
const texto = { type: String, required: true };
const enteroPositivo = { type: Number, required: true, min: 1, validate: Number.isSafeInteger };
const importe = { type: Number, required: true, min: 0, validate: Number.isFinite };
const booleano = { type: Boolean, required: true };
const id = { ...enteroPositivo, unique: true, immutable: true };

const opciones = {
  versionKey: false,
  toJSON: {
    transform(_documento, datos) {
      delete datos._id;
      delete datos.password;
      delete datos.revisionCompras;
      delete datos.revisionVentas;
      return datos;
    }
  }
};

export { Schema, texto, enteroPositivo, importe, booleano, id, opciones };
