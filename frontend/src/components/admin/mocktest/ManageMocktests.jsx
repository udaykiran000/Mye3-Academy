// frontend/src/components/admin/mocktest/ManageMocktests.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Layers, 
  Trophy, 
  List, 
  ChevronRight,
  ClipboardList,
  Loader2,
  AlertCircle,
  ChevronDown,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  fetchAdminMockTests,
  deleteMockTest,
  togglePublish,
  setCategoryFilter,
} from "../../../redux/mockTestSlice";

import { fetchCategories } from "../../../redux/categorySlice";
import { toast } from "react-hot-toast";

const ManageMocktests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type")?.toUpperCase(); // 'MOCK' or 'GRAND'

  // Options: 'ALL', 'MOCK', 'GRAND'
  const [filterType, setFilterType] = useState(typeParam || "ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (typeParam) {
      setFilterType(typeParam);
    }
  }, [typeParam]);

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
  const filteredData = useMemo(() => {
    return mocktests.filter((test) => {
      // 1. Category Filter (already handled by Redux state, but ensuring safety)
      const baseMatch = true; 

      // 2. Type & Sub-filter logic
      const [mainType, subType] = filterType.split(":");
      
      let typeMatch = true;
      if (mainType === "MOCK") typeMatch = !test.isGrandTest;
      if (mainType === "GRAND") typeMatch = test.isGrandTest;
      if (mainType === "ALL") typeMatch = true;

      let subMatch = true;
      if (subType === "PAID") subMatch = !test.isFree;
      if (subType === "FREE") subMatch = test.isFree;

      return baseMatch && typeMatch && subMatch;
    });
  }, [mocktests, filterType]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, selectedCategory]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  /* ---------------------- ACTION HANDLERS ---------------------- */
  const handleCategoryChange = (e) => {
    dispatch(setCategoryFilter(e.target.value || ""));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this mock test permanently?")) return;
    dispatch(deleteMockTest(id));
  };

  const handleTogglePublish = async (id) => {
    try {
      await dispatch(togglePublish(id)).unwrap();
      toast.success("Status Synchronized");
    } catch (err) {
      toast.error(err || "Update failed");
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);

  const getCategoryTagClass = (name) => {
    const colors = [
      "bg-emerald-50 text-emerald-600 border-emerald-100",
      "bg-blue-50 text-blue-600 border-blue-100",
      "bg-amber-50 text-amber-600 border-amber-100",
      "bg-rose-50 text-rose-600 border-rose-100",
      "bg-slate-50 text-slate-600 border-slate-100",
    ];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  /* ---------------------- TABLE COMPONENT ---------------------- */
  const MockTestTable = ({ tests }) => (
    <div className="overflow-x-auto bg-white border border-slate-200 shadow-[0_15px_50px_rgba(0,0,0,0.12)] rounded-none">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#fdfdfd] border-b border-slate-200">
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins">Test Details</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins">Category</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-center">Type</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-center">Pricing</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-center">Attempts</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-center">Exam Specs</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-center">Publish</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {tests.map((test) => {
          const catName = test.category?.name || "N/A";
          const catSlug = test.category?.slug || "default";

          return (
            <tr key={test._id} className="hover:bg-[#fcfdfd] transition-colors group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center border transition-all duration-300 ${test.isGrandTest ? 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' : 'bg-[#21b731]/5 border-[#21b731]/10 text-[#21b731] group-hover:bg-[#21b731] group-hover:text-white'}`}>
                    {test.isGrandTest ? <Trophy size={16} /> : <Layers size={16} />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-bold text-[#3e4954] uppercase tracking-tight font-poppins group-hover:text-[#21b731] transition-colors truncate">
                        {test.title}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-[#7e7e7e] uppercase tracking-widest">
                      {test.subcategory || "Main Segment"}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest border font-poppins inline-block ${getCategoryTagClass(catName)}`}>
                  {catName}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                 <span className={`px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest border font-poppins inline-block min-w-[50px] ${
                     test.isGrandTest 
                     ? "bg-amber-50 text-amber-600 border-amber-100" 
                     : "bg-emerald-50 text-emerald-600 border-emerald-100"
                 }`}>
                     {test.isGrandTest ? "Grand" : "Mock"}
                 </span>
              </td>
              <td className="px-4 py-3 text-center">
                 <span className={`text-[9.5px] font-black px-2 py-0.5 border inline-block min-w-[55px] uppercase tracking-widest font-poppins ${
                   test.isFree 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                 }`}>
                   {test.isFree ? "FREE" : `₹${test.price}`}
                 </span>
              </td>
              <td className="px-4 py-3 text-center">
                 <span className="text-[11px] font-black text-[#3e4954] bg-slate-50 border border-slate-100 px-2 py-1 inline-block min-w-[35px]">{test.attempts?.length || 0}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-[#3e4954]">{test.totalMarks || 0}</span>
                     <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Marks</span>
                  </div>
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-[#3e4954]">{test.questions?.length || 0}</span>
                     <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">MCQs</span>
                  </div>
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-[#3e4954]">{test.durationMinutes || 0}m</span>
                     <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Time</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleTogglePublish(test._id)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 focus:outline-none border-2 ${
                      test.isPublished 
                        ? 'bg-emerald-500 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                        : 'bg-slate-200 border-slate-300'
                    }`}
                    title={test.isPublished ? "Set to Draft" : "Set to Published"}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                        test.isPublished ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => navigate(`/admin/mocktests/${catSlug}/edit/${test._id}`)}
                    className="p-2 bg-slate-50 text-slate-500 border-2 border-slate-100 hover:bg-slate-100 hover:text-[#3e4954] hover:border-slate-200 transition-all rounded"
                    title="Edit Settings"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(test._id)}
                    className="p-2 bg-rose-50 text-rose-500 border-2 border-rose-100 hover:bg-rose-100 transition-all rounded"
                    title="Delete Test"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
    <div className="p-4 pt-2 bg-[#EDF0FF] min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-3 mb-4">
        <div className="space-y-1">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[10px] font-black text-[#7e7e7e] hover:text-[#21b731] uppercase tracking-[0.2em] transition-all font-poppins">
            <ArrowLeft size={12} /> Back
          </Link>
          <div className="flex items-center gap-3">
               <div className="w-1.5 h-7 bg-[#21b731]" />
               <div>
                  <h2 className="text-xl lg:text-2xl font-black text-[#3e4954] uppercase tracking-tighter font-poppins">All Tests</h2>
                  <p className="text-[#7e7e7e] text-[9px] font-bold uppercase tracking-[0.2em] font-poppins mt-0.5">
                    Showing <span className="text-[#21b731]">{filteredData.length}</span> active tests
                  </p>
               </div>
          </div>
        </div>

        <button 
          onClick={() => navigate("/admin/tests/add-new-test")} 
          className="flex items-center justify-center gap-2.5 bg-[#21b731] text-white px-5 py-3 rounded-none shadow-lg shadow-green-100 hover:bg-[#1a9227] hover:-translate-y-0.5 transition-all duration-300 font-black text-[10px] tracking-widest active:scale-95"
        >
          <Plus size={16} strokeWidth={3} /> Add new test
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-stretch lg:items-end">
        {/* Type Filter Tabs */}
        <div className="space-y-2 flex-1 lg:max-w-md">
           <label className="text-[9px] font-black text-[#7e7e7e] uppercase tracking-[0.2em] font-poppins flex items-center gap-2">
              <Filter size={10} className="text-[#21b731]" /> Filter by Type
           </label>
           <div className="flex h-[42px] gap-2 bg-slate-100/50 p-1 border border-slate-200 rounded-none items-stretch">
              <button 
                  onClick={() => setFilterType("ALL")}
                  className={`flex-1 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-none border ${
                    filterType === 'ALL' 
                      ? 'bg-white text-[#3e4954] shadow-sm border-slate-300' 
                      : 'text-[#7e7e7e] border-transparent hover:bg-slate-200/50'
                  }`}
              >
                  <List size={14} strokeWidth={2.5} /> All
              </button>

              <FilterTabWithDropdown 
                id="MOCK"
                label="Mock"
                icon={<Layers size={11} />}
                activeFilter={filterType}
                setFilter={setFilterType}
                counts={{
                  all: mocktests.filter(t => !t.isGrandTest).length,
                  paid: mocktests.filter(t => !t.isGrandTest && !t.isFree).length,
                  free: mocktests.filter(t => !t.isGrandTest && t.isFree).length,
                }}
                activeColor="bg-[#21b731] text-white shadow-md"
              />

              <FilterTabWithDropdown 
                id="GRAND"
                label="Grand"
                icon={<Trophy size={11} />}
                activeFilter={filterType}
                setFilter={setFilterType}
                counts={{
                  all: mocktests.filter(t => t.isGrandTest).length,
                  paid: mocktests.filter(t => t.isGrandTest && !t.isFree).length,
                  free: mocktests.filter(t => t.isGrandTest && t.isFree).length,
                }}
                activeColor="bg-amber-500 text-white shadow-md"
              />
           </div>
        </div>

        {/* Category Dropdown */}
        <div className="space-y-2 w-full lg:w-64">
           <label className="text-[9px] font-black text-[#7e7e7e] uppercase tracking-[0.2em] font-poppins flex items-center gap-2">
              <Search size={10} className="text-[#21b731]" /> Search Category
           </label>
           <div className="relative">
              <select 
                  value={selectedCategory} 
                  onChange={handleCategoryChange} 
                  disabled={categoriesLoading}
                  className="w-full bg-white border border-slate-200 px-3 py-2 text-[10px] font-bold text-[#3e4954] uppercase tracking-widest outline-none focus:border-[#21b731] transition-colors appearance-none font-poppins cursor-pointer"
              >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                 <ChevronRight size={14} className="rotate-90" />
              </div>
           </div>
        </div>
      </div>

      {/* DATA VIEW */}
      <div className="relative">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-100">
            <Loader2 className="animate-spin text-[#21b731] mb-4" size={48} strokeWidth={1.5} />
            <p className="text-[11px] font-black text-[#7e7e7e] uppercase tracking-[0.3em] font-poppins">Loading Mocktests...</p>
          </div>
        )}

        {hasError && (
          <div className="flex flex-col items-center justify-center py-20 bg-rose-50 border border-rose-100">
            <AlertCircle className="text-rose-500 mb-4" size={48} strokeWidth={1.5} />
            <h3 className="text-[14px] font-black text-rose-600 uppercase tracking-widest font-poppins">Failed to Load Mocktests</h3>
            <p className="text-rose-400 text-[11px] mt-2 font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        {!isLoading && !hasError && filteredData.length > 0 && (
          <>
            <MockTestTable tests={paginatedData} />
            
            {/* PAGINATION CONTROLS */}
            {filteredData.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white border border-slate-200 p-4">
                <div className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest font-poppins">
                  Showing <span className="text-[#3e4954]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-[#3e4954]">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="text-[#21b731]">{filteredData.length}</span> results
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#3e4954] transition-all"
                  >
                    <ChevronDown size={16} className="rotate-90" />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      // Show first, last, current, and pages around current
                      if (
                        pageNum === 1 || 
                        pageNum === totalPages || 
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 text-[11px] font-black transition-all border-2 ${
                              currentPage === pageNum 
                                ? 'bg-[#21b731] border-[#21b731] text-white shadow-lg shadow-green-100' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-[#3e4954]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 || 
                        pageNum === currentPage + 2
                      ) {
                        return <span key={pageNum} className="px-1 text-slate-300 font-bold">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#3e4954] transition-all"
                  >
                    <ChevronDown size={16} className="-rotate-90" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 flex items-center justify-center mb-6">
               <ClipboardList size={40} className="text-slate-200" />
            </div>
            <h3 className="text-[16px] font-black text-[#3e4954] uppercase tracking-tighter font-poppins">No Tests Found</h3>
            <p className="text-[#7e7e7e] text-[10px] font-bold uppercase tracking-[0.2em] font-poppins mt-2 text-center max-w-xs leading-loose">
              {filterType === "ALL" 
                ? "Search yielded no results. Create a new test to populate the catalog." 
                : `No active ${filterType.toLowerCase()} tests identified under this criteria.`}
            </p>
            <button 
              onClick={() => navigate("/admin/tests/add-new-test")} 
              className="mt-8 text-[10px] font-black text-[#21b731] hover:text-[#1a9227] uppercase tracking-[0.3em] font-poppins border-b-2 border-[#21b731] pb-1 transition-all"
            >
              Create New Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------------- HELPER COMPONENTS ---------------------- */

const FilterTabWithDropdown = ({ id, label, icon, activeFilter, setFilter, counts, activeColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = activeFilter === id || activeFilter.startsWith(`${id}:`);
  const subType = activeFilter.includes(":") ? activeFilter.split(":")[1] : "ALL";

  const options = [
    { id: "ALL", label: `All ${label}`, count: counts.all },
    { id: "PAID", label: "Paid Only", count: counts.paid },
    { id: "FREE", label: "Free Only", count: counts.free },
  ];

  return (
    <div className="relative flex-1 group">
      <div className="flex h-full items-stretch">
        <button 
          onClick={() => setFilter(id)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all border ${
            isActive 
              ? `${activeColor} border-white/20 rounded-none hover:brightness-110` 
              : 'bg-white text-[#7e7e7e] border-slate-200 hover:bg-slate-50 rounded-none'
          }`}
        >
          <div className="scale-110">{icon}</div>
          <span className="hidden sm:inline">
            {isActive && subType !== "ALL" ? subType : label}
          </span>
          <span className="sm:hidden">{label}</span>
        </button>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 transition-all border-l ${
            isActive 
              ? `${activeColor} border-white/20 hover:brightness-110 rounded-none` 
              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 rounded-none'
          }`}
        >
          <ChevronDown size={16} strokeWidth={3} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl z-50 p-1 min-w-[120px]"
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setFilter(opt.id === "ALL" ? id : `${id}:${opt.id}`);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 text-[8.5px] font-black uppercase tracking-widest transition-all ${
                  subType === opt.id 
                  ? (id === 'MOCK' ? 'bg-[#21b731] text-white' : 'bg-amber-500 text-white') 
                  : `text-slate-600 ${id === 'MOCK' ? 'hover:bg-emerald-50 hover:text-[#21b731]' : 'hover:bg-amber-50 hover:text-amber-600'}`
                }`}
              >
                <div className="flex items-center gap-2">
                  {subType === opt.id && <Check size={10} />}
                  {opt.label}
                </div>
                <span className="text-[7px] text-slate-300">({opt.count})</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageMocktests;