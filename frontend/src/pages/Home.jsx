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
    <section className="py-24 relative bg-white overflow-hidden">
      {/* Soft Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* === STUDENT CARD === */}
          <div className="group relative p-10 rounded-[45px] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(79,70,229,0.12)] transition-all duration-500 hover:-translate-y-3">
            <div className="w-20 h-20 mb-8 rounded-[25px] bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <GraduationCap size={38} />
            </div>

            <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase">
              For Students
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed font-medium text-lg">
              Unlock unlimited mock tests, get detailed performance analytics,
              and compete with peers nationwide.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Real-time Rankings",
                "Detailed Solutions",
                "Performance Graphs",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-slate-700 font-bold text-sm"
                >
                  <div className="p-1 bg-emerald-100 rounded-full text-emerald-600">
                    <CheckCircle2 size={16} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={onNavigate}
              className="w-full py-5 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              Start Learning <ArrowRight size={20} />
            </button>
          </div>

          {/* === INSTRUCTOR CARD === */}
          <div className="group relative p-10 rounded-[45px] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(147,51,234,0.12)] transition-all duration-500 hover:-translate-y-3">
            <div className="w-20 h-20 mb-8 rounded-[25px] bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <Presentation size={38} />
            </div>

            <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase">
              For Instructors
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed font-medium text-lg">
              Create high-quality test series, reach thousands of students, and
              generate revenue from your expertise.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Easy Test Creation",
                "Student Analytics",
                "Monetize Content",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-slate-700 font-bold text-sm"
                >
                  <div className="p-1 bg-purple-100 rounded-full text-purple-600">
                    <CheckCircle2 size={16} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={onNavigate}
              className="w-full py-5 rounded-2xl font-black bg-purple-600 text-white shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              Become Instructor <ArrowRight size={20} />
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
    <section className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-black text-center mb-16 text-slate-900 tracking-tighter">
          FREQUENTLY ASKED QUESTIONS
        </h2>
        <div className="space-y-5">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-[25px] overflow-hidden shadow-sm hover:border-indigo-300 transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center p-7 text-left focus:outline-none"
              >
                <span
                  className={`text-lg font-bold ${
                    openIndex === idx ? "text-indigo-600" : "text-slate-800"
                  }`}
                >
                  {faq.q}
                </span>
                {openIndex === idx ? (
                  <ChevronUp className="text-indigo-600" />
                ) : (
                  <ChevronDown className="text-slate-400" />
                )}
              </button>
              {openIndex === idx && (
                <div className="p-7 pt-0 text-slate-500 font-medium leading-relaxed text-md bg-white border-t border-slate-50">
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
  <section className="relative py-24 px-6 bg-white">
    <div className="max-w-7xl mx-auto rounded-[60px] overflow-hidden relative shadow-2xl">
      {/* Vibrant Gradient like Jumbo Xerox Bulk Section */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

      <div className="relative py-24 px-10 text-center text-white z-10">
        <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase">
          Ready to Top Your Next Exam?
        </h2>
        <p className="text-2xl text-orange-50 mb-12 max-w-3xl mx-auto font-medium opacity-90 leading-relaxed">
          Join 150,000+ students practicing daily with our AI-powered test
          series. Start your first test for free today.
        </p>
        <button
          onClick={onSignup}
          className="px-14 py-6 bg-white text-orange-600 font-black text-xl rounded-[20px] shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-3 mx-auto uppercase tracking-widest"
        >
          Start Practicing Now <ArrowRight size={24} />
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

  const mockTests = publicMocktests.filter((t) => !t.isGrandTest).slice(0, 4);

  const grandTests = publicMocktests
    .filter((t) => t.isGrandTest === true)
    .slice(0, 4);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPublicMockTests("?limit=20"));
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
        <div id="categories-section" className="bg-slate-50 py-10">
          <CategoriesSection
            categories={categories}
            loading={categoryLoading}
            onCategoryClick={handleCategoryClick}
          />
        </div>

        {/* FEATURES */}
        <div className="bg-white">
          <FeaturesSection />
        </div>

        {/* MOCK TESTS */}
        <div className="bg-white">
          <FeaturedTestsSection
            id="mock-tests"
            title="Top Rated Mock Series"
            tests={mockTests}
            loading={publicStatus === "loading"}
            showViewAll
            CardComponent={MockTestCard}
            onViewAll={() => navigate("/mocktests")}
          />
        </div>

        {/* GRAND TESTS - Subtle contrast bg */}
        <div className="bg-[#F8FAFC] border-y border-slate-100">
          <FeaturedTestsSection
            id="grand-tests"
            title="All-India Grand Tests"
            tests={grandTests}
            loading={publicStatus === "loading"}
            showViewAll
            CardComponent={PremiumTestCard}
            onViewAll={() => navigate("/mocktests?filter=grand")}
          />
        </div>

        {/* TESTIMONIALS */}
        <TestimonialsSection />

        {/* NEW JOIN SECTION (Bright UI) */}
        <RoleSelectionSection onNavigate={() => navigate("/signup")} />

        {/* FAQ SECTION (Clean White UI) */}
        <FAQSection />

        {/* CTA BANNER (Vibrant High Energy) */}
        <CTASection onSignup={() => navigate("/login")} />
      </main>
    </div>
  );
};

export default Home;
