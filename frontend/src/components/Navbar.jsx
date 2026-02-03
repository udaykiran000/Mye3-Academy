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
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";

import { logoutUser } from "../redux/userSlice";
import { fetchCategories } from "../redux/categorySlice";
import { setPublicCategoryFilter } from "../redux/studentSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // --- REDUX STATE (Original Names) ---
  const { userData } = useSelector((state) => state.user);
  const { cartItems } = useSelector((state) => state.cart);
  const { items: categories } = useSelector((state) => state.category);
  const { filters } = useSelector((state) => state.students);

  // --- UI STATES ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false); // For Mobile Top Bar
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    if (categories.length === 0) dispatch(fetchCategories());
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dispatch, categories.length]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location]);

  // --- HANDLERS (Original Logic Restored) ---
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const handleCategoryClick = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname === "/") {
      const section = document.getElementById("categories-section");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const section = document.getElementById("categories-section");
        if (section) section.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleSelectCategory = (catId) => {
    dispatch(setPublicCategoryFilter(catId));
    setIsCategoryDropdownOpen(false);
    if (location.pathname !== "/mocktests") navigate("/mocktests");
  };

  // --- LOGIC CALCULATIONS (Original) ---
  const firstName = userData?.firstname || "User";
  const userInitial = firstName.charAt(0).toUpperCase();
  const role = userData?.role || "student";

  let dashboardPath = "/student-dashboard";
  let showDashboardBtn = false;
  let dashboardLabel = "Dashboard";

  if (role === "admin") {
    dashboardPath = "/admin";
    showDashboardBtn = true;
    dashboardLabel = "Admin Panel";
  } else if (role === "instructor") {
    dashboardPath = "/instructor-dashboard";
    showDashboardBtn = true;
    dashboardLabel = "Instructor Panel";
  } else {
    dashboardPath = "/student-dashboard";
    // Student Logic: Only show if they have purchases/enrollments
    const hasPurchased =
      userData?.purchasedTests?.length > 0 ||
      userData?.enrolledMockTests?.length > 0;
    showDashboardBtn = hasPurchased;
    dashboardLabel = "My Dashboard";
  }

  const currentCategoryName =
    categories?.find((c) => c._id === filters.category)?.name || "Categories";

  const getActiveTab = () => {
    const { pathname, search } = location;
    if (pathname === "/") return "home";
    if (pathname === "/mocktests" && search.includes("grand")) return "grand";
    if (pathname === "/mocktests") return "tests";
    if (
      pathname.includes("dashboard") ||
      pathname === "/login" ||
      pathname === "/signup"
    )
      return "profile";
    return "";
  };
  const activeTab = getActiveTab();

  return (
    <>
      {/* ================= TOP NAVBAR ================= */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white border-b border-slate-100 py-2 shadow-sm"
            : "bg-white/90 backdrop-blur-md py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-12">
            {/* 📱 MOBILE TOP UI: Hamburger | Dropdown | Search */}
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
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm"
                >
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {currentCategoryName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${
                      isCategoryDropdownOpen ? "rotate-180" : ""
                    }`}
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
                          onClick={() => handleSelectCategory(cat._id)}
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

            {/* 💻 DESKTOP TOP UI: Logo | Links | Profile */}
            <div className="hidden md:flex items-center justify-between w-full">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:scale-105 transition shadow-lg shadow-indigo-100">
                  <GraduationCap className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tighter italic">
                  MYE 3 Academy
                </span>
              </Link>

              <div className="flex items-center gap-8">
                <Link
                  to="/"
                  className={`text-sm font-bold ${
                    location.pathname === "/"
                      ? "text-indigo-600"
                      : "text-slate-600 hover:text-indigo-600"
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/mocktests"
                  className={`text-sm font-bold ${
                    location.pathname === "/mocktests" &&
                    !location.search.includes("grand")
                      ? "text-indigo-600"
                      : "text-slate-600 hover:text-indigo-600"
                  }`}
                >
                  All Tests
                </Link>
                <Link
                  to="/mocktests?filter=grand"
                  className={`text-sm font-bold ${
                    location.search.includes("grand")
                      ? "text-indigo-600"
                      : "text-slate-600 hover:text-indigo-600"
                  }`}
                >
                  Grand Tests
                </Link>
                <button
                  onClick={handleCategoryClick}
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600"
                >
                  Categories
                </button>
              </div>

              <div className="flex items-center gap-4">
                {userData ? (
                  <div className="flex items-center gap-5">
                    {showDashboardBtn ? (
                      <Link
                        to={dashboardPath}
                        className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        {dashboardLabel}
                      </Link>
                    ) : (
                      <Link
                        to="/mocktests"
                        className="flex items-center gap-2 px-5 py-2 text-xs font-black uppercase tracking-widest text-orange-600 border border-orange-100 bg-orange-50 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                      >
                        <ShoppingBag size={14} /> Browse
                      </Link>
                    )}

                    {role === "student" && (
                      <Link
                        to="/cart"
                        className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors"
                      >
                        <ShoppingCart size={22} />
                        {cartItems.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                            {cartItems.length}
                          </span>
                        )}
                      </Link>
                    )}

                    <div className="relative">
                      <button
                        onClick={() =>
                          setIsProfileDropdownOpen(!isProfileDropdownOpen)
                        }
                        className="flex items-center gap-3 p-1 pr-4 rounded-full border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition transition-all duration-300"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center border border-white">
                          {userData.profilePicture ? (
                            <img
                              src={userData.profilePicture}
                              alt="User"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-black text-indigo-600">
                              {userInitial}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {firstName}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 transition-transform ${
                            isProfileDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                          <Link
                            to={dashboardPath}
                            className="flex items-center px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                          >
                            <LayoutDashboard size={16} className="mr-2" />{" "}
                            {dashboardLabel}
                          </Link>
                          <div className="border-t border-slate-50 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50"
                          >
                            <LogOut size={16} className="mr-2" /> Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link
                      to="/login"
                      className="text-sm font-bold text-slate-600 hover:text-indigo-600"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition transform hover:scale-105"
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

      {/* ================= 📱 MOBILE BOTTOM NAVIGATION ================= */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 z-50 py-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          {[
            { id: "home", label: "HOME", icon: Home, path: "/" },
            {
              id: "tests",
              label: "TESTS",
              icon: ClipboardList,
              path: "/mocktests",
            },
            {
              id: "grand",
              label: "GRAND",
              icon: Zap,
              path: "/mocktests?filter=grand",
            },
            {
              id: "profile",
              label: "PROFILE",
              icon: User,
              path: userData ? dashboardPath : "/login",
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className="flex flex-col items-center gap-1 min-w-[70px]"
              >
                <div
                  className={`p-3 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-[#4f46e5] text-white shadow-lg shadow-indigo-200"
                      : "text-slate-400"
                  }`}
                >
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] font-black tracking-widest ${
                    isActive ? "text-[#4f46e5]" : "text-slate-400"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ================= 📱 MOBILE SIDEBAR DRAWER ================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 h-full bg-white shadow-2xl p-8 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-black italic text-indigo-600">
                MYE 3 Academy
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-slate-50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-6">
              <Link
                to="/"
                className="flex items-center gap-4 py-2 font-bold text-slate-700 hover:text-indigo-600"
              >
                <Home size={20} /> Home
              </Link>
              <Link
                to="/mocktests"
                className="flex items-center gap-4 py-2 font-bold text-slate-700 hover:text-indigo-600"
              >
                <ClipboardList size={20} /> All Tests
              </Link>
              <button
                onClick={handleCategoryClick}
                className="flex items-center gap-4 py-2 font-bold text-slate-700 hover:text-indigo-600 w-full text-left"
              >
                <ShoppingBag size={20} /> Categories
              </button>
              {role === "student" && (
                <Link
                  to="/cart"
                  className="flex items-center justify-between py-2 font-bold text-slate-700"
                >
                  Cart{" "}
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {cartItems.length}
                  </span>
                </Link>
              )}
            </div>
            <div className="pt-6 border-t border-slate-100">
              {userData ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 py-4 text-red-500 font-black uppercase text-xs tracking-[0.2em] bg-red-50 rounded-2xl"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block text-center py-4 bg-indigo-600 text-white rounded-2xl font-bold"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
