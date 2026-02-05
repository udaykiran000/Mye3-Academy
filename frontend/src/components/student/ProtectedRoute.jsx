// frontend/src/components/student/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, role }) => {
  // LOGIC CONNECTIVITY FIX: Always check Auth state (userData)
  const { userData, loading } = useSelector((state) => state.user);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Verifying credentials...
      </div>
    );
  }

  // No user? Go to Login
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // Role Mismatch? Back to dashboard or home
  if (role && userData.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
