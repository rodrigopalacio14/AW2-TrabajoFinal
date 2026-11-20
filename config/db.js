import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { Contador, modelosDatos, reservarIds } from "../models/index.js";

export async function conectarMongoDB() {
  try {
    process.loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
  } catch (error) {
    if (error.code !== "ENOENT") throw new Error("No se pudo leer el archivo .env.");
  }

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || uri.includes("<db_password>")) {
    throw new Error("MONGODB_URI no contiene una URI de MongoDB válida para este entorno.");
  }
  if (!process.env.JWT_SECRET?.trim()) {
    throw new Error("JWT_SECRET no está definido en el entorno.");
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    await Promise.all([Contador, ...modelosDatos].map((modelo) => modelo.init()));
    for (const modelo of modelosDatos) {
      const ultimo = await modelo.findOne().sort({ id: -1 }).select("id");
      await reservarIds(modelo, ultimo?.id ?? 0);
    }
  } catch {
    await mongoose.disconnect().catch(() => {});
    throw new Error("No se pudo iniciar MongoDB. Revisá la URI, los permisos del usuario y el acceso de red en Atlas.");
  }
}

export const desconectarMongoDB = () => mongoose.disconnect();
