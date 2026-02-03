import express from "express";
import { isAuth } from "../middleware/isAuth.js";
import {
  adminGetDoubts,
  adminAssignInstructor,
} from "../controllers/doubtController.js";

const router = express.Router();

// Admin must be authenticated; role is checked inside controller
router.get("/", isAuth, adminGetDoubts);
router.put("/:id/assign", isAuth, adminAssignInstructor);

export default router;
