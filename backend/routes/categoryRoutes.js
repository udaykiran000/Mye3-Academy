import express from "express";
import { createCategory, getCategories, updateCategory, deleteCategory } from "../controllers/addCatAdmin.js"; // ✅ Import getCategories
import { uploadImage } from '../middleware/upload.js';

const router = express.Router();

// 1. Upload Image Helper
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

// 2. Create Category (POST)
router.post("/", uploadImage.single("image"), createCategory);

// 3. Get All Categories (GET) - ✅ FIXES THE 404 ERROR
router.get("/", getCategories);

// 4. Update Category (PUT)
router.put("/:id", uploadImage.single("image"), updateCategory);

// 5. Delete Category (DELETE)
router.delete("/:id", deleteCategory);

export default router;