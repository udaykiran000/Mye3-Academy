import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  BookOpen,
  Users,
  ShoppingCart,
  Wallet,
  Play,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addItemToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import api from "../api/axios";

// Helper for Stats - Clean Slate Palette
const StatItem = ({ icon: Icon, value, label, accentLight }) => (
  <div className="text-center px-1">
    <Icon size={20} className={`${accentLight} mx-auto mb-1`} />
    <p className="text-xl font-extrabold text-slate-800 leading-tight">
      {value}
    </p>
    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
      {label}
    </p>
  </div>
);

const MockTestCard = ({ test, isEmbedded = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);

  const [fetchedImageURL, setFetchedImageURL] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  /* ================================
        IMAGE FETCH LOGIC (Original)
    ================================ */
  useEffect(() => {
    if (!test.thumbnail) return;

    const fetchImage = async () => {
      setLoadingImage(true);
      try {
        const response = await api.get(test.thumbnail, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(response.data);
        setFetchedImageURL(url);
      } catch (error) {
        console.error("Failed to fetch mock test image:", error);
        setFetchedImageURL(
          "https://placehold.co/600x400?text=Image+Load+Error"
        );
      } finally {
        setLoadingImage(false);
      }
    };

    fetchImage();
    return () => fetchedImageURL && URL.revokeObjectURL(fetchedImageURL);
  }, [test.thumbnail]);

  const imageSource =
    fetchedImageURL || "https://placehold.co/600x400?text=Mock+Test";

  /* ================================
        LOGIC VARIABLES
    ================================ */
  const isFree = test.isFree === true;
  const isGrand = test.isGrandTest === true;
  const students = test.totalQuestions * 37 + 500;

  // Human-Designed Vibrant Palette
  const accentColor = isGrand
    ? "from-indigo-600 to-violet-500"
    : "from-cyan-600 to-blue-500";
  const accentLight = isGrand ? "text-indigo-600" : "text-cyan-600";
  const glowColor = isGrand ? "shadow-indigo-200" : "shadow-cyan-200";

  const handleLoginCheck = () => {
    if (!userData) {
      toast.error("Please login first!");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!handleLoginCheck()) return;
    dispatch(addItemToCart(test._id));
    toast.success(`${test.title} added to cart!`);
  };

  const handleStartTest = () => {
    if (!handleLoginCheck()) return;
    navigate(`/student/instructions/${test._id}`);
  };

  const handleViewDetails = () => {
    navigate(`/mocktests/${test._id}`);
  };

  /* ================================
        ACTION BUTTONS (Conditional Display)
    ================================ */
  const ViewDetailsButton = (
    <button
      onClick={handleViewDetails}
      className={`flex items-center justify-center gap-2 ${
        isEmbedded ? "w-full" : "w-1/2"
      } text-white py-3 rounded-xl font-bold transition bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100`}
    >
      <Wallet size={18} /> Buy Now
    </button>
  );

  const AddToCartButton = (
    <button
      onClick={handleAddToCart}
      className="flex items-center justify-center gap-2 w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition border border-slate-200"
    >
      <ShoppingCart size={18} /> Add to Cart
    </button>
  );

  return (
    <div
      className={`
                group flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 
                transition-all duration-300 w-full transform hover:scale-[1.02] hover:shadow-xl hover:${glowColor}
            `}
    >
      {/* THUMBNAIL */}
      <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-t-3xl">
        {loadingImage ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 animate-pulse text-slate-400">
            Loading...
          </div>
        ) : (
          <img
            src={imageSource}
            alt={test.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Price Badge */}
        <span
          className={`
                        absolute bottom-0 right-0 px-5 py-2 text-2xl font-black text-white rounded-tl-2xl
                        bg-gradient-to-r ${accentColor} shadow-lg
                    `}
        >
          {isFree ? "Free" : `₹${test.price}`}
        </span>

        {/* Status Badges */}
        {(isFree || isGrand) && (
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black px-4 py-1.5 rounded-full shadow-sm border border-slate-100 uppercase tracking-widest">
            {isGrand ? "GRAND TEST" : "FREE MODULE"}
          </span>
        )}
      </div>

      {/* CONTENT */}
      <Link
        to={`/mocktests/${test._id}`}
        className="p-6 pb-0 flex flex-col flex-grow"
      >
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
            {test.category?.name?.toUpperCase() || "MOCK SERIES"}
          </p>
          <h3 className="text-xl font-extrabold text-slate-900 leading-tight transition group-hover:text-indigo-600">
            {test.title}
          </h3>
        </div>

        <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow font-medium leading-relaxed">
          {test.description}
        </p>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-2 py-5 border-t border-b border-slate-50">
          <StatItem
            icon={Clock}
            value={test.durationMinutes}
            label="Duration"
            accentLight={accentLight}
          />
          <StatItem
            icon={BookOpen}
            value={test.totalQuestions}
            label="Questions"
            accentLight={accentLight}
          />
          <StatItem
            icon={Users}
            value={students.toLocaleString()}
            label="Enrolled"
            accentLight={accentLight}
          />
        </div>
      </Link>

      {/* ACTION BUTTONS */}
      <div className="p-6 pt-5 flex gap-3 w-full">
        {isFree ? (
          <button
            onClick={handleStartTest}
            className="flex items-center justify-center gap-2 w-full text-white py-3.5 rounded-xl font-bold transition bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100"
          >
            <Play size={18} /> Start Now
          </button>
        ) : (
          <>
            {ViewDetailsButton}
            {!isEmbedded && AddToCartButton}
          </>
        )}
      </div>
    </div>
  );
};

export default MockTestCard;
