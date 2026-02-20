import Doubt from "../../models/Doubt.js";
import MockTest from "../../models/MockTest.js";
import Attempt from "../../models/Attempt.js";

// @desc    Create a new doubt
// @route   POST /api/student/doubts
// @access  Private (Student)
export const createDoubt = async (req, res) => {
  try {
    const { text, subject, type, mocktestId, attemptId, questionId } = req.body;

    if (!text || !subject) {
      return res.status(400).json({
        success: false,
        message: "Please provide doubt text and subject.",
      });
    }

    const newDoubt = new Doubt({
      student: req.user._id,
      text,
      subject,
      type: type || "general",
      mocktestId,
      attemptId,
      questionId,
      status: "pending",
    });

    await newDoubt.save();

    res.status(201).json({
      success: true,
      message: "Doubt submitted successfully",
      doubt: newDoubt,
    });
  } catch (error) {
    console.error("Create Doubt Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit doubt",
      error: error.message,
    });
  }
};

// @desc    Get all doubts for the logged-in student
// @route   GET /api/student/doubts
// @access  Private (Student)
export const getMyDoubts = async (req, res) => {
  try {
    const doubts = await Doubt.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .populate("mocktestId", "title");

    res.status(200).json({
      success: true,
      count: doubts.length,
      doubts,
    });
  } catch (error) {
    console.error("Get My Doubts Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doubts",
      error: error.message,
    });
  }
};
