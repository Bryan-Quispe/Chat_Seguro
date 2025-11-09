import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  sender: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: "text" }, // "text", "file", "deleted"
  fileUrl: { type: String }, // URL del archivo si es tipo file
  edited: { type: Boolean, default: false }, // Indica si el mensaje fue editado
  timestamp: { type: Date, default: Date.now },
});

// ✅ Índice para búsquedas rápidas por sala y tiempo
messageSchema.index({ room: 1, timestamp: 1 });

export default mongoose.model("Message", messageSchema);
