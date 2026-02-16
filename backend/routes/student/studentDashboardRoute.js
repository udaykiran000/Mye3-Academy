import express from "express";
const router = express.Router();

// Middlewares - Go up 2 levels to reach middleware folder
import { isAuth } from "../../middleware/isAuth.js";

// Controllers - Go up 2 levels to reach controllers/student folder
import { getStudentDashboardStats } from "../../controllers/student/studentDashboardController.js";

/*
   STUDENT DASHBOARD OVERVIEW ROUTES
/**
 * @route   GET /api/student/dashboard/stats
 * @desc    Get total counts for Enrolled Tests, Completed Attempts, and Pending Doubts
 * @access  Private (Student only)
 */
router.get("/stats", isAuth, getStudentDashboardStats);

// ✅ CRITICAL: Default export to resolve index.js import error
export default router;