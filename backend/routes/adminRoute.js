import express from "express";
import { createCategory } from "../controllers/addCatAdmin.js";
import { uploadImage } from '../middleware/upload.js';
import { getPassagesByCategory } from "../controllers/questionController.js";
import { getPaymentHistory } from "../controllers/paymentController.js";
import { isAuth } from "../middleware/isAuth.js";
const router = express.Router();

router.post('/upload-image', (req, res) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    res.status(201).json({ message: 'Image uploaded successfully', imageUrl: fileUrl });
  });
});

// Create category
router.post("/", uploadImage.single("image"), createCategory);

// FIXED — REMOVE /admin
router.get("/questions/passages", getPassagesByCategory);

// Passage + children
router.get("/payments", isAuth, getPaymentHistory);


export default router;
