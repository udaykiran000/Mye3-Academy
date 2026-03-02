import React, { useState, useMemo, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProfile } from "../../redux/adminSlice";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getImageUrl } from "../../utils/imageHelper";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const { adminProfile } = useSelector((state) => state.admin || {});
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!adminProfile) {
      dispatch(fetchAdminProfile());
    }
  }, [dispatch, adminProfile]);

  // Scroll main content area to top on every route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);

  const avatarUrl = useMemo(() => {
    if (adminProfile?.avatar) return getImageUrl(adminProfile.avatar);
    return `https://ui-avatars.com/api/?name=${adminProfile?.firstname || "Admin"}+${adminProfile?.lastname || ""}&background=6366f1&color=fff&size=128&bold=true`;
  }, [adminProfile]);

  return (
    <div className="flex h-screen bg-[#EDF0FF] overflow-hidden font-sans"> 
      
      {/* V2 ANIMATED SIDEBAR */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* V2 TOPBAR */}
        <Topbar 
            setMobileOpen={setMobileOpen} 
            adminProfile={adminProfile}
            avatarUrl={avatarUrl}
        />

        {/* PAGE CONTENT */}
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative"> 
            {/* Dynamic decorative backgrounds */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5654F7]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#5654F7]/10 rounded-full blur-[140px] -ml-80 -mb-80 pointer-events-none"></div>
            
            <div className="relative z-10 p-2 lg:p-3 min-h-full">
                <Outlet /> 
            </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;