import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import api from "../../api/axios";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  let cleaned = imagePath.trim();
  if (!cleaned.startsWith("/")) cleaned = "/" + cleaned;
  return `${api.defaults.baseURL}${cleaned}`;
};

const CategoriesSection = ({ categories = [], loading, onCategoryClick }) => {
  const scrollRef = useRef(null);

  // 1. DATABASE DYNAMIC CATEGORIES (Tabs)
  const categoryTabs = useMemo(() => {
    if (!categories.length) return [];
    const uniqueSlugs = new Map();
    categories.forEach((item) => {
      const slug =
        item.categorySlug || item.category?.slug || item.slug || "others";
      const name =
        item.categoryName || item.category?.name || item.name || "Exam";
      if (!uniqueSlugs.has(slug.toLowerCase())) {
        uniqueSlugs.set(slug.toLowerCase(), name.toUpperCase());
      }
    });
    return Array.from(uniqueSlugs).map(([id, label]) => ({
      id,
      label: label.includes("EXAM") ? label : `${label} EXAMS`,
    }));
  }, [categories]);

  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (categoryTabs.length > 0 && !activeCategory) {
      setActiveCategory(categoryTabs[0].id);
    }
  }, [categoryTabs, activeCategory]);

  const filteredExams = useMemo(() => {
    if (!activeCategory) return [];
    return categories.filter((item) => {
      const slug =
        item.categorySlug || item.category?.slug || item.slug || "others";
      return slug.toLowerCase() === activeCategory.toLowerCase();
    });
  }, [categories, activeCategory]);

  // 2. SCROLL LOGIC: Right & Left buttons function
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo =
        direction === "left" ? scrollLeft - 200 : scrollLeft + 200;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section id="categories" className="py-20 bg-white scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-left mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
            Popular Exams
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            Get exam-ready with concepts, questions and study notes as per the
            latest pattern
          </p>
        </div>

        {/* ================= TABS SCROLLBAR AREA ================= */}
        <div className="relative mb-12 group">
          {/* Left Arrow Button */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-[-15px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-cyan-500 hover:scale-110 transition active:scale-95 md:flex hidden"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>

          {/* Tab Container */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-50 flex items-center relative overflow-hidden">
            <div
              ref={scrollRef}
              className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth w-full py-1 px-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-8 py-3 rounded-full text-[13px] font-bold tracking-tight transition-all duration-300 border-2 whitespace-nowrap ${
                    activeCategory === tab.id
                      ? "bg-[#00d1ff] border-[#00d1ff] text-white shadow-xl shadow-cyan-100 scale-105"
                      : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-[-15px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-cyan-500 hover:scale-110 transition active:scale-95 md:flex hidden"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>

        {/* ================= CONTENT GRID ================= */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-12 h-12 text-[#00d1ff] animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Updating Exams...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((item) => {
              const testIcon = getImageUrl(item.thumbnail || item.image);
              const testLabel =
                item.title || item.subcategory || item.name || "Test Title";
              return (
                <div
                  key={item._id}
                  onClick={() => onCategoryClick(item)}
                  className="group flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] hover:border-cyan-100 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 flex-none rounded-full bg-slate-50 border border-slate-50 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-cyan-50/50">
                      {testIcon ? (
                        <img
                          src={testIcon}
                          alt={testLabel}
                          className="w-7 h-7 object-contain group-hover:scale-110 transition duration-500"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-slate-200 rounded-full" />
                      )}
                    </div>
                    <h3 className="text-slate-700 font-bold text-[14px] md:text-[15px] group-hover:text-blue-500 transition-colors uppercase leading-snug tracking-tight">
                      {testLabel}
                    </h3>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-200 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all"
                  />
                </div>
              );
            })}

            {/* Always visible Explore All card */}
            {filteredExams.length > 0 && (
              <div className="flex items-center justify-center p-5 bg-white border border-slate-100 border-dashed rounded-2xl hover:bg-slate-50 group transition-all">
                <span className="text-[#00d1ff] font-extrabold text-sm uppercase tracking-wide group-hover:underline">
                  Explore all exams
                </span>
              </div>
            )}
          </div>
        )}

        {/* Handling Empty Selection */}
        {!loading && filteredExams.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-50 rounded-3xl">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Ee category lo data ledu bro.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
