import React, { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import InstructorSidebar from "../../components/instructors/InstructorSidebar";

export default function InstructorDashboard() {
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* SIDEBAR */}
      <InstructorSidebar />

      {/* RIGHT CONTENT */}
      <main ref={mainRef} className="flex-1 bg-gray-50 pt-20 md:pt-6 px-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
