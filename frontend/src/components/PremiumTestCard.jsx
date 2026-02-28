import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, BookOpen, Zap, ShoppingCart, Play, Star } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { addItemToCart, fetchCart } from "../redux/cartSlice";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const PremiumTestCard = ({ test }) => {
  const dispatch = useDispatch();
  const navigate  = useNavigate();

  const { userData }  = useSelector((s) => s.user);
  const { cartItems } = useSelector((s) => s.cart);

  const purchasedTests = userData?.purchasedTests || userData?.enrolledMockTests || [];
  const isGrand        = test.isGrandTest === true;
  const isFree         = test.isFree === true;
  const hasPurchased   = purchasedTests.some((i) => i._id === test._id || i === test._id);
  const isInCart       = cartItems.some((i) => i._id === test._id || i.mockTestId === test._id);

  const imageSource = getImageUrl(test.thumbnail);
  const enrolled    = (test.totalQuestions * 37 + 500).toLocaleString();

  /* ---- handlers ---- */
  const loginGuard = () => {
    if (!userData) { toast.error("Please login first!"); navigate("/login"); return false; }
    return true;
  };

  const handleStart = () => { if (!loginGuard()) return; navigate(`/student/instructions/${test._id}`); };
  const handleView  = () => navigate(`/mocktests/${test._id}`);

  const handleAddToCart = async () => {
    if (!loginGuard()) return;
    if (isFree)     return toast.info("Free test cannot be added to cart.");
    if (isInCart)   return toast.info("Already in cart.");
    if (isGrand && hasPurchased) return toast.info("Grand Test can be purchased only once.");
    const result = await dispatch(addItemToCart(test._id));
    if (result.meta.requestStatus === "fulfilled") { toast.success(`${test.title} added to cart!`); dispatch(fetchCart()); }
    else toast.error("Failed to add to cart.");
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
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">
            {test.category.name}
          </p>
        )}
        <h3 className="text-[13px] font-black text-slate-800 leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-amber-600 transition-colors">
          {test.title}
        </h3>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {test.description}
        </p>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-1 border-t border-slate-100 pt-2 mt-auto">
          <div className="flex flex-col items-center gap-0.5">
            <Clock size={11} className="text-amber-400" />
            <span className="text-[10px] font-black text-slate-700">{test.durationMinutes}m</span>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest">Duration</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <BookOpen size={11} className="text-amber-400" />
            <span className="text-[10px] font-black text-slate-700">{test.totalQuestions}</span>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest">Questions</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Star size={11} className="text-amber-400" />
            <span className="text-[10px] font-black text-slate-700">{enrolled}</span>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest">Enrolled</span>
          </div>
        </div>
      </Link>

      {/* ── ACTION BUTTONS ── */}
      <div className="px-4 pb-4 flex gap-2">
        {canStart ? (
          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <Play size={12} /> Start Now
          </button>
        ) : (
          <>
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              <Zap size={12} /> Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              disabled={isInCart}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest border transition-colors ${
                isInCart
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              <ShoppingCart size={12} /> {isInCart ? "In Cart" : "Add"}
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default PremiumTestCard;
