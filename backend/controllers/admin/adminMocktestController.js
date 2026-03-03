import MockTest from "../../models/MockTest.js";
import GrandTest from "../../models/GrandTest.js";
import Category from "../../models/Category.js";
import fs from "fs";

// ✅ HELPER: Selects correct model based on isGrandTest flag
const getModel = (isGrand) =>
  isGrand === true || String(isGrand) === "true" ? GrandTest : MockTest;

// ✅ HELPER: Finds a test across both collections
const findTestById = async (id) => {
  let test = await MockTest.findById(id).populate("category", "name slug image");
  let ModelUsed = MockTest;
  if (!test) {
    test = await GrandTest.findById(id).populate("category", "name slug image");
    ModelUsed = GrandTest;
  }
  return { test, ModelUsed };
};

/**
 * @desc    Get all mock tests (MockTests + GrandTests combined)
 * @route   GET /api/admin/mocktests
 */
export const getAllAdminMocktests = async (req, res) => {
  try {
    const [mockTests, grandTests] = await Promise.all([
      MockTest.find({}).select("-questions -attempts").populate("category", "name slug image").sort({ createdAt: -1 }),
      GrandTest.find({}).select("-questions -attempts").populate("category", "name slug image").sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      mocktests: [...mockTests, ...grandTests],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get mock tests filtered by category slug & type
 * @route   GET /api/admin/mocktests/category
 */
export const getMocktestsByCategory = async (req, res) => {
  try {
    const { category, isGrandTest } = req.query;
    if (!category)
      return res.status(400).json({ success: false, message: "Category slug required" });

    const Model = getModel(isGrandTest);
    const tests = await Model.find({ categorySlug: category })
      .select("-questions -attempts")
      .populate("category", "name slug image")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, mocktests: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new Mock Test or Grand Test
 * @route   POST /api/admin/mocktests
 */
export const createMockTest = async (req, res) => {
  try {
    if (req.file) {
      const relativePath = req.file.path.replace(/\\/g, "/");
      const uploadsIndex = relativePath.indexOf("uploads/");
      req.body.thumbnail = uploadsIndex !== -1 ? relativePath.substring(uploadsIndex) : relativePath;
    }

    // Mandatory field checks
    if (!req.body.title || req.body.title.trim() === "") {
      return res.status(400).json({ success: false, message: "Test Title is mandatory" });
    }
    if (!req.body.subcategory || req.body.subcategory.trim() === "") {
      return res.status(400).json({ success: false, message: "Subcategory is mandatory" });
    }
    if (req.body.isFree === undefined || req.body.isFree === "null") {
      return res.status(400).json({ success: false, message: "Access Mode (Free/Paid) is mandatory" });
    }

    if (req.body.subjects) req.body.subjects = JSON.parse(req.body.subjects);

    const isTestFree = String(req.body.isFree) === "true";
    const isTestGrand = String(req.body.isGrandTest) === "true";

    // Category Validation
    if (!req.body.category || req.body.category === "null") {
      return res.status(400).json({ success: false, message: "Category is mandatory." });
    }
    const foundCategory = await Category.findOne({ slug: req.body.category });
    if (!foundCategory) {
      return res.status(400).json({ success: false, message: `Invalid category: ${req.body.category}` });
    }

    // Price validation for paid tests
    if (!isTestFree && (!req.body.price || Number(req.body.price) <= 0)) {
      return res.status(400).json({ success: false, message: "Price must be greater than 0 for Paid tests" });
    }

    const parsedSubjects = (req.body.subjects || []).map((s) => ({
      name: (s.name || "").trim(),
      easy: Number(s.easy) || 0,
      medium: 0,
      hard: 0,
    }));
    const blueprintSum = parsedSubjects.reduce((sum, s) => sum + s.easy, 0);

    let finalThumbnail = null;
    if (req.body.thumbnail && typeof req.body.thumbnail === "string") {
      finalThumbnail = req.body.thumbnail;
    }

    let finalScheduledFor = null;
    if (isTestGrand && req.body.scheduledFor && req.body.scheduledFor !== "null") {
      const d = new Date(req.body.scheduledFor);
      if (!isNaN(d.getTime())) finalScheduledFor = d;
    }

    // null = auto-mode (frontend calculates: questions.length * 2)
    // Only store a value if admin explicitly typed one > 0
    const manualDuration = Number(req.body.durationMinutes);
    const duration = manualDuration > 0 ? manualDuration : null;
    const totalQns = Number(req.body.totalQuestions) || blueprintSum || 0;

    const mockTestData = {
      title: (req.body.title || "").trim(),
      description: (req.body.description || "").trim(),
      subcategory: (req.body.subcategory || "").trim(),
      durationMinutes: duration,
      totalQuestions: totalQns,
      totalMarks: Number(req.body.totalMarks) || 0,
      marksPerQuestion: Number(req.body.marksPerQuestion) || 1,
      negativeMarking: Number(req.body.negativeMarking) || 0,
      price: Number(req.body.price) || 0,
      isFree: isTestFree,
      isGrandTest: isTestGrand,
      scheduledFor: finalScheduledFor,
      category: foundCategory._id,
      categorySlug: foundCategory.slug,
      thumbnail: finalThumbnail,
      subjects: parsedSubjects,
      questions: [], // Embedded, starts empty
    };

    // ✅ Use correct collection based on type
    const Model = getModel(isTestGrand);
    const mocktest = new Model(mockTestData);
    await mocktest.save();

    res.status(201).json({ success: true, mocktest });
  } catch (error) {
    console.error("❌ CREATE_MOCKTEST_ERROR:", error);
    res.status(500).json({ success: false, message: error.message, detail: error.stack });
  }
};

/**
 * @desc    Update Mock Test details
 * @route   PUT /api/admin/mocktests/:id
 */
export const updateMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { test: mockTest } = await findTestById(id);
    if (!mockTest) return res.status(404).json({ message: "Mock test not found" });

    if (req.file) {
      const relativePath = req.file.path.replace(/\\/g, "/");
      const uploadsIndex = relativePath.indexOf("uploads/");
      mockTest.thumbnail = uploadsIndex !== -1 ? relativePath.substring(uploadsIndex) : relativePath;
    }

    if (req.body.subjects) {
      const parsed = JSON.parse(req.body.subjects);
      let calcTotal = 0;
      mockTest.subjects = parsed.map((s) => {
        const easy = Number(s.easy) || 0;
        const medium = Number(s.medium) || 0;
        const hard = Number(s.hard) || 0;
        calcTotal += easy + medium + hard;
        return { name: (s.name || "").trim(), easy, medium, hard };
      });
      if (!req.body.totalQuestions) mockTest.totalQuestions = calcTotal;
    }

    const fields = ["title", "description", "subcategory", "totalMarks", "totalQuestions", "marksPerQuestion", "negativeMarking", "price", "discountPrice"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        mockTest[field] = req.body[field];
      }
    });

    // ✅ Sync existing questions if global marking scheme is updated
    if (req.body.marksPerQuestion !== undefined || req.body.negativeMarking !== undefined) {
      const gMarks = Number(req.body.marksPerQuestion);
      const gNeg = Number(req.body.negativeMarking);

      if (mockTest.questions && mockTest.questions.length > 0) {
        mockTest.questions.forEach(q => {
          if (req.body.marksPerQuestion !== undefined) q.marks = gMarks;
          if (req.body.negativeMarking !== undefined) q.negative = gNeg;
        });
        // Recalculate totalMarks based on updated questions
        mockTest.totalMarks = mockTest.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
        mockTest.totalQuestions = mockTest.questions.length;
      }
    }

    // Duration: store null for auto-mode, or manual value if > 0
    if (req.body.durationMinutes !== undefined) {
      const val = Number(req.body.durationMinutes);
      mockTest.durationMinutes = val > 0 ? val : null;
    }
    if (req.body.isFree !== undefined) mockTest.isFree = String(req.body.isFree) === "true";
    if (req.body.isGrandTest !== undefined) mockTest.isGrandTest = String(req.body.isGrandTest) === "true";

    mockTest.isPublished = false; // Force draft on edit
    const updated = await mockTest.save();
    res.status(200).json({ success: true, message: "Updated successfully (Draft mode)", mocktest: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a Mock Test or Grand Test
 * @route   DELETE /api/admin/mocktests/:id
 */
export const deleteMockTest = async (req, res) => {
  try {
    const { test, ModelUsed } = await findTestById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (test.thumbnail && fs.existsSync("." + test.thumbnail)) {
      fs.unlinkSync("." + test.thumbnail);
    }

    await ModelUsed.findByIdAndDelete(req.params.id);
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
    const { test } = await findTestById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (!test.isPublished) {
      // ✅ STRICT VALIDATION FOR PUBLISHING
      const errors = [];
      if (!test.title || test.title.trim() === "New Mock Test") errors.push("Test title is missing");
      if (!test.subcategory || test.subcategory.trim() === "") errors.push("Sub-category is missing");

      // Fallback duration instead of blocking
      if (!test.durationMinutes || Number(test.durationMinutes) <= 0) {
        test.durationMinutes = 60; // Default to 60m if admin forgot
        console.log(`- Defaulted duration to 60m for test: ${test.title}`);
      }

      const questionCount = test.questions?.length || 0;
      if (questionCount < 1) errors.push("Add at least one question before publishing");

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot publish: ${errors.join(", ")}.`,
        });
      }
    }

    test.isPublished = !test.isPublished;
    await test.save();

    res.status(200).json({
      success: true,
      message: test.isPublished ? "Published" : "Draft",
      mocktest: test,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get a single test by ID (searches both collections)
 * @route   GET /api/admin/mocktests/:id
 */
export const getMockTestById = async (req, res) => {
  try {
    const { test } = await findTestById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Mocktest not found" });

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
    const { category, search, isGrandTest } = req.query;
    console.log(`\n🔍 GET /filter | cat: ${category}, search: ${search}, isGrand: ${isGrandTest}`);

    let query = {};
    if (category) query.categorySlug = category;
    if (search) query.title = { $regex: search, $options: "i" };

    let tests = [];
    if (isGrandTest === "true") {
      tests = await GrandTest.find(query).select("-questions -attempts").populate("category", "name slug image").sort({ createdAt: -1 });
      console.log(`- GrandTests Only: ${tests.length}`);
    } else if (isGrandTest === "false") {
      tests = await MockTest.find(query).select("-questions -attempts").populate("category", "name slug image").sort({ createdAt: -1 });
      console.log(`- MockTests Only: ${tests.length}`);
    } else {
      // Both
      const [m, g] = await Promise.all([
        MockTest.find(query).select("-questions -attempts").populate("category", "name slug image").sort({ createdAt: -1 }),
        GrandTest.find(query).select("-questions -attempts").populate("category", "name slug image").sort({ createdAt: -1 }),
      ]);
      console.log(`- Combined results: Mock(${m.length}), Grand(${g.length})`);
      tests = [...m, ...g];
    }

    res.status(200).json({ success: true, mocktests: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get published tests (from both collections)
 * @route   GET /api/admin/mocktests/published/list
 */
export const getPublishedMocktests = async (req, res) => {
  try {
    const [mockTests, grandTests] = await Promise.all([
      MockTest.find({ isPublished: true }).select("title isGrandTest categorySlug").sort({ createdAt: -1 }),
      GrandTest.find({ isPublished: true }).select("title isGrandTest categorySlug").sort({ createdAt: -1 }),
    ]);
    res.status(200).json([...mockTests, ...grandTests]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
