import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  MessageSquare,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchInstructorProfile } from "../../redux/instructorSlice";
import { setUserData } from "../../redux/userSlice";
import api from "../../api/axios";
import toast from "react-hot-toast";

import SidebarLink from "../student/SidebarLink";

const InstructorSidebar = ({ activeTab, setActiveTab }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { instructorProfile } = useSelector((state) => state.instructors);

  useEffect(() => {
    if (!instructorProfile) {
      dispatch(fetchInstructorProfile());
    }
  }, [dispatch, instructorProfile]);

  /* --------------------------------------------------
     LOGOUT HANDLER (Same logic as Student Dashboard)
  --------------------------------------------------- */
  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    setLoading(true);
    try {
      await api.get("/api/auth/logout");

      dispatch(setUserData(null));
      localStorage.clear();

      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (err) {
      dispatch(setUserData(null));
      localStorage.clear();
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
     AVATAR LOGIC
  --------------------------------------------------- */
  const getAvatarUrl = () => {
    if (instructorProfile?.avatar) {
      return `import.meta.env.VITE_SERVER_URL/${instructorProfile.avatar.replace(/\\/g, "/")}`;
    }

    const firstname = instructorProfile?.firstname || "I";
    const lastname = instructorProfile?.lastname || "";

    return `https://ui-avatars.com/api/?name=${firstname}+${lastname}&background=1C3C6B&color=fff`;
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 w-full p-4 bg-gray-900/95 backdrop-blur-md z-50 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold text-white">Instructor Panel</h1>

        <Menu
          className="text-white text-3xl cursor-pointer"
          onClick={() => setOpen(true)}
        />
      </div>

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`bg-gray-900/95 backdrop-blur-lg shadow-2xl shadow-black/50
          fixed top-0 left-0 h-screen w-72 z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* PROFILE SECTION */}
        <div className="flex flex-col items-center py-8 border-b border-gray-800 mt-14 md:mt-0">
          <div
            className="relative cursor-pointer flex items-center justify-center w-20 h-20 rounded-full bg-blue-700 text-white text-3xl font-bold border-4 border-gray-800 shadow-xl"
            onClick={() => setActiveTab("settings")}
          >
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()}
                className="w-full h-full rounded-full object-cover"
                alt="Instructor Profile"
              />
            ) : (
              (instructorProfile?.firstname?.charAt(0) || "I").toUpperCase()
            )}
          </div>

          <h4 className="text-white font-bold mt-4 text-lg tracking-wide capitalize text-center px-4">
            {instructorProfile?.firstname
              ? `${instructorProfile.firstname} ${instructorProfile.lastname}`
              : "Loading..."}
          </h4>

          <span className="bg-purple-900/40 text-purple-300 text-xs font-medium px-3 py-1 rounded-full mt-2 border border-purple-700/40">
            Instructor Account
          </span>
        </div>

        {/* NAVIGATION */}
        <nav className="mt-6 flex-grow overflow-y-auto px-4 space-y-2 scrollbar-hidden">
          <SidebarLink
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isActive={activeTab === "dashboard"}
            onClick={() => {
              setActiveTab("dashboard");
              setOpen(false);
            }}
          />

          <SidebarLink
            icon={<MessageSquare size={20} />}
            label="Doubts"
            isActive={activeTab === "doubts"}
            onClick={() => {
              setActiveTab("doubts");
              setOpen(false);
            }}
          />

          <SidebarLink
            icon={<Settings size={20} />}
            label="Profile Settings"
            isActive={activeTab === "settings"}
            onClick={() => {
              setActiveTab("settings");
              setOpen(false);
            }}
          />
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            disabled={loading}
            className={`w-full bg-red-600/20 hover:bg-red-600/40 text-red-300 py-3 rounded-lg
              flex items-center gap-3 justify-center transition duration-200
              ${loading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <LogOut size={20} />
            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
};

export default InstructorSidebar;
