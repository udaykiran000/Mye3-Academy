import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, BookOpen, Unlock, Play, FileText } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { fetchPublicTestById } from "../redux/mockTestSlice";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const PremiumTestCard = ({ test }) => {
  const dispatch = useDispatch();
  const navigate  = useNavigate();

  const { userData, myMockTests }  = useSelector((s) => s.user);

  const purchasedTests = userData?.purchasedTests || userData?.enrolledMockTests || [];
  const isGrand        = test.isGrandTest === true;
  const isFree         = test.isFree === true;
  
  const hasPurchased   = purchasedTests.some((i) => i._id === test._id || i === test._id) || 
                       myMockTests?.some((t) => t._id === test._id);
  // const isInCart       = cartItems.some((i) => i._id === test._id || i.mockTestId === test._id);

  const imageSource = getImageUrl(test.thumbnail);
  const enrolled    = (test.totalQuestions * 37 + 500).toLocaleString();

  /* ---- handlers ---- */
  const loginGuard = () => {
    if (!userData) { toast.error("Please login first!"); navigate("/login"); return false; }
    return true;
  };

  const handleStart = () => { if (!loginGuard()) return; navigate(`/student/instructions/${test._id}`); };
  const handleView  = () => navigate(`/mocktests/${test._id}`);

  const handleUnlock = () => {
    if (!loginGuard()) return;
    navigate(`/student/instructions/${test._id}`);
  };

  const canStart   = isFree || hasPurchased;
  const priceLabel = isFree ? "FREE" : `₹${test.price}`;

  return (
    <div className="group relative flex flex-col bg-white border border-amber-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(251,191,36,0.18)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">

      {/* ── BADGE ── */}
      {(isFree || isGrand || hasPurchased) && (
        <span className={`absolute top-3 left-3 z-20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 ${
          hasPurchased ? "bg-emerald-500 text-white"
          : isFree     ? "bg-blue-500 text-white"
          :               "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
        }`}>
          {hasPurchased ? "Purchased" : isFree ? "FREE" : "Grand"}
        </span>
      )}

      {/* ── THUMBNAIL ── */}
      <div className="relative w-full h-36 overflow-hidden bg-slate-100">
        <img
          src={imageSource}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          alt={test.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {/* Price overlay */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-amber-400 text-xs font-black px-2 py-0.5 tracking-wide">
          {priceLabel}
        </div>
      </div>

      {/* ── BODY ── */}
      <Link to={`/mocktests/${test._id}`} className="flex-1 flex flex-col p-4 gap-2">
        {test.category?.name && (
          <div className="flex">
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-wider">
              {test.category.name}
            </span>
          </div>
        )}
        <h3 className="text-[13px] font-black text-slate-800 leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-amber-600 transition-colors">
          {test.title}
        </h3>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {test.description}
        </p>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 mt-auto">
          <div className="flex flex-col items-center gap-1">
            <Clock size={12} className="text-amber-500" />
            <span className="text-[11px] font-black text-slate-800 leading-none">
              {test.durationMinutes > 0 
                ? `${test.durationMinutes}m` 
                : (test.totalQuestions > 0 ? `${test.totalQuestions * 2}m` : "—")}
            </span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Duration</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FileText size={12} className="text-amber-500" />
            <span className="text-[11px] font-black text-slate-800 leading-none">{test.totalMarks || "0"}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Marks</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BookOpen size={12} className="text-amber-500" />
            <span className="text-[11px] font-black text-slate-800 leading-none">{test.totalQuestions || 0}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Questions</span>
          </div>
        </div>
      </Link>

      {/* ── ACTION BUTTONS ── */}
      <div className="px-4 pb-4 flex gap-2">
        {canStart ? (
          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 rounded-xl"
          >
            <Play size={12} fill="currentColor" /> Start Test
          </button>
        ) : (
          <>
            <button
              onClick={handleUnlock}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-100 rounded-xl"
            >
              <Unlock size={12} strokeWidth={3} /> Unlock
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default PremiumTestCard;
