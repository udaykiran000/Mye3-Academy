// backend/routes/dashboardRoute.js
// (Create this new file)

import express from "express";
import { getAdminStats } from "../controllers/dashboardController.js";
import { isAuth, isAdmin } from "../middleware/isAuth.js"; // Assuming you have an isAdmin middleware

const router = express.Router();

// GET /api/v1/dashboard/stats
router.get("/stats", isAuth, isAdmin, getAdminStats);

export default router;