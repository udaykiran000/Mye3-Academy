import express from "express";
import { createOrder, verifyPayment, getPaymentHistory } from "../controllers/paymentController.js";
import { getAllPaymentSettings, updatePaymentSetting, getActivePaymentConfig } from "../controllers/paymentSettingsController.js";
import { isAuth, isAdmin } from "../middleware/isAuth.js"; // Assuming you have isAdmin

const router = express.Router();

// --- STUDENT CHECKOUT ROUTES ---
// 1. Get the Key ID (Public)
router.get("/config", getActivePaymentConfig); 
// 2. Create Order
router.post("/create-order", isAuth, createOrder);
// 3. Verify
router.post("/verify-payment", isAuth, verifyPayment);

// --- ADMIN ROUTES ---
router.get("/admin/payments", isAuth, isAdmin, getPaymentHistory); // Existing history
router.get("/admin/settings", isAuth, isAdmin, getAllPaymentSettings); // NEW: Get Keys
router.put("/admin/update", isAuth, isAdmin, updatePaymentSetting); // NEW: Update Keys

export default router;