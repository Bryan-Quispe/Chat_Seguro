// models/Room.js
import mongoose from "mongoose";
import { decryptPin } from "../utils/pinCrypto.js";

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // store deterministic HMAC for lookup and uniqueness
  pinHash: { type: String, required: true, unique: true },
  // store encrypted pin (confidential, reversible with key)
  pinEncrypted: { type: String, required: true },
  type: { type: String, default: "standard" }, // 👈 "standard" o "multimedia"
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Virtual to return decrypted PIN when needed (use with care)
roomSchema.virtual('pin').get(function () {
  if (!this.pinEncrypted) return undefined;
  return decryptPin(this.pinEncrypted);
});

roomSchema.set('toJSON', { virtuals: true });

export default mongoose.model("Room", roomSchema);

