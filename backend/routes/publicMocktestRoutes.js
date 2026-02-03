// routes/publicMocktestRoutes.js
import express from "express";
import { getPublicMockTests, getPublicMockTestById } from "../controllers/publicController.js";

const router = express.Router();

// GET All published tests with search + category filters
router.get("/", getPublicMockTests);

// GET Single published test
router.get("/:id", getPublicMockTestById);

export default router;
