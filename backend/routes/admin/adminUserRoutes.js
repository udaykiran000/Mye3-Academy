import express from "express";
const adminUserRoutes = express.Router();

// Middlewares
import { isAuth, isAdmin } from "../../middleware/isAuth.js";
import { upload } from "../../middleware/upload.js"; 

// Controllers - Admin Management
import { 
    addStudent, 
    addInstructor, 
    getAllStudents, 
    getAllInstructors,
    toggleInstructorStatus,
    updateInstructor,
    deleteInstructor,
    updateStudent,
    deleteStudent,
    toggleStudentStatus 
} from "../../controllers/admin/adminUserController.js";

// Controllers - Profile Management
import { getme, updateUserProfile } from "../../controllers/common/authController.js";

/* ============================================================
   ADMIN USER MANAGEMENT ROUTES
   ============================================================ */

// 1. Profile routes for the logged-in user
adminUserRoutes.get("/profile", isAuth, getme);

// 2. Update own profile with avatar
// FIX: Changed 'uploadImage' to 'upload' to match the middleware export
adminUserRoutes.put(
  "/profile", 
  isAuth, 
  upload.single("avatar"), 
  updateUserProfile
);

// 3. Admin: Create Students and Instructors
adminUserRoutes.post("/add/instructors", isAuth, isAdmin, upload.single("photo"), addInstructor);
adminUserRoutes.post("/add/students", isAuth, isAdmin, upload.single("photo"), addStudent);

// 4. Admin: View User Lists
adminUserRoutes.get("/instructors", isAuth, isAdmin, getAllInstructors);
adminUserRoutes.get("/students", isAuth, isAdmin, getAllStudents);

// 5. Admin: Update Existing Users
adminUserRoutes.put("/instructors/:id", isAuth, isAdmin, upload.single("photo"), updateInstructor);
adminUserRoutes.put("/students/:id", isAuth, isAdmin, upload.single("photo"), updateStudent);

// 6. Admin: Toggle Account Status (Active/Inactive)
adminUserRoutes.put("/instructors/:id/toggle-status", isAuth, isAdmin, toggleInstructorStatus);
adminUserRoutes.put("/students/:id/toggle-status", isAuth, isAdmin, toggleStudentStatus);

// 7. Admin: Delete User Accounts
adminUserRoutes.delete("/instructors/:id", isAuth, isAdmin, deleteInstructor);
adminUserRoutes.delete("/students/:id", isAuth, isAdmin, deleteStudent);

export default adminUserRoutes;