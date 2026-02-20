import express from "express";
const router = express.Router();

// Middlewares
import { isAuth } from "../../middleware/isAuth.js";

// Controllers - Using exact names from your doubtController.js
import {
  createDoubt,
  getMyDoubts,
} from "../../controllers/instructor/doubtController.js";

/* ============================================================
   STUDENT DOUBT ROUTES
   ============================================================ */

router.use(isAuth);

// Student creates a new doubt
router.post("/create", createDoubt);

// Student gets their own doubts list
router.get("/my-doubts", getMyDoubts);

export default router;
