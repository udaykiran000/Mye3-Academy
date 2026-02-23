import MockTest from "../../models/MockTest.js";
import Attempt from "../../models/Attempt.js";
import Question from "../../models/Question.js";
import User from "../../models/Usermodel.js";
import Order from "../../models/Order.js";
import mongoose from "mongoose";
import { shuffleArray } from "../../utils/examHelpers.js";

/**
 * 1. Start Test Attempt (Handles new start and resume)
 */
export const startTestAttempt = async (req, res) => {
  try {
    const { mockTestId } = req.body;
    const studentId = req.user._id; 
    const maxAttempts = 1;

    const mocktest = await MockTest.findById(mockTestId).lean();
    if (!mocktest) return res.status(404).json({ success: false, message: "Mocktest not found" });

    // 1. Resume existing test check
    const latestAttempt = await Attempt.findOne({ studentId, mocktestId: mockTestId }).sort({ createdAt: -1 });
    if (latestAttempt && latestAttempt.status === "in-progress") {
      if (new Date(latestAttempt.endsAt) < new Date()) return res.status(403).json({ message: "Exam time expired." });
      return res.status(200).json({ success: true, attemptId: latestAttempt._id, endsAt: latestAttempt.endsAt });
    }

    // 2. Purchase check
    if (mocktest.price > 0) {
      const order = await Order.findOne({ user: studentId, items: mockTestId, status: "successful" });
      if (!order) return res.status(403).json({ success: false, message: "Please purchase the test to continue." });
    }

    // 3. Question Selection Logic (Holistic priority based)
    const allQuestions = await Question.find({ _id: { $in: mocktest.questionIds } }).lean();
    shuffleArray(allQuestions);
    const selected = allQuestions.slice(0, mocktest.totalQuestions);

    const now = new Date();
    const endsAt = new Date(now.getTime() + Number(mocktest.durationMinutes) * 60000);

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
    res.status(500).json({ success: false, message: "Exam setup failed." });
  }
};

/**
 * 2. Load Exam Paper (WriteTest Page)
 */
export const loadExamPaper = async (req, res) => {
  try {
    const attempt = await Attempt.findById(attemptId).populate("mocktestId", "title totalMarks price negativeMarking");
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    const isFinished = attempt.status === "completed" || attempt.status === "finished";
    
    // Proactive: Remove correct answers if test is still in-progress
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
      totalMarks: attempt.mocktestId?.totalMarks || 0
    });
  } catch (err) {
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
    const attempt = await Attempt.findById(attemptId).populate("mocktestId", "totalMarks");
    
    if (attempt.status === "completed") return res.status(400).json({ message: "Already submitted." });

    let score = 0;
    let correctCount = 0;
    const processedAnswers = [];

    for (const q of attempt.questions) {
      const userAns = answers.find(a => a.questionId === q._id.toString());
      const selected = userAns ? userAns.selectedAnswer : null;
      let isCorrect = false;

      if (q.questionType === "mcq") {
        if (selected !== null && q.correct.includes(Number(selected))) {
          score += q.marks;
          correctCount++;
          isCorrect = true;
        } else if (selected !== null) {
          score -= q.negative;
        }
      } else if (q.questionType === "manual") {
        if (selected?.toString().trim().toLowerCase() === q.correctManualAnswer?.trim().toLowerCase()) {
          score += q.marks;
          correctCount++;
          isCorrect = true;
        } else if (selected) {
          score -= q.negative;
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
      totalMarks: attempt.mocktestId?.totalMarks || 0
    });
  } catch (err) {
    res.status(500).json({ message: "Submission failed." });
  }
};