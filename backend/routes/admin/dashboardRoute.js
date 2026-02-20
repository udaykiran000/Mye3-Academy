import express from "express";
const router = express.Router();

// Middlewares
import { isAuth, isAdmin } from "../../middleware/isAuth.js";

// Controllers
// Path corrected to point to adminDashboardController.js
import { getAdminStats } from "../../controllers/admin/adminDashboardController.js";

/* ============================================================
   ADMIN DASHBOARD ROUTES
   ============================================================ */

// Only Admin can access dashboard statistics
router.get("/stats", isAuth, isAdmin, getAdminStats);

export default router;
