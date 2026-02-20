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

/**
 * 2. Get All Published Mock Tests
 */
export const getPublishedMockTests = async (req, res) => {
  try {
    // 1. Capture the category slug from the query string (?category=banking)
    const { category } = req.query;

    // 2. Setup base filter for published tests
    let filter = { isPublished: true };

    // 3. If a specific category is requested (and not 'all'), add to filter
    // We trim and lowercase to prevent matching errors
    if (category && category.toLowerCase() !== "all") {
      filter.categorySlug = category.toLowerCase().trim();
    }

    // 4. Execute query with population
    const tests = await MockTest.find(filter)
      .populate("category", "name slug")
      .select("-questionIds -attempts") // Optimized: Exclude unnecessary data
      .sort({ createdAt: -1 });

    // 5. Standardized response key 'mocktests' for frontend sync
    res.status(200).json({
      success: true,
      mocktests: tests,
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
    console.log("DEBUG: getMockTestById params:", req.params);
    const test = await MockTest.findById(req.params.id)
      .populate("category", "name slug")
      .select("-questionIds");
    console.log("DEBUG: getMockTestById result:", test ? "Found" : "Not Found");
    
    if (!test) return res.status(404).json({ message: "MockTest not found" });
    res.status(200).json({ success: true, test });
  } catch (err) {
    console.error("GET_MOCKTEST_BY_ID_ERROR:", err);
    res.status(500).json({ message: "Error fetching test details", error: err.message });
  }
};

