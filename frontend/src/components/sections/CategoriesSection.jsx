import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";


const CategoriesSection = ({ categories = [], loading, onCategoryClick }) => {
  const navigate = useNavigate();
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
    <section id="categories" className="py-20 bg-transparent scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-left mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase">
            Popular <span className="text-emerald-500">Exams</span>
          </h2>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px] opacity-70">
            Premium Exam Series • Concept Mastery • AI Analytics
          </p>
        </div>

        {/* ================= TABS SCROLLBAR AREA ================= */}
        <div className="relative mb-12 group">
          {/* Left Arrow Button */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-[-15px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:scale-110 transition active:scale-95 md:flex hidden"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Tab Container */}
          <div className="bg-transparent flex items-center relative overflow-hidden mb-4">
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
                  className={`px-6 py-3 rounded-xl text-[11px] font-black tracking-[0.1em] transition-all duration-300 border-2 whitespace-nowrap uppercase ${
                    activeCategory === tab.id
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-105"
                      : "bg-white border-slate-200 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-500"
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
            className="absolute right-[-15px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:scale-110 transition active:scale-95 md:flex hidden"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* ================= CONTENT GRID ================= */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
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
              
              // Direct navigation logic
              const handleTestClick = () => {
                const effectivePrice = (item.discountPrice > 0 && Number(item.discountPrice) < Number(item.price)) 
                  ? Number(item.discountPrice) 
                  : Number(item.price);
                const isFree = item.isFree === true || effectivePrice <= 0;

                if (isFree) {
                  navigate(`/student/instructions/${item._id}`);
                } else {
                  navigate(`/mocktests/${item._id}`);
                }
              };

              const price = (item.discountPrice > 0) ? item.discountPrice : item.price;
              const isFree = item.isFree === true || price <= 0;

              return (
                <div
                  key={item._id}
                  onClick={handleTestClick}
                  className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] hover:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.08)] hover:border-emerald-500 transition-all duration-500 cursor-pointer relative overflow-hidden shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex-none rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:bg-emerald-50">
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
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-slate-800 font-black text-[15px] group-hover:text-emerald-600 transition-colors uppercase leading-tight tracking-tight">
                          {testLabel}
                        </h3>
                        {isFree ? (
                          <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-black uppercase">Free</span>
                        ) : (
                          <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-black uppercase">₹{price}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Mock Test Series</p>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-200 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                </div>
              );
            })}

            {/* Always visible Explore All card */}
            {filteredExams.length > 0 && (
              <Link
                to="/mocktests"
                className="flex items-center justify-center p-5 bg-white border border-slate-200 border-dashed rounded-[24px] hover:bg-emerald-50 hover:border-emerald-500 hover:border-solid group transition-all duration-500 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                   <span className="text-emerald-600 font-black text-[13px] uppercase tracking-[0.1em] group-hover:scale-105 transition-transform">
                     View All Exams
                   </span>
                   <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:translate-x-1 transition-all">
                      <ChevronRight size={14} strokeWidth={3} />
                   </div>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Handling Empty Selection */}
        {!loading && filteredExams.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-50 rounded-3xl">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
No exams found in this category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
