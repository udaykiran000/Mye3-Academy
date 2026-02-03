import React from "react";
import {
  ChevronRight,
  ShieldCheck,
  Trophy,
  FileText,
  Video,
  MessageCircle,
} from "lucide-react";
import heroBanner from "../../assets/home-banner.svg";

const HeroSection = () => {
  return (
    <section className="relative bg-[#f0f9ff]">
      {/* ================= MAIN HERO CONTENT ================= */}
      <div className="relative pt-16 pb-24 lg:pt-24 lg:pb-40 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
            {/* LEFT CONTENT */}
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1e293b] leading-[1.2] tracking-tight">
                Master Every <br /> Concept with <br />
                <span className="text-blue-600">Specialized Test Series</span>
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm md:text-base font-semibold text-slate-500">
                <span>Learn</span>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
                <span>Practice</span>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
                <span>Improve</span>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
                <span className="text-blue-600">Succeed</span>
              </div>

              <p className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed">
                Join thousands of aspirants and sharpen your skills with
                real-time exam simulations. Start your preparation for free
                today!
              </p>

              <div className="pt-2">
                <button className="bg-[#1ec978] hover:bg-[#19af69] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-emerald-200/50 active:scale-95">
                  Get Started For Free
                </button>
              </div>
            </div>

            {/* RIGHT VISUALS (SVG) */}
            <div className="relative flex justify-center lg:justify-end">
              <img
                src={heroBanner}
                alt="Specialized Test Series Banner"
                className="w-full max-w-[580px] object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= STATS BAR (The White Card) ================= */}
      {/* Absolute positioning ni relative container tho replace cheshanu so adi cut avvadu */}
      <div className="relative z-20 -mt-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100 p-8 md:p-10 mb-10">
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
                <p className="text-xl md:text-2xl font-bold text-slate-800">
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
                <p className="text-xl md:text-2xl font-bold text-slate-800">
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
                <p className="text-xl md:text-2xl font-bold text-slate-800">
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
                <p className="text-xl md:text-2xl font-bold text-slate-800">
                  25+ Lakhs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <a
          href="#"
          className="bg-[#25D366] p-4 rounded-full shadow-2xl cursor-pointer hover:scale-110 transition-all duration-300 block"
        >
          <MessageCircle className="w-8 h-8 text-white fill-current" />
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
