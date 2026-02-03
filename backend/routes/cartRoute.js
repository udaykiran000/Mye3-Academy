import express from "express";
import { getCart, addToCart, removeFromCart } from "../controllers/cartController.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

// All cart routes are protected
router.get("/", isAuth, getCart);
router.post("/add", isAuth, addToCart);
router.delete("/remove/:mocktestId", isAuth, removeFromCart);

export default router;