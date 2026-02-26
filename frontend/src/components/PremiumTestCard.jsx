import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, BookOpen, Users, ShoppingCart, Wallet, Play } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { addItemToCart, fetchCart } from "../redux/cartSlice";
import api from "../api/axios";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const StatItem = ({ icon: Icon, value, label, accentLight }) => (
  <div className="text-center">
    <Icon size={12} className={`${accentLight} mx-auto mb-0.5`} />
    <p className="text-sm font-black text-white leading-tight">{value}</p>
    <p className="text-[7px] text-gray-500 uppercase tracking-wider font-black">{label}</p>
  </div>
);

const PremiumTestCard = ({ test }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userData } = useSelector((state) => state.user);
  const { cartItems } = useSelector((state) => state.cart);

  const purchasedTests =
    userData?.purchasedTests || userData?.enrolledMockTests || [];

  const isGrand = test.isGrandTest === true;

  const hasPurchasedBefore = purchasedTests.some(
    (item) => item._id === test._id || item === test._id
  );

  const canPurchase = isGrand ? !hasPurchasedBefore : true;

  const isInCart = cartItems.some(
    (item) => item._id === test._id || item.mockTestId === test._id
  );

  /* Image logic replaced with helper */
  
  // const imageSource = fetchedImageURL || "https://placehold.co/600x400?text=Mock+Test";
  const imageSource = getImageUrl(test.thumbnail);

  const isFree = test.isFree === true;

  const accentColor = isGrand
    ? "from-indigo-500 to-purple-400"
    : "from-cyan-500 to-teal-400";

  const accentLight = isGrand ? "text-indigo-400" : "text-cyan-400";
  const glowColor = isGrand ? "shadow-indigo-500/50" : "shadow-cyan-500/50";

  const handleLoginCheck = () => {
    if (!userData) {
      toast.error("Please login first!");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!handleLoginCheck()) return;

    if (isFree) return toast.info("Free test cannot be added to cart.");
    if (isGrand && hasPurchasedBefore)
      return toast.info("Grand Test can be purchased only once.");

    if (isInCart) return toast.info("Already in cart.");

    try {
      const result = await dispatch(addItemToCart(test._id));
      if (result.meta.requestStatus === "fulfilled") {
        toast.success(`${test.title} added to cart!`);
        dispatch(fetchCart());
      } else {
        toast.error("Failed to add to cart.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const handleStartTest = () => {
    if (!handleLoginCheck()) return;
    navigate(`/student/instructions/${test._id}`);
  };

  const handleViewDetails = () => navigate(`/mocktests/${test._id}`);

  const handlePrimaryAction = () => {
    if (isFree || hasPurchasedBefore) handleStartTest();
    else handleViewDetails();
  };

  const getPrimaryButtonText = () => {
    if (isFree) return "Start Free Test";
    if (hasPurchasedBefore) return "Resume Test";
    return "View Details";
  };

  const needsTwoButtons = !(isFree || hasPurchasedBefore);

  return (
    <div
      className={`
        group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer
        bg-gray-900 border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] 
        hover:${glowColor}
        transition-all duration-500 transform hover:-translate-y-3 hover:scale-[1.02]
        before:content-[''] before:absolute before:inset-0 before:rounded-2xl 
        before:border-[3px] before:opacity-0 group-hover:opacity-100 
        before:transition-opacity before:duration-500 before:border-transparent 
        before:bg-clip-border before:bg-gradient-to-r before:${accentColor}
        before:pointer-events-none ring-1 ring-white/5
      `}
    >
      {(isFree || isGrand || hasPurchasedBefore) && (
        <span className={`absolute top-3 left-3 text-white text-[10px] font-black px-3 py-1 rounded-full z-20 shadow-lg uppercase tracking-wider
          ${hasPurchasedBefore ? "bg-emerald-500" : isFree ? "bg-blue-500" : "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border border-amber-300"}
        `}>
          {hasPurchasedBefore ? "Purchased" : isFree ? "FREE" : "Grand"}
        </span>
      )}

      <div className="relative w-full h-22">
        <img
          src={imageSource}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
      </div>

      <Link to={`/mocktests/${test._id}`} className="p-1.5 flex flex-col flex-grow">
        <div className="mb-1">
          {test.category?.name && (
            <p className="text-[8px] font-semibold text-gray-400 mb-0.5 tracking-wider uppercase transition-transform duration-300 group-hover:scale-105 origin-left">
              {test.category.name}
            </p>
          )}
          <h3 className="text-base font-bold text-white leading-snug line-clamp-1 uppercase tracking-tight">
            {test.title}
          </h3>
        </div>

        <p className="text-gray-400 text-xs mb-3 line-clamp-1 flex-grow">
          {test.description}
        </p>

        <div className="grid grid-cols-3 gap-2 border-y border-gray-700/50 py-2 mb-3">
          <StatItem icon={Clock} value={`${test.durationMinutes}m`} label="Duration" accentLight={accentLight} />
          <StatItem icon={BookOpen} value={`${test.totalQuestions} Qs`} label="Questions" accentLight={accentLight} />
          <StatItem icon={Users} value={(test.totalQuestions * 37 + 500).toLocaleString().replace(/,/g, " ")} label="Enrolled" accentLight={accentLight} />
        </div>

        {/* ⭐⭐⭐ PRICE SECTION UPDATED ⭐⭐⭐ */}
        <div className="flex items-center gap-2">
          <p className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 drop-shadow-lg">
            {isFree ? "Free" : `₹${test.price}`}
          </p>

          {/* Show discount if originalPrice exists AND is higher */}
          {test.originalPrice && test.originalPrice > test.price && (
            <p className="text-xs line-through text-gray-400">
              ₹{test.originalPrice}
            </p>
          )}
        </div>
        {/* END PRICE SECTION */}

      </Link>

      <div className={`p-2 pt-0 flex gap-2 w-full ${needsTwoButtons ? "flex-col sm:flex-row" : "flex-row"}`}>
        <button
          onClick={handlePrimaryAction}
          className={`flex items-center justify-center gap-2 text-white py-2 rounded-lg font-black transition text-xs uppercase tracking-widest
            ${(isFree || hasPurchasedBefore)
              ? "bg-green-600 hover:bg-green-500 w-full shadow-lg shadow-green-900/20"
              : "bg-cyan-600 hover:bg-cyan-500 w-full sm:w-1/2 shadow-lg shadow-cyan-900/20"
            }
          `}
        >
          {(isFree || hasPurchasedBefore) ? <Play size={14} /> : <Wallet size={14} />}
          {getPrimaryButtonText()}
        </button>

        {needsTwoButtons && (
          isGrand && hasPurchasedBefore ? (
            <button
              disabled
              className="flex items-center justify-center gap-2 text-white py-2 rounded-lg font-bold text-xs uppercase
              w-full sm:w-1/2 bg-gray-500 cursor-not-allowed"
            >
              Purchased
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isInCart}
              className={`flex items-center justify-center gap-2 text-white py-2 rounded-lg font-bold transition text-xs uppercase tracking-widest
                w-full sm:w-1/2
                ${isInCart ? "bg-gray-500 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600"}
              `}
            >
              <ShoppingCart size={14} />
              {isInCart ? "In Cart" : "Add"}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default PremiumTestCard;
