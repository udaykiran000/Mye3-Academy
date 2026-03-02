import mongoose from "mongoose";
import { questionSchema } from "./Question.js";

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
}, { _id: false });

const attemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
            selectedAnswer: mongoose.Schema.Types.Mixed,
            isCorrect: Boolean,
        },
    ],
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['started', 'finished', 'completed'], default: 'started' },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
});

const MockTestSchema = new mongoose.Schema({
    title: { type: String, default: "New Mock Test" },
    description: { type: String, default: "" },
    subcategory: { type: String, required: true },

    totalQuestions: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: null }, // null = auto-calc from questions.length * 2
    totalMarks: { type: Number, default: 0 },
    marksPerQuestion: { type: Number, default: 1 }, 
    negativeMarking: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    thumbnail: { type: String, default: null },
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },

    isGrandTest: { type: Boolean, default: false },
    scheduledFor: { type: Date, default: null },
    availableFrom: { type: Date, default: Date.now },
    availableTo: { type: Date, default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000) },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categorySlug: String,

    subjects: [SubjectSchema],

    // ✅ EMBEDDED QUESTIONS (no longer a separate collection)
    questions: [questionSchema],

    attempts: [attemptSchema],
}, { timestamps: true });

// Named export for reuse in GrandTest model
export { MockTestSchema };

export default mongoose.model("MockTest", MockTestSchema);