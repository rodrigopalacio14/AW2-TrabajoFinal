export const textoValido = (valor) => typeof valor === "string" && valor.trim() !== "";
export const idValido = (valor) => Number.isSafeInteger(valor) && valor > 0;
export const importeValido = (valor) => Number.isFinite(valor) && valor >= 0;
export const normalizarEmail = (email) => email.trim().toLowerCase();

export function datosUsuarioValidos({ nombre, apellido, email, direccion, activo }) {
  return [nombre, apellido, email, direccion].every(textoValido)
    && email.includes("@") && typeof activo === "boolean";
}

export function passwordValida(password) {
  return textoValido(password) && Buffer.byteLength(password, "utf8") <= 72;
}

export function datosProductoValidos({ nombre, descripcion, categoria, imagen, precio, stock, disponible }) {
  return [nombre, descripcion, categoria, imagen].every(textoValido)
    && importeValido(precio) && Number.isSafeInteger(stock) && stock >= 0
    && typeof disponible === "boolean";
}
