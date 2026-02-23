import express from "express";
const router = express.Router();

// Middlewares - Go up 2 levels to reach middleware folder
import { isAuth } from "../../middleware/isAuth.js";

// Controllers - Go up 2 levels to reach controllers/instructor folder
import { 
    getInstructorDashboardStats,
    getAllStudentsForInstructor,
    getStudentActivityForInstructor
} from "../../controllers/instructor/instructorDashboardController.js";

/* ============================================================
   INSTRUCTOR DASHBOARD ROUTES
   ============================================================ */

/**
 * @route   GET /api/instructor/stats
 * @desc    Get dashboard statistics for the logged-in instructor
 * @access  Private (Instructor only)
 */
router.get("/stats", isAuth, getInstructorDashboardStats);

/**
 * @route   GET /api/instructor/students
 * @desc    Get all students with metrics (Read-only)
 */
router.get("/students", isAuth, getAllStudentsForInstructor);

/**
 * @route   GET /api/instructor/students/:id/activity
 * @desc    Get detailed activity for a specific student
 */
router.get("/students/:id/activity", isAuth, getStudentActivityForInstructor);

export default router;
