import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { setUserData } from "../../redux/userSlice";

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
  Building2,
} from "lucide-react";

/* ----------------------------------
  INSTITUTION NAV ITEMS
----------------------------------- */

const navItems = [
  { name: "Dashboard", path: "/institution-dashboard", icon: Home },
  { name: "My Students", path: "/institution-dashboard/students", icon: Users },
  { name: "Profile Settings", path: "/institution-dashboard/profile", icon: Settings },
];

/* ----------------------------------
  MENU ITEM
----------------------------------- */

const MenuItem = ({ item, isOpen, toggleOpen, openSections, closeSidebar }) => {
  const location = useLocation();

  const isActive = useMemo(() => {
    if (item.path) return location.pathname === item.path;
    return item.children?.some((c) => location.pathname.startsWith(c.path));
  }, [location.pathname, item.path, item.children]);

  const activeStyle =
    "bg-indigo-50/80 text-indigo-600 border-r-2 border-indigo-500 font-bold shadow-sm";

  const baseStyle =
    "flex items-center justify-between gap-3 px-5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-50";

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
};

/* ----------------------------------
  SIDEBAR CORE
----------------------------------- */

const InstitutionSidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    if (userData?.avatar)
      return `${import.meta.env.VITE_SERVER_URL}/${userData.avatar}`;
    return `https://ui-avatars.com/api/?name=${userData?.firstname || "Institution"}&background=6366f1&color=fff`;
  }, [userData]);

  return (
    <>
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
        className={`bg-white fixed top-0 left-0 h-screen w-72 z-50 transition border-r shadow-sm
        ${showMobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="px-6 py-6 border-b">
          <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600">
            MYE 3 Academy
          </h2>
          <p className="text-[10px] text-slate-400 font-bold">INSTITUTION PORTAL</p>
        </div>

        <div className="px-6 py-6 text-center border-b">
          <img src={avatarUrl} className="w-12 h-12 mx-auto rounded-2xl shadow-sm border border-slate-100" />
          <h4 className="mt-3 font-bold text-sm text-slate-800">
            {userData?.firstname || "Institution"}
          </h4>
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter tracking-widest">
            {userData?.lastname || "Campus"}
          </span>
        </div>

        <nav className="px-3 py-6 space-y-1">
          <ul>
            {navItems.map((item) => (
              <MenuItem
                key={item.name}
                item={item}
                closeSidebar={() => setShowMobileSidebar(false)}
              />
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t absolute bottom-0 w-full">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-rose-50 text-rose-500 py-2.5 rounded-xl flex justify-center items-center gap-2 font-bold text-xs hover:bg-rose-100 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default InstitutionSidebar;
