import express from "express";
const router = express.Router();
import { isAuth } from "../../middleware/isAuth.js";
import {
  getCart,
  addToCart,
  removeFromCart,
} from "../../controllers/student/cartController.js";

router.use(isAuth);

// GET /api/cart
router.get("/", isAuth, getCart);
router.post("/add", isAuth, addToCart);
router.delete("/remove/:id", isAuth, removeFromCart);

export default router;
