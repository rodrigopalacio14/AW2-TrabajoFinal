import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";

const directorio = new URL("../public/img/productos/cargas/", import.meta.url);
const maximo = 2 * 1024 * 1024;
const loopback = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const tipos = new Map([
  ["image/jpeg", { extension: "jpg", valida: (b) => b.subarray(0, 3).equals(Buffer.from([255, 216, 255])) }],
  ["image/png", { extension: "png", valida: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ["image/webp", { extension: "webp", valida: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" }]
]);

export class ErrorImagen extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export function prepararImagenLocal(req) {
  const archivo = req.body?.imagenArchivo;
  if (archivo === undefined) return null;
  if (process.env.VERCEL || !loopback.has(req.socket.remoteAddress)) {
    throw new ErrorImagen(403, "La carga de imágenes está disponible desde el servidor local.");
  }

  const tipo = tipos.get(archivo?.tipo);
  const base64 = archivo?.base64;
  if (!tipo || typeof base64 !== "string" || !base64.length) {
    throw new ErrorImagen(400, "Seleccioná una imagen JPG, PNG o WebP.");
  }
  if (base64.length > Math.ceil(maximo / 3) * 4) {
    throw new ErrorImagen(413, "La imagen supera el límite de 2 MB.");
  }

  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > maximo) throw new ErrorImagen(413, "La imagen supera el límite de 2 MB.");
  if (bytes.toString("base64") !== base64 || !tipo.valida(bytes)) {
    throw new ErrorImagen(400, "El contenido no coincide con el formato de imagen indicado.");
  }

  const nombre = `${randomUUID()}.${tipo.extension}`;
  const destino = new URL(nombre, directorio);
  return {
    ruta: `cargas/${nombre}`,
    async guardar() {
      await mkdir(directorio, { recursive: true });
      try {
        await writeFile(destino, bytes, { flag: "wx" });
      } catch (error) {
        if (error.code !== "EEXIST") await unlink(destino).catch(() => {});
        throw error;
      }
    },
    descartar: () => unlink(destino).catch(() => {})
  };
}
