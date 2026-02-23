import genToken from "../../config/token.js";
import User from "../../models/Usermodel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import sendEmail from "../../utils/sendEmail.js";
import Order from "../../models/Order.js";
import fs from "fs";
import Attempt from "../../models/Attempt.js";
import Doubt from "../../models/Doubt.js";

export const getAllInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: "instructor" })
      .select("-password")
      .sort({ createdAt: -1 });

    // Fetch doubt stats for each instructor
    const enrichedInstructors = await Promise.all(
      instructors.map(async (inst) => {
        const [total, pending, resolved] = await Promise.all([
          Doubt.countDocuments({ assignedInstructor: inst._id }),
          Doubt.countDocuments({ assignedInstructor: inst._id, status: { $in: ["assigned", "pending"] } }), // counts both as pending if assigned
          Doubt.countDocuments({ assignedInstructor: inst._id, status: "answered" }),
        ]);

        return {
          ...inst.toObject(),
          doubtStats: {
            total,
            pending,
            resolved,
          },
        };
      })
    );

    res.status(200).json(enrichedInstructors);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .populate("addedBy", "firstname lastname")
      .lean();

    const updated = await Promise.all(
      students.map(async (stu) => {
        const orderCount = await Order.countDocuments({
          user: stu._id,
          status: "successful",
        });

        const attemptCount = await Attempt.countDocuments({
          studentId: stu._id,
        });

        const doubtCount = await Doubt.countDocuments({
          student: stu._id,
        });

        return {
          ...stu,
          purchasedTestCount: orderCount,
          attemptCount: attemptCount,
          doubtCount: doubtCount,
        };
      }),
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("Get All Students Error:", err);
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
      isVerified: true, 
      avatar: avatarPath, 
      addedBy: req.user._id,
      registrationSource: req.user.role === "admin" ? "admin" : "institution",
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

export const getAllInstitutions = async (req, res) => {
  try {
    const institutions = await User.find({ role: "institution" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const updated = await Promise.all(
      institutions.map(async (inst) => {
        const studentCount = await User.countDocuments({
          addedBy: inst._id,
          role: "student",
        });

        return {
          ...inst,
          studentCount,
        };
      })
    );

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const addInstitution = async (req, res) => {
  try {
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
    const avatarPath = req.file ? req.file.path : "";

    const newInst = await User.create({
      firstname: firstName,
      lastname: lastName,
      email,
      password: hashPassword,
      phoneNumber: phone || "0000000000",
      role: "institution",
      isVerified: true,
      avatar: avatarPath,
    });

    try {
      const subject = "Welcome to InnoMakers - Institution Account Created";
      const text = `Hello ${firstName},\n\nYour institution account has been successfully created by the admin.\n\nHere are your Login Credentials:\n----------------------------\nEmail: ${email}\nPassword: ${password}\n----------------------------\n\nPlease login and change your password immediately for security purposes.\n\nBest Regards,\nInnoMakers Team`;
      await sendEmail(email, subject, text);
    } catch (emailError) {
      console.error("Failed to send credential email:", emailError);
    }

    const { password: _, ...instData } = newInst.toObject();

    return res.status(201).json({
      message: "Institution added successfully",
      institution: instData,
    });
  } catch (error) {
    return res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

export const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || user.role !== "institution")
      return res.status(404).json({ message: "Institution not found" });

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
    const { password, ...updatedUser } = user.toObject();

    return res.json({
      message: "Institution updated successfully",
      institution: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleInstitutionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const inst = await User.findById(id);
    if (!inst || inst.role !== "institution")
      return res.status(404).json({ message: "Institution not found" });
    inst.isActive = !inst.isActive;
    await inst.save();
    const { password: _, ...instData } = inst.toObject();
    res.status(200).json({ message: "Status updated", institution: instData });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || user.role !== "institution")
      return res.status(404).json({ message: "Institution not found" });

    if (user.avatar && fs.existsSync(user.avatar)) {
      fs.unlinkSync(user.avatar);
    }

    await user.deleteOne();
    res.json({ message: "Institution deleted", id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const downloadInstructorReport = async (req, res) => {
  try {
    const instructors = await User.find({ role: "instructor" })
      .select("-password")
      .lean();

    const data = instructors.map((inst) => ({
      "Instructor Name": `${inst.firstname} ${inst.lastname}`,
      Email: inst.email,
      Mobile: inst.phoneNumber,
      "Joined Date": new Date(inst.createdAt).toLocaleDateString(),
      Status: inst.isActive ? "Active" : "Blocked",
    }));

    if (data.length === 0) {
      return res.status(404).json({ message: "No instructors found to export" });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];
    for (const row of data) {
      const values = headers.map((header) => `"${row[header]}"`);
      csvRows.push(values.join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=Instructors_Report.csv");
    res.status(200).send(csvRows.join("\n"));
  } catch (error) {
    res.status(500).json({ message: "Failed to generate report" });
  }
};

export const downloadInstitutionReport = async (req, res) => {
  try {
    const institutions = await User.find({ role: "institution" })
      .select("-password")
      .lean();

    const data = await Promise.all(
      institutions.map(async (inst) => {
        const studentCount = await User.countDocuments({
          addedBy: inst._id,
          role: "student",
        });

        return {
          "Institution Name": `${inst.firstname} ${inst.lastname}`,
          Email: inst.email,
          Mobile: inst.phoneNumber,
          "Student Count": studentCount,
          "Joined Date": new Date(inst.createdAt).toLocaleDateString(),
          Status: inst.isActive ? "Active" : "Blocked",
        };
      })
    );

    if (data.length === 0) {
      return res.status(404).json({ message: "No institutions found to export" });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];
    for (const row of data) {
      const values = headers.map((header) => `"${row[header]}"`);
      csvRows.push(values.join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=Institutions_Report.csv");
    res.status(200).send(csvRows.join("\n"));
  } catch (error) {
    res.status(500).json({ message: "Failed to generate report" });
  }
};
export const downloadStudentReport = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .populate("addedBy", "firstname lastname")
      .lean();

    const data = await Promise.all(
      students.map(async (stu) => {
        const orderCount = await Order.countDocuments({
          user: stu._id,
          status: "successful",
        });
        const attemptCount = await Attempt.countDocuments({
          studentId: stu._id,
        });
        const doubtCount = await Doubt.countDocuments({
          student: stu._id,
        });

        const source = stu.registrationSource === "self" 
          ? "Self" 
          : stu.addedBy 
            ? `${stu.addedBy.firstname} ${stu.addedBy.lastname}` 
            : "Admin";

        return {
          "Student Name": `${stu.firstname} ${stu.lastname}`,
          Email: stu.email,
          Mobile: stu.phoneNumber,
          Source: source,
          "Purchased Tests": orderCount,
          "Attempted Tests": attemptCount,
          "Doubts Raised": doubtCount,
          "Joined Date": new Date(stu.createdAt).toLocaleDateString(),
          Status: stu.isActive ? "Active" : "Blocked",
        };
      })
    );

    if (data.length === 0) {
      return res.status(404).json({ message: "No students found to export" });
    }

    // Generate CSV
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        return `"${val}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Students_Report.csv"
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
};

export const getStudentActivity = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Purchased Tests
    const orders = await Order.find({ user: id, status: "successful" })
      .populate("items", "title")
      .lean();
    const purchasedTests = orders.flatMap(o => o.items.map(i => ({
      title: i.title,
      date: o.createdAt,
      orderId: o.razorpay?.order_id || "N/A"
    })));

    // 2. Attempts
    const attempts = await Attempt.find({ studentId: id })
      .populate("mocktestId", "title")
      .sort({ createdAt: -1 })
      .lean();

    // 3. Doubts
    const doubts = await Doubt.find({ student: id })
      .populate("assignedInstructor", "firstname lastname")
      .populate("mocktestId", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      purchasedTests,
      attempts,
      doubts
    });
  } catch (error) {
    console.error("Get Student Activity Error:", error);
    res.status(500).json({ message: "Failed to fetch student activity" });
  }
};
export const getInstructorDoubts = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch all doubts assigned to this instructor
    const doubts = await Doubt.find({ assignedInstructor: id })
      .populate("student", "firstname lastname email")
      .populate("mocktestId", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(doubts);
  } catch (error) {
    console.error("Get Instructor Doubts Error:", error);
    res.status(500).json({ message: "Failed to fetch instructor doubts" });
  }
};
