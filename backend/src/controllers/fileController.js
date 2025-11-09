import Message from "../models/Message.js";
import Room from "../models/Room.js";

export const uploadFile = async (req, res) => {
  try {
    const { roomId, sender } = req.body;
    const file = req.file;

    if (!file) {
      console.log("❌ No se recibió archivo");
      return res.status(400).json({ message: "No se recibió archivo" });
    }

    if (!roomId || !sender) {
      console.log("❌ Faltan roomId o sender");
      return res.status(400).json({ message: "Faltan datos obligatorios (roomId, sender)" });
    }

    // Confirmar datos
    console.log("📎 Archivo recibido:", file.originalname, file.mimetype);
    console.log("📌 Datos:", { roomId, sender });

    // Buscar sala
    const room = await Room.findById(roomId);
    if (!room) {
      console.log("❌ Sala no encontrada");
      return res.status(404).json({ message: "Sala no encontrada" });
    }

    // ✅ Validar que la sala sea multimedia
    if (room.type !== "multimedia") {
      console.log("⚠️ Sala no permite archivos (tipo:", room.type, ")");
      return res.status(403).json({ message: "Esta sala no permite archivos. Solo salas multimedia pueden compartir archivos." });
    }

    // Construir URL del archivo
    const fileUrl = `/uploads/${file.filename}`;

    // Guardar mensaje en Mongo
    const message = new Message({
      room: roomId,
      sender,
      content: fileUrl,
      type: "file",
    });

    await message.save();
    console.log("✅ Mensaje guardado en MongoDB:", message);

    res.status(200).json({
      message: "Archivo subido correctamente",
      fileUrl: fileUrl,
      fileName: file.originalname,
      messageId: message._id,
    });
  } catch (error) {
    console.error("❌ Error al subir archivo:", error);
    res.status(500).json({ message: "Error al subir archivo", error: error.message });
  }
};
