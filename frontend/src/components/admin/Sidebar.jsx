import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProfile } from "../../redux/adminSlice";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { setUserData } from "../../redux/userSlice";
import { clearCart } from "../../redux/cartSlice";

import {
  Home,
  Users,
  UserCog,
  BarChart3,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  CreditCard,
  LogOut,
  Menu,
  Settings,
  Wallet,
  X,
} from "lucide-react";

// ----------------------------------------------
// NAVIGATION GROUPS
// ----------------------------------------------
const navItems = [
  { name: "Main Dashboard", path: "/admin", icon: Home, end: true },
  {
    name: "TESTS",
    key: "tests",
    icon: FileText,
    children: [
      {
        name: "Categories",
        path: "/admin/tests/add-new-test",
        icon: Plus,
      },
      {
        name: "manage Tests",
        path: "/admin/tests/manage-tests",
        icon: BarChart3,
      },
    ],
  },
  {
    name: "Instructor & Students",
    key: "users",
    icon: Users,
    children: [
      {
        name: "Instructors",
        key: "instructors",
        icon: UserCog,
        children: [
          {
            name: "Manage Instructors",
            path: "/admin/users/instructors/manage",
            icon: UserCog,
          },
          {
            name: "Add Entry",
            path: "/admin/users/instructors/add",
            icon: Plus,
          },
        ],
      },
      {
        name: "Students",
        key: "students",
        icon: Users,
        children: [
          {
            name: "Manage Students",
            path: "/admin/users/students/manage",
            icon: Users,
          },
          {
            name: "New Student",
            path: "/admin/users/students/add",
            icon: Plus,
          },
        ],
      },
    ],
  },
  {
    name: "Payment Management",
    key: "payments",
    icon: CreditCard,
    children: [
      { name: "Transactions Hub", path: "/admin/payments", icon: FileText },
      { name: "Gateway Config", path: "/admin/payment-settings", icon: Wallet },
    ],
  },
  { name: "Doubt Management", path: "/admin/doubts", icon: FileText },
];

// ----------------------------------------------
// MENU ITEM UI
// ----------------------------------------------
const MenuItem = ({ item, isOpen, toggleOpen, openSections, closeSidebar }) => {
  const location = useLocation();
  const isActive = useMemo(() => {
    if (item.path) return location.pathname === item.path;
    return item.children?.some((c) => location.pathname.startsWith(c.path));
  }, [location.pathname]);

  const activeStyle = `bg-indigo-50/80 text-indigo-600 border-r-2 border-indigo-500 font-bold shadow-sm`;
  const baseStyle = `flex items-center justify-between gap-3 px-5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-50`;

  if (item.path) {
    return (
      <li className="list-none">
        <NavLink
          to={item.path}
          end={item.end}
          onClick={closeSidebar}
          className={({ isActive: exact }) =>
            `${baseStyle} ${exact ? activeStyle : ""}`
          }
        >
          <div className="flex items-center gap-3">
            <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[13px] tracking-tight">{item.name}</span>
          </div>
        </NavLink>
      </li>
    );
  }

  return (
    <li className="list-none">
      <div
        className={`${baseStyle} ${isActive ? "text-indigo-600 font-bold" : ""}`}
        onClick={() => toggleOpen(item.key)}
      >
        <div className="flex items-center gap-3">
          <item.icon size={16} />
          <span className="text-[13px] tracking-tight">{item.name}</span>
        </div>
        <span className="opacity-40">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </div>
      {isOpen && (
        <ul className="ml-5 mt-1 space-y-1 border-l border-slate-100 pl-4">
          {item.children.map((child) => (
            <MenuItem
              key={child.name}
              item={child}
              isOpen={child.children ? openSections[child.key] : false}
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

// ----------------------------------------------
// SIDEBAR CORE
// ----------------------------------------------
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { adminProfile } = useSelector((state) => state.admin || {});
  const [openSections, setOpenSections] = useState({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!adminProfile) dispatch(fetchAdminProfile());
  }, [dispatch, adminProfile]);

  useEffect(() => {
    const newOpenSections = {};
    const path = location.pathname;
    navItems.forEach((l1) => {
      if (l1.children) {
        let isL1Open = l1.children.some((l2) => {
          if (l2.path && path.startsWith(l2.path)) return true;
          return l2.children?.some((l3) => path.startsWith(l3.path));
        });
        if (isL1Open) newOpenSections[l1.key] = true;
      }
    });
    setOpenSections(newOpenSections);
  }, [location.pathname]);

  const toggleOpen = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.get("/api/auth/logout");
      dispatch(setUserData(null));
      dispatch(clearCart());
      toast.success("Safe logout completed");
      navigate("/");
    } catch (error) {
      toast.error("Logout interrupted");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const avatarUrl = useMemo(() => {
    if (adminProfile?.avatar)
      return `http://localhost:8000/${adminProfile.avatar.replace(/\\/g, "/")}`;
    return `https://ui-avatars.com/api/?name=${adminProfile?.firstname || "Admin"}+${adminProfile?.lastname || ""}&background=6366f1&color=fff&size=128&bold=true`;
  }, [adminProfile]);

  return (
    <>
      {/* MOBILE HEADER BUTTON */}
      <div className="md:hidden fixed top-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm z-[60] flex justify-between items-center border-b border-slate-100 shadow-sm">
        <h1 className="text-lg font-black text-indigo-600 tracking-tighter uppercase italic">
          Mye 3 Academy
        </h1>
        <button onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
          {showMobileSidebar ? (
            <X size={24} className="text-indigo-600" />
          ) : (
            <Menu size={24} className="text-indigo-600" />
          )}
        </button>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-50 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* SIDEBAR MAIN PANEL */}
      <aside
        className={`
        bg-gray-300 border-1 border-gray-600 shadow-sm
        fixed top-0 left-0 h-screen 
        w-72 flex flex-col z-[55]
        transition-transform duration-300 ease-in-out
        ${showMobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* BRAND IDENTITY */}
        <div className="px-6 py-6 border-b border-slate-100 flex items-center gap-3">
          {/* <div className="bg-indigo-600 w-8 h-8 rounded flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Settings size={18} strokeWidth={2.5} />
          </div> */}
          <div>
            <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-widest leading-none">
              MYE 3 Academy
            </h2>
            <p className="text-[13px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
              ADMIN
            </p>
          </div>
        </div>

        {/* PROFILE CONTROL UNIT */}
        <div className="px-6 py-8 flex flex-col items-center border-b border-slate-100/50 bg-[#fafbfc]/50 group relative">
          <div
            className="relative group cursor-pointer"
            onClick={() => {
              navigate("/admin/profile");
              setShowMobileSidebar(false);
            }}
          >
            <img
              src={avatarUrl}
              className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm hover:scale-105 transition duration-500"
              alt="Avatar"
            />
          </div>
          <div className="mt-4 text-center">
            <h4 className="text-slate-800 font-black text-[14px] leading-tight uppercase tracking-tight">
              {adminProfile?.firstname
                ? `${adminProfile.firstname} ${adminProfile.lastname}`
                : "Retrieving Data..."}
            </h4>
            <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-widest mt-0.5"></p>
          </div>
        </div>

        {/* DYNAMIC NAVIGATION LINKS */}
        <nav className="flex-grow overflow-y-auto px-3 py-6 no-scrollbar space-y-6">
          <div>
            <p className="px-5 text-[12px] font-bold text-black   uppercase tracking-[0.2em] mb-3">
              Index
            </p>
            <ul className="space-y-0.5">
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
          </div>
          {/* <div className="px-5">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-2">
              Internal Index
            </p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                Dashboard back-end systemsync dashboard consistenc
              </p>
            </div>
          </div> */}
        </nav>

        {/* LOGOUT UNIT */}
        <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full group bg-rose-50 border border-rose-200 text-rose-500 py-2.5 rounded-lg flex items-center gap-3 justify-center font-bold text-xs uppercase tracking-widest transition duration-300 hover:bg-rose-100 hover:text-rose-600 ${
              isLoggingOut ? "opacity-50" : ""
            }`}
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
