import express from "express";
import { getInstructorDashboardStats } from "../../controllers/instructor/instructorDashboardController.js";
import { isAuth } from "../../middleware/isAuth.js";

const router = express.Router();

router.get("/dashboard-stats", isAuth, getInstructorDashboardStats);

export default router;
