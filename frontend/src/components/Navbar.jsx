// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  GraduationCap,
  Search,
  Home,
  ClipboardList,
  Zap,
} from "lucide-react";

import { logoutUser } from "../redux/userSlice";
import { fetchCategories } from "../redux/categorySlice";
import { setPublicCategoryFilter } from "../redux/studentSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userData } = useSelector((state) => state.user);
  const { items: categories } = useSelector((state) => state.category);
  const { filters } = useSelector((state) => state.students);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;

      // Reset timer on scroll
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      
      // Auto-show after 2 seconds of no scrolling
      if (currentScrollY > 100) {
        scrollTimeoutRef.current = setTimeout(() => {
          setIsVisible(true);
        }, 2000);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    if (categories.length === 0) dispatch(fetchCategories());
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [dispatch, categories.length]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const handleSelectCategory = (catId) => {
    dispatch(setPublicCategoryFilter(catId));
    setIsCategoryDropdownOpen(false);
    if (location.pathname !== "/mocktests") navigate("/mocktests");
  };

  // --- LOGIC CONNECTIVITY FIX: Dashboard Visibility ---
  const role = userData?.role || "student";
  let dashboardPath = "/student-dashboard";
  let showDashboardBtn = !!userData; // If logged in, show dashboard button
  let dashboardLabel = "My Dashboard";

  // Check if Admin is in "Student View" mode
  const isAdminInStudentView = role === "admin" && !location.pathname.startsWith("/admin");

  if (role === "admin") {
    if (isAdminInStudentView) {
        // In Student View: Link to Student Dashboard, but label appropriately or hide if preferred
        dashboardPath = "/student-dashboard"; 
        dashboardLabel = "Student Dashboard";
        // Option: set showDashboardBtn = false to hide it completely in student view
        // showDashboardBtn = false; 
    } else {
        dashboardPath = "/admin";
        dashboardLabel = "Admin Panel";
    }
  } else if (role === "instructor") {
    dashboardPath = "/instructor-dashboard";
    dashboardLabel = "Instructor Panel";
  } else if (role === "institution") {
    dashboardPath = "/institution-dashboard";
    dashboardLabel = "Institution Portal";
  }

  const currentCategoryName =
    categories?.find((c) => c.slug === filters.category)?.name || "Categories";

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 transform ${isVisible ? "translate-y-0" : "-translate-y-full"} ${scrolled ? "bg-white border-b border-slate-100 py-2 shadow-sm" : "bg-white/90 backdrop-blur-md py-4"}`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-12">
            {/* MOBILE TOP UI */}
            <div className="flex md:hidden items-center justify-between w-full">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-700"
              >
                <Menu size={26} />
              </button>
              <div
                className="relative flex-1 max-w-[180px] mx-2"
                ref={dropdownRef}
              >
                <button
                  onClick={() =>
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                  }
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm font-bold text-sm text-slate-700"
                >
                  <span className="truncate">{currentCategoryName}</span>
                  <ChevronDown
                    size={14}
                    className={isCategoryDropdownOpen ? "rotate-180" : ""}
                  />
                </button>
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-[70]">
                    <button
                      onClick={() => handleSelectCategory("")}
                      className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50"
                    >
                      All Categories
                    </button>
                    <div className="max-h-[250px] overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => handleSelectCategory(cat.slug)}
                          className="w-full text-left px-5 py-3 text-sm font-semibold hover:bg-slate-50 text-slate-600"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/mocktests")}
                className="p-2 text-slate-700"
              >
                <Search size={24} />
              </button>
            </div>

            {/* DESKTOP TOP UI */}
            <div className="hidden md:flex items-center justify-between w-full gap-6">
              
              {/* === LEFT: Logo === */}
              <Link
                to="/"
                className="flex items-center gap-2 group font-black text-xl italic tracking-tighter flex-shrink-0"
              >
                <div className="bg-indigo-600 p-1.5 shadow-lg shadow-indigo-100">
                  <GraduationCap className="text-white w-5 h-5" />
                </div>
                MYE 3 Academy
              </Link>

              {/* === CENTER: Nav Links (evenly spaced) === */}
              <div className="flex items-center gap-8 font-bold text-sm text-slate-600 mx-auto">
                <Link
                  to="/"
                  className={location.pathname === "/" ? "text-indigo-600" : "hover:text-indigo-600 transition-colors"}
                >
                  Home
                </Link>
                <Link
                  to="/mocktests"
                  className={location.pathname === "/mocktests" && !location.search.includes("type=") ? "text-indigo-600" : "hover:text-indigo-600 transition-colors"}
                >
                  All Tests
                </Link>
                <Link
                  to="/mock-tests"
                  className={location.pathname === "/mock-tests" ? "text-indigo-600" : "hover:text-indigo-600 transition-colors"}
                >
                  Mock Tests
                </Link>
                <Link
                  to="/grand-tests"
                  className={location.pathname === "/grand-tests" ? "text-indigo-600" : "hover:text-indigo-600 transition-colors"}
                >
                  Grand Tests
                </Link>

              </div>

              {/* === RIGHT: Actions === */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {userData ? (
                  <div className="flex items-center gap-4">
                    {/* Divider between nav links and actions */}
                    <div className="w-px h-5 bg-slate-200 flex-shrink-0" />
                    {showDashboardBtn && (
                      <Link
                        to={dashboardPath}
                        className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        Dashboard
                      </Link>
                    )}

                    <div className="relative">
                      <button
                        onClick={() =>
                          setIsProfileDropdownOpen(!isProfileDropdownOpen)
                        }
                        className="flex items-center gap-3 p-1 pr-4 rounded-full border border-slate-200 bg-slate-50 hover:bg-white transition-all"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center font-black text-xs text-indigo-600">
                          {userData.profilePicture ? (
                            <img
                              src={userData.profilePicture}
                              alt="User"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            userData.firstname?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {userData.firstname}
                        </span>
                        <ChevronDown
                          size={14}
                          className={isProfileDropdownOpen ? "rotate-180" : ""}
                        />
                      </button>
                      {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50">
                          <Link
                            to={dashboardPath}
                            className="flex items-center px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <LayoutDashboard size={16} className="mr-2" />{" "}
                            {dashboardLabel}
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={16} className="mr-2" /> Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 font-bold text-sm">
                    <Link
                      to="/login"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform hover:scale-105"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 z-50 py-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          {[
            { id: "home", label: "HOME", icon: Home, path: "/" },
            {
              id: "all",
              label: "ALL",
              icon: Search,
              path: "/mocktests",
            },
            {
              id: "mock",
              label: "MOCK",
              icon: ClipboardList,
              path: "/mock-tests",
            },
            {
              id: "grand",
              label: "GRAND",
              icon: Zap,
              path: "/grand-tests",
            },
            {
              id: "profile",
              label: "PROFILE",
              icon: User,
              path: userData ? dashboardPath : "/login",
            },
          ].map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div
                className={`p-2.5 rounded-full transition-all ${
                  location.pathname === tab.path || (tab.id === 'all' && location.pathname === tab.path)
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-indigo-400"
                }`}
              >
                <tab.icon size={20} />
              </div>
              <span
                className={`text-[9px] font-black tracking-widest ${
                  location.pathname === tab.path || (tab.id === 'all' && location.pathname === tab.path)
                    ? "text-indigo-600"
                    : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
