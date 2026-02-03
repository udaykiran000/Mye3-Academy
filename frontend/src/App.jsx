import React from "react";
import { ToastContainer } from "react-toastify";
import ScrollToTop from "./components/ScrollToTop";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ForgetPassword from "./pages/ForgetPassword";

import AdminLayout from "./components/admin/AdminLayout";
import DashboardPage from "./components/admin/DashboardPage";
import ManageInstructors from "./components/admin/ManageInstructors";
import ManageStudents from "./components/admin/ManageStudents";
import ManageMocktests from "./components/admin/ManageMocktests";

import CategoryPage from "./components/admin/CategoryPage";
import CreateMocktestPage from "./components/admin/CreateMocktestPage";
import FormMocktest from "./components/admin/FormMocktest";
import AdminQuestions from "./components/admin/AdminQuestions";
import SelectCategoryForCreation from "./components/admin/SelectCategoryForCreation";

import WriteMocktest from "./pages/student/WriteMocktest";
import InstructionsPage from "./pages/student/InstructionsPage";
import StuDashboard from "./pages/student/StuDashboard";

import AllMockTests from "./pages/AllMockTests";
import MockTestDetail from "./pages/MockTestDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AddInstructor from "./components/admin/AddInstructor";

import { Toaster } from "react-hot-toast";
import AddStudent from "./components/admin/AddStudent";
import PaymentManagement from "./components/admin/PaymentManagement"; // History Page
import PaymentGatewaySettings from "./pages/admin/PaymentGatewaySettings"; // ✅ NEW SETTINGS PAGE

import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import AdminProfileSettings from "./components/admin/AdminProfileSettings";
import ReviewSolutions from './pages/student/ReviewSolutions';
import ProtectedRoute from "./components/student/ProtectedRoute";
import StudentDoubts from "./pages/student/StudentDoubts";
import AdminDoubts from "./pages/admin/AdminDoubts";
import InstructorDoubts from "./pages/instructor/InstructorDoubts";


// ------------------------- MAIN LAYOUT -------------------------

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

// ------------------------- MAIN APP -------------------------

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
              ) : userData.purchasedTests?.length > 0 ? (
                <Navigate to="/student-dashboard" replace />
              ) : (
                <Navigate to="/mocktests" replace />
              )
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
          {/* ---------------- STUDENT ROUTES ---------------- */}
          <Route
            path="/student/instructions/:mocktestId"
            element={userData ? <InstructionsPage /> : <Navigate to="/login" replace />}
          />
          <Route path="/student/doubts" element={<StudentDoubts />} />


          <Route
            path="/student/write-test/:attemptId"
            element={userData ? <WriteMocktest /> : <Navigate to="/login" replace />}
          />

          <Route path="/mocktests" element={<AllMockTests />} />
          <Route path="/mocktests/:id" element={<MockTestDetail />} />

          <Route path="/cart" element={<Cart />} />

          <Route
            path="/checkout"
            element={userData ? <Checkout /> : <Navigate to="/login" replace />}
          />
          

          {/* ---------------- STUDENT DASHBOARD ---------------- */}
          <Route
            path="/student-dashboard"
            element={
              userData?.role === "student" ? (
                userData.purchasedTests?.length > 0 ? (
                  <StuDashboard />
                ) : (
                  <Navigate to="/mocktests" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* ---------------- INSTRUCTOR DASHBOARD ---------------- */}
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

          {/* ---------------- ADMIN ROUTES ---------------- */}
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
            {/* ADMIN HOME */}
            <Route index element={<DashboardPage />} />

            {/* USERS SECTION */}
            <Route path="users">
              <Route path="instructors/manage" element={<ManageInstructors />} />
              <Route path="instructors/add" element={<AddInstructor />} />
              <Route path="instructors/edit/:id" element={<AddInstructor/>} />

              <Route path="students/manage" element={<ManageStudents />} />
              <Route path="students/edit/:id" element={<AddStudent/>}/>
              <Route path="students/add" element={<AddStudent />} />
            </Route>

            {/* ✅ UPDATED PAYMENT ROUTES */}
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="payment-settings" element={<PaymentGatewaySettings />} /> 
            
            <Route path="doubts" element={<AdminDoubts />} />

            {/* CATEGORIES */}
            <Route path="categories" element={<CategoryPage />} />

            {/* TESTS SECTION */}
            <Route path="tests">
              <Route path="manage-tests" element={<ManageMocktests />} />
              <Route path="add-new-test" element={<SelectCategoryForCreation />} />
            </Route>
            <Route path="profile" element={<AdminProfileSettings />} />

            {/* LEGACY MOCKTEST ROUTES */}
            <Route path="mocktests" element={<ManageMocktests />} />
            <Route path="mocktests/:category" element={<CategoryPage />} />
            <Route path="mocktests/:category/new" element={<CreateMocktestPage />} />
            <Route path="mocktests/:category/edit/:id" element={<FormMocktest />} />
            <Route path="mocktests/:id/questions" element={<AdminQuestions />} />
          </Route>

          {/* ---------------- FALLBACK ---------------- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </>
  );
};

export default App;