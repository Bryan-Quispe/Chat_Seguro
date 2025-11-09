import Message from "../models/Message.js";
import Room from "../models/Room.js";
import User from "../models/User.js";

// 🔹 Eliminar mensaje (solo admin o autor)
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params; // id del mensaje
    const userId = req.user?._id;

    if (!userId)
      return res.status(401).json({ message: "Usuario no autenticado" });

    // Buscar mensaje y su sala
    const message = await Message.findById(id);
    if (!message)
      return res.status(404).json({ message: "Mensaje no encontrado" });

    const room = await Room.findById(message.room);
    const user = await User.findById(userId);

    if (!room || !user)
      return res.status(404).json({ message: "Sala o usuario no encontrado" });

    // Validar si es admin o autor
    const isAdmin = room.createdBy?.toString() === userId.toString();
    const isAuthor = message.sender === user.username;

    if (!isAdmin && !isAuthor)
      return res.status(403).json({ message: "No autorizado" });

    // Marcar mensaje como eliminado
    message.content = isAdmin
      ? "🗑️ Mensaje eliminado por el administrador"
      : "🗑️ Mensaje eliminado";
    message.type = "deleted";
    await message.save();

    res.json({ message: "Mensaje eliminado correctamente", updated: message });
  } catch (err) {
    console.error("Error al eliminar mensaje:", err);
    res.status(500).json({ message: "Error al eliminar mensaje", error: err.message });
  }
};

// 🔹 Editar mensaje (solo autor)
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId)
      return res.status(401).json({ message: "Usuario no autenticado" });

    if (!content || !content.trim())
      return res.status(400).json({ message: "El contenido no puede estar vacío" });

    // Buscar mensaje
    const message = await Message.findById(id);
    if (!message)
      return res.status(404).json({ message: "Mensaje no encontrado" });

    // Solo archivos no se pueden editar
    if (message.type === "file")
      return res.status(400).json({ message: "No puedes editar archivos" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // Solo el autor puede editar
    if (message.sender !== user.username)
      return res.status(403).json({ message: "Solo puedes editar tus propios mensajes" });

    // Actualizar mensaje
    message.content = content.trim();
    message.edited = true;
    await message.save();

    res.json({ message: "Mensaje editado correctamente", updated: message });
  } catch (err) {
    console.error("Error al editar mensaje:", err);
    res.status(500).json({ message: "Error al editar mensaje", error: err.message });
  }
};
