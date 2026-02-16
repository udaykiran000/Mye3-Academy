import MockTest from "../../models/MockTest.js";
import Category from "../../models/Category.js";
import fs from "fs";

/**
 * @desc    Get all mock tests for Admin Registry table
 * @route   GET /api/admin/mocktests
 */
export const getAllAdminMocktests = async (req, res) => {
  try {
    const tests = await MockTest.find({})
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      mocktests: tests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get mock tests filtered by category slug
 * @route   GET /api/admin/mocktests/category
 */
export const getMocktestsByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category)
      return res
        .status(400)
        .json({ success: false, message: "Category slug required" });

    const tests = await MockTest.find({ categorySlug: category })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, mocktests: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new Mock Test with blueprint calculation
 * @route   POST /api/admin/mocktests
 */
export const createMockTest = async (req, res) => {
  try {
    // 1. Handle Thumbnail Path
    if (req.file) req.body.thumbnail = "/uploads/images/" + req.file.filename;

    console.log("DEBUG: createMockTest body:", req.body);

    // 2. Parse stringified FormData fields
    if (req.body.subjects) req.body.subjects = JSON.parse(req.body.subjects);

    const isTestFree = String(req.body.isFree) === "true";
    const isTestGrand = String(req.body.isGrandTest) === "true";
    const isPublished = String(req.body.isPublished) === "true";

    // 3. Category Validation
    const foundCategory = await Category.findOne({ slug: req.body.category });
    console.log("DEBUG: foundCategory:", foundCategory);
    
    if (!foundCategory)
      return res.status(400).json({ message: "Invalid category slug: " + req.body.category });

    // 4. Blueprint Processing (Total limit is stored in 'easy' field)
    const parsedSubjects = (req.body.subjects || []).map((s) => ({
      name: (s.name || "").trim().toLowerCase(),
      easy: Number(s.easy) || 0,
      medium: Number(s.medium) || 0,
      hard: Number(s.hard) || 0,
    }));

    // Calculate total questions from blueprint
    const blueprintSum = parsedSubjects.reduce(
      (sum, s) => sum + s.easy + s.medium + s.hard,
      0,
    );

    const mocktest = new MockTest({
      ...req.body,
      isFree: isTestFree,
      isGrandTest: isTestGrand,
      isPublished: isPublished,
      category: foundCategory._id,
      categorySlug: foundCategory.slug,
      subjects: parsedSubjects,
      totalQuestions:
        blueprintSum > 0 ? blueprintSum : Number(req.body.totalQuestions) || 0,
      questionIds: [],
    });

    await mocktest.save();
    res.status(201).json({ success: true, mocktest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Mock Test details
 * @route   PUT /api/admin/mocktests/:id
 */
export const updateMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const mockTest = await MockTest.findById(id);
    if (!mockTest)
      return res.status(404).json({ message: "Mock test not found" });

    if (req.file) mockTest.thumbnail = "/uploads/images/" + req.file.filename;

    // Handle subjects update
    if (req.body.subjects) {
      const parsed = JSON.parse(req.body.subjects);
      mockTest.subjects = parsed.map((s) => ({
        name: (s.name || "").trim().toLowerCase(),
        easy: Number(s.easy) || 0,
        medium: Number(s.medium) || 0,
        hard: Number(s.hard) || 0,
      }));
    }

    // Update individual fields if provided
    const fields = [
      "title",
      "description",
      "subcategory",
      "durationMinutes",
      "totalMarks",
      "totalQuestions",
      "negativeMarking",
      "price",
      "discountPrice",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) mockTest[field] = req.body[field];
    });

    if (req.body.isFree !== undefined)
      mockTest.isFree = String(req.body.isFree) === "true";
    if (req.body.isGrandTest !== undefined)
      mockTest.isGrandTest = String(req.body.isGrandTest) === "true";
    if (req.body.isPublished !== undefined)
      mockTest.isPublished = String(req.body.isPublished) === "true";

    const updated = await mockTest.save();
    res.status(200).json({ success: true, mocktest: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a Mock Test
 * @route   DELETE /api/admin/mocktests/:id
 */
export const deleteMockTest = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Clean up thumbnail file
    if (test.thumbnail && fs.existsSync("." + test.thumbnail)) {
      fs.unlinkSync("." + test.thumbnail);
    }

    await MockTest.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle Publish/Draft status
 * @route   PUT /api/admin/mocktests/:id/publish
 */
export const togglePublish = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    test.isPublished = !test.isPublished;
    await test.save();

    res.status(200).json({
      success: true,
      message: test.isPublished ? "Published" : "Draft",
      isPublished: test.isPublished,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get a single Mock Test by ID
 * @route   GET /api/admin/mocktests/:id
 */
/**
 * @desc    Get single mocktest - Synchronized for AdminQuestions/FormMocktest
 */
export const getMockTestById = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id).populate("category", "name slug");
    
    if (!test) return res.status(404).json({ success: false, message: "Mocktest not found" });

    // FIX: Sending the object directly so frontend setMocktest(res.data) works perfectly
    // Adding success: true inside the object for compatibility
    const responseData = test.toObject();
    responseData.success = true;

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * @desc    Global filter for mock tests registry
 * @route   GET /api/admin/mocktests/filter
 */
export const getFilteredMocktests = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category) query.categorySlug = category;
    if (search) query.title = { $regex: search, $options: "i" };

    const tests = await MockTest.find(query)
      .populate("category", "name slug")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, mocktests: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get simple list of published mocktests (for dropdowns/filters)
 * @route   GET /api/admin/mocktests/published/list
 */
export const getPublishedMocktests = async (req, res) => {
  try {
    const tests = await MockTest.find({ isPublished: true })
      .select("title isGrandTest categorySlug") // Select only needed fields
      .sort({ createdAt: -1 });

    res.status(200).json(tests); // Return array directly as expected by frontend
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

