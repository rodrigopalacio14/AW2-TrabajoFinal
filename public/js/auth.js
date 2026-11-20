const USUARIO_LOGUEADO = "usuarioLogueado";

function obtenerUsuario() {
    try {
        const usuario = JSON.parse(sessionStorage.getItem(USUARIO_LOGUEADO));
        if (Number.isInteger(usuario?.id) && typeof usuario.nombre === "string") {
            return usuario;
        }
    } catch {
        // La sesión anterior puede tener otro formato.
    }
    cerrarSesion();
    return null;
}

function estaLogueado() {
    return obtenerUsuario() !== null;
}

function iniciarSesion({ id, nombre }) {
    sessionStorage.setItem(USUARIO_LOGUEADO, JSON.stringify({ id, nombre }));
}

function cerrarSesion() {
    sessionStorage.removeItem(USUARIO_LOGUEADO);
}

function obtenerBasePath() {
    return window.location.pathname.includes("/pages/") ? "../" : "./";
}
