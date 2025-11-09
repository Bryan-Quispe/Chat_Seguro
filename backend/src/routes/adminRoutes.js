import express from "express";
import { 
  registerAdmin, 
  loginAdmin, 
  getMyRooms, 
  updateRoom, 
  deleteRoom 
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Registrar nuevo admin
router.post("/register", registerAdmin);

// Iniciar sesión
router.post("/login", loginAdmin);

// Obtener mis salas creadas (requiere autenticación)
router.get("/rooms", protect, getMyRooms);

// Actualizar sala (requiere autenticación)
router.put("/rooms/:id", protect, updateRoom);

// Eliminar sala (requiere autenticación)
router.delete("/rooms/:id", protect, deleteRoom);

export default router;
