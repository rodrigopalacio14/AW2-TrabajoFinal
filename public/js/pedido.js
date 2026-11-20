const medios = {
    transferencia: "Transferencia",
    efectivo: "Efectivo"
};

export function guardarResumenPedido(pedido) {
    try {
        sessionStorage.setItem(ULTIMO_PEDIDO, JSON.stringify(pedido));
    } catch {
        // El resumen sigue disponible en la pantalla actual.
    }
}

export function recuperarResumenPedido() {
    try {
        const pedido = JSON.parse(sessionStorage.getItem(ULTIMO_PEDIDO));
        return pedido?.id_usuario === obtenerUsuario()?.id ? pedido : null;
    } catch {
        return null;
    }
}

function enlaceWhatsApp(pedido, medio) {
    const productos = pedido.productos.map(({ nombre, cantidad }) => `• ${cantidad} × ${nombre}`);
    const mensaje = [
        `Hola, Tres Katanas. Quiero coordinar el pago del pedido #${pedido.id}.`,
        ...productos,
        `Total: ${formatearPrecio(pedido.total)}`,
        `Medio de pago: ${medio}`
    ].join("\n");
    return `https://wa.me/${WHATSAPP_TIENDA}?text=${encodeURIComponent(mensaje)}`;
}

export function mostrarPedido(contenedor, pedido) {
    const filas = pedido.productos.map(({ nombre, cantidad, precio }) => `
        <li class="list-group-item bg-transparent text-light border-secondary d-flex flex-wrap justify-content-between gap-2 px-0">
            <div>
                <strong>${escaparTexto(nombre)}</strong>
                <div class="text-white-50">${cantidad} × ${formatearPrecio(precio)}</div>
            </div>
            <strong>${formatearPrecio(cantidad * precio)}</strong>
        </li>`).join("");

    contenedor.innerHTML = `
        <article class="resumen-pedido p-4 p-md-5 mx-auto" aria-labelledby="titulo-pedido">
            <header class="border-bottom border-secondary pb-3 mb-3">
                <p class="mb-1 text-white-50">Pedido #${escaparTexto(pedido.id)}</p>
                <h2 id="titulo-pedido" class="h2 titulo-seccion mb-2" tabindex="-1">Pedido confirmado</h2>
                <p class="mb-0 text-warning">Pendiente de pago</p>
            </header>
            <h3 class="h6">Productos</h3>
            <ul class="list-group list-group-flush mb-3">${filas}</ul>
            <p class="mb-3"><strong>Entrega</strong> · ${escaparTexto(pedido.direccion)}</p>
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 border-top border-secondary pt-3 mb-4">
                <strong>Total del pedido</strong>
                <strong class="precio-producto fs-4 mb-0">${formatearPrecio(pedido.total)}</strong>
            </div>
            <div id="paso-resumen">
                <button class="btn btn-katana" id="continuar-pago" type="button">Continuar al pago</button>
            </div>
            <form id="paso-pago" hidden>
                <fieldset>
                    <legend class="h5 mb-3" tabindex="-1">Elegí el medio de pago</legend>
                    <div class="form-check mb-2">
                        <input class="form-check-input" id="pago-transferencia" name="medio" value="transferencia" type="radio" required>
                        <label class="form-check-label" for="pago-transferencia">Transferencia</label>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" id="pago-efectivo" name="medio" value="efectivo" type="radio">
                        <label class="form-check-label" for="pago-efectivo">Efectivo</label>
                    </div>
                </fieldset>
                <button class="btn btn-katana" type="submit">Continuar</button>
            </form>
            <section id="paso-validacion" hidden>
                <h3 class="h5" tabindex="-1">Validá el pago con nuestro equipo</h3>
                <p id="medio-elegido" class="mb-2"></p>
                <p>Escribinos por WhatsApp para coordinar el pago de tu pedido.</p>
                <div class="d-flex flex-wrap gap-2">
                    <a class="btn btn-whatsapp" id="whatsapp-pedido" target="_blank" rel="noopener noreferrer">Continuar por WhatsApp</a>
                    <button class="btn btn-outline-light" id="cambiar-medio" type="button">Cambiar medio</button>
                </div>
            </section>
            <a class="btn btn-link text-light px-0 mt-3" href="../">Volver a la tienda</a>
        </article>`;

    const resumen = contenedor.querySelector("#paso-resumen");
    const pago = contenedor.querySelector("#paso-pago");
    const validacion = contenedor.querySelector("#paso-validacion");

    function elegirMedio() {
        resumen.hidden = true;
        validacion.hidden = true;
        pago.hidden = false;
        pago.querySelector("legend").focus();
    }

    contenedor.querySelector("#continuar-pago").addEventListener("click", elegirMedio);
    contenedor.querySelector("#cambiar-medio").addEventListener("click", elegirMedio);
    pago.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const medio = medios[new FormData(pago).get("medio")];
        if (!medio) return;
        contenedor.querySelector("#medio-elegido").textContent = `Medio elegido: ${medio}`;
        contenedor.querySelector("#whatsapp-pedido").href = enlaceWhatsApp(pedido, medio);
        pago.hidden = true;
        validacion.hidden = false;
        validacion.querySelector("h3").focus();
    });
    contenedor.querySelector("#titulo-pedido").focus();
}
