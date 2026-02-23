import express from "express";
const router = express.Router();
import { isAuth } from "../../middleware/isAuth.js";
import { upload } from "../../middleware/upload.js";

import {
  getInstitutionStats,
  getAllStudentsForInstitution,
  addStudentForInstitution,
  getStudentActivityForInstitution,
} from "../../controllers/institution/institutionDashboardController.js";

/**
 * @route   GET /api/institution/stats
 * @desc    Dashboard overview metrics
 */
router.get("/stats", isAuth, getInstitutionStats);

/**
 * @route   GET /api/institution/students
 * @desc    Get students managed by this institution
 */
router.get("/students", isAuth, getAllStudentsForInstitution);

/**
 * @route   POST /api/institution/students/add
 * @desc    Add a new student
 */
router.post("/students/add", isAuth, upload.single("photo"), addStudentForInstitution);

/**
 * @route   GET /api/institution/students/:id/activity
 * @desc    Track student performance
 */
router.get("/students/:id/activity", isAuth, getStudentActivityForInstitution);

export default router;
