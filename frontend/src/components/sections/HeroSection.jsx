import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ShieldCheck,
  Trophy,
  FileText,
  Video,
} from "lucide-react";
import heroBanner from "../../assets/home-banner.svg";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/mocktests");
  };

  return (
    <section className="relative bg-[#f0f9ff] h-screen overflow-hidden flex flex-col">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* ====== HERO CONTENT ====== */}
      <div className="flex-1 flex items-center min-h-[75vh]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center text-left w-full">

            {/* LEFT CONTENT */}
            <div className="space-y-4 lg:pr-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1e293b] leading-[1.2] tracking-tight">
                Master Every <br /> Concept with <br />
                <span className="text-blue-600">Specialized Test Series</span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-semibold text-slate-500">
                <span>Learn</span>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
                <span>Practice</span>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
                <span>Improve</span>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
                <span className="text-blue-600">Succeed</span>
              </div>

              <p className="text-sm md:text-base text-slate-600 max-w-md leading-relaxed">
                Join thousands of aspirants and sharpen your skills with
                real-time exam simulations. Start your preparation for free today!
              </p>

              <div className="pt-2">
                <button
                  onClick={handleGetStarted}
                  className="bg-[#1ec978] hover:bg-[#19af69] text-white px-6 py-3 font-bold text-base transition-all shadow-lg active:scale-95"
                >
                  Get Started For Free
                </button>
              </div>
            </div>

            {/* RIGHT VISUALS */}
            <div className="hidden lg:flex relative justify-center lg:-ml-8">
              <img
                src={heroBanner}
                alt="Specialized Test Series Banner"
                className="w-full max-w-[500px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ====== STATS BAR — pinned at bottom ====== */}
      <div className="w-full px-6 lg:px-8 pb-10">
        <div className="max-w-5xl mx-auto bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100 p-4 md:p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            <div className="flex items-center gap-3 md:border-r border-slate-100">
              <div className="p-2.5 bg-teal-50 text-teal-600 flex-shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Registered</p>
                <p className="text-sm font-bold text-slate-800">50+ Lakhs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:border-r border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-500 flex-shrink-0">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Selections</p>
                <p className="text-sm font-bold text-slate-800">4+ Lakhs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:border-r border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-600 flex-shrink-0">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tests Taken</p>
                <p className="text-sm font-bold text-slate-800">80+ Lakhs</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 text-orange-500 flex-shrink-0">
                <Video className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Classes</p>
                <p className="text-sm font-bold text-slate-800">25+ Lakhs</p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
