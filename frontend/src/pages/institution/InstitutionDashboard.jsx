import React from "react";
import { Outlet } from "react-router-dom";
import InstitutionSidebar from "../../components/institution/InstitutionSidebar";

const InstitutionDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <InstitutionSidebar />
      <main className="flex-1 overflow-y-auto w-full focus:outline-none scroll-smooth">
        <div className="mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default InstitutionDashboard;
