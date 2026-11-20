import { obtenerProductos, registrarCompra } from "./productosService.js";

const contenedorCarrito = document.querySelector("#carrito-contenedor");
const estadoCompra = document.querySelector("#estado-compra");
let catalogo = new Map();
let direccion = "";
let comprando = false;

async function actualizarCatalogo() {
    const productos = await obtenerProductos();
    catalogo = new Map(productos.map((producto) => [producto.id, producto]));
}

function revisarArticulo({ id, cantidad }) {
    const producto = catalogo.get(id);
    if (!producto) return "Este producto ya no está en el catálogo.";
    if (!producto.disponible || producto.stock === 0) return "Este producto ya no está disponible.";
    if (cantidad > producto.stock) return `Reducí la cantidad a ${producto.stock} o menos.`;
    return "";
}

function crearFilaCarrito(item) {
    const { id, cantidad } = item;
    const producto = catalogo.get(id);
    const problema = revisarArticulo(item);

    return `
        <article class="item-carrito" data-producto-id="${id}">
            <div class="sin-imagen">Sin imagen</div>
            <div>
                <h3>${escaparTexto(producto?.nombre ?? `Producto #${id}`)}</h3>
                ${producto ? `<p>${formatearPrecio(producto.precio)} c/u</p>` : ""}
                ${problema ? `<p class="text-warning">${problema}</p>` : `<p>Stock disponible: ${producto.stock}</p>`}
            </div>

            <div class="contador-producto">
                <button class="btn btn-katana btn-carrito-restar" type="button" data-accion="restar" aria-label="Restar unidad">−</button>
                <span class="cantidad-producto">${cantidad}</span>
                <button class="btn btn-katana btn-carrito-sumar" type="button" data-accion="sumar" aria-label="Sumar unidad" ${problema || cantidad >= producto.stock ? "disabled" : ""}>+</button>
            </div>

            <p class="precio-producto">${producto ? formatearPrecio(producto.precio * cantidad) : "—"}</p>
            <button class="btn btn-outline-light btn-eliminar-carrito" type="button" data-accion="eliminar">Eliminar</button>
        </article>
    `;
}

function renderizarCarrito() {
    const carrito = obtenerCarrito();
    actualizarContadorCarritoNavbar();

    if (!carrito.length) {
        contenedorCarrito.innerHTML = `
            <div class="carrito-vacio text-center">
                <h2 class="titulo-seccion">Tu carrito está vacío</h2>
                <a class="btn btn-katana mt-3" href="../">Ver productos</a>
            </div>`;
        return;
    }

    const total = carrito.reduce((suma, { id, cantidad }) => suma + (catalogo.get(id)?.precio ?? 0) * cantidad, 0);
    contenedorCarrito.innerHTML = `
        <div class="lista-carrito">${carrito.map(crearFilaCarrito).join("")}</div>
        <div class="total-carrito">
            <h2>Total: ${formatearPrecio(total)}</h2>
            <div class="acciones-carrito">
                <a class="btn btn-katana" href="../">Agregar más productos</a>
                ${estaLogueado() ? "" : '<a class="btn btn-katana" href="login.html?volver=carrito">Iniciar sesión para comprar</a>'}
            </div>
            ${estaLogueado() ? `
                <form id="formulario-compra" class="mt-3">
                    <label for="direccion" class="form-label">Dirección de entrega</label>
                    <input id="direccion" class="form-control mb-3" autocomplete="street-address" required>
                    <button class="btn btn-katana" type="submit" ${carrito.some(revisarArticulo) ? "disabled" : ""}>
                        Confirmar compra
                    </button>
                </form>` : ""}
        </div>`;

    const campoDireccion = contenedorCarrito.querySelector("#direccion");
    if (campoDireccion) campoDireccion.value = direccion;
}

contenedorCarrito.addEventListener("input", (evento) => {
    if (evento.target.id === "direccion") direccion = evento.target.value;
});

contenedorCarrito.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton || comprando) return;

    const id = Number(boton.closest("[data-producto-id]").dataset.productoId);
    const item = obtenerCarrito().find((articulo) => articulo.id === id);
    if (!item) return;

    const { accion } = boton.dataset;
    if (accion === "eliminar") eliminarProductoDelCarrito(id);
    if (accion === "restar") actualizarCantidadCarrito(id, item.cantidad - 1);
    if (accion === "sumar" && !revisarArticulo(item) && item.cantidad < catalogo.get(id).stock) {
        actualizarCantidadCarrito(id, item.cantidad + 1);
    }
    renderizarCarrito();
});

contenedorCarrito.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (comprando) return;

    const usuario = obtenerUsuario();
    if (!usuario) {
        location.href = "./login.html?volver=carrito";
        return;
    }
    const entrega = direccion.trim();
    if (!entrega) {
        estadoCompra.textContent = "Ingresá una dirección de entrega.";
        return;
    }

    const carrito = obtenerCarrito();
    comprando = true;
    contenedorCarrito.querySelectorAll("button, input").forEach((control) => { control.disabled = true; });
    estadoCompra.textContent = "Procesando compra…";

    try {
        await actualizarCatalogo();
        if (JSON.stringify(carrito) !== JSON.stringify(obtenerCarrito())
            || !carrito.length || carrito.some(revisarArticulo)) {
            estadoCompra.textContent = "El carrito cambió. Revisá los artículos antes de confirmar.";
            return;
        }
        const venta = await registrarCompra({
            id_usuario: usuario.id,
            direccion: entrega,
            productos: carrito.map(({ id, cantidad }) => ({ id_producto: id, cantidad }))
        });
        estadoCompra.textContent = `Compra confirmada. Venta #${venta.id}. Total: ${formatearPrecio(venta.total)}.`;
        const comprados = new Map(carrito.map(({ id, cantidad }) => [id, cantidad]));
        const restantes = obtenerCarrito().map(({ id, cantidad }) => ({
            id, cantidad: cantidad - (comprados.get(id) ?? 0)
        }));
        guardarCarrito(restantes.filter(({ cantidad }) => cantidad > 0));
        direccion = "";
    } catch (error) {
        estadoCompra.textContent = error.message;
    } finally {
        comprando = false;
        renderizarCarrito();
    }
});

try {
    await actualizarCatalogo();
    renderizarCarrito();
} catch (error) {
    contenedorCarrito.textContent = error.message;
}
