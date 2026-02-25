import React, { useState, useMemo, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { setUserData } from "../../redux/userSlice";
import { fetchInstructorProfile } from "../../redux/instructorSlice";
import { motion, AnimatePresence } from "framer-motion";

import {
  Home,
  Users,
  Settings,
  LogOut,
  MessageSquare,
  GraduationCap,
  LayoutGrid,
  Menu,
  X
} from "lucide-react";

const MENU = [
  { label: "Dashboard", icon: LayoutGrid, path: "/instructor-dashboard" },
  { label: "Doubts", icon: MessageSquare, path: "/instructor-dashboard/doubts" },
  { label: "Students", icon: Users, path: "/instructor-dashboard/students" },
  { label: "Profile Settings", icon: Settings, path: "/instructor-dashboard/profile" },
];

const InstructorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { instructorProfile } = useSelector((state) => state.instructors || {});
  const [isHovering, setIsHovering] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);

  useEffect(() => {
    if (!instructorProfile) dispatch(fetchInstructorProfile());
  }, [dispatch, instructorProfile]);

  const expandedSidebar = isPinned || isHovering;

  const handleEnter = () => {
    clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(() => setIsHovering(true), 150);
  };

  const handleLeave = () => {
    if (isPinned) return;
    clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setIsHovering(false), 200);
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    setIsLoggingOut(true);
    try {
      await api.get("/api/auth/logout");
      dispatch(setUserData(null));
      localStorage.clear();
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (error) {
      toast.error("Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const SidebarContent = (
    <motion.div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      animate={{ width: expandedSidebar ? 280 : 88 }}
      transition={{ type: "spring", stiffness: 140, damping: 20, mass: 0.8 }}
      className="relative h-full bg-white border-r border-slate-200 flex flex-col z-[100]"
    >
      {/* BRAND SECTION */}
      <div className="px-6 py-8 flex items-center gap-4">
        <div 
            onClick={() => setIsPinned(!isPinned)}
            className="shrink-0 w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg cursor-pointer hover:rotate-6 transition-transform"
        >
            <GraduationCap size={24} strokeWidth={2.5} />
        </div>
        <AnimatePresence>
            {expandedSidebar && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="overflow-hidden whitespace-nowrap"
                >
                    <h2 className="text-xl font-black text-slate-800 tracking-tighter italic">Mye3</h2>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] leading-none mt-0.5">Instructor Portal</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* NAVIGATION */}
      <nav className="px-3 space-y-1 flex-grow overflow-y-auto custom-scrollbar">
        {MENU.map((m, i) => {
          const Icon = m.icon;
          const isActive = location.pathname === m.path;

          return (
            <div key={i} className="mb-1">
              <div
                onClick={() => {
                  navigate(m.path);
                  setIsMobileOpen(false);
                }}
                className={`
                    relative flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group transition-all
                    ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}
                `}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-pill-instructor"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 bg-indigo-600 rounded-r-full shadow-sm" 
                  />
                )}
                
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 relative z-10" />
                
                <AnimatePresence>
                    {expandedSidebar && (
                        <motion.span 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            className="text-[14px] font-bold whitespace-nowrap overflow-hidden"
                        >
                            {m.label}
                        </motion.span>
                    )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
                flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group w-full
                ${expandedSidebar ? "bg-rose-50 text-rose-600 shadow-sm border border-rose-100" : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"}
            `}
        >
            <LogOut size={20} className="shrink-0" />
            {expandedSidebar && (
                <span className="text-[13px] font-bold whitespace-nowrap">
                    {isLoggingOut ? "Signing out..." : "Secure Logout"}
                </span>
            )}
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 w-full p-4 bg-white/95 backdrop-blur-md z-50 flex justify-between items-center shadow-sm border-b border-slate-100">
        <h1 className="text-xl font-black text-indigo-600 italic">Mye3</h1>
        <Menu
          className="text-slate-600 cursor-pointer"
          onClick={() => setIsMobileOpen(true)}
        />
      </div>

      <div className="hidden md:block h-screen sticky top-0">{SidebarContent}</div>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 h-screen z-[160] md:hidden w-[280px]"
            >
              <div className="h-full bg-white relative">
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 z-[170]"
                >
                  <X size={20} />
                </button>
                {SidebarContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstructorSidebar;
