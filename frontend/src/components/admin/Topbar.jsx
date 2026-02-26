import React from "react";
import { 
  Menu, 
  Search, 
  Bell, 
  LayoutDashboard 
} from "lucide-react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { getImageUrl, handleImageError } from "../../utils/imageHelper";

const Topbar = ({ setMobileOpen, adminProfile, avatarUrl }) => {
  const location = useLocation();
  
  // Map paths to titles
  const getPageTitle = (pathname) => {
    if (pathname === "/admin") return "Main Dashboard";
    if (pathname.includes("/tests") || pathname.includes("/categories")) return "Exam Manager";
    if (pathname.includes("/users")) return "User Management";
    if (pathname.includes("/payments") || pathname.includes("/payment-settings")) return "Payment Hub";
    if (pathname.includes("/profile")) return "Account Settings";
    if (pathname.includes("/doubts")) return "Doubt Management";
    return "Admin Management";
  };

  return (
    <header className="h-[70px] bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3">
        <button 
          className="lg:hidden p-2 rounded-none hover:bg-slate-100 transition-colors" 
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} className="text-slate-600" />
        </button>
        <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">{getPageTitle(location.pathname)}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="hidden md:flex items-center bg-slate-50 px-4 py-2 rounded-none border border-slate-200/50 group focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5654F7]/10 transition-all">
          <Search size={14} className="text-slate-400 group-focus-within:text-[#5654F7] transition-colors" />
          <input 
            className="ml-3 bg-transparent outline-none text-xs text-slate-600 w-48 lg:w-64 placeholder:text-slate-400 font-medium" 
            placeholder="Search everything..." 
          />
        </div>
        
        <div className="relative cursor-pointer hover:scale-110 transition-transform active:scale-90">
            <Bell className="text-slate-400 hover:text-[#5654F7] transition-colors" size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-bold text-slate-700 leading-none">
                {adminProfile?.firstname || "Admin"}
            </p>
          </div>
          <img 
            src={getImageUrl(avatarUrl)} 
            alt="Admin"
            onError={handleImageError}
            className="w-8 h-8 rounded-none object-cover border border-slate-100 shadow-sm ring-2 ring-white hover:ring-indigo-100 transition-all"
          />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
