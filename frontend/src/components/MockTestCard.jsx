import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  BookOpen,
  Users,
  ShoppingCart,
  Wallet,
  Play,
  Trophy,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addItemToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import api from "../api/axios";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const StatItem = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-1 px-1.5 first:pl-0 border-r border-slate-100 last:border-0">
    <Icon size={10} className="text-slate-400" />
    <div className="flex flex-col">
       <span className="text-[10px] font-black text-slate-700 leading-none">{value}</span>
       <span className="text-[7px] text-slate-400 uppercase font-black tracking-tighter">{label}</span>
    </div>
  </div>
);

const MockTestCard = ({ test, isEmbedded = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData, myMockTests } = useSelector((state) => state.user);
  
  const isPurchased = userData?.purchasedTests?.some(id => 
    id === test._id || (id._id && id._id === test._id)
  ) || myMockTests?.some(t => t._id === test._id);

  const effectivePrice = (test.discountPrice > 0 && Number(test.discountPrice) < Number(test.price)) 
    ? Number(test.discountPrice) 
    : Number(test.price);
  
  const isFree = test.isFree === true || effectivePrice <= 0 || isPurchased;
  const duration = Number(test.durationMinutes) || (Number(test.totalQuestions) * 2) || 30;
  const enrolledCount = (test.totalQuestions || 0) * 12 + 150;

  const handleAction = (type) => {
    if (!userData) {
      toast.error("Please login to continue");
      return navigate("/login");
    }
    if (type === "cart") {
      dispatch(addItemToCart(test._id));
      toast.success("Added to cart");
    } else if (type === "start") {
      navigate(`/student/instructions/${test._id}`);
    } else {
      navigate(`/mocktests/${test._id}`);
    }
  };

  return (
    <div className="bg-white border-2 border-slate-300/40 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] hover:border-blue-400 group flex flex-col h-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-2">
      {/* THUMBNAIL AREA - Balanced */}
      <div className="relative h-22 overflow-hidden bg-slate-50">
        <img
          src={getImageUrl(test.thumbnail)}
          alt={test.title}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isFree && (
            <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase">
              Free
            </span>
          )}
          {test.isGrandTest && (
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase border border-amber-300/50">
              Grand
            </span>
          )}
        </div>

        {/* Price Tag */}
        {!isFree && test.price > 0 && (
          <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 font-black text-[10px] rounded-lg shadow-lg">
            ₹{test.price}
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 flex items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100">
           <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-xl scale-50 group-hover:scale-100 transition-transform duration-500">
              <Play size={16} fill="currentColor" />
           </div>
        </div>
      </div>

      {/* CONTENT AREA - Super Micro Padding */}
      <div className="p-1 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[6px] font-black text-blue-600 uppercase bg-blue-50 px-1 py-0.5 rounded">
            {test.category?.name || "Mock"}
          </span>
        </div>
        <h3 className="text-[10px] font-black text-slate-800 line-clamp-1 mb-0.5 group-hover:text-blue-600 transition-colors tracking-tight">
          {test.title}
        </h3>
        <p className="text-[8px] text-slate-500 line-clamp-1 mb-1.5 leading-relaxed font-medium">
          {test.description || "Boost your preparation."}
        </p>

        {/* STATS ROW - Super Micro */}
        <div className="flex items-center justify-between py-0.5 px-1 mt-auto bg-slate-50 rounded-md border border-slate-100">
          <StatItem icon={Clock} value={`${duration}m`} label="Time" />
          <StatItem icon={BookOpen} value={test.totalQuestions || 0} label="Ques" />
          <StatItem icon={Trophy} value={test.totalMarks || 0} label="Marks" />
        </div>
      </div>

      {/* FOOTER ACTIONS - Micro Height */}
      <div className="px-1.5 pb-1.5 flex gap-1">
        {isFree ? (
          <button
            onClick={() => handleAction("start")}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-slate-100"
          >
            Start <Play size={10} fill="currentColor" />
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAction("details")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100"
            >
              Unlock
            </button>
            {!isEmbedded && (
              <button
                onClick={() => handleAction("cart")}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all active:scale-95"
                title="Add to Cart"
              >
                <ShoppingCart size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MockTestCard;
