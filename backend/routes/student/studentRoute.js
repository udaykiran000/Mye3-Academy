import express from "express";
const router = express.Router();

// Middlewares
import { isAuth } from "../../middleware/isAuth.js";
import { upload } from "../../middleware/upload.js";
// From Auth Controller (Profile logic)
import {
  getme,
  updateUserProfile,
} from "../../controllers/common/authController.js";

// From Student Controller (Lists & Results)
import {
  getAvailableMocktests,
  getMyPurchasedTests,
  getMyMockTestById,
  getMyAttempts,
  getAttemptById,
  getTestAttemptsByTestId,
  getStudentLeaderboard
} from "../../controllers/student/studentController.js";

import { getStudentDashboardStats } from "../../controllers/student/studentDashboardController.js";

// From Exam Controller (Core Exam Engine)
import { startTestAttempt, submitMockTest } from "../../controllers/student/examController.js";

// Profile & Auth
router.get("/profile", isAuth, getme);
router.put("/profile", isAuth, upload.single("avatar"), updateUserProfile);

// Mocktest Logic (Matches frontend slices)
router.get("/stats", isAuth, getStudentDashboardStats);
router.get("/available-tests", isAuth, getAvailableMocktests);
router.get("/my-mocktests", isAuth, getMyPurchasedTests); // Align with usersSlice.js
router.get("/my-mocktest/:id", isAuth, getMyMockTestById); // Specialized detail for instructions
router.get("/my-attempts", isAuth, getMyAttempts); // Align with attemptSlice.js
router.get("/attempt/:attemptId", isAuth, getAttemptById);
router.get("/test-attempts/:testId", isAuth, getTestAttemptsByTestId);

// Exam Engine
router.post("/start-test", isAuth, startTestAttempt);
router.post("/submit-test/:id", isAuth, submitMockTest);
router.get("/grandtest-leaderboard/:mockTestId", isAuth, getStudentLeaderboard);

// Doubt Logic
import { createDoubt, getMyDoubts } from "../../controllers/student/studentDoubtController.js";
router.post("/doubts", isAuth, createDoubt);
router.get("/doubts", isAuth, getMyDoubts);

export default router;
