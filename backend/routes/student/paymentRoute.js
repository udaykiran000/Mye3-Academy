import express from "express";
const router = express.Router();

// Middlewares - Path corrected to go up 2 levels
import { isAuth } from "../../middleware/isAuth.js";

// Controllers - Path corrected to point to controllers/student/
import {
   getPaymentConfig, 
    createOrder, 
    verifyPayment, 
    enrollFree 
} from "../../controllers/student/paymentController.js";

router.get("/config", isAuth, getPaymentConfig);
router.post("/create-order", isAuth, createOrder);
router.post("/verify-payment", isAuth, verifyPayment);
router.post("/enroll-free", isAuth, enrollFree);
export default router;
