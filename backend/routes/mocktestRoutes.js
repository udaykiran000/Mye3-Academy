import express from "express";
import {
  createMockTest,
  getMockTestById,
  updateMockTest,
  getMocktestQuestions,
  deleteMockTest,
  togglePublish,

  // Lists & Filters
  getFilteredMocktests,
  getMocktestsByCategory,
  getPublishedMockTests,

  // Questions (Logic Sync Updated)
  addQuestion,
  deleteQuestion, // 👈 ADDED MISSING IMPORT
  bulkUploadQuestions,
  createGlobalQuestion,

  // Passages
  addPassageWithChildren,
  getPassagesByCategory,

  // Exam Taking Logic
  startTestAttempt,
  loadExamPaper,
  submitMockTest,
} from "../controllers/mockTestController.js";

import { isAuth } from "../middleware/isAuth.js";

// FILE UPLOAD UTILS
import {
  uploadFile,
  uploadQuestionImages,
  uploadImage,
  uploadAny,
} from "../middleware/upload.js";

const router = express.Router();

/* ============================================================
   1️⃣ STATIC GET ROUTES
   ============================================================ */
router.get("/filter", getFilteredMocktests);
router.get("/category", getMocktestsByCategory);
router.get("/published/list", getPublishedMockTests);
router.get("/categories/questions/passages", getPassagesByCategory);

/* ============================================================
   2️⃣ EXAM TAKING & SESSION ROUTES
   ============================================================ */
router.post("/attempt/start", isAuth, startTestAttempt);
router.get("/attempt/:attemptId/paper", isAuth, loadExamPaper);

/* ============================================================
   3️⃣ ADMIN: DIRECTORY MANAGEMENT
   ============================================================ */
router.post("/", isAuth, uploadImage.single("thumbnail"), createMockTest);
router.put("/:id", isAuth, uploadImage.single("thumbnail"), updateMockTest);
router.put("/:id/publish", isAuth, togglePublish);
router.delete("/:id", isAuth, deleteMockTest);

/* ============================================================
   4️⃣ QUESTION REPOSITORY MANAGEMENT
   ============================================================ */
// Add Single Item
router.post("/:id/questions", isAuth, uploadQuestionImages, addQuestion);

// ✅ FIXED: Single Resource Deletion Route (Resolve 404 Error)
router.delete("/questions/:qId", isAuth, deleteQuestion);

// Bulk Management
router.post("/questions", isAuth, uploadQuestionImages, createGlobalQuestion);
router.post(
  "/:id/questions/bulk-upload",
  isAuth,
  uploadFile.single("file"),
  bulkUploadQuestions,
);
router.post(
  "/:id/questions/passage-bulk",
  isAuth,
  uploadAny,
  addPassageWithChildren,
);

/* ============================================================
   5️⃣ STUDENT COMMITMENT
   ============================================================ */
router.post("/:id/submit", isAuth, submitMockTest);

/* ============================================================
   6️⃣ RETRIEVAL LOGIC (ORDER IS CRITICAL)
   ============================================================ */
router.get("/:id/questions", isAuth, getMocktestQuestions);
router.get("/:id", getMockTestById);

export default router;
