import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    // **1. CRITICAL CONTAINER:** Full viewport height, no external scroll
    <div className="flex h-screen overflow-hidden"> 
      
      {/* 2. Sidebar component */}
      <Sidebar />

      {/* 3. Main Content: 
           - flex-1: Takes up remaining width.
           - md:ml-64: Pushes content right, assuming Sidebar is 64 units wide.
           - overflow-y-auto: Makes THIS section scrollable.
      */}
      <main className="flex-1 w-full bg-gray-100 p-6 md:ml-80 overflow-y-auto"> {/* <--- CHANGED FROM md:ml-64 to md:ml-80 */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminLayout;