import React, { useState, useEffect } from "react";
import {
  BookOpen,
  TrendingUp,
  BarChart2,
  Settings,
  LogOut,
  Search,
  Menu,
  MessageCircle
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchStudentProfile } from "../../redux/studentSlice";
import { setUserData } from "../../redux/userSlice";
import api from "../../api/axios";
import toast from "react-hot-toast";

import SidebarLink from "./SidebarLink";

const StuSidebar = ({ activeTab, setActiveTab }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { studentProfile } = useSelector((state) => state.students);

  useEffect(() => {
    if (!studentProfile) {
      dispatch(fetchStudentProfile());
    }
  }, [dispatch, studentProfile]);

  // Reset error when avatar changes
  useEffect(() => {
    setImgError(false);
  }, [studentProfile?.avatar]);

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    setLoading(true);
    try {
      await api.get("/api/auth/logout");
      dispatch(setUserData(null));
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("persist:root");
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      dispatch(setUserData(null));
      localStorage.clear();
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = () => {
    if (studentProfile?.avatar && !imgError) {
      const avatarUrl = `http://localhost:8000/${studentProfile.avatar.replace(/\\/g, "/")}`;
      return (
        <img
          src={avatarUrl}
          className="w-20 h-20 rounded-full object-cover border-4 border-gray-800 shadow-xl group-hover:border-blue-600 transition-colors duration-300"
          alt="Student Profile"
          onError={() => setImgError(true)}
        />
      );
    }

    const firstLetter = studentProfile?.firstname
      ? studentProfile.firstname.charAt(0).toUpperCase()
      : "S";

    return (
      <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center border-4 border-gray-800 shadow-xl group-hover:border-blue-500 transition-colors duration-300">
        <span className="text-3xl font-bold text-white">{firstLetter}</span>
      </div>
    );
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 w-full p-4 bg-gray-900/95 backdrop-blur-md z-50 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold text-white">Student Dashboard</h1>
        <Menu
          className="text-white text-3xl cursor-pointer"
          onClick={() => setOpen(true)}
        />
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <aside
        className={`bg-gray-900/95 backdrop-blur-lg shadow-2xl shadow-gray-900/50 
          fixed top-0 left-0 h-screen w-80 z-50 
          flex flex-col 
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 
        `}
      >
        <div className="flex flex-col items-center py-8 border-b border-gray-800 mt-14 md:mt-0">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab("settings")}>
            {renderAvatar()}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="text-white w-6 h-6" />
            </div>
          </div>

          <h4 className="text-white font-bold mt-4 text-lg tracking-wide text-center px-4 capitalize">
            {studentProfile?.firstname
              ? `${studentProfile.firstname} ${studentProfile.lastname}`
              : "Loading..."}
          </h4>

          <span className="bg-blue-900/50 text-blue-300 text-xs font-medium px-3 py-1 rounded-full mt-2 border border-blue-800/50">
            Student Account
          </span>
        </div>

        <nav className="mt-6 flex-grow overflow-y-auto px-4 space-y-2 scrollbar-hidden">
          <SidebarLink
            icon={<BarChart2 size={20} />}
            label="Overview"
            isActive={activeTab === "overview"}
            onClick={() => {
              setActiveTab("overview");
              setOpen(false);
            }}
          />

          <SidebarLink
            icon={<BookOpen size={20} />}
            label="My Mocktests"
            isActive={activeTab === "my-tests"}
            onClick={() => {
              setActiveTab("my-tests");
              setOpen(false);
            }}
          />

          <SidebarLink
            icon={<Search size={20} />}
            label="Explore Tests"
            isActive={activeTab === "explore"}
            onClick={() => {
              setActiveTab("explore");
              setOpen(false);
            }}
          />

          <SidebarLink
            icon={<TrendingUp size={20} />}
            label="My Performance"
            isActive={activeTab === "performance"}
            onClick={() => {
              setActiveTab("performance");
              setOpen(false);
            }}
          />

          <SidebarLink
            icon={<MessageCircle size={20} />}
            label="My Doubts"
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

        <div className="p-4 border-t border-gray-800 mt-auto">
          <button
            onClick={handleLogout}
            disabled={loading}
            className={`w-full bg-red-700/30 hover:bg-red-700/50 text-red-300 py-3 rounded-lg flex items-center gap-3 justify-center font-medium transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
};

export default StuSidebar;