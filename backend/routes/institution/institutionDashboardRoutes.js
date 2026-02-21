import express from "express";
import { getInstitutionDashboardStats } from "../../controllers/institution/institutionDashboardController.js";
import { isAuth, isInstitution } from "../../middleware/isAuth.js";

const router = express.Router();

router.get("/dashboard-stats", isAuth, isInstitution, getInstitutionDashboardStats);

export default router;
