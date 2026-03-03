import React, { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import InstitutionSidebar from "../../components/institution/InstitutionSidebar";

const InstitutionDashboard = () => {
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <InstitutionSidebar />
      <main ref={mainRef} className="flex-1 overflow-y-auto w-full focus:outline-none scroll-smooth">
        <div className="mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default InstitutionDashboard;
