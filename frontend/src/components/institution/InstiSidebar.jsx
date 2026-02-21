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
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/institution-dashboard", icon: Home, end: true },
  {
    name: "Our Students",
    path: "/institution-dashboard/students",
    icon: Users,
  },
  {
    name: "Profile Settings",
    path: "/institution-dashboard/profile",
    icon: Settings,
  },
];

const MenuItem = ({ item, isOpen, toggleOpen, openSections, closeSidebar }) => {
  const location = useLocation();

  const isActive = useMemo(() => {
    if (item.path) return location.pathname === item.path;
    return item.children?.some((c) => location.pathname.startsWith(c.path));
  }, [location.pathname]);

  const activeStyle =
    "bg-white/20 text-white border-r-2 border-white font-bold shadow-sm";

  const baseStyle =
    "flex items-center justify-between gap-3 px-5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-white/80 hover:text-white hover:bg-white/10";

  if (item.path) {
    return (
      <li>
        <NavLink
          to={item.path}
          end={item.end}
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
        className={`${baseStyle} ${isActive ? "text-white font-bold" : ""}`}
        onClick={() => toggleOpen(item.key)}
      >
        <div className="flex items-center gap-3">
          <item.icon size={16} />
          <span className="text-[13px]">{item.name}</span>
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>

      {isOpen && (
        <ul className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-4">
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

const InstiSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userData } = useSelector((state) => state.user || {});
  const [openSections, setOpenSections] = useState({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    if (!window.confirm("Are you sure you want to logout?")) return;
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
      return `${import.meta.env.VITE_SERVER_URL}/${userData.avatar.replace(/\\/g, "/")}`;
    return `https://ui-avatars.com/api/?name=${userData?.firstname || "Institution"}&background=a332ff&color=fff`;
  }, [userData]);

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 w-full p-4 bg-[#a332ff] z-50 flex justify-between border-b border-white/10 shadow-lg">
        <h1 className="font-black text-white">MYE 3 ACADEMY</h1>
        <button onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
          {showMobileSidebar ? <X className="text-white" /> : <Menu className="text-white" />}
        </button>
      </div>

      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      <aside
        className={`bg-[#a332ff] fixed top-0 left-0 h-screen w-72 z-50 transition-transform duration-300 ease-in-out
        ${showMobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="px-6 py-6 border-b border-white/10">
          <h2 className="text-xs font-black uppercase tracking-widest text-white">
            MYE 3 Academy
          </h2>
          <p className="text-xs text-white/60 font-bold">INSTITUTION</p>
        </div>

        <div className="px-6 py-6 text-center border-b border-white/10">
          <img src={avatarUrl} className="w-12 h-12 mx-auto rounded-xl object-cover border-2 border-white/20 shadow-lg" alt="Avatar" />
          <h4 className="mt-2 font-bold text-sm text-white">
            {userData?.firstname || "Institution"}
          </h4>
        </div>

        <nav className="px-3 py-6 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
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

        <div className="p-4 border-t border-white/10 mt-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-rose-50 text-rose-500 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition duration-300 shadow-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default InstiSidebar;
