// frontend/src/pages/AllMockTests.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { IoSearch, IoFunnel, IoClose, IoTrophy, IoApps } from "react-icons/io5";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

import { useDebounce } from "../hooks/useDebounce";
import {
  fetchPublicMockTests,
  setPublicCategoryFilter,
  setPublicSearch,
} from "../redux/studentSlice";
import { fetchCategories } from "../redux/categorySlice";
import MockTestCard from "../components/MockTestCard";
import PremiumCard from "../components/PremiumTestCard";

const getCategoryTheme = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("banking")) return { border: "border-blue-200", text: "text-blue-600", bg: "bg-blue-50", icon: "text-blue-500" };
  if (n.includes("ssc")) return { border: "border-rose-200", text: "text-rose-600", bg: "bg-rose-50", icon: "text-rose-500" };
  if (n.includes("railway") || n.includes("rrb")) return { border: "border-orange-200", text: "text-orange-600", bg: "bg-orange-50", icon: "text-orange-500" };
  if (n.includes("constable") || n.includes("police")) return { border: "border-emerald-200", text: "text-emerald-600", bg: "bg-emerald-50", icon: "text-emerald-500" };
  if (n.includes("teaching") || n.includes("tet")) return { border: "border-purple-200", text: "text-purple-600", bg: "bg-purple-50", icon: "text-purple-500" };
  if (n.includes("defence")) return { border: "border-slate-300", text: "text-slate-700", bg: "bg-slate-100", icon: "text-slate-600" };
  return { border: "border-indigo-200", text: "text-indigo-600", bg: "bg-indigo-50", icon: "text-indigo-500" };
};

export default function AllMockTests({ isEmbedded = false }) {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { publicMocktests, publicStatus, filters } = useSelector(
    (state) => state.students
  );
  const { items: categories, loading: categoriesLoading } = useSelector(
    (state) => state.category
  );

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.q || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("q");
    if (categoryFromUrl) dispatch(setPublicCategoryFilter(categoryFromUrl));
    if (searchFromUrl) {
      dispatch(setPublicSearch(searchFromUrl));
      setSearchTerm(searchFromUrl);
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    if (debouncedSearchTerm !== filters.q) {
      dispatch(setPublicSearch(debouncedSearchTerm));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, dispatch]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const buildQuery = useCallback((filters) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    return params.toString() ? `?${params.toString()}` : "";
  }, []);

  useEffect(() => {
    const qs = buildQuery(filters);
    dispatch(fetchPublicMockTests(qs));
  }, [dispatch, filters, buildQuery]);

  const handleSelectCategory = (slug) => {
    dispatch(setPublicCategoryFilter(slug));
    setIsFilterPanelOpen(false);
  };

  // Regular mock tests (non-grand)
  const regularTests = useMemo(() => {
    if (!publicMocktests) return [];
    return [...publicMocktests]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((t) => !t.isGrandTest);
  }, [publicMocktests]);

  // Grand tests
  const grandTests = useMemo(() => {
    if (!publicMocktests) return [];
    return [...publicMocktests]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((t) => t.isGrandTest === true);
  }, [publicMocktests]);

  const type = searchParams.get("type"); // 'mock' or 'grand' or null

  const selectedCategoryName = useMemo(() => {
    if (!filters.category) return null;
    return categories.find((c) => c.slug === filters.category)?.name || filters.category;
  }, [filters.category, categories]);

  return (
    <div className={`min-h-screen ${isEmbedded ? "bg-transparent" : "bg-[#f4f7fa] pt-20 pb-16"}`}>
      <div className={isEmbedded ? "w-full" : "max-w-[1440px] mx-auto px-6 md:px-12"}>

        {/* TOP HEADER & SEARCH - Premium Revamp */}
        <div className="flex flex-col xl:flex-row items-end justify-between mb-12 gap-8 pt-8">
          <div className="relative group text-left w-full xl:w-auto">
            <div className="absolute -left-6 top-0 w-24 h-24 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-2 uppercase">
              {type === 'mock' ? 'Mock Series' : type === 'grand' ? 'Grand Series' : 'Exam Central'}
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-blue-600 rounded-full" />
              <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] mt-1">
                {type === 'mock' ? 'Top Rated Practice Exams' : type === 'grand' ? 'All India Ranking Tests' : 'Premium Test Collection'}
              </p>
            </div>
          </div>

          <div className="relative w-full xl:w-[540px] group">
            <div className="absolute inset-0 bg-blue-600/10 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-[2rem] shadow-sm focus-within:shadow-[0_20px_50px_rgba(0,0,0,0.1)] focus-within:bg-white focus-within:border-blue-500 transition-all duration-500 overflow-hidden p-1.5 translate-y-0 hover:-translate-y-1">
               <div className="pl-6 pr-2 py-4 text-blue-600">
                  <IoSearch size={22} />
               </div>
               <input
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search by exam name, subject, or tag..."
                 className="w-full px-2 py-2 outline-none text-xs font-black text-slate-700 placeholder:text-slate-400 uppercase tracking-widest bg-transparent"
               />
               <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 transition-all active:scale-95 ml-2">
                  Find Exams
               </button>
            </div>
          </div>
        </div>

        <div className="mb-14 overflow-visible">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                   <IoApps size={14} />
                </div>
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">
                  Featured Categories
                </h2>
             </div>
             <div className="h-px flex-1 bg-slate-100 ml-6 hidden md:block" />
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {/* ALL button */}
              <button
                onClick={() => handleSelectCategory("")}
                className={`relative group flex flex-col items-center justify-center p-4 rounded-[2rem] border-2 transition-all duration-500
                  ${!filters.category
                    ? "bg-blue-600 border-blue-600 shadow-2xl shadow-blue-200 scale-105"
                    : "bg-white border-indigo-200 shadow-sm hover:shadow-xl hover:scale-105"
                  }`}
              >
                <div className={`p-2.5 rounded-2xl mb-2 transition-colors ${!filters.category ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-400 group-hover:bg-blue-50 group-hover:text-blue-600"}`}>
                  <IoApps size={22} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${!filters.category ? "text-white" : "text-slate-500"}`}>
                  Explore All
                </span>
              </button>

              {/* Category cards */}
              {categories.map((cat) => {
                const isSelected = filters.category === cat.slug;
                return (
                   <button
                    key={cat._id}
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`relative group flex flex-col items-center justify-center p-3 rounded-[2rem] border-2 transition-all duration-500
                      ${isSelected
                        ? "bg-blue-600 border-blue-600 shadow-2xl shadow-blue-200 scale-105"
                        : `bg-white ${getCategoryTheme(cat.name).border} shadow-sm hover:shadow-xl hover:scale-105`
                      }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden mb-2.5 bg-slate-50 p-1 border border-slate-100 group-hover:border-blue-200 transition-colors`}>
                      {cat.image ? (
                        <img
                          src={getImageUrl(cat.image)}
                          alt={cat.name}
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white text-xs font-black text-slate-300 uppercase">
                          {cat.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest text-center px-1 truncate w-full ${isSelected ? "text-white" : "text-slate-500"}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {publicStatus === "loading" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-80 bg-slate-50 border border-slate-100 animate-pulse rounded-[2rem]" />
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            {(type === 'mock' || !type) && (
              <div className="mb-12">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                       <IoApps size={14} />
                    </div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                       Mock Exams
                       <span className="ml-2 text-[10px] text-slate-400 font-bold">({regularTests.length})</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsFilterPanelOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    <IoFunnel size={12} /> Filter
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {regularTests.length > 0 ? (
                    regularTests.map((test) => (
                      <MockTestCard key={test._id} test={test} isEmbedded={isEmbedded} />
                    ))
                  ) : (
                    <div className="col-span-full py-16 bg-white border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                         <IoSearch size={24} />
                      </div>
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">No Tests</h3>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          dispatch(setPublicSearch(""));
                          dispatch(setPublicCategoryFilter(""));
                        }}
                        className="mt-4 text-blue-600 font-black uppercase tracking-widest text-[10px] hover:underline"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── GRAND TESTS SECTION ── */}
            {(type === 'grand' || !type) && (
              <div className="mt-20 bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-2 bg-white rounded-full border border-slate-100 shadow-sm text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                  Premium Selection
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-6 py-3 rounded-2xl shadow-[0_10px_40px_rgba(79,70,229,0.4)] border border-white/20 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    <IoTrophy size={18} className="text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.8)] animate-pulse relative z-10" />
                    <h2 className="text-[13px] font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
                      Grand Test Series
                    </h2>
                  </div>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                {grandTests.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {grandTests.map((test) => (
                      <PremiumCard key={test._id} test={test} />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4 border border-slate-100 shadow-sm">
                       <IoTrophy size={28} />
                    </div>
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Coming Soon</h3>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE DRAWER */}
      {isFilterPanelOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFilterPanelOpen(false)} />
          <div className="relative w-80 bg-white h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Categories</h2>
              <button onClick={() => setIsFilterPanelOpen(false)} className="p-1.5 bg-slate-100 rounded-full">
                <IoClose size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* All */}
              <button
                onClick={() => handleSelectCategory("")}
                className={`flex flex-col items-center justify-end h-24 rounded-xl border-2 overflow-hidden transition-all
                  ${!filters.category ? "border-blue-600" : "border-slate-200"}`}
              >
                <div className="flex-1 w-full flex items-center justify-center bg-blue-50">
                  <IoApps size={28} className="text-blue-400" />
                </div>
                <div className={`w-full py-1.5 text-center text-xs font-bold uppercase ${!filters.category ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
                  All
                </div>
              </button>
              {categories.map((cat) => {
                const isSelected = filters.category === cat.slug;
                return (
                  <button
                    key={cat._id}
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`flex flex-col items-center justify-end h-24 rounded-xl border-2 overflow-hidden transition-all
                      ${isSelected ? "border-blue-600" : "border-slate-200"}`}
                  >
                    <div className="flex-1 w-full relative bg-slate-100">
                      {cat.image
                        ? <img src={getImageUrl(cat.image)} alt={cat.name} onError={handleImageError} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><span className="text-2xl font-black text-slate-300">{cat.name?.charAt(0)}</span></div>
                      }
                    </div>
                    <div className={`w-full py-1.5 text-center text-xs font-bold uppercase ${isSelected ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
                      {cat.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
