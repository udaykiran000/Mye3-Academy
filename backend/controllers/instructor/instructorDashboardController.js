import User from "../../models/Usermodel.js";
import MockTest from "../../models/MockTest.js";
import Doubt from "../../models/Doubt.js";
import Attempt from "../../models/Attempt.js";


export const getInstructorDashboardStats = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const students = await User.countDocuments({ role: "student" });

    const tests = await MockTest.countDocuments({ instructor: instructorId });

    const freeTests = await MockTest.countDocuments({
      instructor: instructorId,
      price: 0,
    });

    const paidTests = await MockTest.countDocuments({
      instructor: instructorId,
      price: { $gt: 0 },
    });

    const attempts = await Attempt.countDocuments({ instructor: instructorId });

    const doubts = await Doubt.countDocuments({ assignedTo: instructorId });

    res.json({
      students,
      tests,
      freeTests,
      paidTests,
      attempts,

      doubts,
      categoryBreakdown: [],
      testTypeBreakdown: [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Instructor dashboard stats failed" });
  }
};
