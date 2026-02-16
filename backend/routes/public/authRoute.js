import express from "express";
const router = express.Router();
import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  logout,
  googleAuth,
} from "../../controllers/common/authController.js";

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/logout", logout);
router.post("/google", googleAuth); // Matches /api/auth/google

export default router;
