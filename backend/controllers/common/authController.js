import genToken from "../../config/token.js";
import User from "../../models/Usermodel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import sendEmail from "../../utils/sendEmail.js";
import Order from "../../models/Order.js";
import fs from "fs";




export const signup = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      confirmPassword,
      phoneNumber,
      role,
    } = req.body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const userRole = "student";
    let user = await User.findOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    let hashPassword = await bcrypt.hash(password, 10);

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: "User already exists" });
      }
      user.firstname = firstname;
      user.lastname = lastname;
      user.phoneNumber = phoneNumber;
      user.password = hashPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.role = userRole;
      await user.save();
    } else {
      await User.create({
        firstname,
        lastname,
        email,
        phoneNumber,
        password: hashPassword,
        otp,
        otpExpires,
        role: userRole,
      });
    }

    const isEmailSent = await sendEmail(
      email,
      "Account Verification OTP",
      `Your OTP is ${otp}. It expires in 10 minutes.`,
    );

    if (isEmailSent) {
      return res
        .status(201)
        .json({
          message: "Signup successful. Please check your email for OTP.",
        });
    } else {
      return res
        .status(500)
        .json({
          message:
            "Failed to send OTP email. Please check your internet or try again.",
        });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Signup error: ${error.message}` });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (
      user.otp.toString().trim() !== otp.toString().trim() ||
      user.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userData } = user.toObject();
    return res
      .status(200)
      .json({ message: "Email verified successfully", user: userData });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res
      .status(500)
      .json({ message: `Verification error: ${error.message}` });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "User is already verified. Please Login." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const isEmailSent = await sendEmail(
      email,
      "Resend OTP",
      `Your new OTP is ${otp}`,
    );

    if (isEmailSent) {
      return res.status(200).json({ message: "New OTP sent to your email" });
    } else {
      return res
        .status(500)
        .json({ message: "Could not send OTP. Please try again later." });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userData } = user.toObject();
    return res.status(200).json(userData);
  } catch (error) {
    return res.status(500).json({ message: `Login error: ${error.message}` });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const isEmailSent = await sendEmail(
      email,
      "Password Reset OTP",
      `Your Password Reset OTP is ${otp}`,
    );

    if (isEmailSent) {
      return res.status(200).json({ message: "OTP sent to email" });
    } else {
      return res
        .status(500)
        .json({ message: "Failed to send reset OTP. Try again." });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      user.otp.toString().trim() !== otp.toString().trim() ||
      user.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    return res
      .status(200)
      .json({ message: "Password reset successful. Please login." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    await res.clearCookie("token");
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: `Logout error ${error}` });
  }
};

export const getme = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("purchasedTests")
      .populate("attempts");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    // 1. Get 'role' from request body
    const { firstname, lastname, email, avatar, role } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      // EXISTING USER: Log them in (Keep existing role)
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      const token = await genToken(user._id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password: _, ...userData } = user.toObject();
      return res.status(200).json(userData);
    }

    // 2. NEW USER: Create with SELECTED ROLE
    else {
      const randomPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashPassword = await bcrypt.hash(randomPassword, 10);

      const safeFirst = firstname && firstname.trim() ? firstname : "Google";
      const safeLast = lastname && lastname.trim() ? lastname : "User";

      // Public Google Signup is EXCLUSIVELY for students
      const userRole = "student";

      const newUser = await User.create({
        firstname: safeFirst,
        lastname: safeLast,
        email,
        password: hashPassword,
        phoneNumber: "0000000000",
        avatar: avatar,
        isVerified: true,
        role: userRole, // ⭐ SAVE THE ROLE HERE
      });

      const token = await genToken(newUser._id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password: _, ...userData } = newUser.toObject();
      return res.status(201).json(userData);
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ message: error.message });
  }
};


export const updateUserProfile = async (req, res) => {
  try {
    // User ID comes from the isAuth middleware
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let updates = [];

    // 1. Handle Avatar Upload (Delete old one to save space)
    if (req.file) {
      // Delete old avatar if it exists (use relative path to resolve absolute)
      if (user.avatar && !user.avatar.startsWith('http')) {
        try {
          const { fileURLToPath } = await import('url');
          const { dirname, join } = await import('path');
          const __dir = dirname(fileURLToPath(import.meta.url));
          const absOld = join(__dir, '../../', user.avatar);
          const fsm = await import('fs');
          if (fsm.existsSync(absOld)) fsm.unlinkSync(absOld);
        } catch (err) {
          console.error("Failed to delete old avatar:", err);
        }
      }
      // Store RELATIVE path only: 'uploads/images/filename.jpg'
      // req.file.path is absolute e.g. D:/project/backend/uploads/images/x.jpg
      const rawPath = req.file.path.replace(/\\/g, "/");
      const uploadsIdx = rawPath.indexOf("uploads/");
      user.avatar = uploadsIdx !== -1 ? rawPath.slice(uploadsIdx) : rawPath;
      updates.push("Profile Picture");
    }


    // 2. Update Basic Fields — always assign with fallback to prevent Mongoose required-field errors
    const newFirstName = req.body.firstName || req.body.firstname || null;
    const newLastName  = req.body.lastName  || req.body.lastname  || null;

    if (newFirstName !== null) {
      if (newFirstName !== user.firstname) updates.push("Name");
      user.firstname = newFirstName || user.firstname;
    }
    // lastname: always provide a value (empty string → keep existing) so required validation passes
    user.lastname = (newLastName && newLastName.trim()) ? newLastName.trim() : (user.lastname || "");

    if (req.body.phoneNumber || req.body.phone) {
      user.phoneNumber = req.body.phoneNumber || req.body.phone;
      updates.push("Phone Number");
    }

    // 3. Handle Password Update (Securely)
    if (req.body.password && req.body.password.trim() !== "") {
      if (req.body.password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters" });
      }
      const hashPassword = await bcrypt.hash(req.body.password, 10);
      user.password = hashPassword;
      updates.push("Password");
    }

    await user.save();

    // 4. Return updated user without password
    const { password: _, ...updatedUser } = user.toObject();

    // Construct dynamic message
    let message = "Profile updated successfully";
    if (updates.length > 0) {
      const last = updates.pop();
      const text = updates.length > 0 ? updates.join(", ") + " and " + last : last;
      message = `${text} updated successfully`;
    }

    return res.status(200).json({
      message,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
