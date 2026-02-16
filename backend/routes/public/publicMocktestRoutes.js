import express from "express";
const router = express.Router();

import {
  getAllCategories,
  getPublishedMockTests,
  getMockTestById,
} from "../../controllers/public/portalController.js";

// Routes for Landing Page
router.get("/categories", getAllCategories); // This handles /api/public/mocktests/categories
router.get("/all", getPublishedMockTests);
router.get("/:id", getMockTestById);

export default router;
