import MockTest from "../../models/MockTest.js";
import GrandTest from "../../models/GrandTest.js";
import Attempt from "../../models/Attempt.js";
import Question from "../../models/Question.js";
import User from "../../models/Usermodel.js";
import Order from "../../models/Order.js";
import mongoose from "mongoose";
import { shuffleArray, groupPassagesAndChildren } from "../../utils/examHelpers.js";

/**
 * 1. Start Test Attempt (Handles new start and resume)
 */
export const startTestAttempt = async (req, res) => {
  try {
    const { mockTestId } = req.body;
    const studentId = req.user._id; 

    // Find test across both collections
    let mocktest = await MockTest.findById(mockTestId).lean();
    if (!mocktest) {
      mocktest = await GrandTest.findById(mockTestId).lean();
    }
    
    if (!mocktest) return res.status(404).json({ success: false, message: "Mocktest not found" });

    // 1. Resume existing test check
    const latestAttempt = await Attempt.findOne({ studentId, mocktestId: mockTestId }).sort({ createdAt: -1 });
    if (latestAttempt && latestAttempt.status === "in-progress") {
      if (new Date(latestAttempt.endsAt) < new Date()) return res.status(403).json({ message: "Exam time expired." });
      return res.status(200).json({ success: true, attemptId: latestAttempt._id, endsAt: latestAttempt.endsAt });
    }

    // 2. Purchase check (Price > 0 and not explicitly marked as free)
    if (!mocktest.isFree && mocktest.price > 0) {
      const order = await Order.findOne({ user: studentId, items: mockTestId, status: "successful" });
      if (!order) return res.status(403).json({ success: false, message: "Please purchase the test to continue." });
    }

    // 3. Question Selection Logic (Using embedded questions)
    let selected = [...(mocktest.questions || [])];
    
    shuffleArray(selected);
    selected = groupPassagesAndChildren(selected); // Maintain passage-child contiguous blocks

    if (mocktest.totalQuestions > 0 && mocktest.totalQuestions < selected.length) {
      selected = selected.slice(0, mocktest.totalQuestions);
    }

    const now = new Date();
    // ✅ Use admin-defined duration (Strictly required for published tests now)
    // Fallback only exists for legacy data or unexpected edge cases
    const durationMins = Number(mocktest.durationMinutes) || (selected.length * 2);
    const endsAt = new Date(now.getTime() + durationMins * 60000);

    const attemptDoc = await Attempt.create({
      studentId,
      mocktestId: mockTestId,
      questions: selected,
      startedAt: now,
      endsAt,
      status: "in-progress",
    });

    await User.findByIdAndUpdate(studentId, { $push: { attempts: attemptDoc._id } });

    return res.json({ success: true, attemptId: attemptDoc._id, endsAt, questions: selected });
  } catch (err) {
    console.error("EXAM_START_ERROR:", err);
    res.status(500).json({ success: false, message: "Exam setup failed." });
  }
};

/**
 * 2. Load Exam Paper (WriteTest Page)
 */
export const loadExamPaper = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await Attempt.findById(attemptId).lean();
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    // Fetch test details for metadata (check both collections)
    let mocktest = await MockTest.findById(attempt.mocktestId).select("title totalMarks negativeMarking marksPerQuestion").lean();
    if (!mocktest) {
      mocktest = await GrandTest.findById(attempt.mocktestId).select("title totalMarks negativeMarking marksPerQuestion").lean();
    }

    const isFinished = attempt.status === "completed" || attempt.status === "finished";
    
    // Remove correct answers safely
    const sanitizedQuestions = attempt.questions.map(q => {
      if (!isFinished) {
        const { correct, correctManualAnswer, explanation, ...rest } = q;
        return rest;
      }
      return q;
    });

    res.json({ 
      _id: attempt._id, 
      questions: sanitizedQuestions, 
      endsAt: attempt.endsAt, 
      status: attempt.status,
      testTitle: mocktest?.title || "Exam",
      totalMarks: mocktest?.totalMarks || 0,
      negativeMarking: mocktest?.negativeMarking || 0,
      marksPerQuestion: mocktest?.marksPerQuestion || 1,
      totalQuestions: mocktest?.totalQuestions || attempt.questions.length
    });
  } catch (err) {
    console.error("LOAD_EXAM_ERROR:", err);
    res.status(500).json({ message: "Error loading exam paper." });
  }
};

/**
 * 3. Submit Mock Test (Scoring Logic)
 */
export const submitMockTest = async (req, res) => {
  try {
    const { id: attemptId } = req.params;
    const { answers } = req.body;
    
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.status === "completed") return res.status(400).json({ message: "Already submitted." });

    // Get metadata for totalMarks (check both collections)
    let mocktest = await MockTest.findById(attempt.mocktestId).select("totalMarks negativeMarking marksPerQuestion").lean();
    if (!mocktest) {
      mocktest = await GrandTest.findById(attempt.mocktestId).select("totalMarks negativeMarking marksPerQuestion").lean();
    }

    let score = 0;
    let correctCount = 0;
    const processedAnswers = [];

    for (const q of attempt.questions) {
      const userAns = (answers || []).find(a => a.questionId === q._id.toString());
      const selected = userAns ? userAns.selectedAnswer : null;
      let isCorrect = false;

      // Handle marks and negative as valid numbers
      // Use test-level global settings if set (>0 for negative, or explicitly defined for marks)
      const qMarks = (mocktest?.marksPerQuestion > 0)
        ? mocktest.marksPerQuestion
        : (Number(q.marks) || 0);
      
      const qNegative = (mocktest?.negativeMarking !== undefined && mocktest?.negativeMarking !== null)
        ? Number(mocktest.negativeMarking) 
        : (Number(q.negative) || 0);

      if (q.questionType === "mcq") {
        if (selected !== null && selected !== undefined && q.correct.includes(Number(selected))) {
          score += qMarks;
          correctCount++;
          isCorrect = true;
        } else if (selected !== null && selected !== undefined) {
          score -= qNegative;
        }
      } else if (q.questionType === "manual") {
        if (selected?.toString().trim().toLowerCase() === q.correctManualAnswer?.trim().toLowerCase()) {
          score += qMarks;
          correctCount++;
          isCorrect = true;
        } else if (selected) {
          score -= qNegative;
        }
      }
      processedAnswers.push({ questionId: q._id, selectedAnswer: selected, isCorrect });
    }

    attempt.score = score;
    attempt.correctCount = correctCount;
    attempt.status = "completed";
    attempt.answers = processedAnswers;
    attempt.submittedAt = new Date();
    await attempt.save();

    res.json({ 
      success: true, 
      score, 
      correctCount, 
      attemptId: attempt._id,
      totalMarks: mocktest?.totalMarks || 0
    });
  } catch (err) {
    console.error("SUBMIT_EXAM_ERROR:", err);
    res.status(500).json({ message: "Submission failed." });
  }
};