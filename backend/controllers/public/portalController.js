import MockTest from "../../models/MockTest.js";
import GrandTest from "../../models/GrandTest.js";
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

/**
 * 2. Get All Published Mock Tests (Combined)
 */
export const getPublishedMockTests = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = { isPublished: true };

    if (category && category.toLowerCase() !== "all") {
      filter.categorySlug = category.toLowerCase().trim();
    }

    // Fetch from both collections in parallel
    const [mockTests, grandTests] = await Promise.all([
      MockTest.find(filter)
        .populate("category", "name slug")
        .select("-questions -attempts")
        .lean(),
      GrandTest.find(filter)
        .populate("category", "name slug")
        .select("-questions -attempts")
        .lean(),
    ]);

    // Robustness: Ensure grand tests have the flag
    const processedGrand = grandTests.map(t => ({ ...t, isGrandTest: true }));

    // Combine and sort by newest first
    const combined = [...mockTests, ...processedGrand].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      mocktests: combined,
    });
  } catch (err) {
    console.error("PUBLIC_MOCKTEST_FETCH_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Error fetching tests" });
  }
};

/**
 * 3. Get Single Mock Test Details
 */
export const getMockTestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Search both collections
    let test = await MockTest.findById(id)
      .populate("category", "name slug")
      .select("-questions -attempts"); 
      
    if (!test) {
      test = await GrandTest.findById(id)
        .populate("category", "name slug")
        .select("-questions -attempts");
    }

    if (!test) return res.status(404).json({ message: "Mocktest not found" });
    
    res.status(200).json({ success: true, test });
  } catch (err) {
    console.error("GET_MOCKTEST_BY_ID_ERROR:", err);
    res.status(500).json({ message: "Error fetching test details", error: err.message });
  }
};

