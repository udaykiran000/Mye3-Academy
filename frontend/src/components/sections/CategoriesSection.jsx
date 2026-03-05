import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";

const toTitleCase = (str = "") =>
  str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const CategoriesSection = ({ categories = [], loading }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  /* ── 1. Build category tabs ── */
  const categoryTabs = useMemo(() => {
    if (!categories.length) return [];
    const map = new Map();
    categories.forEach((item) => {
      const slug = item.categorySlug || item.category?.slug || item.slug || "others";
      const name = item.categoryName || item.category?.name || item.name || "Exam";
      if (!map.has(slug.toLowerCase())) map.set(slug.toLowerCase(), name);
    });
    return Array.from(map).map(([id, label]) => {
      const base = toTitleCase(label);
      return { id, label: base.toLowerCase().includes("exam") ? base : `${base} Exams` };
    });
  }, [categories]);

  const [activeCategory, setActiveCategory] = useState("");
  useEffect(() => {
    if (categoryTabs.length > 0 && !activeCategory) setActiveCategory(categoryTabs[0].id);
  }, [categoryTabs, activeCategory]);

  const filteredExams = useMemo(() => {
    if (!activeCategory) return [];
    return categories.filter((item) => {
      const slug = item.categorySlug || item.category?.slug || item.slug || "others";
      return slug.toLowerCase() === activeCategory.toLowerCase();
    });
  }, [categories, activeCategory]);

  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  /* ── RENDER ── */
  return (
    /* Testbook uses a very light gray section background */
    <section id="categories" className="py-10 bg-slate-50 scroll-mt-24">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">

        {/* Header — matches Testbook exactly */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-800">Popular Exams</h2>
          <p className="text-sm text-slate-500 mt-1">
            Get exam-ready with concepts, questions and study notes as per the latest pattern
          </p>
        </div>

        {/* Tabs — pill style, cyan active */}
        <div className="relative mb-5">
          <button
            onClick={() => scroll("left")}
            className="absolute left-[-18px] top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white border border-slate-200 rounded-full shadow flex items-center justify-center text-slate-400 hover:text-cyan-500 transition hidden md:flex"
          >
            <ChevronLeft size={14} />
          </button>

          <div
            ref={scrollRef}
            className="flex items-center gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`#categories .scroll-tabs::-webkit-scrollbar{display:none}`}</style>
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  activeCategory === tab.id
                    ? "bg-cyan-500 border-cyan-500 text-white"
                    : "bg-white border-slate-300 text-slate-600 hover:border-cyan-400 hover:text-cyan-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute right-[-18px] top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white border border-slate-200 rounded-full shadow flex items-center justify-center text-slate-400 hover:text-cyan-500 transition hidden md:flex"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <p className="text-slate-400 text-sm">Loading exams…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredExams.map((item) => {
                const testIcon = getImageUrl(item.thumbnail || item.image);
                /* Title Case the exam name — Testbook style */
                const rawLabel = item.title || item.subcategory || item.name || "Test";
                const testLabel = toTitleCase(rawLabel);

                const handleClick = () => {
                  const effective =
                    item.discountPrice > 0 && Number(item.discountPrice) < Number(item.price)
                      ? Number(item.discountPrice)
                      : Number(item.price);
                  const isFree = item.isFree === true || effective <= 0;
                  navigate(isFree ? `/student/instructions/${item._id}` : `/mocktests/${item._id}`);
                };

                const price = item.discountPrice > 0 ? item.discountPrice : item.price;
                const isFree = item.isFree === true || price <= 0;

                return (
                  /* Card — white, rounded-xl, subtle shadow, ~72px tall */
                  <div
                    key={item._id}
                    onClick={handleClick}
                    className="group flex items-center gap-4 px-5 py-[18px] bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
                  >
                    {/* Circular icon ~40px — exactly like Testbook */}
                    <div className="w-10 h-10 flex-none rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {testIcon ? (
                        <img
                          src={testIcon}
                          alt={testLabel}
                          className="w-9 h-9 object-contain rounded-full"
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-500">
                          {testLabel.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Name — Testbook has no subtitle, just exam name + arrow */}
                    <span className="flex-1 text-[15px] font-semibold text-slate-800 group-hover:text-cyan-600 transition-colors leading-tight truncate">
                      {testLabel}
                    </span>

                    {/* Price/Free badge */}
                    {!isFree && (
                      <span className="text-[11px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded font-semibold shrink-0">
                        ₹{price}
                      </span>
                    )}

                    {/* Arrow */}
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-cyan-500 shrink-0 transition-colors" />
                  </div>
                );
              })}
            </div>

            {/* "Explore all exams" — bottom right plain link, exactly Testbook */}
            {filteredExams.length > 0 && (
              <div className="mt-4 text-right">
                <Link
                  to="/mocktests"
                  className="text-sm text-cyan-600 font-medium hover:underline inline-flex items-center gap-1 hover:text-cyan-700 transition"
                >
                  Explore all exams
                </Link>
              </div>
            )}
          </>
        )}

        {!loading && filteredExams.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No exams found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
