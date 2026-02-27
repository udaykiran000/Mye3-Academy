import React from "react";
import { useSelector } from "react-redux";
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
  const { userData } = useSelector((state) => state.user);

  const handleGetStarted = () => {
    navigate("/mocktests");
  };

  return (
    <section className="relative bg-[#f0f9ff] overflow-hidden">
      {/* ================= MAIN HERO CONTENT ================= */}
      <div className="relative pt-24 pb-12 lg:pt-28 lg:pb-16 overflow-visible">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
            {/* LEFT CONTENT */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1e293b] leading-[1.2] tracking-tight">
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

              <p className="text-sm md:text-base text-slate-600 max-w-sm leading-relaxed">
                Join thousands of aspirants and sharpen your skills with
                real-time exam simulations. Start your preparation for free
                today!
              </p>

              <div className="pt-2">
                <button 
                  onClick={handleGetStarted}
                  className="bg-[#1ec978] hover:bg-[#19af69] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-emerald-200/50 active:scale-95"
                >
                  Get Started For Free
                </button>
              </div>
            </div>

            {/* RIGHT VISUALS (SVG) */}
            <div className="relative flex justify-center lg:justify-end">
              <img
                src={heroBanner}
                alt="Specialized Test Series Banner"
                className="w-full max-w-[400px] object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= STATS BAR (The White Card) ================= */}
      {/* Absolute positioning ni relative container tho replace cheshanu so adi cut avvadu */}
      <div className="relative z-20 -mt-8 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100 p-4 md:p-6 mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Stat 1 */}
            <div className="flex items-center gap-4 md:border-r border-slate-100 last:border-0">
              <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                <ShieldCheck className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Registered
                </p>
                <p className="text-base md:text-lg font-bold text-slate-800">
                  50+ Lakhs
                </p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-4 md:border-r border-slate-100 last:border-0">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
                <Trophy className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Selections
                </p>
                <p className="text-base md:text-lg font-bold text-slate-800">
                  4+ Lakhs
                </p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-4 md:border-r border-slate-100 last:border-0">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <FileText className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Tests Taken
                </p>
                <p className="text-base md:text-lg font-bold text-slate-800">
                  80+ Lakhs
                </p>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-4 last:border-0">
              <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                <Video className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Classes
                </p>
                <p className="text-base md:text-lg font-bold text-slate-800">
                  25+ Lakhs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


    </section>
  );
};

export default HeroSection;
