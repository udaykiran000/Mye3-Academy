import User from "../../models/Usermodel.js";
import MockTest from "../../models/MockTest.js";
import Attempt from "../../models/Attempt.js";

export const getInstitutionDashboardStats = async (req, res) => {
  try {
    const institutionId = req.user._id;

    // Students registered under this institution
    const students = await User.countDocuments({ 
      role: "student", 
      institution: institutionId 
    });

    // Tests might be assigned by admin or instructor, 
    // for now we show all tests if institutions don't create their own,
    // or we can filter by tests purchased by students of this institution.
    // For simplicity, let's show total available mock tests.
    const tests = await MockTest.countDocuments();

    // Attempts by students of this institution
    const studentIds = await User.find({ institution: institutionId }).distinct("_id");
    const attempts = await Attempt.countDocuments({ user: { $in: studentIds } });

    res.json({
      students,
      tests,
      attempts,
      studentList: await User.find({ institution: institutionId }).select("-password")
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Institution dashboard stats failed" });
  }
};
