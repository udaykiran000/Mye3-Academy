import genToken from "../config/token.js";
import User from '../models/Usermodel.js'
import validator from "validator";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import Order from "../models/Order.js";
import fs from "fs";


export const signup = async (req, res) => {
  try {
    const { firstname, lastname, email, password, confirmPassword, phoneNumber, role } = req.body;

    if (!firstname || !lastname || !email || !password || !confirmPassword || !phoneNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const userRole = role === "instructor" ? "instructor" : "student";
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
            role: userRole
        });
    }

    // ⭐ మెయిల్ పంపడం మరియు చెక్ చేయడం
    const isEmailSent = await sendEmail(email, "Account Verification OTP", `Your OTP is ${otp}. It expires in 10 minutes.`);

    if (isEmailSent) {
      return res.status(201).json({ message: "Signup successful. Please check your email for OTP." });
    } else {
      // మెయిల్ వెళ్లకపోతే 500 ఎర్రర్ పంపిస్తాం, అప్పుడు ఫ్రంటెండ్ లో OTP పేజీకి వెళ్ళదు
      return res.status(500).json({ message: "Failed to send OTP email. Please check your internet or try again." });
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

    if (user.otp.toString().trim() !== otp.toString().trim() || user.otpExpires < Date.now()) {
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
    return res.status(200).json({ message: "Email verified successfully", user: userData });

  } catch (error) {
    console.error("Verify OTP Error:", error); 
    return res.status(500).json({ message: `Verification error: ${error.message}` });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified. Please Login." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    // ⭐ మెయిల్ చెక్
    const isEmailSent = await sendEmail(email, "Resend OTP", `Your new OTP is ${otp}`);

    if (isEmailSent) {
      return res.status(200).json({ message: "New OTP sent to your email" });
    } else {
      return res.status(500).json({ message: "Could not send OTP. Please try again later." });
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
      return res.status(403).json({ message: "Please verify your email first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

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

    // ⭐ మెయిల్ చెక్
    const isEmailSent = await sendEmail(email, "Password Reset OTP", `Your Password Reset OTP is ${otp}`);

    if (isEmailSent) {
      return res.status(200).json({ message: "OTP sent to email" });
    } else {
      return res.status(500).json({ message: "Failed to send reset OTP. Try again." });
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
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successful. Please login." });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const logout = async (req, res) => {
    try {
        await res.clearCookie("token");
        return res.status(200).json({message:"Logout successful"});
    } catch (error) {
        return res.status(500).json({message:`Logout error ${error}`});
    }
}


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


export const addInstructor = async (req, res) => {
  try {
    // ⭐ FIX: Read 'firstName' and 'lastName' (CamelCase from React)
    const { firstName, lastName, email, password, phone, } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    let existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    let hashPassword = await bcrypt.hash(password, 10);
    
    // ⭐ FIX: Get the file path if a photo was uploaded
    const avatarPath = req.file ? req.file.path : ""; 

    // ⭐ FIX: Map 'firstName' -> 'firstname' for MongoDB
    const newInstructor = await User.create({
      firstname: firstName, 
      lastname: lastName,   
      email,
      password: hashPassword,
      phoneNumber: phone || "0000000000",
      role: 'instructor',
      isVerified: true, // ⭐ AUTO-VERIFY (Admin Action)
      avatar: avatarPath, // ⭐ SAVING THE IMAGE PATH HERE
    });

    // ---------------------------------------------------------
    // ✉️ SEND EMAIL NOTIFICATION (CREDENTIALS)
    // ---------------------------------------------------------
    try {
      const subject = "Welcome to InnoMakers - Instructor Account Created";
      const text = `Hello ${firstName},\n\nYour instructor account has been successfully created by the admin.\n\nHere are your Login Credentials:\n----------------------------\nEmail: ${email}\nPassword: ${password}\n----------------------------\n\nPlease login and change your password immediately for security purposes.\n\nBest Regards,\nInnoMakers Team`;
      
      await sendEmail(email, subject, text);
      console.log(`Credential email sent to Instructor: ${email}`);
    } catch (emailError) {
      console.error("Failed to send credential email:", emailError);
      // We do not stop the response here, user is created anyway.
    }
    // ---------------------------------------------------------

    const { password: _, ...instructorData } = newInstructor.toObject();

    return res.status(201).json({ 
      message: "Instructor added successfully", 
      instructor: instructorData 
    });

  } catch (error) {
    console.error("Add Instructor Error:", error);
    return res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

export const addStudent = async (req, res) => {
  try {
    // ⭐ FIX: Read 'firstName' and 'lastName'
    const { firstName, lastName, email, password, phone,  } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    let existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    let hashPassword = await bcrypt.hash(password, 10);

    // ⭐ FIX: Get the file path if a photo was uploaded
    const avatarPath = req.file ? req.file.path : "";

    const newStudent = await User.create({
      firstname: firstName,
      lastname: lastName,
      email,
      password: hashPassword,
      phoneNumber: phone || "0000000000",
      role: 'student',
      isVerified: true, // ⭐ AUTO-VERIFY (Admin Action)
      avatar: avatarPath, // ⭐ SAVING THE IMAGE PATH HERE
    });

    // ---------------------------------------------------------
    // ✉️ SEND EMAIL NOTIFICATION (CREDENTIALS)
    // ---------------------------------------------------------
    try {
      const subject = "Welcome to InnoMakers - Student Account Created";
      const text = `Hello ${firstName},\n\nYour student account has been successfully created by the admin.\n\nHere are your Login Credentials:\n----------------------------\nEmail: ${email}\nPassword: ${password}\n----------------------------\n\nPlease login and change your password immediately for security purposes.\n\nBest Regards,\nInnoMakers Team`;

      await sendEmail(email, subject, text);
      console.log(`Credential email sent to Student: ${email}`);
    } catch (emailError) {
      console.error("Failed to send credential email:", emailError);
      // We do not stop the response here, user is created anyway.
    }
    // ---------------------------------------------------------

    const { password: _, ...studentData } = newStudent.toObject();

    return res.status(201).json({ 
      message: "Student added successfully", 
      student: studentData 
    });

  } catch (error) {
    console.error("Add Student Error:", error);
    return res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};




export const getAllInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' }).select("-password").sort({ createdAt: -1 });
    res.status(200).json(instructors);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    // ✅ FIX: Changed 'Usermodel' to 'User' (matches your import at the top)
    const students = await User.find({ role: "student" }).lean();

    const updated = await Promise.all(
      students.map(async (stu) => {
        // Ensure 'Order' model is imported correctly at the top of the file
        const count = await Order.countDocuments({
          user: stu._id, // Ensure your Order schema uses 'user' as the field name
          status: "successful",
        });

        return {
          ...stu,
          purchasedTestCount: count,
        };
      })
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("Get All Students Error:", err); // Log the actual error to your terminal
    res.status(500).json({ error: "Server error" });
  }
};

export const toggleInstructorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor = await User.findById(id);
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    instructor.isActive = !instructor.isActive;
    await instructor.save();
    const { password: _, ...instructorData } = instructor.toObject();
    res.status(200).json({ message: "Status updated", instructor: instructorData });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// --- ⭐ FIXED GOOGLE AUTH FUNCTION ⭐ ---
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
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashPassword = await bcrypt.hash(randomPassword, 10);

      const safeFirst = (firstname && firstname.trim()) ? firstname : "Google";
      const safeLast = (lastname && lastname.trim()) ? lastname : "User"; 

      // ⭐ Determine role (default to student if invalid/missing)
      const userRole = role === "instructor" ? "instructor" : "student";

      const newUser = await User.create({
        firstname: safeFirst, 
        lastname: safeLast,   
        email,
        password: hashPassword,
        phoneNumber: "0000000000", 
        avatar: avatar,
        isVerified: true, 
        role: userRole // ⭐ SAVE THE ROLE HERE
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

export const updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Instructor not found" });

    // ✅ PHOTO update
    if (req.file) {
      if (user.avatar && fs.existsSync(user.avatar)) {
        fs.unlinkSync(user.avatar);
      }
      user.avatar = req.file.path;
    }

    // ✅ CORRECT FIELD MAPPING (VERY IMPORTANT)
    user.firstname = req.body.firstName || user.firstname;
    user.lastname = req.body.lastName || user.lastname;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phone || user.phoneNumber;

    // ✅ OPTIONAL PASSWORD UPDATE
    if (req.body.password && req.body.password.trim() !== "") {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    const { password, ...updatedUser } = user.toObject();

    return res.json({
      message: "Instructor updated successfully",
      instructor: updatedUser
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Instructor not found" });

    if (user.avatar && fs.existsSync(user.avatar)) {
      fs.unlinkSync(user.avatar);
    }

    await user.deleteOne();

    res.json({ message: "Instructor deleted", id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findById(id);
    if (!student || student.role !== "student")
      return res.status(404).json({ message: "Student not found" });

    student.isActive = !student.isActive;
    await student.save();

    const { password, ...studentData } = student.toObject();

    res.status(200).json({ message: "Status updated", student: studentData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || user.role !== "student")
      return res.status(404).json({ message: "Student not found" });

    if (req.file) {
      if (user.avatar && fs.existsSync(user.avatar)) {
        fs.unlinkSync(user.avatar);
      }
      user.avatar = req.file.path;
    }

    user.firstname = req.body.firstName || user.firstname;
    user.lastname = req.body.lastName || user.lastname;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phone || user.phoneNumber;

    if (req.body.password && req.body.password.trim() !== "") {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    const { password, ...studentData } = user.toObject();

    res.json({ message: "Student updated successfully", student: studentData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || user.role !== "student")
      return res.status(404).json({ message: "Student not found" });

    if (user.avatar && fs.existsSync(user.avatar)) {
      fs.unlinkSync(user.avatar);
    }

    await user.deleteOne();

    res.json({ message: "Student deleted", id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateUserProfile = async (req, res) => {
  try {
    // User ID comes from the isAuth middleware
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Handle Avatar Upload (Delete old one to save space)
    if (req.file) {
      if (user.avatar && fs.existsSync(user.avatar)) {
        try {
          fs.unlinkSync(user.avatar);
        } catch (err) {
          console.error("Failed to delete old avatar:", err);
        }
      }
      user.avatar = req.file.path; // Save new path
    }

    // 2. Update Basic Fields (Allow CamelCase or lowercase inputs)
    user.firstname = req.body.firstName || req.body.firstname || user.firstname;
    user.lastname = req.body.lastName || req.body.lastname || user.lastname;
    user.phoneNumber = req.body.phoneNumber || req.body.phone || user.phoneNumber;

    // 3. Handle Password Update (Securely)
    if (req.body.password && req.body.password.trim() !== "") {
      if (req.body.password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const hashPassword = await bcrypt.hash(req.body.password, 10);
      user.password = hashPassword;
    }

    await user.save();

    // 4. Return updated user without password
    const { password: _, ...updatedUser } = user.toObject();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
