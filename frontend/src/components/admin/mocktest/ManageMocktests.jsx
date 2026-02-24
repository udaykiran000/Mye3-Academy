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
    <div className="overflow-x-auto bg-white border border-slate-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#fdfdfd] border-b border-slate-200">
            <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins">Test Details</th>
            <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins">Category</th>
            <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-center">Pricing</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-center">Attempts</th>
          <th className="px-4 py-3 text-[10px] font-black text-[#3e4954] uppercase tracking-widest font-poppins text-center">Exam Specs</th>
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
                      <div className="flex gap-1 flex-shrink-0">
                         <span className={`px-1 py-0.5 text-[6.5px] font-black uppercase tracking-widest border ${
                             test.isGrandTest ? "bg-amber-500 text-white border-amber-600" : "bg-emerald-500 text-white border-emerald-600"
                         }`}>
                             {test.isGrandTest ? "Grand" : "Mock"}
                         </span>
                      </div>
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
                 <span className={`text-[10px] font-black px-1.5 py-1 border inline-block min-w-[50px] ${test.isFree ? 'bg-blue-500 text-white border-blue-600' : 'bg-indigo-600 text-white border-indigo-700'}`}>
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
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  {/* Status Toggle Integrated */}
                  <div className="flex flex-col items-center">
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
                    <span className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${test.isPublished ? 'text-[#21b731]' : 'text-slate-400'}`}>
                      {test.isPublished ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Actions Divider */}
                  <div className="h-8 w-[1px] bg-slate-100" />

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1.5">
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
    <div className="p-4 pt-2 bg-[#f8f9fa] min-h-screen">
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
          className="flex items-center justify-center gap-2.5 bg-[#21b731] text-white px-5 py-3 rounded-none shadow-lg shadow-green-100 hover:bg-[#1a9227] hover:-translate-y-0.5 transition-all duration-300 font-black text-[10px] uppercase tracking-widest active:scale-95"
        >
          <Plus size={16} strokeWidth={3} /> Register New Exam
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-stretch lg:items-end">
        {/* Type Filter Tabs */}
        <div className="space-y-2 flex-1 lg:max-w-md">
           <label className="text-[9px] font-black text-[#7e7e7e] uppercase tracking-[0.2em] font-poppins flex items-center gap-2">
              <Filter size={10} className="text-[#21b731]" /> Filter by Type
           </label>
           <div className="flex bg-slate-100 p-0.5 border border-slate-200">
              <button 
                  onClick={() => setFilterType("ALL")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${filterType === 'ALL' ? 'bg-white text-[#3e4954] shadow-sm' : 'text-[#7e7e7e] hover:text-[#3e4954]'}`}
              >
                  <List size={12} /> All
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
                 <ChevronRight size={12} className="rotate-90" />
              </div>
           </div>
        </div>
      </div>

      {/* DATA VIEW */}
      <div className="relative">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-100">
            <Loader2 className="animate-spin text-[#21b731] mb-4" size={48} strokeWidth={1.5} />
            <p className="text-[11px] font-black text-[#7e7e7e] uppercase tracking-[0.3em] font-poppins">Synchronizing Catalog...</p>
          </div>
        )}

        {hasError && (
          <div className="flex flex-col items-center justify-center py-20 bg-rose-50 border border-rose-100">
            <AlertCircle className="text-rose-500 mb-4" size={48} strokeWidth={1.5} />
            <h3 className="text-[14px] font-black text-rose-600 uppercase tracking-widest font-poppins">Synchronization Failed</h3>
            <p className="text-rose-400 text-[11px] mt-2 font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        {!isLoading && !hasError && filteredData.length > 0 && <MockTestTable tests={filteredData} />}

        {!isLoading && filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 flex items-center justify-center mb-6">
               <ClipboardList size={40} className="text-slate-200" />
            </div>
            <h3 className="text-[16px] font-black text-[#3e4954] uppercase tracking-tighter font-poppins">No Exams Found</h3>
            <p className="text-[#7e7e7e] text-[10px] font-bold uppercase tracking-[0.2em] font-poppins mt-2 text-center max-w-xs leading-loose">
              {filterType === "ALL" 
                ? "Search yielded no results. Register a new exam to populate the catalog." 
                : `No active ${filterType.toLowerCase()} components identified under this criteria.`}
            </p>
            <button 
              onClick={() => navigate("/admin/tests/add-new-test")} 
              className="mt-8 text-[10px] font-black text-[#21b731] hover:text-[#1a9227] uppercase tracking-[0.3em] font-poppins border-b-2 border-[#21b731] pb-1 transition-all"
            >
              Initialize Exam
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
    <div className="relative flex-1 group" onMouseLeave={() => setIsOpen(false)}>
      <div className="flex h-full">
        <button 
          onClick={() => setFilter(id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
            isActive ? `${activeColor}` : 'text-[#7e7e7e] hover:text-[#3e4954]'
          }`}
        >
          {icon} 
          <span className="hidden sm:inline">{subType === "ALL" ? label : subType}</span>
          <span className="sm:hidden">{label}</span>
        </button>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`px-1 transition-all border-l ${
            isActive ? `border-white/20 hover:bg-black/5` : 'border-slate-200 text-slate-400 hover:text-slate-600'
          } ${isActive ? activeColor : ''}`}
        >
          <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
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
                className={`w-full flex items-center justify-between px-2.5 py-2 text-[8px] font-black uppercase tracking-widest transition-all ${
                  subType === opt.id 
                  ? (id === 'MOCK' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600') 
                  : 'text-slate-500 hover:bg-slate-50'
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