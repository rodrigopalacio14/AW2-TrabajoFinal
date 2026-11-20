function crearNavbar() {
    const contenedorNavbar = document.querySelector("#navbar");

    if (!contenedorNavbar) {
        return;
    }

    const basePath = obtenerBasePath();
    const linksPaginas = paginas.map((pagina) => {
        return `
            <li class="nav-item">
                <a class="nav-link" href="${basePath}${pagina.direccion}">${pagina.titulo}</a>
            </li>
        `;
    }).join("");
    const usuario = obtenerUsuario();
    const enlaceAdmin = usuario?.rol === "admin" ? `
        <li class="nav-item">
            <a class="nav-link" href="${basePath}pages/admin.html"${location.pathname.endsWith("/admin.html") ? ' aria-current="page"' : ""}>Panel de administración</a>
        </li>
    ` : "";
    const accionesUsuario = usuario
        ? `
            <li class="nav-item">
                <button class="btn btn-link nav-link" id="btn-logout" type="button">Cerrar sesión</button>
            </li>
        `
        : `
            <li class="nav-item">
                <a class="nav-link" href="${basePath}pages/login.html${location.pathname.endsWith("/carrito.html") ? "?volver=carrito" : ""}">Iniciar sesión</a>
            </li>

            <li class="nav-item">
                <a class="nav-link" href="${basePath}pages/registro.html">Registrarse</a>
            </li>
        `;

    contenedorNavbar.innerHTML = `
        <nav class="navbar navbar-expand-lg bg-dark border-bottom border-body" data-bs-theme="dark">
            <div class="container-fluid">
                <a class="navbar-brand" href="${basePath}index.html">Tres Katanas</a>

                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuTresKatanas">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="menuTresKatanas">
                    <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                        ${linksPaginas}
                        ${enlaceAdmin}
                    </ul>

                    <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
                        <li class="nav-item me-3">
                            <a class="nav-link carrito-nav" href="${basePath}pages/carrito.html">
                                Carrito
                                <span class="contador-carrito" id="contador-carrito">0</span>
                            </a>
                        </li>

                        ${accionesUsuario}
                    </ul>
                </div>
            </div>
        </nav>
    `;

    const botonLogout = document.querySelector("#btn-logout");

    if (botonLogout) {
        botonLogout.addEventListener("click", () => {
            cerrarSesion();
            window.location.href = `${basePath}pages/login.html`;
        });
    }

    actualizarContadorCarritoNavbar();
}

function obtenerCantidadCarritoNavbar() {
    return obtenerCarrito().reduce((total, producto) => total + producto.cantidad, 0);
}

function actualizarContadorCarritoNavbar() {
    const contadorCarrito = document.querySelector("#contador-carrito");

    if (!contadorCarrito) {
        return;
    }

    const cantidad = obtenerCantidadCarritoNavbar();
    contadorCarrito.textContent = cantidad;
    contadorCarrito.classList.toggle("contador-carrito-visible", cantidad > 0);
}

crearNavbar();
