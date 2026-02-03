// frontend/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, role }) => {
  
  // ❌ DELETED: const token = localStorage.getItem("token"); 
  // We rely on the Browser Cookie + Backend 'isAuth' middleware instead.

  // Optional: Get user from Redux to check role (if data is loaded)
  // Adjust 'state.students' if your user data is stored elsewhere
  const { studentProfile } = useSelector((state) => state.students || {});
  
  // If you want to enforce roles (e.g., only "student" can access),
  // make sure studentProfile is actually loaded before redirecting.
  // For now, we allow access and let the backend reject the request if unauthorized.
  
  if (role && studentProfile && studentProfile.role !== role) {
     return <Navigate to="/student-dashboard" replace />;
  }

  // ✅ Allow access (The backend will return 401 if the cookie is missing)
  return children;
};

export default ProtectedRoute;