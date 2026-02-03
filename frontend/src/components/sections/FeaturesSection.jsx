import React from "react";
import {
  Users,
  Zap,
  BarChart3,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
          {/* ================= LEFT CONTENT ================= */}
          <div className="lg:col-span-1 space-y-6">
            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
              <ShieldCheck className="text-blue-600" size={28} />
            </div>

            <h2 className="text-4xl font-bold text-slate-900 leading-tight">
              Why MYE 3 Academy?
            </h2>

            <p className="text-lg text-slate-600 leading-relaxed">
              With{" "}
              <span className="font-bold text-slate-900">
                50+ Lakh Students
              </span>{" "}
              and
              <span className="font-bold text-slate-900">
                {" "}
                One of the best Selection rate in India
              </span>{" "}
              amongst online learning platforms, you can surely rely on us to
              excel.
            </p>

            <div className="pt-4">
              <button className="bg-[#29dd89] hover:bg-[#19af69] text-white px-8 py-3 rounded-lg font-bold transition shadow-lg active:scale-95">
                Get Started For Free
              </button>
            </div>
          </div>

          {/* ================= RIGHT GRID (Staggered Cards) ================= */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-6">
              {/* Feature 1: Learn from Best */}
              <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-[#4de59e] rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-emerald-200">
                  <Users size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Learn from the Best
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Learn from the masters of the subject, in the most engaging
                  yet simplified ways.
                </p>
              </div>

              {/* Feature 2: Detailed Score Analysis */}
              <div className="bg-amber-50/50 p-8 rounded-[2rem] border border-amber-100 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-amber-200">
                  <BarChart3 size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Detailed Score Analysis
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Get a detailed breakdown of your strengths & weaknesses and
                  discover insights to improve your score.
                </p>
              </div>
            </div>

            {/* Column 2 (Staggered - Offset Top) */}
            <div className="space-y-6 md:mt-12">
              {/* Feature 3: Live Tests */}
              <div className="bg-pink-50/50 p-8 rounded-[2rem] border border-pink-100 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-pink-200">
                  <Zap size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Live Tests for Real Experience
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Feel the thrill of a real exam. Improve your time & pressure
                  management skills with real-time simulations.
                </p>
              </div>

              {/* Feature 4: Doubt Solving (Replacing Multilingual) */}
              <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-200">
                  <MessageSquare size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Instant Doubt Solving
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Stuck on a tricky question? Get step-by-step solutions from
                  our verified experts instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
