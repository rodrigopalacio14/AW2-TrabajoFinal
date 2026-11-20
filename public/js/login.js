import { ingresar } from "./productosService.js";

const formularioLogin = document.querySelector("#formulario-login");
const estadoLogin = document.querySelector("#estado-login");
const volverAlCarrito = new URLSearchParams(location.search).get("volver") === "carrito";

formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const boton = formularioLogin.querySelector("button[type=submit]");
    if (boton.disabled) return;
    boton.disabled = true;
    estadoLogin.textContent = "";

    try {
        const email = formularioLogin.querySelector("#email").value;
        const password = formularioLogin.querySelector("#password").value;
        const { usuario } = await ingresar(email, password);
        iniciarSesion(usuario);
        location.href = volverAlCarrito ? "./carrito.html" : "../";
    } catch (error) {
        estadoLogin.textContent = error.message;
        boton.disabled = false;
    }
});
