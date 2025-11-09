import express from "express";
import { uploadFile } from "../controllers/fileController.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// POST /api/files/upload
router.post("/upload", upload.single("file"), uploadFile);

export default router;
