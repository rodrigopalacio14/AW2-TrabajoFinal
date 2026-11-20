import { Contador } from "./Contador.js";
import { Producto } from "./Producto.js";
import { Usuario } from "./Usuario.js";
import { Venta } from "./Venta.js";

export { Contador, Producto, Usuario, Venta };

export const modelosDatos = [Usuario, Producto, Venta];

export function reservarIds(modelo, minimo) {
  return Contador.updateOne(
    { _id: modelo.collection.name },
    { $max: { ultimoId: minimo } },
    { upsert: true }
  );
}

export async function siguienteId(modelo, session) {
  const contador = await Contador.findOneAndUpdate(
    { _id: modelo.collection.name },
    { $inc: { ultimoId: 1 } },
    { returnDocument: "after", session }
  );
  if (!contador || !Number.isSafeInteger(contador.ultimoId)) {
    throw new Error("No se pudo asignar un ID numérico.");
  }
  return contador.ultimoId;
}

// La compra y la eliminación escriben sobre el comprador dentro de sus transacciones.
export function reservarComprador(id, session) {
  return Usuario.updateOne({ id }, { $inc: { revisionCompras: 1 } }, { session });
}
