import Question from "../../models/Question.js";
import MockTest from "../../models/MockTest.js";
import GrandTest from "../../models/GrandTest.js";
import fs from "fs";
import xlsx from "xlsx";

// ✅ HELPER: Find test across both collections (returns { test, ModelUsed })
const findTestById = async (id) => {
  let test = await MockTest.findById(id);
  let ModelUsed = MockTest;
  if (!test) {
    test = await GrandTest.findById(id);
    ModelUsed = GrandTest;
  }
  return { test, ModelUsed };
};

// ✅ Sync stats helper — only overrides duration if it was never manually set (null = auto mode)
const syncTestStats = (test) => {
  // 1. Recalculate counts based on actual embedded questions
  test.totalQuestions = test.questions.length;
  test.totalMarks = test.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  // 2. Sync subjects/sections mapping
  const subjectMap = {};
  test.questions.forEach(q => {
    if (q.category) {
      // Preserve original casing from the last entered question for that category
      const name = q.category.trim();
      subjectMap[name] = (subjectMap[name] || 0) + 1;
    }
  });

  const existingMap = {};
  (test.subjects || []).forEach(s => { if (s.name) existingMap[s.name] = s; });

  test.subjects = Object.entries(subjectMap).map(([name, count]) => ({
    name,
    easy: existingMap[name]?.easy ?? count,
    medium: existingMap[name]?.medium ?? 0,
    hard: existingMap[name]?.hard ?? 0,
  }));

  // 3. Negative Marking Sync
  // If ALL questions have the same negative marking, sync it to the test level
  const uniqueNegatives = [...new Set(test.questions.map(q => Number(q.negative) || 0))];
  if (uniqueNegatives.length === 1) {
    test.negativeMarking = uniqueNegatives[0];
  }

  // 4. Duration Management
  if (test.durationMinutes !== null && test.durationMinutes <= 0) {
    test.durationMinutes = null;
  }
};

/**
 * @desc    Get all questions for a mocktest (reads embedded array)
 */
export const getMocktestQuestions = async (req, res) => {
  try {
    const { test } = await findTestById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Mocktest not found" });

    res.status(200).json({
      success: true,
      questions: test.questions || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load question list" });
  }
};

/**
 * @desc    Add a single question (embedded into test document)
 */
export const addQuestion = async (req, res) => {
  try {
    const { id: testId } = req.params;
    const { test } = await findTestById(testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    console.log("Adding Question for Subject:", req.body.category);

    if (typeof req.body.options === "string") req.body.options = JSON.parse(req.body.options);
    if (typeof req.body.correct === "string") req.body.correct = JSON.parse(req.body.correct);

    const questionData = { ...req.body };
    if (req.file) questionData.questionImageUrl = "/uploads/images/" + req.file.filename;

    // Remove invalid fields that embed schema doesn't need
    delete questionData._id;

    // Update test-level duration if provided
    if (req.body.durationMinutes && Number(req.body.durationMinutes) > 0) {
      test.durationMinutes = Number(req.body.durationMinutes);
    }

    test.questions.push(questionData);
    syncTestStats(test);
    await test.save();

    const addedQuestion = test.questions[test.questions.length - 1];
    res.status(201).json({ success: true, question: addedQuestion });
  } catch (err) {
    console.error("SERVER_ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPassagesByCategory = async (req, res) => {
  try {
    const { category, testId } = req.query;
    const { test } = await findTestById(testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    let passages = test.questions.filter(q => q.questionType === "passage");
    if (category) passages = passages.filter(q => q.category === category);

    res.json({ success: true, passages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addPassageWithChildren = async (req, res) => {
  try {
    const { id } = req.params;
    const { passageTitle, passageText, subject, questions } = req.body;

    const { test } = await findTestById(id);
    if (!test) return res.status(404).json({ message: "MockTest not found" });

    const passageCategory = subject || test.subcategory || "General";
    const finalPassageTitle = passageTitle || passageText || "Reading Comprehension";
    const files = req.files || [];
    const findFile = (fieldname) => {
      const f = files.find((file) => file.fieldname === fieldname);
      return f ? f.path.replace(/\\/g, "/") : null;
    };

    const passageObj = {
      questionType: "passage",
      title: finalPassageTitle,
      category: passageCategory,
      difficulty: "medium",
      questionImageUrl: findFile("passageImage"),
    };

    let parsedQuestions = [];
    try {
      parsedQuestions = typeof questions === "string" ? JSON.parse(questions) : questions;
    } catch (e) {
      parsedQuestions = [];
    }

    const childObjs = [];
    for (let i = 0; i < parsedQuestions.length; i++) {
      const child = parsedQuestions[i];
      const childTitle = child.questionText || child.title;
      if (!childTitle) continue;

      childObjs.push({
        questionType: "mcq",
        title: childTitle,
        category: passageCategory,
        difficulty: (child.difficulty || "medium").toLowerCase(),
        marks: Number(child.marks || 1),
        negative: Number(child.negative || 0),
        questionImageUrl: findFile(`questions[${i}][image]`),
        options: child.options?.map((opt, optIdx) => ({
          text: opt.text || "",
          imageUrl: findFile(`questions[${i}][options][${optIdx}][image]`),
        })),
        correct: child.correct || [],
        correctManualAnswer: child.correctManualAnswer,
      });
    }

    test.questions.push(passageObj, ...childObjs);
    syncTestStats(test);
    await test.save();

    res.status(201).json({
      message: "Passage and questions added",
      childCount: childObjs.length,
    });
  } catch (err) {
    console.error("❌ Error in addPassageWithChildren:", err);
    if (err.name === "ValidationError")
      return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

/**
 * Bulk upload questions from Excel with flexible column mapping
 */
export const bulkUploadQuestions = async (req, res) => {
  try {
    const { id: testId } = req.params;
    console.log("📥 Bulk Upload Request for Test:", testId);
    console.log("🔍 Headers:", req.headers['content-type']);
    console.log("🔍 req.file:", req.file);
    console.log("🔍 req.body keys:", Object.keys(req.body));

    const filePath = req.file?.path;
    if (!filePath) {
      console.error("❌ No file found in request. Check field name and middleware.");
      throw new Error("No file uploaded");
    }

    const { test } = await findTestById(testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    let parsedRows = [];
    try {
      // xlsx library handles .csv, .xlsx, and .xls — use it for all file types
      const workbook = xlsx.readFile(filePath, { type: "file" });
      parsedRows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
        defval: "", // default empty string for missing cells 
        raw: false, // return formatted strings, not raw numbers
      });
      console.log(`📄 Parsed ${parsedRows.length} rows from file`);
    } catch (parseErr) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: "Failed to parse file: " + parseErr.message });
    }

    const validQuestions = [];
    const firstRow = parsedRows[0] || {};
    const rawKeys = Object.keys(firstRow);
    console.log("🔍 CSV Column Headers (raw):", rawKeys);

    // Global marks/negative from frontend form — override per-row CSV values
    const globalMarks = Number(req.body.marks) > 0 ? Number(req.body.marks) : null;
    const globalNegative = req.body.negative !== undefined && req.body.negative !== "" ? Number(req.body.negative) : null;

    for (const row of parsedRows) {
      // Normalize column keys: remove ALL spaces, dots, underscores, dashes → lowercase
      const clean = {};
      Object.keys(row).forEach((k) => {
        const normalizedKey = k.replace(/[^a-z0-9]/gi, "").toLowerCase();
        clean[normalizedKey] = String(row[k] || "").trim();
      });

      console.log("📝 Normalized keys:", Object.keys(clean));

      // FLEXIBLE FIELD DETECTION — try many possible column name patterns
      const title =
        clean.question || clean.questiontext || clean.qtext || clean.title ||
        clean.q || clean.ques || clean.questiontitle || clean.stmt ||
        // fallback: find any key that contains "question" or "q"
        Object.entries(clean).find(([k]) => k.includes("question"))?.[1] ||
        Object.entries(clean).find(([k]) => k.startsWith("q") && clean[k]?.length > 10)?.[1];

      const sub =
        clean.subject || clean.category || clean.subjectname || clean.sub ||
        clean.section || clean.topic || "general"; // default to general if no subject column

      const optionA = clean.optionatext || clean.optiona || clean.opta || clean.a || clean.option1 || clean.ans1 || clean.opt1 || clean.choice1 || "";
      const optionB = clean.optionbtext || clean.optionb || clean.optb || clean.b || clean.option2 || clean.ans2 || clean.opt2 || clean.choice2 || "";
      const optionC = clean.optionctext || clean.optionc || clean.optc || clean.c || clean.option3 || clean.ans3 || clean.opt3 || clean.choice3 || "";
      const optionD = clean.optiondtext || clean.optiond || clean.optd || clean.d || clean.option4 || clean.ans4 || clean.opt4 || clean.choice4 || "";

      const correctIdx = clean.correctindex || clean.correct || clean.answer ||
        clean.answerindex || clean.correctoption || clean.key || clean.ans || "0";

      const diff = (clean.level || clean.difficulty || clean.diff || clean.complexity || "easy").toLowerCase();

      console.log(`  → title: "${title?.substring(0, 30)}" | sub: "${sub}" | A:"${optionA}" B:"${optionB}"`);

      if (!title) {
        console.log("  ⚠️ Skipping row (no title found)");
        continue;
      }

      validQuestions.push({
        title,
        category: sub.trim(),
        questionType: "mcq",
        difficulty: diff,
        marks: globalMarks ?? (Number(clean.marks) || Number(test.marksPerQuestion) || 1),
        negative: globalNegative ?? (Number(clean.negative || clean.negativemark || clean.negmarks) || Number(test.negativeMarking) || 0),
        options: [
          { text: optionA },
          { text: optionB },
          { text: optionC },
          { text: optionD },
        ].filter((o) => o.text),
        correct: String(correctIdx).split(",").map(s => Number(s.trim())).filter(n => !isNaN(n)),
      });

    }

    if (validQuestions.length === 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.log("❌ No valid questions found from", parsedRows.length, "rows");
      return res.status(400).json({
        success: false,
        message: `No valid questions found in ${parsedRows.length} rows. Column headers found: ${rawKeys.join(", ")}. Make sure your CSV has a 'question' column.`,
      });
    }


    test.questions.push(...validQuestions);

    // ✅ Sync test-level duration and marking scheme if global values were provided
    if (req.body.durationMinutes && Number(req.body.durationMinutes) > 0) {
      test.durationMinutes = Number(req.body.durationMinutes);
    }
    if (globalNegative !== null) test.negativeMarking = globalNegative;

    syncTestStats(test);

    try {
      await test.save();
    } catch (saveErr) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "Database Validation Failed: " + (Object.values(saveErr.errors || {}).map(e => e.message).join(", ") || saveErr.message)
      });
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(201).json({ success: true, message: `${validQuestions.length} questions uploaded successfully` });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("❌ BULK_UPLOAD_ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete ALL questions from a test at once (clear all)
 * @route   DELETE /api/admin/mocktests/:id/questions/all
 */
export const clearAllQuestions = async (req, res) => {
  try {
    const { id: testId } = req.params;
    const { test } = await findTestById(testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    const deletedCount = test.questions.length;
    test.questions = [];
    test.isPublished = false; // force to draft since no questions
    syncTestStats(test);
    await test.save();

    res.status(200).json({ success: true, message: `${deletedCount} questions cleared`, deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { qId } = req.params;

    // Search both collections
    let test = await MockTest.findOne({ "questions._id": qId });
    let ModelUsed = MockTest;
    if (!test) {
      test = await GrandTest.findOne({ "questions._id": qId });
      ModelUsed = GrandTest;
    }

    if (!test) return res.status(404).json({ success: false, message: "Question not found in any test" });

    test.questions = test.questions.filter((q) => q._id.toString() !== qId);
    syncTestStats(test);
    await test.save();

    // Also delete from standalone Question collection if it exists there (backwards compat)
    await Question.findByIdAndDelete(qId).catch(() => { });

    res.status(200).json({ success: true, message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
