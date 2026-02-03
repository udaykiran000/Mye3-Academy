// frontend/src/pages/AllMockTests.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  IoSearch,
  IoFunnel,
  IoClose,
  IoGridOutline,
  IoLayersOutline,
} from "react-icons/io5";

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

  const { publicMocktests, publicStatus, publicError, filters } = useSelector(
    (state) => state.students
  );

  const { items: categories, loading: categoriesLoading } = useSelector(
    (state) => state.category
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

  const buildQuery = (filters) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    return params.toString() ? `?${params.toString()}` : "";
  };

  useEffect(() => {
    const qs = buildQuery(filters);
    dispatch(fetchPublicMockTests(qs));
  }, [dispatch, filters]);

  const handleSelectCategory = (catId) => {
    dispatch(setPublicCategoryFilter(catId));
    setIsFilterPanelOpen(false);
  };

  const sortedAndFilteredTests = useMemo(() => {
    if (!publicMocktests) return [];
    const sorted = [...publicMocktests].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const now = new Date();
    return sorted.filter((test) => {
      const isGrand =
        test.isGrandTest === true ||
        test.title?.toLowerCase().includes("grand");
      const eventDate = new Date(test.scheduledFor || test.availableFrom);
      const isUpcoming = eventDate > now;

      switch (testTypeFilter) {
        case "mock":
          return !isGrand;
        case "grand_upcoming":
          return isGrand && isUpcoming;
        default:
          return true;
      }
    });
  }, [publicMocktests, testTypeFilter]);

  /* ============================================================
      UI COMPONENTS (Matching your Screenshot)
  ============================================================ */

  const TestTypeFilter = () => (
    <div className="mb-6 bg-[#94a3b8] rounded-2xl p-5 shadow-sm text-white">
      <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-2">
        <IoLayersOutline size={20} />
        <h3 className="font-bold text-sm uppercase tracking-wider text-white">
          Test Category
        </h3>
      </div>
      <div className="space-y-2">
        {[
          { id: "all", label: "All Tests" },
          { id: "mock", label: "Standard Mock" },
          { id: "grand_upcoming", label: "Grand Tests" },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTestTypeFilter(opt.id)}
            className={`w-full text-left px-4 py-2.5 rounded-xl transition-all font-medium text-sm flex items-center gap-2 ${
              testTypeFilter === opt.id
                ? "bg-[#6366f1] text-white shadow-md translate-x-1"
                : "hover:bg-white/10 text-white/80"
            }`}
          >
            <IoGridOutline size={14} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${
        isEmbedded ? "bg-transparent" : "bg-slate-50 pt-24 pb-16"
      }`}
    >
      <div className={isEmbedded ? "w-full" : "max-w-7xl mx-auto px-4 md:px-8"}>
        {/* HEADER SECTION (Matching image gradients) */}
        {!isEmbedded && (
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-indigo-300 via-indigo-500 to-purple-400 bg-clip-text text-transparent">
              Master Your Future
            </h1>
            <p className="text-indigo-400 font-medium">
              Pick a test, challenge yourself, and excel.
            </p>
          </header>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* SIDEBAR */}
          <aside className="hidden md:block">
            <TestTypeFilter />
            {/* Dark Sidebar Style for Categories */}
            <div className="bg-[#0f172a] rounded-2xl overflow-hidden shadow-xl border border-slate-800">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-400 rounded-full"></div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                  Categories
                </h3>
              </div>
              <div className="p-2">
                <FiltersPanel
                  categories={categories}
                  loading={categoriesLoading}
                  selectedCategory={filters.category}
                  onSelectCategory={handleSelectCategory}
                  variant="dark" // Assuming your component can take a dark variant
                />
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="md:col-span-3">
            {/* SEARCH BAR (Minimalist style) */}
            <div className="relative mb-10">
              <IoSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                value={filters.q}
                onChange={(e) => dispatch(setPublicSearch(e.target.value))}
                placeholder="Search by exam name, subject..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm text-slate-700"
              />
              <button
                onClick={() => setIsFilterPanelOpen(true)}
                className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg"
              >
                <IoFunnel size={18} />
              </button>
            </div>

            {/* TEST CARDS GRID */}
            {publicStatus === "loading" ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">
                  Getting tests ready...
                </p>
              </div>
            ) : (
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                {sortedAndFilteredTests.length > 0 ? (
                  sortedAndFilteredTests.map((test) => (
                    <MockTestCard
                      key={test._id}
                      test={test}
                      isEmbedded={isEmbedded}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 text-lg">
                      No tests found matching your criteria.
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isFilterPanelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsFilterPanelOpen(false)}
          />
          <div className="relative w-80 bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-800 italic">
                FILTERS
              </h2>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className="p-1.5 bg-slate-100 rounded-full"
              >
                <IoClose size={24} />
              </button>
            </div>
            <TestTypeFilter />
            <FiltersPanel
              categories={categories}
              loading={categoriesLoading}
              selectedCategory={filters.category}
              onSelectCategory={handleSelectCategory}
            />
          </div>
        </div>
      )}
    </div>
  );
}
