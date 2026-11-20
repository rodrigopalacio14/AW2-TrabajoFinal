async function solicitar(ruta, datos, estado = 200, token, metodo = datos === undefined ? "GET" : "POST") {
    let respuesta;
    try {
        respuesta = await fetch(new URL(`../${ruta}`, import.meta.url), {
            method: metodo,
            headers: {
                ...(datos !== undefined ? { "Content-Type": "application/json" } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(datos)
        });
    } catch {
        throw new Error("No se pudo conectar con la tienda. Intentá nuevamente.");
    }
    const resultado = await respuesta.json().catch(() => null);
    if (respuesta.status !== estado || !resultado) {
        const error = new Error(resultado?.error || "No se pudo completar la operación.");
        error.status = respuesta.status;
        throw error;
    }
    return resultado;
}

export const obtenerProductos = () => solicitar("productos");
export const ingresar = (email, password) => solicitar("usuarios/login", { email, password });
export const registrarUsuario = (datos) => solicitar("usuarios", datos, 201);
export const registrarCompra = (datos, token) => solicitar("ventas", datos, 201, token);

export const administrar = (ruta, token, metodo = "GET", datos) =>
    solicitar(ruta, datos, metodo === "POST" ? 201 : 200, token, metodo);
