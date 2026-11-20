import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { conectarMongoDB, desconectarMongoDB } from "../config/db.js";
import { Contador, Producto, Usuario, Venta, reservarComprador, reservarIds } from "../models/index.js";
import { datosProductoValidos, datosUsuarioValidos, idValido, importeValido,
  normalizarEmail, passwordValida, textoValido } from "../models/validaciones.js";

class ErrorMigracion extends Error {}

function fechaValida(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const dia = new Date(fecha);
  return Number.isFinite(dia.getTime()) && dia.toISOString().slice(0, 10) === fecha;
}

function ventaValida(venta) {
  return idValido(venta.id_usuario) && fechaValida(venta.fecha)
    && importeValido(venta.total) && textoValido(venta.direccion)
    && typeof venta.entregado === "boolean" && Array.isArray(venta.productos)
    && venta.productos.length > 0 && venta.productos.every((item) =>
      idValido(item?.id_producto) && idValido(item?.cantidad) && importeValido(item?.precio));
}

async function leerRegistros({ archivo, validar }) {
  let datos;
  try {
    datos = JSON.parse(await readFile(new URL(`../data/${archivo}`, import.meta.url), "utf8"));
  } catch {
    throw new ErrorMigracion(`data/${archivo}: no se pudo leer un JSON válido.`);
  }
  if (!Array.isArray(datos)) throw new ErrorMigracion(`data/${archivo}: se esperaba una lista de registros.`);

  const ids = new Set();
  for (const [indice, registro] of datos.entries()) {
    if (!idValido(registro?.id)) {
      throw new ErrorMigracion(`data/${archivo}: ID inválido en el registro ${indice + 1}.`);
    }
    if (ids.has(registro.id) || !validar(registro)) {
      throw new ErrorMigracion(`data/${archivo}, ID ${registro.id}: datos incompatibles o ID repetido.`);
    }
    ids.add(registro.id);
  }
  return datos;
}

async function importar({ archivo, modelo, registros }) {
  const clave = modelo.collection.name;
  let insertados = 0;
  for (const registro of registros) {
    const { id } = registro;
    const ubicacion = `data/${archivo}, ID ${id}`;
    try {
      if (await Contador.exists({ _id: clave, migrados: id })) continue;
      const datos = { ...registro };
      if (modelo === Usuario) {
        datos.email = normalizarEmail(datos.email);
        datos.rol = "cliente";
        datos.password = await bcrypt.hash(datos.password, 12);
      }

      const insertado = await modelo.db.transaction(async (session) => {
        const marca = await Contador.updateOne(
          { _id: clave, migrados: { $ne: id } },
          { $addToSet: { migrados: id } },
          { session }
        );
        if (!marca.modifiedCount || await modelo.exists({ id }).session(session)) return false;

        if (modelo === Venta) {
          const comprador = await reservarComprador(datos.id_usuario, session);
          if (!comprador.matchedCount) {
            throw new ErrorMigracion(`${ubicacion}: usuario ${datos.id_usuario} inexistente.`);
          }
          const ids = [...new Set(datos.productos.map((item) => item.id_producto))];
          await Producto.updateMany({ id: { $in: ids } }, { $inc: { revisionVentas: 1 } }, { session });
          const productos = await Producto.find({ id: { $in: ids } }).select("id").session(session);
          const existentes = new Set(productos.map((producto) => producto.id));
          const faltante = ids.find((idProducto) => !existentes.has(idProducto));
          if (faltante !== undefined) {
            throw new ErrorMigracion(`${ubicacion}: producto ${faltante} inexistente.`);
          }
        }
        await modelo.create([datos], { session });
        return true;
      });
      if (insertado) insertados++;
    } catch (error) {
      if (error instanceof ErrorMigracion) throw error;
      const motivo = error.code === 11000 ? "hay un valor único duplicado" : "no se pudo guardar el registro";
      throw new ErrorMigracion(`${ubicacion}: ${motivo}.`);
    }
  }
  console.log(`${archivo}: ${insertados} importados, ${registros.length - insertados} omitidos.`);
}

let conectado = false;
try {
  const fuentes = [
    { archivo: "usuarios.json", modelo: Usuario,
      validar: (usuario) => datosUsuarioValidos(usuario) && passwordValida(usuario.password) },
    { archivo: "productos.json", modelo: Producto, validar: datosProductoValidos },
    { archivo: "ventas.json", modelo: Venta, validar: ventaValida }
  ];
  for (const fuente of fuentes) fuente.registros = await leerRegistros(fuente);

  await conectarMongoDB();
  conectado = true;
  for (const { modelo, registros } of fuentes) {
    const maximo = registros.reduce((mayor, { id }) => Math.max(mayor, id), 0);
    await reservarIds(modelo, maximo);
  }
  for (const fuente of fuentes) await importar(fuente);
} catch (error) {
  console.error(error instanceof ErrorMigracion || !conectado ? error.message : "No se pudo completar la migración.");
  process.exitCode = 1;
} finally {
  if (conectado) await desconectarMongoDB();
}
