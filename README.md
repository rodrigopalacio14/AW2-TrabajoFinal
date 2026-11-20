# Tres Katanas

Aplicaciones Web 2 ·

Tres Katanas es una tienda de electrónica, perfumes árabes y vapers. Permite navegar por el catálogo, ordenar productos, armar un carrito y confirmar pedidos. El cliente puede coordinar el pago por WhatsApp tras elegir transferencia o efectivo. El panel de administración gestiona usuarios, productos y ventas.

## Cómo ejecutar

Requisitos: Node.js 22 o posterior, npm y acceso de lectura y escritura a MongoDB Atlas desde la red utilizada.

El proyecto carga la configuración de MongoDB y JWT desde el archivo `.env` en la raíz del repositorio.

| Variable | Uso |
| --- | --- |
| `MONGODB_URI` | URI de conexión a la base de Atlas. |
| `JWT_SECRET` | Clave privada para firmar y verificar tokens. |

```bash
npm install
npm run migrar
npm run dev
```

La migración manual conserva los IDs y las ventas históricas, y aplica bcrypt a las contraseñas importadas. Se puede reanudar sin duplicar registros. La tienda abre en [http://localhost:4000/](http://localhost:4000/).

El panel se abre en `/pages/admin.html`. Para habilitar una cuenta administradora, su documento en la colección `usuarios` debe tener `rol: "admin"` y `activo: true`. El panel permite cargar fotos de productos desde la instalación local.

## Arquitectura y mejoras

| Parte | Responsabilidad |
| --- | --- |
| `public/` | Interfaz en HTML, CSS, JavaScript y Bootstrap, basada en la [tienda de AW1](https://github.com/rodrigopalacio14/AW1-E-commerce). |
| `index.js`, `routes/`, `controllers/` | Express sirve la tienda y la API desde el mismo servidor. nodemon reinicia el servidor durante el desarrollo. |
| `config/`, `models/` | Mongoose conecta con Atlas y guarda usuarios, catálogo y ventas. Cada venta conserva el precio de sus productos al momento de registrarla. |
| `middlewares/` | Registro de solicitudes y permisos. jsonwebtoken firma y verifica el JWT de una hora. La API identifica al comprador a partir del token. |
| `data/`, `scripts/migrar.js` | JSON de origen y migración manual. bcryptjs convierte las contraseñas en hashes al importar, registrar o actualizar una cuenta y las verifica en el login. |

## API

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/usuarios`, `/usuarios/login` | Público. |
| `GET` | `/usuarios` | Administrador. |
| `GET`, `PUT`, `DELETE` | `/usuarios/:id` | Titular o administrador. |
| `GET` | `/productos`, `/productos/:id` | Público. |
| `POST` | `/productos` | Administrador. |
| `PUT`, `DELETE` | `/productos/:id` | Administrador. |
| `POST` | `/ventas` | Usuario autenticado. |
| `POST` | `/ventas/admin` | Administrador. |
| `GET` | `/ventas`, `/ventas/:id` | Administrador. |
| `PUT`, `DELETE` | `/ventas/:id` | Administrador. |npm