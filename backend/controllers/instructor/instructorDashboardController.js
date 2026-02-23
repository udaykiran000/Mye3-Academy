import User from "../../models/Usermodel.js";
import MockTest from "../../models/MockTest.js";
import Doubt from "../../models/Doubt.js";
import Attempt from "../../models/Attempt.js";
import Order from "../../models/Order.js";

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

/**
 * Get all students for Instructor (Read-only)
 */
export const getAllStudentsForInstructor = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .populate("addedBy", "firstname lastname")
      .lean();

    const updated = await Promise.all(
      students.map(async (stu) => {
        const [orderCount, attemptCount, doubtCount] = await Promise.all([
          Order.countDocuments({ user: stu._id, status: "successful" }),
          Attempt.countDocuments({ studentId: stu._id }),
          Doubt.countDocuments({ student: stu._id }),
        ]);

        return {
          ...stu,
          purchasedTestCount: orderCount,
          attemptCount: attemptCount,
          doubtCount: doubtCount,
        };
      })
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("Instructor Get All Students Error:", err);
    res.status(500).json({ message: "Failed to load students" });
  }
};

/**
 * Get specific student activity for Instructor
 */
export const getStudentActivityForInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders, attempts, doubts] = await Promise.all([
      Order.find({ user: id, status: "successful" }).populate("items", "title").lean(),
      Attempt.find({ studentId: id }).populate("mocktestId", "title").sort({ createdAt: -1 }).lean(),
      Doubt.find({ student: id }).populate("assignedInstructor", "firstname lastname").populate("mocktestId", "title").sort({ createdAt: -1 }).lean(),
    ]);

    const purchasedTests = orders.flatMap(o => o.items.map(i => ({
      title: i.title,
      date: o.createdAt,
      orderId: o.razorpay?.order_id || "N/A"
    })));

    res.status(200).json({
      purchasedTests,
      attempts,
      doubts
    });
  } catch (error) {
    console.error("Instructor Get Student Activity Error:", error);
    res.status(500).json({ message: "Failed to fetch student activity" });
  }
};
