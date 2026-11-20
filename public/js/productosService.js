async function solicitar(ruta, datos, estado = 200) {
    let respuesta;
    try {
        respuesta = await fetch(new URL(`../${ruta}`, import.meta.url), datos === undefined ? undefined : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
    } catch {
        throw new Error("No se pudo conectar con la tienda. Intentá nuevamente.");
    }
    const resultado = await respuesta.json().catch(() => null);
    if (respuesta.status !== estado || !resultado) {
        throw new Error(resultado?.error || "No se pudo completar la operación.");
    }
    return resultado;
}

export const obtenerProductos = () => solicitar("productos");
export const ingresar = (email, password) => solicitar("usuarios/login", { email, password });
export const registrarCompra = (datos) => solicitar("ventas", datos, 201);
