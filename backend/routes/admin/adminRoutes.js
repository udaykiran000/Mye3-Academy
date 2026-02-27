import express from "express";
const router = express.Router();

// Middlewares
import { isAuth, isAdmin } from "../../middleware/isAuth.js";
import { upload } from "../../middleware/upload.js"; // Ensure this matches your middleware file

// Controllers
import {
  createMockTest,
  updateMockTest,
  deleteMockTest,
  togglePublish,
} from "../../controllers/admin/adminMocktestController.js";

import {
  addQuestion,
  bulkUploadQuestions,
  deleteQuestion,
  getMocktestQuestions,
} from "../../controllers/admin/adminQuestionController.js";

import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../../controllers/admin/adminCategoryController.js";

// ⭐ SECURITY LOCK
router.use(isAuth, isAdmin);

/* --- HELPER: STANDALONE IMAGE UPLOAD --- */
// Logic: Admin can upload any image and get the URL back
router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });
  const fileUrl = `/${req.file.path.replace(/\\/g, "/")}`;
  res
    .status(201)
    .json({ message: "Image uploaded successfully", imageUrl: fileUrl });
});

/* --- MOCKTEST MANAGEMENT --- */
router.post("/mocktests", upload.single("thumbnail"), createMockTest);
router.put("/mocktests/:id", upload.single("thumbnail"), updateMockTest);
router.delete("/mocktests/:id", deleteMockTest);
router.put("/mocktests/:id/publish", togglePublish);

/* --- QUESTION MANAGEMENT --- */
router.get("/mocktests/:id/questions", getMocktestQuestions);
router.post(
  "/mocktests/:id/questions",
  upload.single("questionImage"),
  addQuestion,
);
// REMOVED duplicate route already defined in mocktestRoutes.js
// router.post(
//   "/mocktests/:id/questions/bulk-upload",
//   upload.single("file"),
//   bulkUploadQuestions,
// );
router.delete("/questions/:qId", deleteQuestion);

import {
  getAllPayments,
  downloadPaymentReport
} from "../../controllers/admin/adminPaymentController.js";

import {
  getAllPaymentSettings,
  updatePaymentSetting
} from "../../controllers/admin/paymentSettingsController.js";

/* --- CATEGORY MANAGEMENT --- */
router.get("/categories", getCategories);
router.post("/categories", upload.single("image"), addCategory); // Integrated Image Upload
router.put("/categories/:id", upload.single("image"), updateCategory);
router.delete("/categories/:id", deleteCategory);

/* --- PAYMENT MANAGEMENT -- */
router.get("/payments", getAllPayments);
router.get("/payments/report", downloadPaymentReport);
router.get("/payment-settings", getAllPaymentSettings);
router.put("/payment-settings", updatePaymentSetting);

export default router;
