// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  GraduationCap,
  Presentation,
  CheckCircle2,
} from "lucide-react";

import Navbar from "../components/Navbar";
import HeroSection from "../components/sections/HeroSection";
import FeaturesSection from "../components/sections/FeaturesSection";
import CategoriesSection from "../components/sections/CategoriesSection";
import FeaturedTestsSection from "../components/sections/FeaturedTestsSection";
import TestimonialsSection from "../components/sections/TestimonialsSection";

import MockTestCard from "../components/MockTestCard";
import PremiumTestCard from "../components/PremiumTestCard";

import { fetchCategories } from "../redux/categorySlice";
import { fetchPublicMockTests } from "../redux/studentSlice";

/* =========================================
   1. REDESIGNED: ROLE SELECTION SECTION
   ========================================= */
const RoleSelectionSection = ({ onNavigate }) => {
  return (
    <section className="py-24 relative bg-slate-200/30 overflow-hidden">
      {/* Soft Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* === STUDENT CARD === */}
          <div className="group relative p-6 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 mb-6 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <GraduationCap size={28} />
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tighter uppercase">
              For Students
            </h3>
            <p className="text-slate-500 mb-6 leading-relaxed font-medium text-sm">
              Unlock unlimited mock tests, get detailed performance analytics,
              and compete with peers nationwide.
            </p>

            <div className="space-y-3 mb-8">
              {[
                "Real-time Rankings",
                "Detailed Solutions",
                "Performance Graphs",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-[13px] font-bold text-slate-700 tracking-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onNavigate}
              className="w-full py-3.5 px-8 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group/btn"
            >
              Start Your Preparation <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* === INSTRUCTOR CARD === */}
          <div className="group relative p-6 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-100/30 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 mb-6 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <Presentation size={28} />
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tighter uppercase">
              For Instructors
            </h3>
            <p className="text-slate-500 mb-6 leading-relaxed font-medium text-sm">
              Create high-quality test series, reach thousands of students,
              and generate revenue from your expertise.
            </p>

            <div className="space-y-3 mb-8">
              {[
                "Easy Test Creation",
                "Student Analytics",
                "Monetize Content",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-purple-500" />
                  <span className="text-[13px] font-bold text-slate-700 tracking-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onNavigate}
              className="w-full py-3.5 px-8 rounded-xl bg-purple-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-purple-700 transition-all duration-300 shadow-lg shadow-purple-100 flex items-center justify-center gap-2 group/btn"
            >
              Join As Instructor <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/* =========================================
   2. REDESIGNED: FAQ SECTION
   ========================================= */
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    {
      q: "Can I attempt the tests on mobile?",
      a: "Yes! Our platform is fully responsive. You can take tests on your phone, tablet, or laptop anytime.",
    },
    {
      q: "Are the Grand Tests real-time?",
      a: "Yes. Live Grand Tests run on a specific schedule to simulate the real exam environment and generate All-India Ranks.",
    },
    {
      q: "Can I re-attempt a test?",
      a: "Standard Mock Tests can be re-attempted multiple times. Grand Tests are usually one-time to preserve ranking integrity, but become available for practice later.",
    },
    {
      q: "Do I get detailed solutions?",
      a: "Absolutely. Immediately after submitting, you get a detailed analysis report with explanations for every correct and incorrect answer.",
    },
  ];

  return (
    <section className="py-24 bg-slate-200/30 border-t border-slate-100 relative">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-slate-800 tracking-tighter uppercase leading-tight">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 hover:border-indigo-300 transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center p-4 md:p-5 text-left focus:outline-none"
              >
                <span
                  className={`text-sm md:text-base font-bold tracking-tight ${
                    openIndex === idx ? "text-indigo-600" : "text-slate-800"
                  }`}
                >
                  {faq.q}
                </span>
                {openIndex === idx ? (
                  <ChevronUp size={18} className="text-indigo-600" />
                ) : (
                  <ChevronDown size={18} className="text-slate-400" />
                )}
              </button>
              {openIndex === idx && (
                <div className="p-4 md:p-5 pt-0 text-slate-500 font-medium leading-relaxed text-xs bg-white border-t border-slate-50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* =========================================
   3. REDESIGNED: CTA BANNER
   ========================================= */
const CTASection = ({ onSignup }) => (
  <section className="relative py-24 px-6 bg-white overflow-hidden">
    <div className="max-w-6xl mx-auto rounded-[32px] overflow-hidden relative shadow-2xl border border-slate-100">
      {/* Vibrant Gradient like Jumbo Xerox Bulk Section */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

      <div className="relative py-12 px-8 text-center text-white z-10">
        <h2 className="text-2xl md:text-4xl font-black mb-4 tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
          Ready to Top Your Next Exam?
        </h2>
        <p className="text-sm md:text-base text-orange-50 mb-8 max-w-2xl mx-auto font-medium opacity-90 leading-relaxed line-clamp-2">
          Join 150,000+ students practicing daily with our AI-powered test
          series. Start your first test for free today.
        </p>
        <button
          onClick={onSignup}
          className="px-10 py-4 bg-white text-orange-600 font-black text-xs rounded-xl shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto uppercase tracking-widest"
        >
          Start Practicing Now <ArrowRight size={16} />
        </button>
      </div>
    </div>
  </section>
);

/* =========================================
   MAIN HOME PAGE (BRIGHT THEME)
   ========================================= */
const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { items: categories, loading: categoryLoading } = useSelector(
    (state) => state.category,
  );

  const { publicMocktests, publicStatus } = useSelector(
    (state) => state.students,
  );

  const mockTests = publicMocktests.filter((t) => !t.isGrandTest).slice(0, 6);

  const grandTests = publicMocktests
    .filter((t) => t.isGrandTest === true)
    .slice(0, 6);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPublicMockTests("?limit=100"));
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/mocktests?q=${encodeURIComponent(search)}`);
  };

  const handleCategoryClick = (category) => {
    const slug = category.slug || category._id || category;
    navigate(`/mocktests?category=${encodeURIComponent(slug)}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        {/* HERO - Suggestion: Use a light theme version for HeroSection too */}
        <HeroSection
          search={search}
          setSearch={setSearch}
          onSubmit={handleSearch}
        />

        {/* CATEGORIES */}
        <div id="categories-section" className="bg-slate-100 pt-10 pb-6 relative">
          <div className="relative z-10">
            <CategoriesSection
              categories={publicMocktests}
              loading={publicStatus === "loading"}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        </div>

        {/* FEATURES */}
        <div className="bg-slate-100 py-6">
          <FeaturesSection />
        </div>

        {/* MOCK TESTS */}
        <div className="bg-slate-200/20 border-t border-slate-300/30">
          <FeaturedTestsSection
            id="mock-tests"
            title="Top Rated Mock Series"
            tests={mockTests}
            loading={publicStatus === "loading"}
            showViewAll
            viewAllText="View All Mocktests"
            CardComponent={MockTestCard}
            onViewAll={() => navigate("/mocktests?type=mock")}
          />
        </div>

        {/* GRAND TESTS - Subtle contrast bg */}
        <div className="bg-slate-300/20 border-t border-slate-300/40">
          <FeaturedTestsSection
            id="grand-tests"
            title="All-India Grand Tests"
            tests={grandTests}
            loading={publicStatus === "loading"}
            showViewAll
            viewAllText="View All Grand Tests"
            CardComponent={PremiumTestCard}
            onViewAll={() => navigate("/mocktests?type=grand")}
          />
        </div>

        {/* TESTIMONIALS */}
        <TestimonialsSection />

        {/* NEW JOIN SECTION (Bright UI) */}
        <RoleSelectionSection onNavigate={() => navigate("/signup")} />

        {/* FAQ SECTION (Clean White UI) */}
        <FAQSection />

        {/* CTA BANNER (Vibrant High Energy) */}
        <CTASection onSignup={() => navigate("/mocktests")} />
      </main>
    </div>
  );
};

export default Home;
