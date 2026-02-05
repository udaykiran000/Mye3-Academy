import React from "react";
import { ToastContainer } from "react-toastify";
import ScrollToTop from "./components/ScrollToTop";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// PUBLIC PAGES
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ForgetPassword from "./pages/ForgetPassword";

// ADMIN COMPONENTS
import AdminLayout from "./components/admin/AdminLayout";
import DashboardPage from "./components/admin/DashboardPage";
import ManageInstructors from "./components/admin/instructors/ManageInstructors";
import ManageStudents from "./components/admin/students/ManageStudents";
import ManageMocktests from "./components/admin/mocktest/ManageMocktests";
import FormMocktest from "./components/admin/mocktest/FormMocktest";
import AdminQuestions from "./components/admin/AdminQuestions";
import SelectCategoryForCreation from "./components/admin/category/SelectCategoryForCreation";
import CategoryMockTests from "./components/admin/category/CategoryMockTests.jsx";
import AddInstructor from "./components/admin/instructors/AddInstructor";
import AddStudent from "./components/admin/students/AddStudent";
import PaymentManagement from "./components/admin/PaymentManagement";
import AdminProfileSettings from "./components/admin/AdminProfileSettings";
import AdminDoubts from "./pages/admin/AdminDoubts";
import PaymentGatewaySettings from "./pages/admin/PaymentGatewaySettings";

// STUDENT PAGES
import WriteMocktest from "./pages/student/WriteMocktest";
import InstructionsPage from "./pages/student/InstructionsPage";
import StuDashboard from "./pages/student/StuDashboard";
import AllMockTests from "./pages/AllMockTests";
import MockTestDetail from "./pages/MockTestDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ReviewSolutions from "./pages/student/ReviewSolutions";
import StudentDoubts from "./pages/student/StudentDoubts";

// INSTRUCTOR PAGES
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorDoubts from "./pages/instructor/InstructorDoubts";

// PROTECTED ROUTE
import ProtectedRoute from "./components/student/ProtectedRoute";
import { Toaster } from "react-hot-toast";

// ------------------------- MAIN LAYOUT COMPONENT -------------------------
const MainLayout = ({ children }) => {
  const location = useLocation();

  const hideLayout =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/student-dashboard") ||
    location.pathname.startsWith("/instructor-dashboard") ||
    location.pathname.startsWith("/student/write-test") ||
    location.pathname.startsWith("/student/review") ||
    location.pathname.startsWith("/student/instructions") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {!hideLayout && <Navbar />}
      <main className="min-h-[80vh]">{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
};

// ------------------------- MAIN APP COMPONENT -------------------------
const App = () => {
  const { userData } = useSelector((state) => state.user);

  return (
    <>
      <ToastContainer />
      <ScrollToTop />

      <MainLayout>
        <Routes>
          {/* ---------------- PUBLIC ROUTES ---------------- */}
          <Route path="/" element={<Home />} />
          <Route
            path="/signup"
            element={!userData ? <Signup /> : <Navigate to="/" replace />}
          />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route
            path="/login"
            element={
              !userData ? (
                <Login />
              ) : userData.role === "admin" ? (
                <Navigate to="/admin" replace />
              ) : userData.role === "instructor" ? (
                <Navigate to="/instructor-dashboard" replace />
              ) : (
                <Navigate to="/mocktests" replace />
              )
            }
          />

          {/* ---------------- STUDENT ROUTES ---------------- */}
          <Route path="/mocktests" element={<AllMockTests />} />
          <Route path="/mocktests/:id" element={<MockTestDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={userData ? <Checkout /> : <Navigate to="/login" replace />}
          />
          <Route path="/student/doubts" element={<StudentDoubts />} />
          <Route
            path="/student/instructions/:mocktestId"
            element={
              userData ? <InstructionsPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/student/write-test/:attemptId"
            element={
              userData ? <WriteMocktest /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/student/review/:attemptId"
            element={
              <ProtectedRoute>
                <ReviewSolutions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              userData?.role === "student" ? (
                <StuDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* ---------------- INSTRUCTOR ROUTES ---------------- */}
          <Route
            path="/instructor-dashboard"
            element={
              userData?.role === "instructor" ? (
                <InstructorDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/instructor/doubts" element={<InstructorDoubts />} />

          {/* ---------------- ADMIN ROUTES (Holistic & Clean) ---------------- */}
          <Route
            path="/admin"
            element={
              userData?.role === "admin" ? (
                <AdminLayout />
              ) : (
                <Navigate to="/" replace />
              )
            }
          >
            {/* Admin Home Dashboard */}
            <Route index element={<DashboardPage />} />

            {/* User Management */}
            <Route path="users">
              <Route
                path="instructors/manage"
                element={<ManageInstructors />}
              />
              <Route path="instructors/add" element={<AddInstructor />} />
              <Route path="instructors/edit/:id" element={<AddInstructor />} />
              <Route path="students/manage" element={<ManageStudents />} />
              <Route path="students/add" element={<AddStudent />} />
              <Route path="students/edit/:id" element={<AddStudent />} />
            </Route>

            {/* Finance & Support */}
            <Route path="payments" element={<PaymentManagement />} />
            <Route
              path="payment-settings"
              element={<PaymentGatewaySettings />}
            />
            <Route path="doubts" element={<AdminDoubts />} />
            <Route path="profile" element={<AdminProfileSettings />} />

            {/* Categories Management (Directory of all exam types) */}
            <Route path="categories" element={<SelectCategoryForCreation />} />

            {/* Test Management Section */}
            <Route path="tests">
              <Route path="manage-tests" element={<ManageMocktests />} />
              <Route
                path="add-new-test"
                element={<SelectCategoryForCreation />}
              />
            </Route>

            {/* Mocktest Core Routing System (Handles New and Edit via FormMocktest) */}
            <Route path="mocktests" element={<ManageMocktests />} />
            <Route path="mocktests/:category" element={<CategoryMockTests />} />

            {/* CREATE MODE: category provided, no ID */}
            <Route path="mocktests/:category/new" element={<FormMocktest />} />

            {/* EDIT MODE: category and ID provided */}
            <Route
              path="mocktests/:category/edit/:id"
              element={<FormMocktest />}
            />

            {/* Question Builder for specific mocktest */}
            <Route
              path="mocktests/:id/questions"
              element={<AdminQuestions />}
            />
          </Route>

          {/* ---------------- FALLBACK ---------------- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </>
  );
};

export default App;
