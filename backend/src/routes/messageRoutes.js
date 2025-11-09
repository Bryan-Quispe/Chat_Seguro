import express from "express";
import Message from "../models/Message.js";
import { deleteMessage, editMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Obtener mensajes de una sala
router.get("/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ room: roomId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error obteniendo mensajes:", err);
    res.status(500).json({ message: "Error al obtener mensajes" });
  }
});

// Eliminar mensaje (requiere autenticación)
router.delete("/:id", protect, deleteMessage);

// Editar mensaje (requiere autenticación)
router.put("/:id", protect, editMessage);

export default router;
