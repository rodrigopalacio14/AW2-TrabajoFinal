function obtenerPaginaActual() {
    const rutaActual = window.location.pathname.replace(/\\/g, "/");

    if (rutaActual === "/") return titulosPaginas[0];

    return titulosPaginas.find((pagina) => rutaActual.endsWith(pagina.direccion));
}

function actualizarTituloPagina() {
    const paginaActual = obtenerPaginaActual();

    if (paginaActual) {
        document.title = `Tres Katanas - ${paginaActual.titulo}`;
    }
}

actualizarTituloPagina();
