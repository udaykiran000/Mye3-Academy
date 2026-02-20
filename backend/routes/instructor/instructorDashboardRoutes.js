import express from "express";
const router = express.Router();

// Middlewares - Go up 2 levels to reach middleware folder
import { isAuth } from "../../middleware/isAuth.js";

// Controllers - Go up 2 levels to reach controllers/instructor folder
import { getInstructorDashboardStats } from "../../controllers/instructor/instructorDashboardController.js";

/* ============================================================
   INSTRUCTOR DASHBOARD ROUTES
   ============================================================ */

/**
 * @route   GET /api/instructor/stats
 * @desc    Get dashboard statistics for the logged-in instructor
 * @access  Private (Instructor only)
 */
router.get("/stats", isAuth, getInstructorDashboardStats);

export default router;
