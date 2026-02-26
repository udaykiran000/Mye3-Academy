import MockTest from "../../models/MockTest.js";
import User from "../../models/Usermodel.js";
import Attempt from "../../models/Attempt.js";
import Order from "../../models/Order.js";
import Doubt from "../../models/Doubt.js";

export const getAvailableMocktests = async (req, res) => {
  try {
    const tests = await MockTest.find({ isPublished: true }).populate(
      "category",
      "name slug",
    );
    res.status(200).json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching tests" });
  }
};

export const getGrandTestLeaderboard = async (req, res) => {
  try {
    const { mockTestId } = req.params;

    // Note: Assuming 'attempts' array is embedded/referenced in MockTest model
    // for leaderboard calculation, as per your original code structure.
    const grandTest = await MockTest.findById(mockTestId)
      .populate({
        path: "attempts.userId",
        model: "User",
        select: "firstname lastname avatar",
      })
      .lean();

    if (!grandTest) {
      return res.status(404).json({ message: "Grand Test not found." });
    }

    if (!grandTest.isGrandTest) {
      return res.status(400).json({ message: "This is not a grand test." });
    }

    // 2. Filter for 'completed' attempts and validate score
    const validAttempts = (grandTest.attempts || []).filter(
      (attempt) =>
        (attempt.status === "finished" || attempt.status === "completed") &&
        attempt.score !== undefined,
    );

    // 3. Sort by Score (Descending) and then by submission time (Ascending)
    validAttempts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const dateA = new Date(a.submittedAt || 0);
      const dateB = new Date(b.submittedAt || 0);
      return dateA - dateB;
    });

    // 4. Take Top 3
    const topRankers = validAttempts.slice(0, 3);

    // 5. Format for Frontend
    const formattedLeaderboard = topRankers.map((attempt, index) => {
      const user = attempt.userId;

      let fullName = "Unknown User";
      if (user) {
        // Safely combine firstname and lastname
        fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
        if (!fullName) fullName = "User";
      }

      return {
        rank: index + 1,
        name: fullName,
        avatar: user?.avatar || null,
        score: attempt.score,
        totalMarks: grandTest.totalMarks,
      };
    });

    res.status(200).json({
      success: true,
      leaderboard: formattedLeaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching leaderboard." });
  }
};
export const getMyAttempts = async (req, res) => {
  try {
    // FIX: Using req.user.id for consistency
    const userId = req.user.id;

    // Find all attempts belonging to the user
    const attempts = await Attempt.find({ studentId: userId })
      .populate("mocktestId", "title totalMarks isGrandTest scheduledFor") // Populate mocktest details
      .sort({ createdAt: -1 })
      .lean();

    // Filter attempts to only include those that are completed/finished
    const completedAttempts = attempts.filter(
      (a) => a.status === "completed" || a.status === "finished",
    );

    // ⭐ FIX: Safely map to a cleaner format, checking if mocktestId is populated.
    const formattedAttempts = completedAttempts.map((a) => {
      const mocktest = a.mocktestId;

      // If the referenced MockTest object is missing (null/deleted), use safe defaults
      if (!mocktest || typeof mocktest !== "object") {
        return {
          _id: a._id,
          score: a.score,
          correctCount: a.correctCount,
          createdAt: a.submittedAt || a.createdAt,
          mocktestId: {
            _id: a.mocktestId ? a.mocktestId.toString() : null, // If it's an unpopulated ID string
            title: "Test Deleted/Unavailable",
            totalMarks: 0,
            isGrandTest: false,
            scheduledFor: null,
          },
        };
      }

      return {
        _id: a._id,
        score: a.score,
        correctCount: a.correctCount,
        // Ensure the date is returned, the frontend component uses att.createdAt
        createdAt: a.submittedAt || a.createdAt,
        mocktestId: {
          _id: mocktest._id,
          title: mocktest.title,
          totalMarks: mocktest.totalMarks,
          isGrandTest: mocktest.isGrandTest,
          scheduledFor: mocktest.scheduledFor,
        },
      };
    });

    res.status(200).json(formattedAttempts);
  } catch (error) {
    console.error("Get Attempts Error:", error);
    res.status(500).json({ message: "Failed to fetch attempt history" });
  }
};

export const getMyPurchasedTests = async (req, res) => {
  try {
    const userId = req.user.id;
    const maxAttempts = 1; // Enforce single attempt policy per purchase

    // 1. Fetch User and Populate 'purchasedTests'
    const user = await User.findById(userId)
      .populate({
        path: "purchasedTests",
        model: "MockTest",
        select:
          "title description price discountPrice thumbnail category isGrandTest scheduledFor durationMinutes totalQuestions totalMarks negativeMarking subjects",
        options: { sort: { createdAt: -1 } },
      })
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 2. Filter out nulls and get IDs
    const validTests = (user.purchasedTests || []).filter(
      (test) => test && typeof test === "object",
    );
    const purchasedTestIds = validTests.map((test) => test._id);

    // 3. Fetch all attempts by this user for the purchased tests, sorted newest first
    const attempts = await Attempt.find({
      studentId: userId,
      mocktestId: { $in: purchasedTestIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // 4. Process each purchased test to attach attempt stats
    const testsWithStats = await Promise.all(
      validTests.map(async (test) => {
        // ⭐ ADDED ASYNC/AWAIT
        // Find attempts for this specific test
        const testAttempts = attempts.filter(
          (a) => a.mocktestId.toString() === test._id.toString(),
        );

        // Count any attempt that has been initiated
        const attemptsMade = testAttempts.length;

        // Get the latest attempt data
        const latestAttempt = testAttempts[0];

        // Determine current status
        let status = "not_started";
        let latestAttemptId = null;

        if (latestAttempt) {
          latestAttemptId = latestAttempt._id;
          // Normalize status for frontend clarity
          if (
            latestAttempt.status === "finished" ||
            latestAttempt.status === "completed"
          ) {
            status = "completed";
          } else if (latestAttempt.status === "in-progress") {
            status = "in-progress";
          }
        }

        //  NEW CORE LOGIC: Check for available UNUSED order (Crucial for re-purchase)
        const isCompletedOrFinished =
          status === "completed" || status === "finished";

        const unusedOrder = await Order.findOne({
          user: userId,
          items: test._id,
          status: "successful",
          attemptUsed: false,
        }).lean();

        // If an unused order exists, the student is NOT required to purchase again.
        const isPurchaseRequired = isCompletedOrFinished && !unusedOrder;

        let cardStatus = status;

        //  If completed BUT a new purchase is available, override status to show "Start Exam"
        if (isCompletedOrFinished && unusedOrder) {
          cardStatus = "ready_to_retry";
        }

        return {
          ...test,
          maxAttempts: maxAttempts,
          attemptsMade: attemptsMade,
          status: cardStatus, // Send the refined status to frontend
          latestAttemptId: latestAttemptId,
          isPurchaseRequired: isPurchaseRequired, // Flag sent to frontend
        };
      }),
    ); // ⭐ CLOSE await Promise.all

    res.status(200).json({ success: true, tests: testsWithStats });
  } catch (error) {
    console.error("❌ Error fetching purchased tests:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching tests." });
  }
};
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Attempt.aggregate([
      { $match: { status: { $in: ["finished", "completed", "pending"] } } },
      {
        $group: {
          _id: "$studentId",
          totalScore: { $sum: "$score" },
          attemptsCount: { $sum: 1 },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          totalScore: 1,
          attemptsCount: 1,
          name: {
            $concat: ["$userDetails.firstname", " ", "$userDetails.lastname"],
          },
          avatar: "$userDetails.avatar",
        },
      },
    ]);

    console.log(`🏆 Found ${leaderboard.length} rankers for the global leaderboard.`);
    res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
};

export const getStudentDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Total Enrolled Tests
    const user = await User.findById(userId);
    const enrolledCount = user.purchasedTests?.length || 0;

    // 2. Completed Attempts
    const completedCount = await Attempt.countDocuments({ 
      studentId: userId, 
      status: { $in: ['finished', 'completed'] } 
    });

    // 3. Pending Doubts
    const pendingDoubts = await Doubt.countDocuments({ 
      student: userId, 
      status: 'pending' 
    });

    res.status(200).json({
      success: true,
      stats: {
        enrolledTests: enrolledCount,
        completedTests: completedCount,
        pendingDoubts: pendingDoubts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Stats fetch failed" });
  }
};