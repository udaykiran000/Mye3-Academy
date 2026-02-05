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

const StatItem = ({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-center border-r border-slate-100 last:border-0">
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon size={14} className="text-slate-400" />
      <span className="text-sm font-bold text-slate-700">{value}</span>
    </div>
    <span className="text-[10px] text-slate-400 uppercase font-semibold">
      {label}
    </span>
  </div>
);

const MockTestCard = ({ test, isEmbedded = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [fetchedImageURL, setFetchedImageURL] = useState(null);

  useEffect(() => {
    if (!test.thumbnail) return;
    const fetchImage = async () => {
      try {
        const response = await api.get(test.thumbnail, {
          responseType: "blob",
        });
        setFetchedImageURL(URL.createObjectURL(response.data));
      } catch (e) {
        setFetchedImageURL("https://placehold.co/400x250?text=Mock+Test");
      }
    };
    fetchImage();
  }, [test.thumbnail]);

  const isFree = test.isFree === true;
  const enrolledCount = test.totalQuestions * 12 + 150; // Dynamic mock count

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
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-all hover:shadow-md group flex flex-col h-full">
      {/* THUMBNAIL AREA */}
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img
          src={
            fetchedImageURL || "https://placehold.co/400x250?text=Loading..."
          }
          alt={test.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isFree && (
            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">
              Free
            </span>
          )}
          {test.isGrandTest && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-tighter">
              Full Length
            </span>
          )}
        </div>

        {/* Price Tag */}
        {!isFree && (
          <div className="absolute bottom-0 right-0 bg-slate-900 text-white px-3 py-1 font-bold text-sm rounded-tl-lg">
            ₹{test.price}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">
          {test.category?.name || "Mock Test"}
        </p>
        <h3 className="text-base font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
          {test.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {test.description ||
            "Comprehensive test series to boost your exam preparation."}
        </p>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-0 py-3 mt-auto border-t border-slate-100 bg-slate-50/50 rounded-md">
          <StatItem
            icon={Clock}
            value={`${test.durationMinutes}m`}
            label="Time"
          />
          <StatItem icon={BookOpen} value={test.totalQuestions} label="Que" />
          <StatItem icon={Users} value={enrolledCount} label="Users" />
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="px-4 pb-4 flex gap-2">
        {isFree ? (
          <button
            onClick={() => handleAction("start")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Play size={14} /> Start Now
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAction("details")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold text-sm transition-colors"
            >
              Buy Now
            </button>
            {!isEmbedded && (
              <button
                onClick={() => handleAction("cart")}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors"
                title="Add to Cart"
              >
                <ShoppingCart size={18} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MockTestCard;
