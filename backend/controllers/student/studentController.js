import MockTest from "../../models/MockTest.js";
import Attempt from "../../models/Attempt.js";

import mongoose from "mongoose";
import User from "../../models/Usermodel.js"; // Note: Imported as 'User' here
import Order from "../../models/Order.js";

/**
 * @desc    Get all available mock tests for students (Library)
 * @route   GET /api/student/available-tests
 */
export const getAvailableMocktests = async (req, res) => {
  try {
    const tests = await MockTest.find({ isPublished: true })
      .populate("category", "name slug")
      .select("-questionIds")
      .sort({ createdAt: -1 });

    // Using 'mocktests' key for frontend consistency
    res.status(200).json({
      success: true,
      mocktests: tests,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get enrolled tests for "My Enrolled Tests" section
 */
/**
 * @desc    Get enrolled tests for "My Enrolled Tests" section
 */
export const getMyPurchasedTests = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: "purchasedTests",
      populate: { path: "category", select: "name slug" },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Fetch all attempts for this user
    const attempts = await Attempt.find({ studentId: userId });

    // Create a map for quick lookup of attempts by mockTestId
    const attemptMap = {};
    attempts.forEach(attempt => {
       // Store the most relevant attempt (e.g. latest or based on status)
       // Here we store the attempt object itself
       if (!attemptMap[attempt.mocktestId.toString()] || new Date(attempt.updatedAt) > new Date(attemptMap[attempt.mocktestId.toString()].updatedAt)) {
           attemptMap[attempt.mocktestId.toString()] = attempt;
       }
    });

    // Inject status into each purchased test
    const purchasedTestsWithStatus = user.purchasedTests.map(test => {
        const testObj = test.toObject(); // Convert Mongoose doc to plain object
        const latestAttempt = attemptMap[test._id.toString()];
        
        // Default status
        let status = 'not_started';
        let progress = 0;

        if (latestAttempt) {
            status = latestAttempt.status; // 'started', 'submitted', 'completed' etc.
            // If the attemptSchema uses different status strings, verify them. 
            // The schema has: enum: ['started', 'finished', 'completed']
            
            // Map 'finished' to 'completed' for frontend consistency if needed, 
            // or ensure frontend handles 'finished'.
            if (status === 'finished') status = 'completed'; 
            
            // Calculate progress if needed (simple logic provided)
            if (status === 'started') progress = 10; // Example: In progress
            if (status === 'completed') progress = 100;
        }

        return {
            ...testObj,
            status, 
            progress
        };
    });

    res.status(200).json({
      success: true,
      mocktests: purchasedTestsWithStatus,
    });
  } catch (error) {
    console.error("Error in getMyPurchasedTests:", error);
    res
      .status(500)
      .json({ success: false, message: "Error loading purchased tests" });
  }
};

/**
 * @desc    Get all exam attempts history for the logged-in student
 * @route   GET /api/student/my-attempts
 */
export const getMyAttempts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch attempts and populate test title for the UI table
    const attempts = await Attempt.find({ studentId: userId })
      .populate("mocktestId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      attempts: attempts,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load attempt history" });
  }
};

/**
 * @desc    Get detailed result of a specific attempt by ID
 * @route   GET /api/student/attempt/:attemptId
 */
export const getAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user._id;

    const attempt = await Attempt.findById(attemptId).populate(
      "mocktestId",
      "title totalMarks",
    );

    if (!attempt)
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found" });

    // Security check: Only the student who took the test can see their result
    if (attempt.studentId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to view this result",
        });
    }

    res.status(200).json({
      success: true,
      attempt,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching attempt details" });
  }
};

/**
 * @desc    Get top rankers for a specific mocktest (Leaderboard)
 * @route   GET /api/student/leaderboard/:mockTestId
 */
export const getStudentLeaderboard = async (req, res) => {
  try {
    const { mockTestId } = req.params;

    // Get top 10 finished attempts sorted by score
    const leaderboard = await Attempt.find({
      mocktestId: mockTestId,
      status: { $in: ["finished", "completed"] },
    })
      .populate("studentId", "firstname lastname avatar")
      .sort({ score: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch leaderboard" });
  }
};
