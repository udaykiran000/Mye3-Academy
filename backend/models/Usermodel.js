import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstname: { 
      type: String, 
      required: true, 
      trim: true,
      default: "User" // ⭐ Added Default
    },
    lastname: { 
      type: String, 
      required: false,
      trim: true, 
      default: "" 
    },

    phoneNumber: { 
      type: String, 
      required: true,
      trim: true,
      default: "0000000000" // ⭐ Added Default
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin", "institution"],
      default: "student",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    otp: { type: String, select: false }, // Hide OTP
    otpExpires: { type: Date, select: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    avatar: {
      type: String,
      default: "",
    },

    // 🛒 Cart & Tests
    cart: [{ type: mongoose.Schema.Types.ObjectId }],
    purchasedTests: [{ type: mongoose.Schema.Types.ObjectId }],
    attempts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attempt" }],
    
    // 🚩 Tracking Fields
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    registrationSource: {
      type: String,
      enum: ["self", "institution", "admin"],
      default: "self",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);