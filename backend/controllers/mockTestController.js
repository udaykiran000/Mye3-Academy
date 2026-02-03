import MockTest from "../models/MockTest.js";
import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";
import User from "../models/Usermodel.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import fs from "fs";
import csv from "csv-parser";
import xlsx from "xlsx";

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Group passages and their children
function groupPassagesAndChildren(items) {
  const byId = new Map();
  const passageOrder = [];

  items.forEach((q) => {
    if (!q || !q._id) return;
    byId.set(q._id.toString(), q);
    if (q.questionType === "passage" || q.isPassage) {
      passageOrder.push(q._id.toString());
    }
  });

  const used = new Set();
  const result = [];

  for (const pid of passageOrder) {
    const passage = byId.get(pid);
    if (!passage || used.has(pid)) continue;

    result.push(passage);
    used.add(pid);

    items.forEach((q) => {
      const qid = q._id?.toString();
      if (
        qid &&
        !used.has(qid) &&
        q.parentQuestionId &&
        q.parentQuestionId.toString() === pid
      ) {
        result.push(q);
        used.add(qid);
      }
    });
  }

  items.forEach((q) => {
    const qid = q._id?.toString();
    if (qid && !used.has(qid)) {
      result.push(q);
      used.add(qid);
    }
  });

  return result;
}

// -----------------------------------------------------------------------------
// 1️⃣ START TEST ATTEMPT (Handles new start and resume check)
// -----------------------------------------------------------------------------

export const startTestAttempt = async (req, res) => {
  try {
    const { mockTestId } = req.body;
    const studentId = req.user.id;
    const maxAttempts = 1;

    if (!mongoose.Types.ObjectId.isValid(mockTestId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mocktest id" });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid user id" });
    }

    const mocktest = await MockTest.findById(mockTestId).lean();
    if (!mocktest)
      return res
        .status(404)
        .json({ success: false, message: "Mocktest not found" });

    const totalQuestionsRequired = Number(mocktest.totalQuestions);

    // --------------------------------------------------
    // 1️⃣ ATTEMPT RESUME LOGIC
    // --------------------------------------------------
    const latestAttempt = await Attempt.findOne({
      studentId,
      mocktestId: mockTestId,
    }).sort({ createdAt: -1 });

    if (latestAttempt && latestAttempt.status === "in-progress") {
      const now = new Date();
      if (new Date(latestAttempt.endsAt) < now) {
        return res
          .status(403)
          .json({ success: false, message: "Exam time expired." });
      }

      return res.status(200).json({
        success: true,
        message: "Resuming existing test.",
        attemptId: latestAttempt._id,
        endsAt: latestAttempt.endsAt,
      });
    }

    // --------------------------------------------------
    // 2️⃣ PURCHASE / ATTEMPT LIMIT LOGIC
    // --------------------------------------------------
    const attemptsMade = await Attempt.countDocuments({
      studentId,
      mocktestId: mockTestId,
      status: { $in: ["completed", "finished", "in-progress"] },
    });

    let orderToUse = null;
    if (mocktest.price > 0) {
      orderToUse = await Order.findOne({
        user: studentId,
        items: mockTestId,
        status: "successful",
        attemptUsed: false,
      }).sort({ createdAt: 1 });

      if (attemptsMade >= maxAttempts && !orderToUse) {
        return res.status(403).json({
          success: false,
          message: "Attempt limit reached. Purchase again to continue.",
        });
      }
    }

    const now = new Date();
    let endsAt = new Date(
      now.getTime() + Number(mocktest.durationMinutes) * 60000,
    );

    // --------------------------------------------------
    // 3️⃣ GET QUESTIONS FROM FIXED POOL
    // --------------------------------------------------
    const questionPool = mocktest.questionIds || [];

    let allQuestions = await Question.find({
      _id: { $in: questionPool },
    }).lean();

    // --------------------------------------------------
    // 4️⃣ BUILD PASSAGE BLOCKS
    // --------------------------------------------------
    const passageBlocks = []; // Each entry: { parent, children: [] }
    const usedQuestionIds = new Set();

    const questionMap = new Map(allQuestions.map((q) => [q._id.toString(), q]));

    for (const q of allQuestions) {
      if (q.questionType !== "passage") continue;

      const block = { parent: q, children: [] };

      for (const c of allQuestions) {
        if (
          c.parentQuestionId &&
          c.parentQuestionId.toString() === q._id.toString()
        ) {
          block.children.push(c);
        }
      }

      passageBlocks.push(block);

      usedQuestionIds.add(q._id.toString());
      block.children.forEach((ch) => usedQuestionIds.add(ch._id.toString()));
    }

    // --------------------------------------------------
    // 5️⃣ SEPARATE OTHER QUESTIONS BY PRIORITY
    // --------------------------------------------------
    const imageQuestions = [];
    const manualQuestions = [];
    const mcqQuestions = [];

    for (const q of allQuestions) {
      if (usedQuestionIds.has(q._id.toString())) continue;

      if (q.questionImageUrl || q.options?.some((opt) => opt.imageUrl)) {
        imageQuestions.push(q);
      } else if (q.questionType === "manual") {
        manualQuestions.push(q);
      } else {
        mcqQuestions.push(q);
      }
    }

    // --------------------------------------------------
    // 6️⃣ BUILD FINAL LIST USING PRIORITY
    // --------------------------------------------------
    let selected = [];

    // 1) ADD PASSAGE BLOCKS FIRST (if they fit)
    for (const block of passageBlocks) {
      const blockSize = 1 + block.children.length;

      if (selected.length + blockSize <= totalQuestionsRequired) {
        selected.push(block.parent, ...block.children);
      }
    }

    // 2) ADD IMAGE QUESTIONS
    for (const q of imageQuestions) {
      if (selected.length >= totalQuestionsRequired) break;
      selected.push(q);
    }

    // 3) ADD MANUAL QUESTIONS
    for (const q of manualQuestions) {
      if (selected.length >= totalQuestionsRequired) break;
      selected.push(q);
    }

    // 4) ADD MCQ TO FILL REMAINING
    shuffleArray(mcqQuestions);
    for (const q of mcqQuestions) {
      if (selected.length >= totalQuestionsRequired) break;
      selected.push(q);
    }

    // --------------------------------------------------
    // 7️⃣ GUARANTEE EXACT TOTAL QUESTIONS (TRIM LOGIC)
    // NEVER TRIM PASSAGE BLOCKS
    // --------------------------------------------------
    const isPassage = (q) => q.questionType === "passage" || q.parentQuestionId;

    // Remove MCQ first
    const trimInOrder = (list) => {
      for (let i = 0; i < selected.length; i++) {
        const q = selected[i];
        if (isPassage(q)) continue;
        if (list.includes(q)) {
          selected.splice(i, 1);
          return true;
        }
      }
      return false;
    };

    while (selected.length > totalQuestionsRequired) {
      if (trimInOrder(mcqQuestions)) continue;
      if (trimInOrder(manualQuestions)) continue;
      if (trimInOrder(imageQuestions)) continue;

      break; // should never reach here
    }

    // --------------------------------------------------
    // 8️⃣ FINALIZE ATTEMPT QUESTIONS
    // --------------------------------------------------
    const attemptQuestions = selected.map((q) => ({
      _id: q._id,
      questionType: q.questionType,
      subject: q.subject || q.category,
      level: q.difficulty,

      // ⭐ FIXED TEXT LOGIC
      questionText: q.questionText || q.title || "(View the image and answer)",

      questionImageUrl: q.questionImageUrl || null,
      options: q.options || [],
      marks: q.marks || 1,
      negative: q.negative || 0,
      parentQuestionId: q.parentQuestionId || null,
    }));

    const attemptDoc = await Attempt.create({
      studentId,
      mocktestId: mockTestId,
      questions: attemptQuestions,
      answers: [],
      startedAt: now,
      endsAt,
      status: "in-progress",
    });

    if (orderToUse) {
      orderToUse.attemptUsed = true;
      await orderToUse.save();
    }

    await User.findByIdAndUpdate(studentId, {
      $push: { attempts: attemptDoc._id },
    });

    return res.json({
      success: true,
      attemptId: attemptDoc._id,
      endsAt,
      questions: attemptQuestions,
    });
  } catch (err) {
    console.error("❌ Fatal Error in startTestAttempt:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during exam setup.",
    });
  }
};

// -----------------------------------------------------------------------------
// 2️⃣ LOAD EXAM PAPER (Fetches exam questions/status for the WriteTest page)
// -----------------------------------------------------------------------------

export const loadExamPaper = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID",
      });
    }

    // Fetch attempt + mocktest details
    const attempt = await Attempt.findById(attemptId).populate(
      "mocktestId",
      "title totalMarks price",
    );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    if (attempt.studentId.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this test.",
      });
    }

    // -----------------------------
    // CHECK TIME STATUS
    // -----------------------------
    const now = new Date();
    const isTimeUp = attempt.endsAt && now > new Date(attempt.endsAt);
    const isFinished =
      attempt.status === "completed" || attempt.status === "finished";

    if (isTimeUp && !isFinished) {
      return res.status(403).json({
        success: false,
        message:
          "Exam time has expired. Please submit your answers immediately.",
      });
    }

    // -----------------------------
    // SANITIZE QUESTIONS IF NOT FINISHED
    // -----------------------------
    const questions = (attempt.questions || []).map((q) => {
      if (!isFinished) {
        const { correct, correctManualAnswer, explanation, ...rest } = q;

        return rest;
      }
      return q;
    });

    // -----------------------------
    // CHECK DASHBOARD ACCESS
    // Student gets dashboard access if ANY successful order exists
    // -----------------------------
    const successfulOrderCount = await Order.countDocuments({
      user: studentId,
      status: "successful",
    });

    const hasDashboardAccess = successfulOrderCount > 0;

    // -----------------------------
    // CHECK IF THIS TEST IS FREE
    // -----------------------------
    const price = attempt.mocktestId?.price || 0;
    const isFreeTest = Number(price) === 0;

    // -----------------------------
    // SEND RESPONSE
    // -----------------------------
    return res.json({
      _id: attempt._id,
      mocktestId: attempt.mocktestId,
      endsAt: attempt.endsAt,
      status: attempt.status,

      // only show score when test finished
      score: isFinished ? attempt.score : undefined,
      correctCount: isFinished ? attempt.correctCount : undefined,

      questions,
      answers: Array.isArray(attempt.answers) ? attempt.answers : [],

      hasDashboardAccess, // ✅ PREMIUM USER FLAG
      isFreeTest, // optional but frontend useful
    });
  } catch (err) {
    console.error("❌ Error in loadExamPaper:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error loading exam paper.",
    });
  }
};

// -----------------------------------------------------------------------------
// 3️⃣ SUBMIT MOCK TEST
// -----------------------------------------------------------------------------
export const submitMockTest = async (req, res) => {
  try {
    const { id: attemptId } = req.params;
    const { answers } = req.body; // Expecting: Array of { questionId: string, selectedAnswer: number | string }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt)
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found" });
    if (attempt.status === "completed" || attempt.status === "finished")
      return res
        .status(400)
        .json({ success: false, message: "Test already submitted." });

    let score = 0;
    let correctCount = 0;
    let totalMarks = 0;
    const processedAnswers = [];

    // Assuming attempt.questions is correctly populated with embedded question data
    const attemptQuestions = attempt.questions || [];

    for (const q of attemptQuestions) {
      // Find the user's submitted answer for the current question
      const userAns = Array.isArray(answers)
        ? answers.find((a) => a.questionId === q._id.toString())
        : null;
      const selectedAnswer = userAns ? userAns.selectedAnswer : null;
      let isCorrect = false;

      // Only count marks for scorable questions
      if (q.questionType !== "passage") {
        totalMarks += q.marks || 0;
      }

      if (q.questionType === "mcq") {
        // Ensure submitted answer is a number (e.g., "1" -> 1)
        const submittedIndex = Number(selectedAnswer);

        // ✅ FIX: Normalize the database 'correct' array to ensure all elements are JavaScript numbers
        const correctIndices = (q.correct || []).map((index) => Number(index));

        // Check for inclusion using the normalized array
        if (
          userAns &&
          !isNaN(submittedIndex) &&
          correctIndices.includes(submittedIndex)
        ) {
          score += q.marks || 0;
          correctCount++;
          isCorrect = true;
        } else if (userAns && selectedAnswer !== null) {
          // Answered incorrectly
          score -= q.negative || 0;
        }

        processedAnswers.push({
          questionId: q._id.toString(),
          selectedAnswer: submittedIndex,
          correctAnswer:
            q.options && q.options[correctIndices[0]]
              ? q.options[correctIndices[0]].text
              : null,
          isCorrect,
          marks: q.marks,
          negativeMarks: q.negative,
          questionText: q.questionText,
        });
      } else if (q.questionType === "manual") {
        // Assuming manual means NAT (Numerical Answer Type) or short exact match
        const submittedValue = selectedAnswer
          ? selectedAnswer.toString().trim().toLowerCase()
          : "";
        const correctValue = q.correctManualAnswer
          ? q.correctManualAnswer.toString().trim().toLowerCase()
          : "";

        const isAnswerProvided = submittedValue.length > 0;
        const isManualCorrect =
          isAnswerProvided && submittedValue === correctValue;

        if (isManualCorrect) {
          score += q.marks || 0;
          correctCount++;
          isCorrect = true;
        } else if (isAnswerProvided) {
          score -= q.negative || 0;
        }

        processedAnswers.push({
          questionId: q._id.toString(),
          selectedAnswer: selectedAnswer,
          correctAnswer: q.correctManualAnswer,
          isCorrect,
          marks: q.marks,
          negativeMarks: q.negative,
          questionText: q.questionText,
        });
      }
    }

    // 3. Finalize and Save the Attempt
    attempt.score = score;
    attempt.correctCount = correctCount;
    attempt.status = "completed";
    attempt.submittedAt = new Date();
    attempt.answers = processedAnswers;
    await attempt.save();

    // 4. Send the result back to the frontend
    res.json({
      success: true,
      score,
      correctCount,
      totalQuestions: attemptQuestions.filter(
        (q) => q.questionType !== "passage",
      ).length,
      totalMarks,
      attemptId: attempt._id,
    });
  } catch (err) {
    console.error("❌ Error in submitMockTest:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during test submission.",
    });
  }
};

/* ============================================================
   4️⃣ CREATE MOCKTEST (✅ FIXED: STARTS EMPTY - STRICT ISOLATION)
   ============================================================ */
export const createMockTest = async (req, res) => {
  try {
    // Handle Thumbnail Upload
    if (req.file) req.body.thumbnail = "/uploads/images/" + req.file.filename;

    // Parse subjects JSON string if coming from FormData
    if (req.body.subjects) {
      try {
        req.body.subjects = JSON.parse(req.body.subjects);
      } catch (e) {
        req.body.subjects = [];
      }
    }

    let {
      isFree,
      price,
      discountPrice,
      isGrandTest,
      scheduledFor,
      category,
      subcategory = "",
      title = "",
      description = "",
      durationMinutes = 0,
      totalQuestions: formTotalQuestions,
      totalMarks = 0,
      negativeMarking = 0,
      isPublished = false,
      subjects = [],
      thumbnail,
    } = req.body;

    // ✅ FIX 1: Explicit Boolean Conversion (FormData sends strings "true"/"false")
    const isTestFree = String(isFree) === "true";
    const isTestGrand = String(isGrandTest) === "true";
    const isTestPublished = String(isPublished) === "true";

    if (isTestFree) {
      price = 0;
      discountPrice = 0;
    }

    // Validation
    if (!category)
      return res.status(400).json({ message: "Category (slug) is required" });
    if (!title) return res.status(400).json({ message: "Title is required" });

    const foundCategory = await Category.findOne({ slug: category });
    if (!foundCategory)
      return res.status(400).json({ message: "Invalid category slug" });

    // Parse blueprint
    const parsedSubjects = (subjects || [])
      .filter((s) => s.name && s.name.trim() !== "") //
      .map((s) => ({
        name: (s.name || "").trim().toLowerCase(),
        easy: Number(s.easy) || 0,
        medium: Number(s.medium) || 0,
        hard: Number(s.hard) || 0,
      }));

    // Calculate Total Questions from Blueprint
    let blueprintSum = 0;
    parsedSubjects.forEach((s) => {
      blueprintSum +=
        (Number(s.easy) || 0) + (Number(s.medium) || 0) + (Number(s.hard) || 0);
    });

    // Use Blueprint Sum if defined, otherwise use form input
    const finalTotalQuestions =
      blueprintSum > 0 ? blueprintSum : Number(formTotalQuestions) || 0;

    // ✅ FIX 2: Handle Scheduled Date for Grand Test
    let finalScheduledFor = null;
    if (isTestGrand && scheduledFor) {
      finalScheduledFor = new Date(scheduledFor);
    }

    const mt = new MockTest({
      category: foundCategory._id,
      categorySlug: foundCategory.slug,
      subcategory: String(subcategory || "").trim(),
      title: String(title).trim(),
      description: String(description || "").trim(),
      durationMinutes: Number(durationMinutes) || 0,
      totalQuestions: finalTotalQuestions,
      totalMarks: Number(totalMarks) || 0,
      negativeMarking: Number(negativeMarking) || 0,
      price: Number(price) || 0,
      discountPrice: Number(discountPrice) || 0,
      isFree: isTestFree,
      thumbnail: thumbnail || null,
      isPublished: isTestPublished,
      subjects: parsedSubjects,

      // ✅ CRITICAL: Start with empty pool. Questions are added via Upload/Add APIs later.
      questionIds: [],
    });

    await mt.save();
    return res.status(201).json({ mocktest: mt });
  } catch (err) {
    console.error("createMockTest ERROR:", err);
    return res
      .status(500)
      .json({ message: "Create mocktest failed", error: err.message });
  }
};

/* ============================================================
   5️⃣ UPDATE MOCKTEST (✅ FIXED: AUTO-CALCULATE TOTAL QUESTIONS)
   ============================================================ */
export const updateMockTest = async (req, res) => {
  try {
    const { id } = req.params;

    const mockTest = await MockTest.findById(id);
    if (!mockTest) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    // Thumbnail
    if (req.file) {
      mockTest.thumbnail = "/uploads/images/" + req.file.filename;
    }

    // Basic string fields
    if (req.body.title !== undefined) mockTest.title = req.body.title;
    if (req.body.description !== undefined)
      mockTest.description = req.body.description;
    if (req.body.subcategory !== undefined)
      mockTest.subcategory = req.body.subcategory;

    // Numeric fields
    if (req.body.durationMinutes !== undefined)
      mockTest.durationMinutes = Number(req.body.durationMinutes);

    if (req.body.totalMarks !== undefined)
      mockTest.totalMarks = Number(req.body.totalMarks);

    if (req.body.totalQuestions !== undefined)
      mockTest.totalQuestions = Number(req.body.totalQuestions);

    if (req.body.negativeMarking !== undefined)
      mockTest.negativeMarking = Number(req.body.negativeMarking);

    // Price
    if (req.body.isFree !== undefined)
      mockTest.isFree = req.body.isFree === "true";

    if (!mockTest.isFree) {
      if (req.body.price !== undefined) mockTest.price = Number(req.body.price);

      if (req.body.discountPrice !== undefined)
        mockTest.discountPrice = Number(req.body.discountPrice);
    } else {
      mockTest.price = 0;
      mockTest.discountPrice = 0;
    }

    // Category
    if (req.body.category !== undefined) mockTest.category = req.body.category;

    if (req.body.categorySlug !== undefined)
      mockTest.categorySlug = req.body.categorySlug;

    // Subjects (blueprint)
    if (req.body.subjects !== undefined) {
      try {
        mockTest.subjects = JSON.parse(req.body.subjects).map((s) => ({
          name: (s.name || "").trim().toLowerCase(), // ✅ FIX
          easy: Number(s.easy) || 0,
          medium: Number(s.medium) || 0,
          hard: Number(s.hard) || 0,
        }));
      } catch (e) {
        console.log("Blueprint parse error", e);
      }
    }

    // Grand test fields
    if (req.body.isGrandTest !== undefined)
      mockTest.isGrandTest = req.body.isGrandTest === "true";

    if (mockTest.isGrandTest && req.body.scheduledFor) {
      mockTest.scheduledFor = new Date(req.body.scheduledFor);
    } else if (!mockTest.isGrandTest) {
      mockTest.scheduledFor = null;
    }

    // Available From / To (if you use them)
    if (req.body.availableFrom)
      mockTest.availableFrom = new Date(req.body.availableFrom);

    if (req.body.availableTo)
      mockTest.availableTo = new Date(req.body.availableTo);

    // Final Save
    const updated = await mockTest.save();
    return res.status(200).json({ mocktest: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   6️⃣ ADD SINGLE QUESTION (✅ FIXED: ADDS TO PRIVATE POOL)
   ============================================================ */
// export const addQuestion = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       subject,
//       level,
//       questionText,
//       title,
//       options,
//       correct,
//       correctManualAnswer,
//       questionType = "mcq",
//       marks,
//       negative,
//       explanation,
//     } = req.body;

//     const mt = await MockTest.findById(id);
//     if (!mt) return res.status(404).json({ message: "MockTest not found" });

//     const finalTitle = questionText || title;
//     const finalCategory =
//       subject || mt.subcategory || mt.categorySlug || "General";

//     if (!finalTitle)
//       return res.status(400).json({ message: "Question Text is required" });
//     if (!finalCategory)
//       return res.status(400).json({ message: "Subject is required" });

//     const files = req.files || {};
//     const getFileUrl = (field) =>
//       files[field] ? files[field][0].path.replace(/\\/g, "/") : null;

//     const newQuestionData = {
//       questionType,
//       title: finalTitle.trim(),
//       difficulty: (level || "easy").toLowerCase().trim(),
//       category: finalCategory.trim(),
//       marks: Number(marks || 1),
//       negative: Number(negative || 0),
//       explanation: explanation?.trim() || "",
//       questionImageUrl: getFileUrl("questionImage"),
//     };

//     if (questionType === "mcq") {
//       const rawOptions = Array.isArray(options)
//         ? options
//         : JSON.parse(options || "[]");
//       newQuestionData.options = rawOptions.map((opt, i) => ({
//         text: typeof opt === "string" ? opt : opt.text || "",
//         imageUrl: getFileUrl(`optionImage${i}`),
//       }));
//       newQuestionData.correct = Array.isArray(correct)
//         ? correct.map(Number)
//         : JSON.parse(correct || "[]").map(Number);
//     } else if (questionType === "manual") {
//       newQuestionData.correctManualAnswer = correctManualAnswer?.trim();
//     }

//     const qDoc = new Question(newQuestionData);
//     await qDoc.save();

//     // ✅ Only add to THIS mock test's ID list.
//     mt.questionIds.push(qDoc._id);
//     await mt.save();

//     res
//       .status(201)
//       .json({ message: "Question added successfully", question: qDoc });
//   } catch (err) {
//     res.status(500).json({ message: "Server Error: " + err.message });
//   }
// };

/* ============================================================
   7️⃣ BULK UPLOAD (✅ FIXED: ADDS TO PRIVATE POOL)
   ============================================================ */
export const bulkUploadQuestions = async (req, res) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) throw new Error("No file uploaded");

    let parsedRows = [];
    if (filePath.endsWith(".xlsx") || filePath.endsWith(".xls")) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      parsedRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      const csvData = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (row) => csvData.push(row))
          .on("end", resolve)
          .on("error", reject);
      });
      parsedRows = csvData;
    }

    const validQuestions = [];
    const errors = [];

    for (const row of parsedRows) {
      const clean = {};
      Object.keys(row).forEach((k) => {
        const kk = k.replace(/\s+/g, "").toLowerCase();
        clean[kk] = typeof row[k] === "string" ? row[k].trim() : row[k];
      });

      if (!clean.question || !clean.subject || !clean.level) {
        errors.push({ row, error: "Missing required fields" });
        continue;
      }

      const qType = clean.questiontype === "manual" ? "manual" : "mcq";
      const base = {
        questionType: qType,
        title: clean.question,
        questionImageUrl: clean.questionimageurl || null,
        category: clean.subject,
        difficulty: clean.level.toLowerCase(),
        marks: Number(clean.marks) || 1,
        negative: Number(clean.negative) || 0,
        tags: clean.tags ? clean.tags.split(",").map((t) => t.trim()) : [],
      };

      if (qType === "mcq") {
        const options = [
          { text: clean.optiona_text, imageUrl: clean.optiona_image },
          { text: clean.optionb_text, imageUrl: clean.optionb_image },
          { text: clean.optionc_text, imageUrl: clean.optionc_image },
          { text: clean.optiond_text, imageUrl: clean.optiond_image },
          { text: clean.optione_text, imageUrl: clean.optione_image },
        ].filter((o) => o.text || o.imageUrl);

        if (options.length < 2) {
          errors.push({ row, error: "Not enough options" });
          continue;
        }
        const correctIndexes = String(clean.correctindex || "")
          .split(",")
          .map((x) => parseInt(x.trim(), 10))
          .filter((n) => !isNaN(n));
        if (!correctIndexes.length) {
          errors.push({ row, error: "No correct index" });
          continue;
        }

        base.options = options;
        base.correct = correctIndexes;
      } else {
        if (!clean.correctmanualanswer) {
          errors.push({ row, error: "Manual missing correctManualAnswer" });
          continue;
        }
        base.correctManualAnswer = clean.correctmanualanswer;
      }

      validQuestions.push(base);
    }

    if (!validQuestions.length) {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ message: "No valid questions found", errors });
    }

    const inserted = await Question.insertMany(validQuestions);
    fs.unlinkSync(filePath);

    if (req.params?.id) {
      const ids = inserted.map((i) => i._id);
      await MockTest.findByIdAndUpdate(req.params.id, {
        // ✅ ONLY PUSH TO THIS TEST. Do not share with other tests.
        $push: { questionIds: { $each: ids } },
      });
    }

    res
      .status(201)
      .json({ message: `${inserted.length} questions uploaded`, errors });
  } catch (err) {
    console.error("❌ Error bulk upload:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ============================================================
   8️⃣ ADD PASSAGE (✅ FIXED: ADDS TO PRIVATE POOL)
   ============================================================ */
export const addPassageWithChildren = async (req, res) => {
  try {
    const { id } = req.params;
    const { passageTitle, passageText, subject, questions } = req.body;

    const mt = await MockTest.findById(id);
    if (!mt) return res.status(404).json({ message: "MockTest not found" });

    const passageCategory = subject || mt.subcategory || "General";
    const finalPassageTitle =
      passageTitle || passageText || "Reading Comprehension";
    const files = req.files || [];
    const findFile = (fieldname) => {
      const f = files.find((file) => file.fieldname === fieldname);
      return f ? f.path.replace(/\\/g, "/") : null;
    };

    const passageDoc = new Question({
      questionType: "passage",
      title: finalPassageTitle,
      category: passageCategory,
      difficulty: "medium",
      questionImageUrl: findFile("passageImage"),
    });
    await passageDoc.save();

    let parsedQuestions = [];
    try {
      parsedQuestions =
        typeof questions === "string" ? JSON.parse(questions) : questions;
    } catch (e) {
      parsedQuestions = [];
    }

    const createdChildIds = [];

    for (let i = 0; i < parsedQuestions.length; i++) {
      const child = parsedQuestions[i];
      const childTitle = child.questionText || child.title;
      if (!childTitle) continue;

      const childDoc = new Question({
        questionType: "mcq",
        title: childTitle,
        category: passageCategory,
        difficulty: (child.difficulty || "medium").toLowerCase(),
        marks: Number(child.marks || 1),
        negative: Number(child.negative || 0),
        parentQuestionId: passageDoc._id,
        questionImageUrl: findFile(`questions[${i}][image]`),
        options: child.options?.map((opt, optIdx) => ({
          text: opt.text || "",
          imageUrl: findFile(`questions[${i}][options][${optIdx}][image]`),
        })),
        correct: child.correct || [],
        correctManualAnswer: child.correctManualAnswer,
      });

      await childDoc.save();
      createdChildIds.push(childDoc._id);
    }

    const allIds = [passageDoc._id, ...createdChildIds];

    // ✅ ONLY PUSH TO THIS TEST
    await MockTest.findByIdAndUpdate(id, {
      $push: { questionIds: { $each: allIds } },
    });

    res.status(201).json({
      message: "Passage and questions added",
      passageId: passageDoc._id,
      childCount: createdChildIds.length,
    });
  } catch (err) {
    console.error("❌ Error in addPassageWithChildren:", err);
    if (err.name === "ValidationError")
      return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ... (Keep existing getters like getMockTestById, getFilteredMocktests, createGlobalQuestion, etc.) ...
export const getMockTestById = async (req, res) => {
  try {
    const mocktest = await MockTest.findById(req.params.id)
      .populate("category", "name slug")
      .select(
        "category subcategory title description durationMinutes totalMarks totalQuestions negativeMarking price discountPrice isFree thumbnail subjects isPublished isGrandTest scheduledFor questionIds",
      );
    if (!mocktest)
      return res.status(404).json({ message: "MockTest not found" });
    res.json(mocktest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFilteredMocktests = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    if (!category || category.trim() === "") {
      const allTests = await MockTest.find()
        .populate("category", "name slug")
        .sort({ createdAt: -1 });
      return res.status(200).json(allTests);
    }
    let categoryFilterId = null;
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryFilterId = category;
    } else {
      const foundCategory = await Category.findOne({
        $or: [
          { slug: category.toLowerCase() },
          { name: new RegExp(`^${category}$`, "i") },
        ],
      });
      if (foundCategory) categoryFilterId = foundCategory._id;
    }
    if (categoryFilterId) {
      filter.category = categoryFilterId;
    } else {
      filter.categorySlug = category.toLowerCase();
    }
    const mocktests = await MockTest.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 });
    return res.status(200).json(mocktests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch filtered mocktests" });
  }
};

export const getMocktestsByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      const allTests = await MockTest.find().sort({ createdAt: -1 });
      return res.json(allTests);
    }
    let filter = {};
    if (mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({
        $or: [{ slug: category }, { name: category }],
      });
      if (catDoc) {
        filter.category = catDoc._id;
      } else {
        filter.categorySlug = category;
      }
    }
    const mocktests = await MockTest.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 });
    res.json(mocktests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublishedMockTests = async (req, res) => {
  try {
    const tests = await MockTest.find({ isPublished: true }).select(
      "-questions.correctAnswer",
    );
    res.json(tests);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching published mocktests",
      error: err.message,
    });
  }
};

export const deleteMockTest = async (req, res) => {
  try {
    const deleted = await MockTest.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "MockTest not found" });
    res.json({ message: "MockTest deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting mocktest", error: err.message });
  }
};

export const togglePublish = async (req, res) => {
  try {
    const mocktest = await MockTest.findById(req.params.id);
    if (!mocktest)
      return res.status(404).json({ message: "MockTest not found" });
    mocktest.isPublished = !mocktest.isPublished;
    await mocktest.save();
    res.json({
      message: mocktest.isPublished
        ? "MockTest Published"
        : "MockTest Unpublished",
      mocktest,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error toggling publish status", error: err.message });
  }
};

export const getPassagesByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category)
      return res.status(400).json({ message: "Category is required" });
    const passages = await Question.find({
      questionType: "passage",
      category: category,
    }).select("title questionImageUrl category difficulty");
    return res.status(200).json(passages);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch passage questions",
      error: err.message,
    });
  }
};

export const createGlobalQuestion = async (req, res) => {
  try {
    const {
      questionType,
      title,
      correctManualAnswer,
      marks,
      negative,
      difficulty,
      category,
      options: optionsJSON,
      correct: correctJSON,
    } = req.body;
    const files = req.files || {};
    if (!title)
      return res
        .status(400)
        .json({ message: "Question text (title) is required." });
    if (!category)
      return res
        .status(400)
        .json({ message: "Subject (category) is required." });

    const formatPath = (file) => {
      if (!file || !file.path) return null;
      return file.path.replace(/\\/g, "/");
    };
    const questionImageUrl = files.questionImage
      ? formatPath(files.questionImage[0])
      : null;

    const newQuestionData = {
      questionType,
      title,
      marks: Number(marks) || 1,
      negative: Number(negative) || 0,
      difficulty,
      category,
      questionImageUrl,
    };

    if (questionType === "mcq") {
      let options = JSON.parse(optionsJSON || "[]");
      let correct = JSON.parse(correctJSON || "[]");
      const finalOptions = options.map((opt, i) => {
        const fileKey = `optionImage${i}`;
        return {
          text: opt.text,
          imageUrl: files[fileKey] ? formatPath(files[fileKey][0]) : null,
        };
      });
      newQuestionData.options = finalOptions.filter(
        (opt) => opt.text || opt.imageUrl,
      );
      newQuestionData.correct = correct;
      if (newQuestionData.options.length < 2)
        return res
          .status(400)
          .json({ message: "MCQ questions must have at least 2 options." });
      if (newQuestionData.correct.length === 0)
        return res.status(400).json({
          message: "MCQ questions must have at least 1 correct answer.",
        });
    } else {
      if (!correctManualAnswer)
        return res
          .status(400)
          .json({ message: "Manual questions must have a correct answer." });
      newQuestionData.correctManualAnswer = correctManualAnswer;
    }

    const question = new Question(newQuestionData);
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    if (err.name === "ValidationError")
      return res.status(400).json({
        message: "Validation failed.",
        errors: Object.values(err.errors).map((val) => val.message),
      });
    if (req.files) {
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => fs.unlink(file.path, () => {}));
        }
      });
    }
    res.status(500).json({
      message: "Failed to create question",
      error: err.stack || err.message,
    });
  }
};

export const getMocktestQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const mocktest = await MockTest.findById(id).populate("questionIds");
    if (!mocktest)
      return res.status(404).json({ message: "Mocktest not found" });
    res.status(200).json(mocktest.questionIds || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching questions" });
  }
};

// Question add chesetappude MockTest "questionIds" array lo ki push cheyalai
// export const addQuestion = async (req, res) => {
//   try {
//     const { id: mocktestId } = req.params;
//     const {
//       title,
//       category,
//       options,
//       correct,
//       questionType,
//       correctManualAnswer,
//       difficulty,
//       marks,
//       negative,
//     } = req.body;

//     // Create New Question Document
//     const newQuestion = await Question.create({
//       questionType,
//       title,
//       category: category.toLowerCase(), // Schema normalization
//       difficulty,
//       marks: Number(marks),
//       negative: Number(negative),
//       questionImageUrl:
//         req.files && req.files["questionImage"]
//           ? `/uploads/${req.files["questionImage"][0].filename}`
//           : null,
//       ...(questionType === "mcq"
//         ? { options: JSON.parse(options), correct: JSON.parse(correct) }
//         : { correctManualAnswer }),
//     });

//     // ✅ HOLISTIC SYNC: Add the Question ID to the Mocktest
//     await MockTest.findByIdAndUpdate(mocktestId, {
//       $push: { questionIds: newQuestion._id },
//     });

//     res.status(201).json({
//       success: true,
//       message: "Sync successful",
//       question: newQuestion,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// export const deleteQuestion = async (req, res) => {
//   try {
//     const { qId } = req.params;
//     const question = await Question.findById(qId);
//     if (!question) return res.status(404).json({ message: "Not found" });

//     // Remove reference from any Mocktests
//     await MockTest.updateMany({}, { $pull: { questionIds: qId } });
//     await Question.findByIdAndDelete(qId);

//     res.json({ success: true, message: "Pool item deleted" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Delete action failed" });
//   }
// };

// 1. ADD QUESTION: UNIFIED SYNC LOGIC
export const addQuestion = async (req, res) => {
  try {
    const { id: mocktestId } = req.params;
    const {
      title, // Previously questionText
      category, // Previously subject
      difficulty, // Previously level
      questionType = "mcq",
      options,
      correct,
      correctManualAnswer,
      marks,
      negative,
    } = req.body;

    const mt = await MockTest.findById(mocktestId);
    if (!mt)
      return res
        .status(404)
        .json({ success: false, message: "Host Mocktest not found" });

    // File Management logic for Dashboard
    const files = req.files || {};
    const getFileUrl = (field) =>
      files[field] ? `/uploads/${files[field][0].filename}` : null;

    const newQuestionData = {
      questionType,
      title: title?.trim(),
      difficulty: (difficulty || "easy").toLowerCase().trim(),
      category:
        category?.trim()?.toLowerCase() ||
        mt.subcategory?.toLowerCase() ||
        "general",
      marks: Number(marks || 1),
      negative: Number(negative || 0),
      questionImageUrl: getFileUrl("questionImage"),
    };

    // Logical branching for entry patterns
    if (questionType === "mcq") {
      const rawOptions = Array.isArray(options)
        ? options
        : JSON.parse(options || "[]");
      newQuestionData.options = rawOptions.map((opt, i) => ({
        text: typeof opt === "string" ? opt : opt.text || "",
        imageUrl: getFileUrl(`optionImage${i}`),
      }));
      newQuestionData.correct = Array.isArray(correct)
        ? correct.map(Number)
        : JSON.parse(correct || "[]").map(Number);
    } else if (questionType === "manual") {
      newQuestionData.correctManualAnswer = correctManualAnswer?.trim();
    }

    const qDoc = new Question(newQuestionData);
    await qDoc.save();

    // 1. HOLISTIC SYNC: Pushing ID and Saving Mocktest record
    mt.questionIds.push(qDoc._id);
    await mt.save();

    // 2. RESPONSE REFINEMENT: Providing structured object to Frontend
    res.status(201).json({
      success: true,
      message: "Sync Complete",
      question: qDoc,
    });
  } catch (err) {
    console.error("Internal Logic Fail:", err);
    res.status(500).json({ success: false, message: "Sync rejection." });
  }
};

// 2. DELETE QUESTION: CLEANUP LOGIC
export const deleteQuestion = async (req, res) => {
  try {
    const { qId } = req.params;
    const target = await Question.findById(qId);
    if (!target)
      return res.status(404).json({ message: "Asset not found in Pool" });

    // Logical Archive Action
    await MockTest.updateMany(
      { questionIds: qId },
      { $pull: { questionIds: qId } },
    );
    await Question.findByIdAndDelete(qId);

    res.json({ success: true, message: "Asset archived from database bank" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Pool deletion failed" });
  }
};
