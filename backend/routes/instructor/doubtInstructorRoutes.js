import express from "express";
const router = express.Router();

// Middlewares
import { isAuth } from "../../middleware/isAuth.js";

// Controllers - Using exact names from your doubtController.js
import {
  instructorGetMyDoubts,
  instructorAnswerDoubt,
} from "../../controllers/instructor/doubtController.js";

/* ============================================================
   INSTRUCTOR DOUBT ROUTES
   ============================================================ */

router.use(isAuth);

// Get doubts assigned to the logged-in instructor
router.get("/", instructorGetMyDoubts);

// Solve/Answer a doubt
router.put("/:id/solve", instructorAnswerDoubt);

export default router;
