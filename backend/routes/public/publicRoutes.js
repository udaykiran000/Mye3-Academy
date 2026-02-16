import express from "express";
const router = express.Router();

import {
  getAllCategories,
  getPublishedMockTests,
  getMockTestById,
} from "../../controllers/public/portalController.js";



router.get("/categories", getAllCategories);
router.get("/mocktests", getPublishedMockTests);
router.get("/mocktests/:id", getMockTestById);

export default router;