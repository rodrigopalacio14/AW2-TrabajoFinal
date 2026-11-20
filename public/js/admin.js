import { administrar } from "./productosService.js";

const recursos = {
    usuarios: {
        singular: "usuario",
        titulo: "Usuarios",
        campos: [
            ["nombre", "Nombre"], ["apellido", "Apellido"], ["email", "Correo", "email"],
            ["password", "Contraseña", "password"], ["direccion", "Dirección"], ["activo", "Activo", "checkbox"]
        ],
        columnas: ["ID", "Nombre", "Correo", "Dirección", "Rol", "Estado"],
        valores: (u) => [u.id, `${u.nombre} ${u.apellido}`, u.email, u.direccion,
            u.rol === "admin" ? "Administrador" : "Cliente", u.activo ? "Activo" : "Inactivo"]
    },
    productos: {
        singular: "producto",
        titulo: "Productos",
        campos: [
            ["nombre", "Nombre"], ["descripcion", "Descripción"], ["categoria", "Categoría", "categoria"],
            ["precio", "Precio (ARS)", "number"], ["stock", "Stock", "number"],
            ["disponible", "Disponible", "checkbox"]
        ],
        columnas: ["ID", "Nombre", "Descripción", "Categoría", "Precio", "Stock", "Imagen", "Estado"],
        valores: (p) => [p.id, p.nombre, p.descripcion, p.categoria, formatearPrecio(p.precio), p.stock,
            p.imagen, p.disponible ? "Disponible" : "No disponible"]
    },
    ventas: {
        singular: "venta",
        titulo: "Ventas",
        campos: [["id_usuario", "Comprador", "usuario"], ["direccion", "Dirección"], ["entregado", "Entregada", "checkbox"]],
        columnas: ["ID", "Comprador", "Fecha", "Dirección", "Productos", "Total", "Estado"],
        valores: (v) => [v.id, etiquetaUsuario(v.id_usuario), v.fecha, v.direccion,
            v.productos.map((p) => `${etiquetaProducto(p.id_producto)} × ${p.cantidad} (${formatearPrecio(p.precio)} c/u)`).join("; "),
            formatearPrecio(v.total), v.entregado ? "Entregada" : "Pendiente"]
    }
};

const sesion = obtenerUsuario();
const panel = document.querySelector("#panel-admin");
const estado = document.querySelector("#estado-admin");
const formulario = document.querySelector("#form-admin");
const estadoFormulario = document.querySelector("#estado-form-admin");
const campos = document.querySelector("#campos-admin");
const agregar = document.querySelector("#nuevo-registro");
const encabezado = document.querySelector("#encabezado-admin");
const listado = document.querySelector("#listado-admin");
const pestanas = [...panel.querySelectorAll("[data-recurso]")];

let datos = {};
let recurso = "usuarios";
let editado;
let ocupado = false;

function etiquetaUsuario(id) {
    const usuario = datos.usuarios.find((u) => u.id === id);
    return usuario ? `#${id} · ${usuario.nombre} ${usuario.apellido}` : `#${id}`;
}

function etiquetaProducto(id) {
    const producto = datos.productos.find((p) => p.id === id);
    return producto ? `#${id} · ${producto.nombre}` : `#${id}`;
}

function boton(texto, clases, accion) {
    const elemento = document.createElement("button");
    elemento.type = "button";
    elemento.className = `btn ${clases}`;
    elemento.textContent = texto;
    elemento.addEventListener("click", accion);
    return elemento;
}

function celda(etiqueta, texto) {
    const elemento = document.createElement(etiqueta);
    elemento.textContent = texto;
    if (etiqueta === "th") elemento.scope = "col";
    return elemento;
}

function renderizarListado() {
    const { titulo, singular, columnas, valores } = recursos[recurso];
    const registros = datos[recurso];
    document.querySelector("#titulo-listado").textContent = `${titulo} (${registros.length})`;
    agregar.textContent = `Agregar ${singular}`;
    for (const pestana of pestanas) {
        const activa = pestana.dataset.recurso === recurso;
        pestana.classList.toggle("active", activa);
        pestana.setAttribute("aria-pressed", String(activa));
    }

    const cabecera = document.createElement("tr");
    cabecera.append(...[...columnas, "Acciones"].map((texto) => celda("th", texto)));
    encabezado.replaceChildren(cabecera);
    listado.replaceChildren();

    if (!registros.length) {
        const fila = listado.insertRow();
        const vacio = celda("td", "No hay registros.");
        vacio.colSpan = columnas.length + 1;
        fila.append(vacio);
    }

    for (const registro of registros) {
        const fila = listado.insertRow();
        fila.append(...valores(registro).map((texto) => celda("td", texto)));
        const acciones = fila.insertCell();
        acciones.className = "text-nowrap";
        acciones.append(
            boton("Editar", "btn-outline-light btn-sm me-2", () => { if (!ocupado) abrirFormulario(registro); }),
            boton("Eliminar", "btn-outline-danger btn-sm", () => eliminar(registro))
        );
    }
}

function selector(registros, etiqueta, valor) {
    const campo = document.createElement("select");
    campo.className = "form-select";
    campo.required = true;
    campo.add(new Option("Seleccionar", ""));
    for (const registro of registros) campo.add(new Option(etiqueta(registro.id), registro.id));
    if (valor !== undefined) campo.value = String(valor);
    return campo;
}

const tiposImagen = ["image/jpeg", "image/png", "image/webp"];
const maximoImagen = 2 * 1024 * 1024;

function validarArchivoImagen(archivo) {
    if (!tiposImagen.includes(archivo.type)) return "Seleccioná una imagen JPG, PNG o WebP.";
    if (archivo.size > maximoImagen) return "La imagen supera el límite de 2 MB.";
    return "";
}

function agregarCampoImagen(registro) {
    const bloque = document.createElement("div");
    bloque.className = "col-md-6";
    bloque.innerHTML = `
        <label class="form-label" for="admin-imagen">Imagen del producto</label>
        <input id="admin-imagen" name="imagen" class="form-control" type="file"
            accept="image/jpeg,image/png,image/webp" aria-describedby="ayuda-imagen">
        <small id="ayuda-imagen">JPG, PNG o WebP, hasta 2 MB.</small>
        <div class="vista-previa-imagen mt-2"></div>
    `;

    const campo = bloque.querySelector("input");
    const vista = bloque.querySelector(".vista-previa-imagen");
    campo.required = !registro;

    function mostrarActual() {
        vista.replaceChildren();
        if (!registro) return;
        const anterior = document.createElement("span");
        anterior.textContent = "Sin imagen";
        vista.append(anterior);
        mostrarImagenProducto(anterior, registro);
    }

    campo.addEventListener("change", () => {
        const archivo = campo.files[0];
        const error = archivo ? validarArchivoImagen(archivo) : "";
        campo.setCustomValidity(error);
        if (!archivo || error) {
            mostrarActual();
            if (error) campo.reportValidity();
            return;
        }
        const imagen = document.createElement("img");
        imagen.alt = "Vista previa de la imagen seleccionada";
        const url = URL.createObjectURL(archivo);
        imagen.onload = () => URL.revokeObjectURL(url);
        imagen.onerror = () => {
            URL.revokeObjectURL(url);
            if (campo.files[0] === archivo) {
                campo.setCustomValidity("El archivo no se pudo abrir como imagen.");
                mostrarActual();
                campo.reportValidity();
            }
        };
        imagen.src = url;
        vista.replaceChildren(imagen);
    });

    mostrarActual();
    campos.append(bloque);
}

function prepararArchivoImagen(archivo) {
    const error = validarArchivoImagen(archivo);
    if (error) throw new Error(error);
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve({
            tipo: archivo.type,
            base64: lector.result.split(",")[1]
        });
        lector.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
        lector.readAsDataURL(archivo);
    });
}

function selectorCategoria(valor) {
    const campo = document.createElement("select");
    campo.className = "form-select";
    campo.required = true;
    campo.add(new Option("Seleccioná una categoría", ""));
    for (const [clave, nombre] of categoriasProducto) campo.add(new Option(nombre, clave));
    const actual = claveCategoria(valor ?? "");
    if (categoriasProducto.has(actual)) campo.value = actual;
    return campo;
}

function agregarCampo([nombre, texto, tipo = "text"], registro) {
    const bloque = document.createElement("div");
    bloque.className = "col-md-6";
    const label = document.createElement("label");
    label.className = "form-label";
    label.htmlFor = `admin-${nombre}`;
    label.textContent = texto;

    let campo;
    if (tipo === "usuario") {
        campo = selector(datos.usuarios, etiquetaUsuario, registro?.[nombre]);
    } else if (tipo === "categoria") {
        campo = selectorCategoria(registro?.[nombre]);
    } else {
        campo = document.createElement("input");
        campo.type = tipo;
        campo.className = tipo === "checkbox" ? "form-check-input ms-2" : "form-control";
        campo.required = tipo !== "checkbox" && (tipo !== "password" || !registro);
        campo.value = tipo === "password" ? "" : registro?.[nombre] ?? "";
        if (tipo === "checkbox") campo.checked = registro?.[nombre] ?? nombre !== "entregado";
        if (tipo === "number") {
            campo.min = 0;
            campo.step = nombre === "precio" ? "any" : "1";
        }
        if (tipo === "password") campo.autocomplete = "new-password";
    }

    campo.id = label.htmlFor;
    campo.name = nombre;
    bloque.append(label, campo);
    campos.append(bloque);
}

function agregarLineas(productos) {
    const bloque = document.createElement("fieldset");
    bloque.className = "col-12";
    const titulo = document.createElement("legend");
    titulo.className = "h6";
    titulo.textContent = "Productos de la venta";
    const lineas = document.createElement("div");

    function agregarLinea(item = {}) {
        const fila = document.createElement("div");
        fila.className = "d-flex flex-wrap flex-sm-nowrap gap-2 mb-2";
        fila.dataset.linea = "";
        const producto = selector(datos.productos, etiquetaProducto, item.id_producto);
        producto.setAttribute("aria-label", "Producto");
        const cantidad = document.createElement("input");
        cantidad.type = "number";
        cantidad.min = 1;
        cantidad.value = item.cantidad ?? 1;
        cantidad.required = true;
        cantidad.className = "form-control w-auto";
        cantidad.setAttribute("aria-label", "Cantidad");
        fila.append(producto, cantidad, boton("Quitar", "btn-outline-light", () => {
            if (lineas.childElementCount > 1) fila.remove();
        }));
        lineas.append(fila);
    }

    for (const item of productos) agregarLinea(item);
    bloque.append(titulo, lineas, boton("Agregar producto", "btn-outline-light btn-sm", () => agregarLinea()));
    campos.append(bloque);
}

function abrirFormulario(registro) {
    editado = registro;
    campos.replaceChildren();
    estadoFormulario.textContent = "";
    const { singular, campos: definiciones } = recursos[recurso];
    document.querySelector("#titulo-form-admin").textContent = registro
        ? `Editar ${singular} #${registro.id}` : `Agregar ${singular}`;
    for (const definicion of definiciones) agregarCampo(definicion, registro);
    if (recurso === "productos") agregarCampoImagen(registro);
    if (recurso === "ventas") agregarLineas(registro?.productos ?? [{}]);
    formulario.hidden = false;
    campos.querySelector("input, select").focus();
}

async function leerFormulario() {
    const resultado = {};
    for (const [nombre, , tipo] of recursos[recurso].campos) {
        const campo = formulario.elements.namedItem(nombre);
        if (nombre === "password" && editado && !campo.value) continue;
        if (tipo === "checkbox") resultado[nombre] = campo.checked;
        else if (tipo === "number" || tipo === "usuario") resultado[nombre] = Number(campo.value);
        else resultado[nombre] = campo.value;
    }

    if (recurso === "ventas") {
        const productos = [...campos.querySelectorAll("[data-linea]")].map((fila) => ({
            id_producto: Number(fila.querySelector("select").value),
            cantidad: Number(fila.querySelector("input").value)
        }));
        const anteriores = editado?.productos.map(({ id_producto, cantidad }) => ({ id_producto, cantidad }));
        if (JSON.stringify(productos) !== JSON.stringify(anteriores)) resultado.productos = productos;
    }
    if (recurso === "productos") {
        const archivo = formulario.elements.namedItem("imagen").files[0];
        if (archivo) resultado.imagenArchivo = await prepararArchivoImagen(archivo);
    }
    return resultado;
}

function mostrarError(error, destino = estado) {
    if (error.status === 401) {
        cerrarSesion();
        crearNavbar();
        panel.hidden = true;
        estado.textContent = "Tu sesión venció. Volvé a iniciar sesión.";
        return;
    }
    if (error.status === 403) {
        panel.hidden = true;
        estado.textContent = "El panel requiere una cuenta administradora activa.";
        return;
    }
    destino.textContent = error.message;
}

async function cargarDatos() {
    const entradas = await Promise.all(Object.keys(recursos).map(async (clave) =>
        [clave, await administrar(clave, sesion.token)]
    ));
    datos = Object.fromEntries(entradas);
    renderizarListado();
}

async function cambiarRegistro(operacion, mensaje, destino = estado) {
    if (ocupado) return;
    ocupado = true;
    panel.inert = true;
    estado.textContent = "";
    estadoFormulario.textContent = "";
    try {
        await operacion();
        formulario.hidden = true;
        estado.textContent = mensaje;
        try {
            await cargarDatos();
        } catch (error) {
            mostrarError(error);
            if (error.status !== 401 && error.status !== 403) {
                estado.textContent = `${mensaje} No se pudo actualizar el listado. Recargá la página.`;
            }
        }
    } catch (error) {
        mostrarError(error, destino);
    } finally {
        panel.inert = false;
        ocupado = false;
    }
}

function eliminar(registro) {
    if (ocupado || !confirm(`¿Eliminar ${recursos[recurso].singular} #${registro.id}?`)) return;
    const ruta = `${recurso}/${registro.id}`;
    void cambiarRegistro(() => administrar(ruta, sesion.token, "DELETE"), "Registro eliminado.");
}

for (const pestana of pestanas) {
    pestana.addEventListener("click", () => {
        recurso = pestana.dataset.recurso;
        formulario.hidden = true;
        estado.textContent = "";
        renderizarListado();
    });
}

agregar.addEventListener("click", () => abrirFormulario());
document.querySelector("#cancelar-admin").addEventListener("click", () => { formulario.hidden = true; });
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (ocupado) return;
    const ruta = editado ? `${recurso}/${editado.id}` : recurso === "ventas" ? "ventas/admin" : recurso;
    const metodo = editado ? "PUT" : "POST";
    void cambiarRegistro(async () => {
        const cuerpo = await leerFormulario();
        return administrar(ruta, sesion.token, metodo, cuerpo);
    }, "Registro guardado.", estadoFormulario);
});

if (!sesion) {
    location.replace("./login.html");
} else {
    try {
        await cargarDatos();
        panel.hidden = false;
    } catch (error) {
        mostrarError(error);
    }
}
