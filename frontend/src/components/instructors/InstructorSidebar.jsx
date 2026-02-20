import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { setUserData } from "../../redux/userSlice";
import { fetchInstructorProfile } from "../../redux/instructorSlice";

import {
  Home,
  Users,
  BarChart3,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  LogOut,
  Menu,
  Settings,
  X,
  MessageSquare,
} from "lucide-react";

/* ----------------------------------
 INSTRUCTOR NAV ITEMS (ADMIN STYLE)
----------------------------------- */

const navItems = [
  { name: "Home", path: "/", icon: Home },

  { name: "Dashboard", path: "/instructor-dashboard", icon: Home },

  {
    name: "TESTS",
    key: "tests",
    icon: FileText,
    children: [
      {
        name: "Categories",
        path: "/instructor-dashboard/tests/categories",
        icon: Plus,
      },
      {
        name: "Manage Categories",
        path: "/instructor-dashboard/tests/manage",
        icon: BarChart3,
      },
    ],
  },

  {
    name: "Doubts",
    path: "/instructor-dashboard/doubts",
    icon: MessageSquare,
  },

  {
    name: "Students",
    path: "/instructor-dashboard/students",
    icon: Users,
  },

  {
    name: "Profile Settings",
    path: "/instructor-dashboard/profile",
    icon: Settings,
  },
];

/* ----------------------------------
 MENU ITEM (REUSED FROM ADMIN)
----------------------------------- */

const MenuItem = ({ item, isOpen, toggleOpen, openSections, closeSidebar }) => {
  const location = useLocation();

  const isActive = useMemo(() => {
    if (item.path) return location.pathname === item.path;
    return item.children?.some((c) => location.pathname.startsWith(c.path));
  }, [location.pathname]);

  const activeStyle =
    "bg-indigo-50/80 text-indigo-600 border-r-2 border-indigo-500 font-bold shadow-sm";

  const baseStyle =
    "flex items-center justify-between gap-3 px-5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-50";

  if (item.path) {
    return (
      <li>
        <NavLink
          to={item.path}
          onClick={closeSidebar}
          className={({ isActive: exact }) =>
            `${baseStyle} ${exact ? activeStyle : ""}`
          }
        >
          <div className="flex items-center gap-3">
            <item.icon size={16} />
            <span className="text-[13px]">{item.name}</span>
          </div>
        </NavLink>
      </li>
    );
  }

  return (
    <li>
      <div
        className={`${baseStyle} ${isActive ? "text-indigo-600 font-bold" : ""}`}
        onClick={() => toggleOpen(item.key)}
      >
        <div className="flex items-center gap-3">
          <item.icon size={16} />
          <span className="text-[13px]">{item.name}</span>
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>

      {isOpen && (
        <ul className="ml-5 mt-1 space-y-1 border-l border-slate-100 pl-4">
          {item.children.map((child) => (
            <MenuItem
              key={child.name}
              item={child}
              isOpen={openSections[child.key]}
              toggleOpen={toggleOpen}
              openSections={openSections}
              closeSidebar={closeSidebar}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

/* ----------------------------------
 SIDEBAR CORE
----------------------------------- */

const InstructorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { instructorProfile } = useSelector((state) => state.instructors || {});
  const [openSections, setOpenSections] = useState({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!instructorProfile) dispatch(fetchInstructorProfile());
  }, [dispatch, instructorProfile]);

  useEffect(() => {
    const newOpen = {};
    navItems.forEach((l1) => {
      if (l1.children) {
        if (l1.children.some((c) => location.pathname.startsWith(c.path)))
          newOpen[l1.key] = true;
      }
    });
    setOpenSections(newOpen);
  }, [location.pathname]);

  const toggleOpen = (key) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.get("/api/auth/logout");
      dispatch(setUserData(null));
      toast.success("Logged out");
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const avatarUrl = useMemo(() => {
    if (instructorProfile?.avatar)
      return `${import.meta.env.VITE_SERVER_URL}/${instructorProfile.avatar}`;
    return `https://ui-avatars.com/api/?name=${instructorProfile?.firstname || "Instructor"}&background=6366f1&color=fff`;
  }, [instructorProfile]);

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 w-full p-4 bg-white z-50 flex justify-between border-b">
        <h1 className="font-black text-indigo-600">MYE 3 ACADEMY</h1>
        <button onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
          {showMobileSidebar ? <X /> : <Menu />}
        </button>
      </div>

      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      <aside
        className={`bg-gray-300 fixed top-0 left-0 h-screen w-72 z-50 transition
        ${showMobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* BRAND */}
        <div className="px-6 py-6 border-b">
          <h2 className="text-xs font-black uppercase tracking-widest">
            MYE 3 Academy
          </h2>
          <p className="text-xs text-slate-400 font-bold">INSTRUCTOR</p>
        </div>

        {/* PROFILE */}
        <div className="px-6 py-6 text-center border-b">
          <img src={avatarUrl} className="w-10 h-10 mx-auto rounded-xl" />
          <h4 className="mt-2 font-bold text-sm">
            {instructorProfile?.firstname || "Instructor"}
          </h4>
        </div>

        {/* NAV */}
        <nav className="px-3 py-6 space-y-1">
          <ul>
            {navItems.map((item) => (
              <MenuItem
                key={item.name}
                item={item}
                isOpen={openSections[item.key]}
                toggleOpen={toggleOpen}
                openSections={openSections}
                closeSidebar={() => setShowMobileSidebar(false)}
              />
            ))}
          </ul>
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t mt-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-rose-50 text-rose-500 py-2 rounded flex justify-center gap-2"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default InstructorSidebar;
