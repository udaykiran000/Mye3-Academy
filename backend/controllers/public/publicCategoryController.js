import MockTest from "../../models/MockTest.js";
import Category from "../../models/Category.js";

/**
 * 1. Get All Categories (For Landing Page/Filters)
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching categories" });
  }
};