import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import roomAdminRoutes from "./routes/roomAdminRoutes.js";

dotenv.config();

const app = express();

// Configuración de CORS (permitimos el frontend)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "Servidor de Chat en Tiempo Real funcionando" });
});

app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
// Servir archivos estáticos desde /uploads
app.use("/uploads", express.static("uploads"));
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/rooms", roomAdminRoutes);



export default app;
