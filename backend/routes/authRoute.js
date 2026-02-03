// backend/routes/authRoute.js
import express from "express";
import { 
    signup, 
    verifyOtp, 
    login, 
    logout, 
    forgotPassword, 
    resetPassword ,
    resendOtp,
    googleAuth
} from "../controllers/UserConrollers.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/verify-otp", verifyOtp); // New
authRouter.post("/login", login);
authRouter.get("/logout", logout);
authRouter.post("/forgot-password", forgotPassword); // New
authRouter.post("/reset-password", resetPassword);
authRouter.post("/resend-otp", resendOtp); 
 authRouter.post("/google", googleAuth);  // New

export default authRouter;