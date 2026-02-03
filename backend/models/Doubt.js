import mongoose from "mongoose";

const doubtSchema = new mongoose.Schema(
  {
    // Who asked the doubt
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Optional: who will answer
    assignedInstructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // General vs Mocktest doubt
    type: {
      type: String,
      enum: ["general", "mocktest"],
      default: "general",
    },

    // For general doubts: student MUST choose subject manually
    subject: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // If linked to a test & question
    mocktestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTest",
      default: null,
    },

    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      default: null,
    },

    // Original question from Question collection (if you want)
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },

    // The actual doubt asked by student
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // Admin / system status
    status: {
      type: String,
      enum: ["pending", "assigned", "answered", "rejected"],
      default: "pending",
    },

    // Instructor’s answer
    answer: {
      type: String,
      default: "",
      trim: true,
    },

    answeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Doubt", doubtSchema);
