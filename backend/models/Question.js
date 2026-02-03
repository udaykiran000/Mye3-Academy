// backend/models/Question.js
import mongoose from "mongoose";

/* -------------------------------
   OPTION SCHEMA
-------------------------------*/
const optionSchema = new mongoose.Schema({
  text: { type: String, default: "" },
  imageUrl: { type: String, default: null }
}, { _id: false });

/* -------------------------------
   QUESTION SCHEMA
-------------------------------*/
const questionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ["mcq", "manual", "passage"],
    default: "mcq"
  },

  title: { 
    type: String, 
    required: [true, "Question text (title) is required"], 
    trim: true 
  },

  questionImageUrl: { type: String, default: null },

  /* ---------------------------
     MCQ OPTIONS
  ----------------------------*/
  options: {
    type: [optionSchema],
    required: function () { return this.questionType === "mcq"; },
    validate: {
      validator: function(arr) {
        if (this.questionType !== "mcq") return true;
        return Array.isArray(arr) && arr.length >= 2;
      },
      message: "MCQ must have at least 2 options."
    }
  },

  correct: {
    type: [Number],
    required: function () { return this.questionType === "mcq"; }
  },

  /* ---------------------------
     MANUAL ANSWER
  ----------------------------*/
  correctManualAnswer: {
    type: String,
    required: function () { return this.questionType === "manual"; },
    default: ""
  },

  /* ---------------------------
     PASSAGE + CHILD LINKS
  ----------------------------*/
  parentQuestionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    default: null
  },

  isPassage: { 
    type: Boolean, 
    default: false 
  },

  /* ---------------------------
     MARKS & META
  ----------------------------*/
  marks: { type: Number, default: 1 },
  negative: { type: Number, default: 0 },

  difficulty: { 
    type: String, 
    enum: ["easy", "medium", "hard"], 
    default: "easy" 
  },

  category: { 
    type: String, 
    required: [true, "Category/subject is required"] 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/* ---------------------------
   PRE-SAVE CLEANING
----------------------------*/
questionSchema.pre("save", function(next) {
  if (this.title) this.title = this.title.trim();

  // ✅ FIX: Normalize category/subject string before saving
  if (this.category) {
    this.category = this.category.trim().toLowerCase();
  }
  
  if (Array.isArray(this.options)) {
    this.options = this.options.map(opt => ({
      text: (opt.text || "").toString(),
      imageUrl: opt.imageUrl || null
    }));
  }
  next();
});

/* ---------------------------
   CLEAN JSON OUTPUT
----------------------------*/
questionSchema.method("toJSON", function() {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
});

export default mongoose.model("Question", questionSchema);
