import { registrarUsuario } from "./productosService.js";

const formulario = document.querySelector("#formulario-registro");
const estado = document.querySelector("#estado-registro");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const boton = formulario.querySelector("button[type=submit]");
    if (boton.disabled) return;
    boton.disabled = true;
    estado.textContent = "";

    try {
        await registrarUsuario({
            nombre: formulario.querySelector("#nombre").value,
            apellido: formulario.querySelector("#apellido").value,
            email: formulario.querySelector("#registro-email").value,
            password: formulario.querySelector("#registro-password").value,
            direccion: formulario.querySelector("#direccion").value,
            activo: true
        });
        location.href = "./login.html";
    } catch (error) {
        estado.textContent = error.message;
        boton.disabled = false;
    }
});
