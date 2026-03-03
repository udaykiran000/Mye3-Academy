import MockTest from "../../models/MockTest.js";
import GrandTest from "../../models/GrandTest.js";
import Category from "../../models/Category.js";
import Attempt from "../../models/Attempt.js";

import mongoose from "mongoose";
import User from "../../models/Usermodel.js";
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
    const user = await User.findById(userId).select("purchasedTests");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // 1. Manually populate bought tests from both collections
    const testIds = user.purchasedTests || [];


    const populatedTests = await Promise.all(testIds.map(async (id) => {
        try {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {

                return null;
            }

            let test = await MockTest.findById(id).populate("category", "name slug").lean();
            if (test) {

                return { ...test, isGrandTest: false };
            }
            
            test = await GrandTest.findById(id).populate("category", "name slug").lean();
            if (test) {

                return { ...test, isGrandTest: true };
            }
            

            return null;
        } catch (err) {
            console.error(`[MY_TESTS] Error populating test ID ${id}:`, err);
            return null;
        }
    }));

    const validTests = populatedTests.filter(Boolean);


    // Fetch all attempts for this user
    const attempts = await Attempt.find({ studentId: userId });

    // Create a map for quick lookup of attempts by mockTestId
    const attemptMap = {};
    attempts.forEach(attempt => {
       try {
           if (!attempt.mocktestId) return;
           
           const mtId = attempt.mocktestId.toString();
           if (!attemptMap[mtId] || new Date(attempt.updatedAt) > new Date(attemptMap[mtId].updatedAt)) {
               attemptMap[mtId] = attempt;
           }
       } catch (e) {
           console.error("Error processing attempt for map:", e);
       }
    });

    // Inject status into each purchased test
    const purchasedTestsWithStatus = validTests.map(test => {
        try {
            const testObj = { ...test }; 
            const testIdStr = test._id?.toString();
            if (!testIdStr) return null;

            const latestAttempt = attemptMap[testIdStr];
        
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
        } catch (e) {
            console.error("Error processing final test object:", e);
            return null;
        }
    }).filter(Boolean);

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

    // Fetch attempts
    const attempts = await Attempt.find({ studentId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Manually populate mocktestId details from both collections
    const populatedAttempts = await Promise.all(attempts.map(async (attempt) => {
        try {
            if (!attempt.mocktestId || !mongoose.Types.ObjectId.isValid(attempt.mocktestId)) {
                return { ...attempt, mocktestId: { title: "Invalid Test Reference", totalMarks: 0 }};
            }

            let test = await MockTest.findById(attempt.mocktestId).select("title totalMarks isGrandTest").lean();
            let isGrandTest = false;
            if (!test) {
                test = await GrandTest.findById(attempt.mocktestId).select("title totalMarks").lean();
                isGrandTest = !!test;
            }

            return {
                ...attempt,
                mocktestId: test
                    ? { ...test, isGrandTest }
                    : { title: "Deleted Test", totalMarks: 0, isGrandTest: false }
            };
        } catch (err) {
            return { ...attempt, mocktestId: { title: "Error Loading Title", totalMarks: 0 }};
        }
    }));

    res.status(200).json({
      success: true,
      attempts: populatedAttempts,
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

    const attempt = await Attempt.findById(attemptId).lean();

    if (!attempt)
      return res.status(404).json({ success: false, message: "Attempt not found" });

    // Manually populate test details
    try {
        if (attempt.mocktestId && mongoose.Types.ObjectId.isValid(attempt.mocktestId)) {
            let test = await MockTest.findById(attempt.mocktestId).select("title totalMarks").lean();
            if (!test) {
                test = await GrandTest.findById(attempt.mocktestId).select("title totalMarks").lean();
            }
            attempt.mocktestId = test || { title: "Deleted Test", totalMarks: 0 };
        } else {
            attempt.mocktestId = { title: "Invalid Reference", totalMarks: 0 };
        }
    } catch (err) {
        attempt.mocktestId = { title: "Error Loading Test", totalMarks: 0 };
    }

    // Security check: Only the student who took the test, an admin, OR their institution can see the result
    const isOwner = attempt.studentId.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";
    
    let isInstitutionOfStudent = false;
    if (req.user.role === "institution") {
        const student = await User.findById(attempt.studentId);
        if (student && student.addedBy?.toString() === userId.toString()) {
            isInstitutionOfStudent = true;
        }
    }

    if (!isOwner && !isAdmin && !isInstitutionOfStudent) {
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
