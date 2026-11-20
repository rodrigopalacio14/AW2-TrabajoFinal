import { obtenerProductos } from "./productosService.js";

const contenedor = document.querySelector("#productos");
const filtro = document.querySelector("#categoria");
const estado = document.querySelector("#estado-catalogo");

try {
    const productos = await obtenerProductos();
    const grupos = new Map();
    for (const producto of productos) {
        if (!grupos.has(producto.categoria)) grupos.set(producto.categoria, []);
        grupos.get(producto.categoria).push(producto);
    }

    if (filtro) {
        for (const categoria of grupos.keys()) {
            filtro.add(new Option(nombreCategoria(categoria), categoria));
        }
        filtro.value = grupos.has(contenedor.dataset.categoria) ? contenedor.dataset.categoria : "";
        const titulo = document.querySelector(".titulo-principal");
        const actualizar = () => {
            titulo.textContent = filtro.value ? nombreCategoria(filtro.value) : "Categorías";
            renderizarProductos(filtro.value ? grupos.get(filtro.value) : productos, contenedor);
        };
        filtro.addEventListener("change", actualizar);
        actualizar();
    } else {
        for (const [categoria, lista] of grupos) {
            const titulo = document.createElement("h2");
            titulo.className = "text-center titulo-seccion mb-4";
            titulo.textContent = nombreCategoria(categoria);
            const grilla = document.createElement("div");
            grilla.className = "row justify-content-center g-4 mb-5";
            contenedor.append(titulo, grilla);
            renderizarProductos(lista, grilla);
        }
    }

    estado.textContent = productos.length ? "" : "El catálogo está vacío.";
} catch (error) {
    estado.textContent = error.message;
}
