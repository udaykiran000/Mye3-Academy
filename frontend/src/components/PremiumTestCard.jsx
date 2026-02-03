import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, BookOpen, Users, ShoppingCart, Wallet, Play } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { addItemToCart, fetchCart } from "../redux/cartSlice";
import api from "../api/axios";

const StatItem = ({ icon: Icon, value, label, accentLight }) => (
  <div className="text-center">
    <Icon size={18} className={`${accentLight} mx-auto mb-1`} />
    <p className="text-lg font-bold text-white leading-tight">{value}</p>
    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
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

  const [fetchedImageURL, setFetchedImageURL] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (!test.thumbnail) return;

    const fetchImage = async () => {
      setLoadingImage(true);
      try {
        const res = await api.get(test.thumbnail, { responseType: "blob" });
        setFetchedImageURL(URL.createObjectURL(res.data));
      } catch {
        setFetchedImageURL("https://placehold.co/600x400?text=Image+Load+Error");
      } finally {
        setLoadingImage(false);
      }
    };

    fetchImage();
    return () => {
      if (fetchedImageURL) URL.revokeObjectURL(fetchedImageURL);
    };
  }, [test.thumbnail]);

  const imageSource = fetchedImageURL || "https://placehold.co/600x400?text=Mock+Test";

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
        bg-gray-900/80 backdrop-blur-md border border-gray-800 shadow-2xl 
        hover:${glowColor}
        transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.03]
        before:content-[''] before:absolute before:inset-0 before:rounded-2xl 
        before:border-2 before:opacity-0 group-hover:opacity-100 
        before:transition-opacity before:duration-500 before:border-transparent 
        before:bg-clip-border before:bg-gradient-to-r before:${accentColor}
        before:pointer-events-none
      `}
    >
      {(isFree || isGrand || hasPurchasedBefore) && (
        <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full z-20">
          {hasPurchasedBefore ? "Purchased" : isFree ? "FREE" : "Grand"}
        </span>
      )}

      <div className="relative w-full h-40">
        {loadingImage ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 animate-pulse">
            Loading Image...
          </div>
        ) : (
          <img src={imageSource} className="w-full h-full object-cover" />
        )}
      </div>

      <Link to={`/mocktests/${test._id}`} className="p-6 flex flex-col flex-grow">
        <div className="mb-4">
          {test.category?.name && (
            <p className="text-sm font-semibold text-gray-400 mb-1 tracking-wider">
              {test.category.name.toUpperCase()}
            </p>
          )}
          <h3 className="text-2xl font-bold text-white leading-snug line-clamp-2">
            {test.title}
          </h3>
        </div>

        <p className="text-gray-400 text-sm mb-5 line-clamp-3 flex-grow">
          {test.description}
        </p>

        <div className="grid grid-cols-3 gap-4 border-y border-gray-700/50 py-4 mb-5">
          <StatItem icon={Clock} value={`${test.durationMinutes} Min`} label="Duration" accentLight={accentLight} />
          <StatItem icon={BookOpen} value={`${test.totalQuestions} Qs`} label="Questions" accentLight={accentLight} />
          <StatItem icon={Users} value={(test.totalQuestions * 37 + 500).toLocaleString()} label="Enrolled" accentLight={accentLight} />
        </div>

        {/* ⭐⭐⭐ PRICE SECTION UPDATED ⭐⭐⭐ */}
        <div className="flex items-center gap-3">
          <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 drop-shadow-lg">
            {isFree ? "Free" : `₹${test.price}`}
          </p>

          {/* Show discount if originalPrice exists AND is higher */}
          {test.originalPrice && test.originalPrice > test.price && (
            <p className="text-lg line-through text-gray-400">
              ₹{test.originalPrice}
            </p>
          )}
        </div>
        {/* END PRICE SECTION */}

      </Link>

      <div className={`p-6 pt-0 flex gap-3 w-full ${needsTwoButtons ? "flex-col sm:flex-row" : "flex-row"}`}>
        <button
          onClick={handlePrimaryAction}
          className={`flex items-center justify-center gap-2 text-white py-3 rounded-lg font-bold transition 
            ${(isFree || hasPurchasedBefore)
              ? "bg-green-600 hover:bg-green-500 w-full"
              : "bg-cyan-600 hover:bg-cyan-500 w-full sm:w-1/2"
            }
          `}
        >
          {(isFree || hasPurchasedBefore) ? <Play size={18} /> : <Wallet size={18} />}
          {getPrimaryButtonText()}
        </button>

        {needsTwoButtons && (
          isGrand && hasPurchasedBefore ? (
            <button
              disabled
              className="flex items-center justify-center gap-2 text-white py-3 rounded-lg font-semibold
              w-full sm:w-1/2 bg-gray-500 cursor-not-allowed"
            >
              Already Purchased
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isInCart}
              className={`flex items-center justify-center gap-2 text-white py-3 rounded-lg font-semibold transition 
                w-full sm:w-1/2
                ${isInCart ? "bg-gray-500 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600"}
              `}
            >
              <ShoppingCart size={18} />
              {isInCart ? "In Cart" : "Add to Cart"}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default PremiumTestCard;
