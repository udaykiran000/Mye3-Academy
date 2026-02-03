import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mocktestId: { type: mongoose.Schema.Types.ObjectId, ref: "MockTest", required: true },

    questions: Array,

    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId },
        selectedAnswer: String,
        isCorrect: Boolean,
      },
    ],

    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    submittedAt: Date,
    endsAt: Date,

    status: {
      type: String,
      enum: ["in-progress", "completed", "finished", "pending"],
      default: "in-progress",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attempt", AttemptSchema);
