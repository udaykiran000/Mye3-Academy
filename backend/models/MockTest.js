import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
}, { _id: false });

const attemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
            selectedAnswer: mongoose.Schema.Types.Mixed, 
            isCorrect: Boolean,
        },
    ],
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['started', 'finished', 'completed'], default: 'started' }, // Added 'completed' to enum
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
});

const MockTestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    subcategory: { type: String, default: "" }, 

    totalQuestions: { type: Number, default: 0 }, 
    durationMinutes: { type: Number, default: 60 },
    totalMarks: { type: Number, default: 0 },
    negativeMarking: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    thumbnail: { type: String, default: null },
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    
    // ✅ ADD THESE MISSING FIELDS
    isGrandTest: { type: Boolean, default: false },
    scheduledFor: { type: Date, default: null },
    availableFrom: { type: Date, default: Date.now }, // For generic availability
    availableTo: { type: Date, default: () => new Date(+new Date() + 365*24*60*60*1000) }, // Default 1 year

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    categorySlug: String,
    
    subjects: [SubjectSchema], 
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    attempts: [attemptSchema],
}, { timestamps: true });

export default mongoose.model("MockTest", MockTestSchema);