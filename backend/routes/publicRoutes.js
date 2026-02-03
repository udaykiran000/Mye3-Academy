// backend/routes/publicRoutes.js
import express from "express";
import { getPublicCategories, getPublicMockTests } from "../controllers/publicController.js";

const router = express.Router();

router.get("/categories", getPublicCategories);
router.get("/mocktests", getPublicMockTests);

export default router;
