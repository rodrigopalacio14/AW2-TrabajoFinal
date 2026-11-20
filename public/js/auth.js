const USUARIO_LOGUEADO = "usuarioLogueado";
const ULTIMO_PEDIDO = "ultimoPedidoTresKatanas";

function obtenerUsuario() {
    try {
        const usuario = JSON.parse(sessionStorage.getItem(USUARIO_LOGUEADO));
        if (Number.isInteger(usuario?.id) && typeof usuario.nombre === "string"
            && typeof usuario.token === "string" && usuario.token) {
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

function iniciarSesion({ id, nombre, rol }, token) {
    sessionStorage.setItem(USUARIO_LOGUEADO, JSON.stringify({ id, nombre, rol, token }));
}

function cerrarSesion() {
    sessionStorage.removeItem(USUARIO_LOGUEADO);
    sessionStorage.removeItem(ULTIMO_PEDIDO);
}

function obtenerBasePath() {
    return window.location.pathname.includes("/pages/") ? "../" : "./";
}
