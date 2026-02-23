import express from "express";
const router = express.Router();

// Middlewares
import { isAuth, isAdmin } from "../../middleware/isAuth.js";
import { upload, uploadFile } from "../../middleware/upload.js";

// Controllers - Mocktest Management
// FIX: Added 'getFilteredMocktests' and 'getMockTestById' to the import list
import {
  createMockTest,
  updateMockTest,
  deleteMockTest,
  togglePublish,
  getAllAdminMocktests,
  getMocktestsByCategory,
  getFilteredMocktests,
  getMockTestById,
  getPublishedMocktests,
} from "../../controllers/admin/adminMocktestController.js";

// Controllers - Question Management
import {
  getMocktestQuestions,
  addQuestion,
  bulkUploadQuestions,
  deleteQuestion,
  clearAllQuestions,
} from "../../controllers/admin/adminQuestionController.js";

// Apply Admin Security
router.use(isAuth, isAdmin);

/* --- 1. STATIC ROUTES (Place these ABOVE dynamic /:id routes) --- */

router.get("/published/list", getPublishedMocktests);
router.get("/", getAllAdminMocktests);  
router.get("/filter", getFilteredMocktests);
router.get("/category", getMocktestsByCategory);

// Create a new mocktest
router.post("/", upload.single("thumbnail"), createMockTest);
router.put("/:id", upload.single("thumbnail"), updateMockTest);
router.get("/:id", getMockTestById);
router.delete("/:id", deleteMockTest);

// Toggle publish status
router.put("/:id/publish", togglePublish);
router.get("/:id/questions", getMocktestQuestions);
router.post("/:id/questions", upload.single("questionImage"), addQuestion);
router.post(
  "/:id/questions/bulk-upload",
  uploadFile.single("file"),
  bulkUploadQuestions,
);
router.delete("/questions/:qId", deleteQuestion);
router.delete("/:id/questions/all", clearAllQuestions);


export default router;
