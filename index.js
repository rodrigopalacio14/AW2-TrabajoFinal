import { fileURLToPath } from "node:url";
import express from "express";
import usuariosRoutes from "./routes/usuarios.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";

import { conectarMongoDB, desconectarMongoDB } from "./config/db.js";
import logger from "./middlewares/logger.middleware.js";

const app = express();
const puerto = 4000;

app.use(logger);
app.use(express.static(fileURLToPath(new URL("./public/", import.meta.url))));
app.get("/pages/admin", (_req, res) => res.redirect("/pages/admin.html"));
app.use("/usuarios", express.json(), usuariosRoutes);
app.use("/productos", productosRoutes);
app.use("/ventas", express.json(), ventasRoutes);

try {
  await conectarMongoDB();
  app.listen(puerto, async (error) => {
    if (error) {
      console.error("No se pudo iniciar Express en el puerto 4000.");
      process.exitCode = 1;
      await desconectarMongoDB();
      return;
    }
    console.log(`Tres Katanas: servidor en http://localhost:${puerto}`);
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
