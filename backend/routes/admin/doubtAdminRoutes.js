import express from "express";
const router = express.Router();

// Middlewares
import { isAuth, isAdmin } from "../../middleware/isAuth.js";

// Controllers - Using exact names from your doubtController.js
import {
  adminGetDoubts,
  adminAssignInstructor,
} from "../../controllers/instructor/doubtController.js";

/* ============================================================
   ADMIN DOUBT ROUTES
   ============================================================ */

router.use(isAuth, isAdmin);

// Admin retrieves all doubts
router.get("/", adminGetDoubts);

// Admin assigns an instructor to a doubt
router.put("/:id/assign", adminAssignInstructor);

export default router;
