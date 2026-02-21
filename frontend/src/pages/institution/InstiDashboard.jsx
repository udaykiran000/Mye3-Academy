import React from "react";
import { Outlet } from "react-router-dom";
import InstiSidebar from "../../components/institution/InstiSidebar";

export default function InstiDashboard() {
  return (
    <div className="min-h-screen flex bg-[#a332ff]">
      {/* SIDEBAR */}
      <InstiSidebar />

      {/* RIGHT CONTENT */}
      <main className="flex-1 bg-[#a332ff] md:ml-72 pt-20 md:pt-6 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
