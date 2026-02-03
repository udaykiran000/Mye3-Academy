import express from "express";
import { isAuth } from "../middleware/isAuth.js";
import {
  instructorGetMyDoubts,
  instructorAnswerDoubt,
} from "../controllers/doubtController.js";

const router = express.Router();

// All require instructor login; role validated in controller
router.get("/", isAuth, instructorGetMyDoubts);
router.put("/:id/answer", isAuth, instructorAnswerDoubt);

export default router;
