// frontend/src/pages/AllMockTests.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { IoSearch, IoFunnel, IoClose, IoChevronForward } from "react-icons/io5";

import {
  fetchPublicMockTests,
  setPublicCategoryFilter,
  setPublicSearch,
} from "../redux/studentSlice";
import { fetchCategories } from "../redux/categorySlice";
import FiltersPanel from "../components/FiltersPanel";
import MockTestCard from "../components/MockTestCard";

export default function AllMockTests({ isEmbedded = false }) {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { publicMocktests, publicStatus, filters } = useSelector(
    (state) => state.students,
  );
  const { items: categories, loading: categoriesLoading } = useSelector(
    (state) => state.category,
  );

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [testTypeFilter, setTestTypeFilter] = useState("all");

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("q");
    if (categoryFromUrl) dispatch(setPublicCategoryFilter(categoryFromUrl));
    if (searchFromUrl) dispatch(setPublicSearch(searchFromUrl));
  }, [dispatch, searchParams]);

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

  const handleSelectCategory = (catId) => {
    dispatch(setPublicCategoryFilter(catId));
    setIsFilterPanelOpen(false);
  };

  const sortedAndFilteredTests = useMemo(() => {
    if (!publicMocktests) return [];
    let processed = [...publicMocktests].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    const now = new Date();

    return processed.filter((test) => {
      const isGrand =
        test.isGrandTest === true ||
        test.title?.toLowerCase().includes("grand");
      const eventDate = new Date(test.scheduledFor || test.availableFrom);
      const isUpcoming = eventDate > now;

      if (testTypeFilter === "mock") return !isGrand;
      if (testTypeFilter === "grand_upcoming") return isGrand && isUpcoming;
      return true;
    });
  }, [publicMocktests, testTypeFilter]);

  return (
    <div
      className={`min-h-screen ${isEmbedded ? "bg-transparent" : "bg-[#f1f5f9] pt-24 pb-12"}`}
    >
      <div
        className={
          isEmbedded ? "w-full" : "max-w-[1400px] mx-auto px-4 md:px-6"
        }
      >
        {/* TOP HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Explore All Mock Tests
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Boost your preparation with our comprehensive test series.
            </p>
          </div>

          <div className="relative w-full md:w-[400px]">
            <IoSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              value={filters.q}
              onChange={(e) => dispatch(setPublicSearch(e.target.value))}
              placeholder="Search by exam or subject..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* SIDEBAR */}
          <aside className="hidden md:block w-72 flex-shrink-0 space-y-6">
            {/* Exam Type Sidebar Section */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Exam Type
                </h3>
              </div>
              <div className="p-1.5">
                {[
                  { id: "all", label: "All Mock Tests" },
                  { id: "mock", label: "Chapter Tests" },
                  { id: "grand_upcoming", label: "Full Length Tests" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTestTypeFilter(opt.id)}
                    className={`w-full text-left px-4 py-2.5 rounded text-sm font-medium flex items-center justify-between group transition-all ${
                      testTypeFilter === opt.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                    <IoChevronForward
                      className={
                        testTypeFilter === opt.id
                          ? "text-white"
                          : "text-slate-300"
                      }
                      size={14}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category Sidebar Section (Removed dark theme) */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Select Category
                </h3>
              </div>
              <div className="p-2">
                <FiltersPanel
                  categories={categories}
                  loading={categoriesLoading}
                  selectedCategory={filters.category}
                  onSelectCategory={handleSelectCategory}
                  variant="light" // Use light variant for professional look
                />
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">
                Found {sortedAndFilteredTests.length} available tests
              </span>
              <button
                onClick={() => setIsFilterPanelOpen(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium"
              >
                <IoFunnel size={16} /> Filters
              </button>
            </div>

            {publicStatus === "loading" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-white border border-slate-200 animate-pulse rounded-lg"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAndFilteredTests.length > 0 ? (
                  sortedAndFilteredTests.map((test) => (
                    <MockTestCard
                      key={test._id}
                      test={test}
                      isEmbedded={isEmbedded}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 bg-white border border-dashed border-slate-300 rounded-lg text-center">
                    <p className="text-slate-500 font-medium">
                      No tests match your search criteria.
                    </p>
                    <button
                      onClick={() => {
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
            )}
          </main>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isFilterPanelOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsFilterPanelOpen(false)}
          />
          <div className="relative w-72 bg-white h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Filters</h2>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className="p-1.5 bg-slate-100 rounded-full"
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">
                  Exam Types
                </h3>
                <div className="space-y-2">
                  {["all", "mock", "grand_upcoming"].map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        setTestTypeFilter(id);
                        setIsFilterPanelOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 rounded text-sm ${testTypeFilter === id ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600"}`}
                    >
                      {id === "all"
                        ? "All Tests"
                        : id === "mock"
                          ? "Chapter Tests"
                          : "Grand Tests"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">
                  Categories
                </h3>
                <FiltersPanel
                  categories={categories}
                  loading={categoriesLoading}
                  selectedCategory={filters.category}
                  onSelectCategory={handleSelectCategory}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
