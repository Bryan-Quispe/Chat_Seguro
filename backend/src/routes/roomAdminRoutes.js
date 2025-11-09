import express from "express";
import Room from "../models/Room.js";

const router = express.Router();

// 📦 Obtener todas las salas del usuario actual (si usas token, puedes filtrar por createdBy)
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error("Error al obtener salas:", err);
    res.status(500).json({ message: "Error al obtener salas" });
  }
});

// ✏️ Actualizar sala
router.put("/:id", async (req, res) => {
  try {
    const { name, type } = req.body;
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { name, type },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: "Sala no encontrada" });
    res.json({ message: "Sala actualizada correctamente", room });
  } catch (err) {
    console.error("Error al actualizar sala:", err);
    res.status(500).json({ message: "Error al actualizar sala" });
  }
});

// 🗑️ Eliminar sala
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Room.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Sala no encontrada" });
    res.json({ message: "Sala eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar sala:", err);
    res.status(500).json({ message: "Error al eliminar sala" });
  }
});

export default router;
