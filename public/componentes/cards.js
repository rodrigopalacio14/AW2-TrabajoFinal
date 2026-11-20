const monedaARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function formatearPrecio(precio) {
    return monedaARS.format(precio);
}

function escaparTexto(texto) {
    const nodo = document.createElement("span");
    nodo.textContent = texto;
    return nodo.innerHTML;
}

function nombreCategoria(categoria) {
    const nombres = new Map([
        ["electronica", "Electrónica"],
        ["perfumes arabes", "Perfumes árabes"],
        ["vapers", "Vapers"]
    ]);
    return nombres.get(categoria) ?? categoria;
}

function crearCardProducto(producto) {
    const disponible = producto.disponible && producto.stock > 0;

    return `
        <div class="col-md-4">
            <article class="card card-producto h-100" data-producto-id="${producto.id}">
                <div class="card-img-top imagentarjetas sin-imagen">Sin imagen</div>
                <div class="card-body">
                    <h5 class="card-title">${escaparTexto(producto.nombre)}</h5>
                    <p class="card-text">${escaparTexto(nombreCategoria(producto.categoria))}</p>
                    <p class="card-text">${escaparTexto(producto.descripcion)}</p>
                    <p class="precio-producto">${formatearPrecio(producto.precio)}</p>
                    ${disponible ? `
                        <div class="contador-producto">
                            <button class="btn btn-katana btn-restar" type="button" aria-label="Restar unidad">−</button>
                            <span class="cantidad-producto">1</span>
                            <button class="btn btn-katana btn-sumar" type="button" aria-label="Sumar unidad">+</button>
                        </div>` : ""}
                    <button class="btn btn-katana mt-3 btn-agregar-carrito" type="button" ${disponible ? "" : "disabled"}>
                        ${disponible ? "Agregar al carrito" : "Sin disponibilidad"}
                    </button>
                    <p class="mt-2 mb-0" role="status"></p>
                </div>
            </article>
        </div>
    `;
}

function activarContadores(card, producto) {
    const cantidad = card.querySelector(".cantidad-producto");
    const estado = card.querySelector("[role=status]");

    card.querySelector(".btn-sumar").addEventListener("click", () => {
        const actual = Number(cantidad.textContent);
        if (actual < producto.stock) cantidad.textContent = actual + 1;
        else estado.textContent = `Stock disponible: ${producto.stock}.`;
    });
    card.querySelector(".btn-restar").addEventListener("click", () => {
        cantidad.textContent = Math.max(1, Number(cantidad.textContent) - 1);
    });
    card.querySelector(".btn-agregar-carrito").addEventListener("click", () => {
        const solicitada = Number(cantidad.textContent);
        const agregada = agregarProductoAlCarrito(producto, solicitada);
        const total = obtenerCarrito().find((item) => item.id === producto.id)?.cantidad;
        const mensaje = agregada ? `Se agregó al carrito: ${agregada}.` : "";
        estado.textContent = total === producto.stock || agregada < solicitada
            ? `${mensaje} Límite de stock: ${producto.stock}.`.trim()
            : mensaje;
        cantidad.textContent = 1;
        actualizarContadorCarritoNavbar();
    });
}

function renderizarProductos(listaProductos, contenedor) {
    contenedor.innerHTML = listaProductos.map(crearCardProducto).join("");
    contenedor.querySelectorAll("[data-producto-id]").forEach((card, indice) => {
        const producto = listaProductos[indice];
        if (producto.disponible && producto.stock > 0) activarContadores(card, producto);
    });
}
