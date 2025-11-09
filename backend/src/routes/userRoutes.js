import express from "express";
import {
  getUserRooms,
  joinRoom,
  getCreatedRooms,   // 👈 asegúrate de tener esta importación
} from "../controllers/userController.js";

const router = express.Router();

router.get("/:nickname/rooms", getUserRooms);
router.get("/:nickname/created", getCreatedRooms); // ✅ Nueva ruta
router.post("/join", joinRoom);

export default router;
