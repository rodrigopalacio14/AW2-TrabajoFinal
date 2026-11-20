const CARRITO_STORAGE = "carritoTresKatanasAW2";

function obtenerCarrito() {
    try {
        const carrito = JSON.parse(localStorage.getItem(CARRITO_STORAGE));
        return Array.isArray(carrito) ? carrito : [];
    } catch {
        return [];
    }
}

function guardarCarrito(carrito) {
    const items = carrito.map(({ id, cantidad }) => ({ id, cantidad }));
    localStorage.setItem(CARRITO_STORAGE, JSON.stringify(items));
}

function agregarProductoAlCarrito(producto, cantidad) {
    if (!producto.disponible || producto.stock < 1 || cantidad < 1) return 0;

    const carrito = obtenerCarrito();
    const existente = carrito.find((item) => item.id === producto.id);
    const anterior = existente?.cantidad ?? 0;
    const agregada = Math.min(cantidad, Math.max(0, producto.stock - anterior));
    if (!agregada) return 0;

    if (existente) {
        existente.cantidad += agregada;
    } else {
        carrito.push({ id: producto.id, cantidad: agregada });
    }
    guardarCarrito(carrito);
    return agregada;
}

function eliminarProductoDelCarrito(idProducto) {
    guardarCarrito(obtenerCarrito().filter((item) => item.id !== idProducto));
}

function actualizarCantidadCarrito(idProducto, nuevaCantidad) {
    if (nuevaCantidad < 1) {
        eliminarProductoDelCarrito(idProducto);
        return;
    }
    const carrito = obtenerCarrito();
    const item = carrito.find((producto) => producto.id === idProducto);
    if (item) {
        item.cantidad = nuevaCantidad;
        guardarCarrito(carrito);
    }
}
