import express from "express";
import usuariosRoutes from "./routes/usuarios.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";

const app = express();
const puerto = 4000;

app.use(express.json());
app.use("/usuarios", usuariosRoutes);
app.use("/productos", productosRoutes);
app.use("/ventas", ventasRoutes);

app.listen(puerto, () => {
  console.log(`Tres Katanas: servidor en http://localhost:${puerto}`);
});
