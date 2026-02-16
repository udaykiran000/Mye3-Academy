import genToken from "../../config/token.js";
import User from "../../models/Usermodel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import sendEmail from "../../utils/sendEmail.js";
import Order from "../../models/Order.js";
import fs from "fs";

export const getAllInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: "instructor" })
      .select("-password")
      .sort({ createdAt: -1 });
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
      }),
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("Get All Students Error:", err); // Log the actual error to your terminal
    res.status(500).json({ error: "Server error" });
  }
};

export const addInstructor = async (req, res) => {
  try {
    // ⭐ FIX: Read 'firstName' and 'lastName' (CamelCase from React)
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    let existUser = await User.findOne({ email });
    if (existUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
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
      role: "instructor",
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
      instructor: instructorData,
    });
  } catch (error) {
    console.error("Add Instructor Error:", error);
    return res.status(500).json({ message: `Server Error: ${error.message}` });
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
      instructor: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleInstructorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor = await User.findById(id);
    if (!instructor)
      return res.status(404).json({ message: "Instructor not found" });
    instructor.isActive = !instructor.isActive;
    await instructor.save();
    const { password: _, ...instructorData } = instructor.toObject();
    res
      .status(200)
      .json({ message: "Status updated", instructor: instructorData });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
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

export const addStudent = async (req, res) => {
  try {
    // ⭐ FIX: Read 'firstName' and 'lastName'
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    let existUser = await User.findOne({ email });
    if (existUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
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
      role: "student",
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
      student: studentData,
    });
  } catch (error) {
    console.error("Add Student Error:", error);
    return res.status(500).json({ message: `Server Error: ${error.message}` });
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
