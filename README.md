# Tres Katanas

Trabajo práctico de Aplicaciones Web 2 — Segunda etapa.

Backend del e-commerce Tres Katanas, desarrollado con Node.js y Express. Los usuarios, productos y ventas se guardan en archivos JSON.

## Cómo ejecutar

Instalar las dependencias desde la carpeta del proyecto:

```bash
npm install
```

Iniciar el servidor:

```bash
npm run dev
```

También se puede usar `npm start` para ejecutarlo sin nodemon.

El servidor usa el puerto **4000**: `http://localhost:4000`.

## Archivos

- `index.js`: configuración e inicio del servidor.
- `routes/`: rutas de usuarios, productos y ventas.
- `data/`: archivos JSON. Se movieron desde `array-node/` sin cambiar los datos.

## Rutas

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/usuarios` | Lista todos los usuarios. |
| GET | `/usuarios/:id` | Busca un usuario por ID. |
| POST | `/usuarios/login` | Verifica email y contraseña. |
| POST | `/usuarios` | Agrega un usuario. |
| PUT | `/usuarios/:id` | Actualiza un usuario. |
| DELETE | `/usuarios/:id` | Elimina un usuario si no tiene ventas. |
| GET | `/productos` | Lista todos los productos. |
| GET | `/productos/:id` | Busca un producto por ID. |
| POST | `/productos` | Agrega un producto. |
| PUT | `/productos/:id` | Actualiza un producto. |
| GET | `/ventas` | Lista todas las ventas. |
| GET | `/ventas/:id` | Busca una venta por ID. |
| POST | `/ventas` | Registra una venta. |

Reemplazar `:id` por el número del registro. Para POST y PUT, enviar el body como JSON con el encabezado `Content-Type: application/json`.

## Ejemplos de body

### POST /usuarios/login

```json
{
  "email": "rodrigo.palacio@email.com",
  "password": "katanas123"
}
```

Se usa POST para enviar las credenciales en el body. Si coinciden, devuelve un mensaje de bienvenida; si no, responde `401`. Este login no genera sesiones ni tokens.

### POST /usuarios

```json
{
  "nombre": "Ana",
  "apellido": "Perez",
  "email": "ana.perez@email.com",
  "password": "practica123",
  "direccion": "San Martin 100, Rosario",
  "activo": true
}
```

Todos los campos del ejemplo son obligatorios. El ID se asigna automáticamente. No se permiten usuarios con el mismo email.

### PUT /usuarios/3

```json
{
  "direccion": "Belgrano 500, Cordoba",
  "activo": true
}
```

Se pueden actualizar nombre, apellido, email, password, direccion y activo. Los campos que no se envían mantienen su valor y el ID no cambia.

### POST /productos

```json
{
  "nombre": "Auriculares Bluetooth Mini",
  "descripcion": "Auriculares inalambricos con estuche de carga.",
  "categoria": "electronica",
  "precio": 35000,
  "stock": 5,
  "imagen": "auriculares-mini.jpg",
  "disponible": true
}
```

Todos los campos del ejemplo son obligatorios. El precio no puede ser negativo y el stock debe ser un entero mayor o igual a cero. El ID se asigna automáticamente.

### PUT /productos/6

```json
{
  "precio": 19000,
  "stock": 8,
  "disponible": true
}
```

También se pueden actualizar nombre, descripcion, categoria e imagen. Los campos que no se envían mantienen su valor. Cambiar el precio de un producto no modifica las ventas anteriores.

### POST /ventas

```json
{
  "id_usuario": 1,
  "direccion": "Av. Corrientes 1450, CABA",
  "productos": [
    { "id_producto": 1, "cantidad": 1 },
    { "id_producto": 5, "cantidad": 2 }
  ]
}
```

El usuario y los productos deben existir. La venta debe tener al menos un producto y las cantidades deben ser enteros positivos.

El servidor toma los precios del catálogo, calcula el total y agrega el ID, la fecha actual (UTC) y `entregado: false`. La venta se guarda en `ventas.json`. No se descuenta stock.

## Eliminación de usuarios

Antes de eliminar un usuario se revisa si su ID aparece como `id_usuario` en alguna venta. Si tiene ventas relacionadas, se responde `409` y no se elimina. Así no quedan ventas asociadas a usuarios inexistentes.

Con los datos iniciales, `DELETE /usuarios/1` no está permitido porque tiene ventas. `DELETE /usuarios/3` sí está permitido porque no tiene ninguna. No hace falta enviar un body.

## Códigos de respuesta

| Código | Significado |
| --- | --- |
| 200 | Operación exitosa. |
| 201 | Registro creado. |
| 400 | Datos inválidos o incompletos. |
| 401 | Email o contraseña incorrectos. |
| 404 | Usuario, producto o venta no encontrado. |
| 409 | Email repetido o usuario con ventas relacionadas. |
| 500 | Error al leer o guardar los datos. |
