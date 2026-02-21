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

  const selectedCategoryName = useMemo(() => {
    if (!filters.category) return null;
    return categories.find((c) => c.slug === filters.category)?.name || filters.category;
  }, [filters.category, categories]);

  return (
    <div className={`min-h-screen ${isEmbedded ? "bg-transparent" : "bg-[#f1f5f9] pt-24 pb-12"}`}>
      <div className={isEmbedded ? "w-full" : "max-w-[1400px] mx-auto px-4 md:px-6"}>

        {/* TOP HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Explore All Mock Tests
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Boost your preparation with our comprehensive test series.
            </p>
          </div>
          <div className="relative w-full md:w-[400px]">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by exam or subject..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* ── CATEGORIES GRID ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <IoApps size={18} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              Select Category
            </h2>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* ALL button */}
              <button
                onClick={() => handleSelectCategory("")}
                className={`relative flex flex-col items-center justify-end h-28 rounded-xl border-2 overflow-hidden transition-all group
                  ${!filters.category
                    ? "border-blue-600 ring-2 ring-blue-200 shadow-md"
                    : "border-slate-200 hover:border-blue-400 hover:shadow-md"
                  }`}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                  <IoApps size={36} className={!filters.category ? "text-blue-600" : "text-slate-400 group-hover:text-blue-400"} />
                </div>
                <div className={`relative w-full px-2 py-2 text-center text-xs font-bold uppercase tracking-wide
                  ${!filters.category
                    ? "bg-blue-600 text-white"
                    : "bg-white/90 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700"
                  }`}>
                  All
                </div>
              </button>

              {/* Category cards */}
              {categories.map((cat) => {
                const isSelected = filters.category === cat.slug;
                return (
                  <button
                    key={cat._id}
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`relative flex flex-col items-center justify-end h-28 rounded-xl border-2 overflow-hidden transition-all group
                      ${isSelected
                        ? "border-blue-600 ring-2 ring-blue-200 shadow-md"
                        : "border-slate-200 hover:border-blue-400 hover:shadow-md"
                      }`}
                  >
                    {/* Image or gradient background */}
                    <div className="absolute inset-0 bg-slate-100">
                      {cat.image ? (
                        <img
                          src={getImageUrl(cat.image)}
                          alt={cat.name}
                          onError={handleImageError}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <span className="text-3xl font-black text-slate-300">
                            {cat.name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      {/* Subtle overlay */}
                      <div className={`absolute inset-0 transition-opacity ${isSelected ? "bg-blue-600/10" : "bg-black/0 group-hover:bg-black/5"}`} />
                    </div>

                    {/* Name label at bottom */}
                    <div className={`relative w-full px-2 py-2 text-center text-xs font-bold uppercase tracking-wide
                      ${isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white/90 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700"
                      }`}>
                      {cat.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MOCK TESTS ── */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">
            {selectedCategoryName
              ? `${selectedCategoryName} — ${regularTests.length} Mock Test${regularTests.length !== 1 ? "s" : ""}`
              : `Found ${regularTests.length} Mock Test${regularTests.length !== 1 ? "s" : ""}`}
          </span>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
          >
            <IoFunnel size={16} /> Filters
          </button>
        </div>

        {publicStatus === "loading" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white border border-slate-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularTests.length > 0 ? (
                regularTests.map((test) => (
                  <MockTestCard key={test._id} test={test} isEmbedded={isEmbedded} />
                ))
              ) : (
                <div className="col-span-full py-20 bg-white border border-dashed border-slate-300 rounded-xl text-center">
                  <p className="text-slate-500 font-medium">
                    No tests match your search criteria.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      dispatch(setPublicSearch(""));
                      dispatch(setPublicCategoryFilter(""));
                    }}
                    className="mt-3 text-blue-600 font-bold hover:underline text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* ── GRAND TESTS SECTION (always visible) ── */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                  <IoTrophy className="text-amber-500" size={18} />
                  <h2 className="text-sm font-bold text-amber-800 uppercase tracking-widest">
                    Grand Tests
                  </h2>
                  {grandTests.length > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {grandTests.length}
                    </span>
                  )}
                </div>
                <div className="h-px flex-1 bg-amber-100" />
              </div>

              {grandTests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grandTests.map((test) => (
                    <MockTestCard key={test._id} test={test} isEmbedded={isEmbedded} />
                  ))}
                </div>
              ) : (
                <div className="py-12 bg-gradient-to-br from-amber-50 to-orange-50 border border-dashed border-amber-200 rounded-xl text-center">
                  <IoTrophy size={36} className="mx-auto text-amber-300 mb-3" />
                  <p className="text-amber-700 font-semibold text-sm">Grand Tests Coming Soon!</p>
                  <p className="text-amber-500 text-xs mt-1 max-w-xs mx-auto">
                    Full-length comprehensive exams will appear here once available.
                  </p>
                </div>
              )}
            </div>
          </>
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
