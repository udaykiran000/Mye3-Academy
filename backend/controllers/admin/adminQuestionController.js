import Question from "../../models/Question.js";
import MockTest from "../../models/MockTest.js";
import fs from "fs";
import xlsx from "xlsx";
import csv from "csv-parser";

/**
 * @desc    Get all questions for a mocktest in object format
 */

/**
 * @desc    Get all questions - Synchronized for "Question Preview" list
 */
/**
 * @desc    Get all questions - Synchronized for "Question Preview" list
 */
export const getMocktestQuestions = async (req, res) => {
  try {
    // 1. Fetch test and populate the full question objects
    const test = await MockTest.findById(req.params.id).populate("questionIds");

    if (!test) return res.status(404).json({ success: false, message: "Mocktest not found" });

    // 2. Return the questions array in the 'questions' key 
    // This matches your frontend: setAddedQuestions(qRes.value.data.questions || [])
    res.status(200).json({
      success: true,
      questions: test.questionIds || [] 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load preview list" });
  }
};
/**
 * @desc    Add question with Descriptive Blueprint Validation
 */
export const addQuestion = async (req, res) => {
  try {
    const { id: testId } = req.params;
    const mocktest = await MockTest.findById(testId);

    // DEBUG 1: Check what subject is coming from frontend
    console.log("Adding Question for Subject:", req.body.category);

    // 1. Data Parsing
    if (typeof req.body.options === "string")
      req.body.options = JSON.parse(req.body.options);
    if (typeof req.body.correct === "string")
      req.body.correct = JSON.parse(req.body.correct);

    // 2. Matching Subject in Blueprint
    const subjectName = (req.body.category || "general").trim().toLowerCase();
    const subjectBlueprint = mocktest.subjects.find(
      (s) => s.name.toLowerCase().trim() === subjectName,
    );

    // 3. Validation Logic
    // A) Global Limit Check
    if (mocktest.totalQuestions > 0 && mocktest.questionIds.length >= mocktest.totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `Total question limit for this test reached (${mocktest.totalQuestions}).`,
      });
    }

    // B) Strict Difficulty-Specific Limit Check
    if (subjectBlueprint) {
      const difficulty = (req.body.difficulty || "easy").toLowerCase();
      const difficultyLimit = Number(subjectBlueprint[difficulty]) || 0;

      // ✅ FIX: Only enforce if a limit is actually set (> 0)
      if (difficultyLimit > 0) {
        // Check current count for this specific subject AND difficulty
        const currentDifficultyCount = await Question.countDocuments({
          _id: { $in: mocktest.questionIds },
          category: subjectName,
          difficulty: difficulty,
        });

        if (currentDifficultyCount >= difficultyLimit) {
          return res.status(400).json({
            success: false,
            message: `Limit reached for ${req.body.category} (${difficulty}). Allowed: ${difficultyLimit}.`,
          });
        }
      }
    }

    // 4. Save Logic
    const question = new Question({ ...req.body });
    if (req.file)
      question.questionImageUrl = "/uploads/images/" + req.file.filename;

    await question.save();

    // 5. Sync with Mocktest
    mocktest.questionIds.push(question._id);
    await mocktest.save();

    res.status(201).json({ success: true, question });
  } catch (err) {
    console.error("SERVER_ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPassagesByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { questionType: "passage" };
    if (category) query.category = category;
    const passages = await Question.find(query).select(
      "title questionImageUrl category createdAt",
    );
    res.json({ success: true, passages });
  } catch (err) {
    console.error("Error in getPassagesByCategory:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

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

/**
 * Bulk upload questions from Excel/CSV with blueprint validation
 */
export const bulkUploadQuestions = async (req, res) => {
  try {
    const { id: testId } = req.params;
    const filePath = req.file?.path;
    if (!filePath) throw new Error("No file uploaded");

    const mocktest = await MockTest.findById(testId);
    let parsedRows = [];

    if (filePath.endsWith(".xlsx") || filePath.endsWith(".xls")) {
      const workbook = xlsx.readFile(filePath);
      parsedRows = xlsx.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]],
      );
    }

    const validQuestions = [];
    const blueprintMap = {};
    mocktest.subjects.forEach((s) => {
      const sub = s.name.toLowerCase().trim();
      blueprintMap[sub] = {
        easy: Number(s.easy || 0),
        medium: Number(s.medium || 0),
        hard: Number(s.hard || 0),
      };
    });

    for (const row of parsedRows) {
      const clean = {};
      Object.keys(row).forEach((k) => {
        clean[k.replace(/\s+/g, "").toLowerCase()] = row[k];
      });

      const sub = clean.subject?.toLowerCase().trim();
      const diff = clean.level?.toLowerCase().trim() || "easy";

      if (blueprintMap[sub] && blueprintMap[sub][diff] > 0) {
        validQuestions.push({
          title: clean.question,
          category: sub,
          questionType: clean.questiontype || "mcq",
          difficulty: diff,
          marks: Number(clean.marks) || 1,
          negative: Number(clean.negative) || 0,
          options: [
            { text: clean.optiona_text },
            { text: clean.optionb_text },
            { text: clean.optionc_text },
            { text: clean.optiond_text },
          ].filter((o) => o.text),
          correct: String(clean.correctindex || "")
            .split(",")
            .map(Number),
        });
        blueprintMap[sub][diff]--;
      }
    }

    const inserted = await Question.insertMany(validQuestions);
    await MockTest.findByIdAndUpdate(testId, {
      $push: { questionIds: { $each: inserted.map((q) => q._id) } },
    });

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(201).json({ message: `${inserted.length} questions uploaded` });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Delete question and remove reference from Mocktest
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { qId } = req.params;

    // 1. Delete from Question collection
    const deletedQuestion = await Question.findByIdAndDelete(qId);
    if (!deletedQuestion)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });

    // 2. Remove reference from ALL Mocktests (Sync logic)
    await MockTest.updateMany({}, { $pull: { questionIds: qId } });

    res
      .status(200)
      .json({ success: true, message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
