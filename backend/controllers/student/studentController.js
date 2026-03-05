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

            let test = await MockTest.findById(id).select("title totalMarks marksPerQuestion negativeMarking totalQuestions durationMinutes price discountPrice isFree isPublished isGrandTest category thumbnail subjects").populate("category", "name slug").lean();
            if (test) {
                // ✅ Add effective fields for consistency
                test.marksPerQuestion = (test.marksPerQuestion > 0) ? test.marksPerQuestion : (test.totalQuestions > 0 ? Number((test.totalMarks / test.totalQuestions).toFixed(2)) : 1);
                test.negativeMarking = (test.negativeMarking !== undefined && test.negativeMarking !== null) ? test.negativeMarking : 0;
                return { ...test, isGrandTest: false };
            }
            
            test = await GrandTest.findById(id).select("title totalMarks marksPerQuestion negativeMarking totalQuestions durationMinutes price discountPrice isFree isPublished isGrandTest category thumbnail subjects").populate("category", "name slug").lean();
            if (test) {
                // ✅ Add effective fields for consistency
                test.marksPerQuestion = (test.marksPerQuestion > 0) ? test.marksPerQuestion : (test.totalQuestions > 0 ? Number((test.totalMarks / test.totalQuestions).toFixed(2)) : 1);
                test.negativeMarking = (test.negativeMarking !== undefined && test.negativeMarking !== null) ? test.negativeMarking : 0;
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

    // Create mapping for quick lookup and count attempts
    const attemptMap = {};
    const countMap = {};

    attempts.forEach(attempt => {
       try {
           if (!attempt.mocktestId) return;
           
           const mtId = attempt.mocktestId.toString();
           
           // Track total count
           countMap[mtId] = (countMap[mtId] || 0) + 1;

           // Keep track of the latest attempt for status/progress
           if (!attemptMap[mtId] || new Date(attempt.updatedAt) > new Date(attemptMap[mtId].updatedAt)) {
               attemptMap[mtId] = attempt;
           }
       } catch (e) {
           console.error("Error processing attempt for map:", e);
       }
    });

    // Inject status and metadata into each purchased test
    const purchasedTestsWithStatus = await Promise.all(validTests.map(async (test) => {
        try {
            const testObj = { ...test }; 
            const testIdStr = test._id?.toString();
            if (!testIdStr) return null;

            const latestAttempt = attemptMap[testIdStr];
            const attemptsMade = countMap[testIdStr] || 0;
            const maxAttempts = 1; // Base policy
        
            // Default status
            let status = 'not_started';
            let progress = 0;
            let latestAttemptId = null;

            if (latestAttempt) {
                latestAttemptId = latestAttempt._id;
                status = latestAttempt.status;
                
                if (status === 'finished') status = 'completed'; 
                
                if (status === 'started') progress = 10;
                if (status === 'completed') progress = 100;
            }

            // RE-ATTEMPT LOGIC: check for successful but unused order
            const isFree = test.isFree === true || test.price <= 0;
            
            const unusedOrder = isFree ? true : await Order.findOne({
                user: userId,
                items: test._id,
                status: "successful",
                attemptUsed: false,
            }).lean();

            const isPurchaseRequired = (status === 'completed') && !unusedOrder && !isFree;
            
            // If completed but we have a fresh order or it's free, let them retry
            if (status === 'completed' && (unusedOrder || isFree)) {
                status = 'ready_to_retry';
            }

            return {
                ...testObj,
                status, 
                progress,
                attemptsMade,
                maxAttempts,
                latestAttemptId,
                isPurchaseRequired
            };
        } catch (e) {
            console.error("Error processing final test object:", e);
            return null;
        }
    }));

    const finalTests = purchasedTestsWithStatus.filter(Boolean);

    res.status(200).json({
      success: true,
      mocktests: finalTests,
    });
  } catch (error) {
    console.error("Error in getMyPurchasedTests:", error);
    res
      .status(500)
      .json({ success: false, message: "Error loading purchased tests" });
  }
};

/**
 * @desc    Get detailed status for ONE purchased test (for Instructions Page)
 */
export const getMyMockTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // 1. Find the test
        let test = await MockTest.findById(id).select("title totalMarks marksPerQuestion negativeMarking totalQuestions durationMinutes price discountPrice isFree isPublished isGrandTest category thumbnail subjects description").populate("category", "name slug").lean();
        let isGrandTest = false;

        if (!test) {
            test = await GrandTest.findById(id).select("title totalMarks marksPerQuestion negativeMarking totalQuestions durationMinutes price discountPrice isFree isPublished isGrandTest category thumbnail subjects description").populate("category", "name slug").lean();
            isGrandTest = true;
        }

        if (!test) return res.status(404).json({ success: false, message: "Test not found" });

        // 2. Fetch attempts for this test
        const attempts = await Attempt.find({ studentId: userId, mocktestId: id });
        const attemptsMade = attempts.length;
        
        const latestAttempt = attempts.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

        // 3. Status logic
        let status = 'not_started';
        let progress = 0;
        let latestAttemptId = null;

        if (latestAttempt) {
            latestAttemptId = latestAttempt._id;
            status = latestAttempt.status;
            if (status === 'finished') status = 'completed';
            if (status === 'started') progress = 10;
            if (status === 'completed') progress = 100;
        }

        const isFree = test.isFree === true || test.price <= 0;
        const unusedOrder = isFree ? true : await Order.findOne({
            user: userId,
            items: id,
            status: "successful",
            attemptUsed: false,
        }).lean();

        const isPurchaseRequired = (status === 'completed') && !unusedOrder && !isFree;
        if (status === 'completed' && (unusedOrder || isFree)) {
            status = 'ready_to_retry';
        }

        res.status(200).json({
            success: true,
            test: {
                ...test,
                // ✅ Effective Marking Scheme Fallbacks
                marksPerQuestion: (test.marksPerQuestion > 0) ? test.marksPerQuestion : (test.totalQuestions > 0 ? Number((test.totalMarks / test.totalQuestions).toFixed(2)) : 1),
                negativeMarking: (test.negativeMarking !== undefined && test.negativeMarking !== null) ? test.negativeMarking : 0,
                isGrandTest,
                status,
                progress,
                attemptsMade,
                maxAttempts: 1,
                latestAttemptId,
                isPurchaseRequired
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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

            let test = await MockTest.findById(attempt.mocktestId).select("title totalMarks marksPerQuestion negativeMarking isGrandTest totalQuestions").lean();
            let isGrandTest = false;
            if (!test) {
                test = await GrandTest.findById(attempt.mocktestId).select("title totalMarks marksPerQuestion negativeMarking totalQuestions").lean();
                isGrandTest = !!test;
            }

            if (test) {
              // ✅ Apply effective logic here as well for consistent dashboard display
              test.marksPerQuestion = (test.marksPerQuestion > 0) ? test.marksPerQuestion : (test.totalQuestions > 0 ? Number((test.totalMarks / test.totalQuestions).toFixed(2)) : 1);
              test.negativeMarking = (test.negativeMarking !== undefined && test.negativeMarking !== null) ? test.negativeMarking : 0;
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
            let test = await MockTest.findById(attempt.mocktestId).select("title totalMarks negativeMarking marksPerQuestion isGrandTest").lean();
            let isGrandTest = false;
            if (test) {
                isGrandTest = !!test.isGrandTest;
                // ✅ Effective fields
                test.marksPerQuestion = (test.marksPerQuestion > 0) ? test.marksPerQuestion : (test.totalQuestions > 0 ? Number((test.totalMarks / test.totalQuestions).toFixed(2)) : 1);
                test.negativeMarking = (test.negativeMarking !== undefined && test.negativeMarking !== null) ? test.negativeMarking : 0;
            } else {
                test = await GrandTest.findById(attempt.mocktestId).select("title totalMarks negativeMarking marksPerQuestion").lean();
                isGrandTest = !!test;
                if (test) {
                  test.marksPerQuestion = (test.marksPerQuestion > 0) ? test.marksPerQuestion : (test.totalQuestions > 0 ? Number((test.totalMarks / test.totalQuestions).toFixed(2)) : 1);
                  test.negativeMarking = (test.negativeMarking !== undefined && test.negativeMarking !== null) ? test.negativeMarking : 0;
                }
            }
            attempt.mocktestId = test ? { ...test, isGrandTest } : { title: "Deleted Test", totalMarks: 0 };
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
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all attempts for a specific test ID (for history page)
 * @route   GET /api/student/test-attempts/:testId
 */
export const getTestAttemptsByTestId = async (req, res) => {
    try {
        const { testId } = req.params;
        const userId = req.user._id;

        // 1. Fetch test basic info
        let test = await MockTest.findById(testId).select("title totalMarks marksPerQuestion negativeMarking").lean();
        if (!test) {
            test = await GrandTest.findById(testId).select("title totalMarks marksPerQuestion negativeMarking").lean();
        }

        if (!test) return res.status(404).json({ success: false, message: "Test not found" });

        // 2. Fetch all attempts for this test by this user
        const attempts = await Attempt.find({ studentId: userId, mocktestId: testId })
            .sort({ createdAt: -1 })
            .select("score status startedAt submittedAt correctCount createdAt")
            .lean();

        res.status(200).json({
            success: true,
            test,
            attempts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
