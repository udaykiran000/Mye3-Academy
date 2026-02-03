import express from "express";
import { isAuth } from "../middleware/isAuth.js";
import { uploadImage } from "../middleware/upload.js";
import { updateUserProfile, getme } from "../controllers/UserConrollers.js";

// 1. OLD CONTROLLERS (Keep only what you still need, like history/profile)
import {
  getAvailableMocktests,
  getMyPurchasedTests,
  getGrandTestLeaderboard,
  getMyAttempts,
 
} from "../controllers/studentController.js";

// 2. NEW CONTROLLERS (For the Random Exam Logic)
import { 
     startTestAttempt,
    loadExamPaper,    // Fetches those questions for the exam page
    submitMockTest    // Saves the answers
} from "../controllers/mockTestController.js";

const studentRouter = express.Router();

/* =========================================
   🎓 EXAM TAKING ROUTES (The New Logic)
   These must come first to ensure they work.
========================================= */

// 1. Start Exam -> Generates random questions
// Frontend sends { mockTestId } in body
studentRouter.post("/start-test", isAuth, startTestAttempt);

// 2. Read Exam Paper -> Loads the generated questions
// Frontend calls /api/student/attempt/:attemptId
studentRouter.get("/attempt/:attemptId", isAuth, loadExamPaper);

// 3. Submit Exam -> Saves answers
studentRouter.post("/submit-test/:id", isAuth, submitMockTest);



/* =========================================
   📊 DASHBOARD & HISTORY ROUTES
========================================= */

// View all available tests
studentRouter.get("/mocktests", getAvailableMocktests);

// View purchased tests
studentRouter.get("/my-mocktests", isAuth, getMyPurchasedTests);

// View history of attempts
studentRouter.get("/my-attempts", isAuth, getMyAttempts);

// Grand Test Leaderboard
studentRouter.get('/grandtest-leaderboard/:mockTestId', isAuth, getGrandTestLeaderboard);


/* =========================================
   👤 PROFILE ROUTES
========================================= */

studentRouter.get("/profile", isAuth, getme);

studentRouter.put(
  "/profile", 
  isAuth, 
  uploadImage.single("avatar"), 
  updateUserProfile
);

export default studentRouter;