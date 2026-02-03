import mongoose from "mongoose";
import Doubt from "../models/Doubt.js";
import User from "../models/Usermodel.js";
import MockTest from "../models/MockTest.js";
import Attempt from "../models/Attempt.js";
import { getIO } from "../socket.js";

/* ============================================================
   STUDENT CONTROLLERS
============================================================ */
export const createDoubt = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      text,
      subject,
      type = "general",
      mocktestId,
      attemptId,
      questionId,
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Doubt text is required" });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: "Subject is required" });
    }

    // Helper: If ID is an empty string or undefined, make it null
    const cleanId = (id) => (id && id !== "" ? id : null);

    const doubt = await Doubt.create({
      student: studentId,
      text: text.trim(),
      subject: subject.trim().toLowerCase(),
      type,
      mocktestId: cleanId(mocktestId),
      attemptId: cleanId(attemptId),
      questionId: cleanId(questionId),
    });

    // Notify Admins via Socket
    try {
      const populatedDoubt = await doubt.populate("student", "firstname lastname email");
      const io = getIO();
      io.emit("newDoubtReceived", { 
        message: `New doubt from ${populatedDoubt.student.firstname}`,
        doubt: populatedDoubt 
      });
    } catch (err) {
      console.warn("Socket notification failed:", err.message);
    }

    res.status(201).json({ success: true, doubt });
  } catch (err) {
    console.error("❌ createDoubt error:", err);
    res.status(500).json({ success: false, message: "Failed to create doubt", error: err.message });
  }
};

export const getMyDoubts = async (req, res) => {
  try {
    const studentId = req.user.id;
    const doubts = await Doubt.find({ student: studentId })
      .populate("assignedInstructor", "firstname lastname email")
      .populate("mocktestId", "title")
      .populate("questionId") // Added to see question in student view too
      .sort({ createdAt: -1 });

    res.json({ success: true, doubts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch doubts" });
  }
};

/* ============================================================
   ADMIN CONTROLLERS
============================================================ */
export const adminGetDoubts = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    const { status, subject } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (subject) filter.subject = subject.trim().toLowerCase();

    const doubts = await Doubt.find(filter)
      .populate("student", "firstname lastname email")
      .populate("assignedInstructor", "firstname lastname email")
      .populate("mocktestId", "title")
      .populate("questionId") // Added population
      .sort({ createdAt: -1 });

    res.json({ success: true, doubts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch doubts" });
  }
};

export const adminAssignInstructor = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    const { id } = req.params;
    const { instructorId, status } = req.body;

    const doubt = await Doubt.findById(id);
    if (!doubt) return res.status(404).json({ message: "Doubt not found" });

    if (instructorId) {
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        return res.status(400).json({ message: "Invalid Instructor ID" });
      }
      const instructor = await User.findById(instructorId);
      if (!instructor || instructor.role !== "instructor") {
        return res.status(400).json({ message: "Invalid instructor" });
      }
      doubt.assignedInstructor = instructorId;
      doubt.status = status || "assigned";
    } else if (status) {
      doubt.status = status;
    }

    await doubt.save();

    const populated = await Doubt.findById(id)
      .populate("student", "firstname lastname email")
      .populate("assignedInstructor", "firstname lastname email")
      .populate("mocktestId", "title");

    try {
      const io = getIO();
      if (doubt.assignedInstructor) {
        io.to(String(doubt.assignedInstructor)).emit("doubtAssigned", { doubtId: doubt._id });
      }
    } catch (e) {}

    res.json({ success: true, doubt: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update doubt" });
  }
};

/* ============================================================
   INSTRUCTOR CONTROLLERS
============================================================ */

// GET /api/instructor/doubts
export const instructorGetMyDoubts = async (req, res) => {
  try {
    if (req.user.role !== "instructor") return res.status(403).json({ message: "Access denied" });

    const instructorId = req.user.id;

    const doubts = await Doubt.find({ assignedInstructor: instructorId })
      .populate("student", "firstname lastname email")
      .populate("mocktestId", "title")
      .populate("questionId") // ✅ THIS IS THE KEY CHANGE: Populates the Question Data
      .sort({ createdAt: 1 });

    res.json({ success: true, doubts });
  } catch (err) {
    console.error("❌ instructorGetMyDoubts error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch doubts" });
  }
};

// PUT /api/instructor/doubts/:id/answer
export const instructorAnswerDoubt = async (req, res) => {
  try {
    if (req.user.role !== "instructor") return res.status(403).json({ message: "Access denied" });

    const instructorId = req.user.id;
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer || !answer.trim()) return res.status(400).json({ message: "Answer required" });

    const doubt = await Doubt.findById(id);
    if (!doubt) return res.status(404).json({ message: "Doubt not found" });

    if (doubt.assignedInstructor?.toString() !== instructorId) {
      return res.status(403).json({ message: "Not assigned to you" });
    }

    doubt.answer = answer.trim();
    doubt.status = "answered";
    doubt.answeredAt = new Date();
    await doubt.save();

    const populated = await Doubt.findById(id)
      .populate("student", "firstname lastname email")
      .populate("mocktestId", "title")
      .populate("questionId"); // Populate here too for consistency

    try {
      const io = getIO();
      io.to(String(doubt.student)).emit("doubtAnswered", { doubtId: doubt._id });
    } catch (e) {}

    res.json({ success: true, doubt: populated });
  } catch (err) {
    console.error("❌ instructorAnswerDoubt error:", err);
    res.status(500).json({ success: false, message: "Failed to answer doubt" });
  }
};