import express from "express";
import multer from "multer";
import { 
    addStudent, 
    addInstructor, 
    getAllStudents, 
    getAllInstructors,
    toggleInstructorStatus,
    updateInstructor,
    deleteInstructor,

    // ✅ NEW
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    getme,
    updateUserProfile
} from "../controllers/UserConrollers.js";
import { isAuth } from "../middleware/isAuth.js";
import { uploadImage } from "../middleware/upload.js";

const adminUserRoutes = express.Router();
const upload = multer({ dest: "uploads/" });


adminUserRoutes.get("/profile", isAuth, getme);

// 2. PUT: Instructor updates their own profile
// ✅ This uses 'uploadImage', so it must be imported above
adminUserRoutes.put(
  "/profile", 
  isAuth, 
  uploadImage.single("avatar"), 
  updateUserProfile
);

// CREATE
adminUserRoutes.post("/add/instructors", upload.single("photo"), addInstructor);
adminUserRoutes.post("/add/students", upload.single("photo"), addStudent);

// READ
adminUserRoutes.get("/instructors", getAllInstructors);
adminUserRoutes.get("/students", getAllStudents);

// UPDATE
adminUserRoutes.put("/instructors/:id", upload.single("photo"), updateInstructor);
adminUserRoutes.put("/students/:id", upload.single("photo"), updateStudent);

// TOGGLE ACTIVE/INACTIVE
adminUserRoutes.put("/instructors/:id/toggle-status", toggleInstructorStatus);
adminUserRoutes.put("/students/:id/toggle-status", toggleStudentStatus);

// DELETE
adminUserRoutes.delete("/instructors/:id", deleteInstructor);
adminUserRoutes.delete("/students/:id", deleteStudent);

export default adminUserRoutes;
