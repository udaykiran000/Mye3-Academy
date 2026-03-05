import React from "react";
import InstructorDashboardPage from "./pages/instructor/InstructorDashboardPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScrollToTop from "./components/ScrollToTop";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";

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

import AdminQuestions from "./components/admin/mocktest/AdminQuestions";
import SelectCategoryForCreation from "./components/admin/category/SelectCategoryForCreation";
import CategoryMockTests from "./components/admin/category/CategoryMockTests.jsx";
import AddInstructor from "./components/admin/instructors/AddInstructor";
import AddStudent from "./components/admin/students/AddStudent";
import PaymentManagement from "./components/admin/PaymentManagement";
import AdminProfileSettings from "./components/admin/AdminProfileSettings";
import AdminDoubts from "./pages/admin/AdminDoubts";
import PaymentGatewaySettings from "./pages/admin/PaymentGatewaySettings";
import ManageInstitutions from "./components/admin/institutions/ManageInstitutions";
import AddInstitution from "./components/admin/institutions/AddInstitution";

// STUDENT PAGES
import WriteMocktest from "./pages/student/WriteMocktest";
import InstructionsPage from "./pages/student/InstructionsPage";
import StuDashboard from "./pages/student/StuDashboard";
import AllMockTests from "./pages/AllMockTests";
import MockTestDetail from "./pages/MockTestDetail";
import ReviewSolutions from "./pages/student/ReviewSolutions";
import StudentDoubts from "./pages/student/StudentDoubts";
import TestAttemptsReport from "./pages/student/TestAttemptsReport";

// INSTRUCTOR PAGES
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorDoubts from "./pages/instructor/InstructorDoubts";
import InstructorProfileSettings from "./pages/instructor/InstructorProfileSettings";
import InstructorStudents from "./pages/instructor/InstructorStudents";

import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import InstitutionDashboardPage from "./pages/institution/InstitutionDashboardPage";
import InstitutionStudents from "./pages/institution/InstitutionStudents";
import InstitutionProfileSettings from "./pages/institution/InstitutionProfileSettings";

// PROTECTED ROUTE
import ProtectedRoute from "./components/student/ProtectedRoute";
import ViewModeToggle from "./components/common/ViewModeToggle";
import { Toaster } from "react-hot-toast";

// ------------------------- MAIN LAYOUT COMPONENT -------------------------
const MainLayout = ({ children }) => {
  const location = useLocation();

  const hideLayout =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/student-dashboard") ||
    location.pathname.startsWith("/instructor-dashboard") ||
    location.pathname.startsWith("/institution-dashboard") ||
    location.pathname.startsWith("/student/write-test") ||
    location.pathname.startsWith("/student/review") ||
    location.pathname.startsWith("/student/instructions") ||
    location.pathname.startsWith("/student/test-attempts") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {!hideLayout && <Navbar />}
      <main className="min-h-[80vh]">{children}</main>
      {!hideLayout && <Footer />}
      <ViewModeToggle />
    </>
  );
};

// ------------------------- MAIN APP COMPONENT -------------------------
const App = () => {
  const { userData } = useSelector((state) => state.user);
  const location = useLocation();

  return (
    <>
      <ToastContainer />
      <ScrollToTop />

      <MainLayout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
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
          <Route
            path="/mocktests"
            element={
              <ProtectedRoute>
                <AllMockTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-tests"
            element={
              <ProtectedRoute>
                <AllMockTests overrideType="mock" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grand-tests"
            element={
              <ProtectedRoute>
                <AllMockTests overrideType="grand" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mocktests/:id"
            element={
              <ProtectedRoute>
                <MockTestDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/doubts"
            element={
              <ProtectedRoute>
                <StudentDoubts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/instructions/:mocktestId"
            element={
              <ProtectedRoute>
                <InstructionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/write-test/:attemptId"
            element={
              <ProtectedRoute>
                <WriteMocktest />
              </ProtectedRoute>
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
            path="/student/test-attempts/:testId"
            element={
              <ProtectedRoute>
                <TestAttemptsReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              userData?.role === "student" || userData?.role === "admin" ? (
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
          >
            <Route index element={<InstructorDashboardPage />} />
            <Route path="doubts" element={<InstructorDoubts />} />
            <Route path="profile" element={<InstructorProfileSettings />} />
            <Route path="students" element={<InstructorStudents />} />
          </Route>

          {/* ---------------- INSTITUTION DASHBOARD ---------------- */}
          <Route
            path="/institution-dashboard"
            element={
              <ProtectedRoute role="institution">
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<InstitutionDashboardPage />} />
            <Route path="students" element={<InstitutionStudents />} />
            <Route path="profile" element={<InstitutionProfileSettings />} />
          </Route>

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
              <Route path="institutions/manage" element={<ManageInstitutions />} />
              <Route path="institutions/add" element={<AddInstitution />} />
              <Route path="institutions/edit/:id" element={<AddInstitution />} />
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

            {/* Unified Test Manager (Handles Configuration & Questions) */}
            <Route path="mocktests" element={<ManageMocktests />} />
            <Route path="mocktests/:category" element={<CategoryMockTests />} />

            {/* CREATE MODE: category provided, no ID */}
            <Route path="mocktests/:category/new" element={<AdminQuestions />} />

            {/* EDIT MODE: category and ID provided */}
            <Route
              path="mocktests/:category/edit/:id"
              element={<AdminQuestions />}
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
        </AnimatePresence>
      </MainLayout>
    </>
  );
};

export default App;
