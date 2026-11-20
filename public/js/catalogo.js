import { obtenerProductos } from "./productosService.js";

const contenedor = document.querySelector("#productos");
const orden = document.querySelector("#orden-productos");
const estado = document.querySelector("#estado-catalogo");
const porNombre = new Intl.Collator("es-AR", { sensitivity: "base", numeric: true });
const compararNombre = (a, b) => porNombre.compare(a.nombre, b.nombre);
const comparar = {
    "nombre-asc": compararNombre,
    "nombre-desc": (a, b) => compararNombre(b, a),
    "precio-asc": (a, b) => a.precio - b.precio || compararNombre(a, b),
    "precio-desc": (a, b) => b.precio - a.precio || compararNombre(a, b)
};

function mostrarCategoria(productos) {
    const categoria = claveCategoria(contenedor.dataset.categoria);
    const lista = productos.filter((producto) => claveCategoria(producto.categoria) === categoria);
    if (!lista.length) {
        estado.textContent = "Todavía no hay productos en esta categoría.";
        return;
    }

    renderizarProductos(lista, contenedor);
    const tarjetas = new Map(lista.map((producto, indice) => [producto.id, contenedor.children[indice]]));
    const ordenar = () => {
        const ordenados = [...lista].sort(comparar[orden.value]);
        contenedor.append(...ordenados.map((producto) => tarjetas.get(producto.id)));
    };
    orden.addEventListener("change", ordenar);
    ordenar();
    orden.disabled = false;
    estado.textContent = "";
}

function mostrarInicio(productos) {
    const grupos = new Map();
    for (const producto of productos) {
        const clave = claveCategoria(producto.categoria);
        const categoria = categoriasProducto.has(clave) ? clave : producto.categoria;
        if (!grupos.has(categoria)) grupos.set(categoria, []);
        grupos.get(categoria).push(producto);
    }

    for (const [categoria, lista] of grupos) {
        const titulo = document.createElement("h2");
        titulo.className = "text-center titulo-seccion mb-4";
        titulo.textContent = nombreCategoria(categoria);
        const grilla = document.createElement("div");
        grilla.className = "row justify-content-center g-4 mb-5";
        contenedor.append(titulo, grilla);
        renderizarProductos(lista, grilla);
    }

    estado.textContent = productos.length ? "" : "El catálogo está vacío.";
}

try {
    const productos = await obtenerProductos();
    if (orden) mostrarCategoria(productos);
    else mostrarInicio(productos);
} catch (error) {
    estado.textContent = error.message;
}
