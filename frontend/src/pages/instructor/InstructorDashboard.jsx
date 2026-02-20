import React from "react";
import { Outlet } from "react-router-dom";
import InstructorSidebar from "../../components/instructors/InstructorSidebar";

export default function InstructorDashboard() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* SIDEBAR */}
      <InstructorSidebar />

      {/* RIGHT CONTENT */}
      <main className="flex-1 bg-gray-300 md:ml-72 pt-20 md:pt-6 px-6">
        <Outlet />
      </main>
    </div>
  );
}
