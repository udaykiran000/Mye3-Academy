import express from "express";
import { isAuth } from "../middleware/isAuth.js";
import { createDoubt, getMyDoubts } from "../controllers/doubtController.js";

const router = express.Router();

// All student doubt routes require authentication
router.post("/", isAuth, createDoubt);     // Create new doubt
router.get("/", isAuth, getMyDoubts);      // Get my doubts list

export default router;
