// frontend/src/components/admin/ManageMocktests.jsx
import React, { useEffect, useState, useMemo } from "react"; // Added useState, useMemo
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import {
  FaPlus,
  FaClipboardList,
  FaSpinner,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaTrashAlt,
  FaArrowLeft,
  FaFilter,
  FaRss,
  FaEyeSlash,
  FaBookmark,
  FaLayerGroup, // Added for Mock Icon
  FaTrophy,     // Added for Grand Icon
  FaList        // Added for All Icon
} from "react-icons/fa";

import {
  fetchAdminMockTests,
  deleteMockTest,
  togglePublish,
  setCategoryFilter,
} from "../../redux/mockTestSlice";

import { fetchCategories } from "../../redux/categorySlice";

const ManageMocktests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ------------------ LOCAL STATE FOR TYPE FILTER ------------------
  // Options: 'ALL', 'MOCK', 'GRAND'
  const [filterType, setFilterType] = useState("ALL");

  /* ---------------------- SELECTORS ---------------------- */
  const mocktests = useSelector((state) => state.mocktest.adminMocktests || []);
  const status = useSelector((state) => state.mocktest.adminStatus);
  const error = useSelector((state) => state.mocktest.adminError);

  const selectedCategory = useSelector((state) => state.mocktest.filters.category);

  const categories = useSelector((state) => state.category.items || []);
  const categoriesLoading = useSelector((state) => state.category.loading);

  const isLoading = status === "loading";
  const hasError = status === "failed";

  /* ---------------------- LOAD DATA ---------------------- */
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAdminMockTests());
  }, [dispatch, selectedCategory]);

  /* ---------------------- FILTER LOGIC ---------------------- */
  // We filter the Redux data based on the local 'filterType' state
  const filteredData = useMemo(() => {
    if (filterType === "ALL") return mocktests;
    
    return mocktests.filter((test) => {
      if (filterType === "GRAND") {
        return test.isGrandTest === true; // Only Grand Tests
      } else {
        return !test.isGrandTest; // Only Normal Mock Tests (false or undefined)
      }
    });
  }, [mocktests, filterType]);

  /* ---------------------- ACTION HANDLERS ---------------------- */
  const handleCategoryChange = (e) => {
    dispatch(setCategoryFilter(e.target.value || ""));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this mock test permanently?")) return;
    dispatch(deleteMockTest(id));
  };

  const handleTogglePublish = (id) => {
    dispatch(togglePublish(id));
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);

  const getCategoryTagClass = (name) => {
    const code = (name || "").charCodeAt(0) || 0;
    switch (code % 4) {
      case 0: return "bg-purple-100 text-purple-700 border-purple-300";
      case 1: return "bg-indigo-100 text-indigo-700 border-indigo-300";
      case 2: return "bg-teal-100 text-teal-700 border-teal-300";
      case 3: return "bg-pink-100 text-pink-700 border-pink-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  /* ---------------------- TABLE COMPONENT ---------------------- */
  const MockTestTable = ({ tests }) => (
    <div className="overflow-x-auto bg-white rounded-xl shadow-2xl border border-gray-100/50 mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50/70">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Title / Type</th>
            <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Category</th>
            <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Price</th>
            <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Stats</th>
            <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Visibility</th>
            <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {tests.map((test) => {
            const catName = test.category?.name || test.categorySlug || "N/A";
            const catSlug = test.category?.slug || test.categorySlug || "default";
            const tagClass = getCategoryTagClass(catName);

            return (
              <tr key={test._id} className="hover:bg-blue-50/50 transition">
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <p className="font-semibold text-gray-900 line-clamp-1">{test.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* TYPE BADGE */}
                      {test.isGrandTest ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                           <FaTrophy size={10} /> Grand
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                           <FaLayerGroup size={10} /> Mock
                        </span>
                      )}
                      <span className="text-xs text-gray-400">ID: {test._id.slice(-6)}</span>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${tagClass}`}>
                    <FaBookmark className="mr-1 text-xs" />
                    {catName}
                  </span>
                </td>

                <td className="px-5 py-4 text-center font-bold text-green-600">{formatPrice(test.price)}</td>

                <td className="px-5 py-4 text-center text-sm text-gray-600">
                    <div className="font-bold">{test.attempts?.length || 0}</div>
                    <div className="text-[10px] text-gray-400 uppercase">Enrollments</div>
                </td>

                <td className="px-5 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center ${test.isPublished ? "bg-green-100 text-green-700 border border-green-300" : "bg-yellow-100 text-yellow-700 border border-yellow-300"}`}>
                    {test.isPublished ? <FaRss /> : <FaEyeSlash />} &nbsp;{test.isPublished ? "Published" : "Draft"}
                  </span>
                </td>

                <td className="px-5 py-4 text-center space-x-2">
                  <button onClick={() => handleTogglePublish(test._id)} className={`p-2 rounded-full shadow ${test.isPublished ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                    {test.isPublished ? <FaToggleOn /> : <FaToggleOff />}
                  </button>

                  <button onClick={() => navigate(`/admin/mocktests/${catSlug}/edit/${test._id}`)} className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 shadow">
                    <FaEdit size={16} />
                  </button>

                  <button onClick={() => handleDelete(test._id)} className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow">
                    <FaTrashAlt size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  /* ---------------------- MAIN RENDER ---------------------- */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6 border-b pb-4">
        <Link to="/admin" className="flex items-center gap-2 text-blue-600 hover:text-blue-800"><FaArrowLeft /> Back to Dashboard</Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 gap-4">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Mock Test Registry <span className="text-blue-600">({filteredData.length})</span>
          </h2>

          <button onClick={() => navigate("/admin/tests/add-new-test")} className="flex items-center bg-indigo-600 text-white px-6 py-3 rounded-xl shadow hover:bg-indigo-700 transition">
            <FaPlus className="mr-2" /> Create New Test
          </button>
        </div>
      </header>

      {/* ---------------- FILTERS CONTAINER ---------------- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        
        {/* 1. TEST TYPE FILTER (NEW) */}
        <div className="flex flex-col gap-2 w-full lg:w-auto">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Filter by Type</label>
             <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-fit">
                {/* ALL Button */}
                <button 
                    onClick={() => setFilterType("ALL")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filterType === 'ALL' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaList size={14} /> All
                </button>

                {/* MOCK Button */}
                <button 
                    onClick={() => setFilterType("MOCK")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filterType === 'MOCK' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaLayerGroup size={14} /> Mock Tests
                </button>

                {/* GRAND Button */}
                <button 
                    onClick={() => setFilterType("GRAND")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filterType === 'GRAND' ? 'bg-white text-amber-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaTrophy size={14} /> Grand Tests
                </button>
             </div>
        </div>

        {/* 2. CATEGORY FILTER (EXISTING) */}
        <div className="flex flex-col gap-2 w-full lg:w-auto">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Filter by Category</label>
             <div className="relative">
                <FaFilter className="absolute left-3 top-3 text-gray-400" />
                {categoriesLoading ? (
                    <div className="h-[42px] w-[200px] bg-gray-100 animate-pulse rounded-lg"></div>
                ) : (
                    <select 
                        value={selectedCategory} 
                        onChange={handleCategoryChange} 
                        className="w-full lg:w-64 border border-gray-300 pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                )}
             </div>
        </div>

      </div>

      {/* ---------------- TABLES ---------------- */}
      {isLoading && (
        <div className="text-center mt-20">
          <FaSpinner className="animate-spin text-indigo-600 mx-auto" size={40} />
          <p className="text-gray-600 mt-3 font-medium">Loading tests...</p>
        </div>
      )}

      {hasError && <div className="mt-10 p-4 bg-red-100 text-center text-red-600 rounded-lg border border-red-200">{error}</div>}

      {/* Pass 'filteredData' instead of 'mocktests' */}
      {!isLoading && !hasError && filteredData.length > 0 && <MockTestTable tests={filteredData} />}

      {!isLoading && filteredData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
             <FaClipboardList size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">No Tests Found</h3>
          <p className="text-gray-500">
            {filterType === "ALL" ? "Try creating a new test." : `No ${filterType.toLowerCase().replace('_', ' ')} tests found.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageMocktests;