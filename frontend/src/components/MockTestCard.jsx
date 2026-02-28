import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getImageUrl, handleImageError } from "../utils/imageHelper";
import { Clock, BookOpen, FileText } from "lucide-react";
import { motion } from "framer-motion";

const MockTestCard = ({ test, isEmbedded = false, index = 0 }) => {
  const navigate = useNavigate();
  const { userData, myMockTests } = useSelector((state) => state.user);

  const isPurchased =
    userData?.purchasedTests?.some(
      (id) => id === test._id || (id._id && id._id === test._id)
    ) || myMockTests?.some((t) => t._id === test._id);

  const effectivePrice =
    test.discountPrice > 0 && Number(test.discountPrice) < Number(test.price)
      ? Number(test.discountPrice)
      : Number(test.price);

  const isFree = test.isFree === true || effectivePrice <= 0 || isPurchased;

  const handleAction = () => {
    if (!userData) {
      toast.error("Please login to continue");
      return navigate("/login");
    }
    navigate(`/mocktests/${test._id}`);
  };

  const imgSrc = test.thumbnail
    ? getImageUrl(test.thumbnail)
    : test.category?.image
    ? getImageUrl(test.category.image)
    : "/logo.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      onClick={handleAction}
      className="group relative bg-white border border-slate-200 overflow-hidden flex flex-col cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.13)] transition-shadow duration-300"
    >
      {/* ── IMAGE ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={imgSrc}
          alt={test.title}
          onError={handleImageError}
          className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
        />

        {/* Category logo — top-left */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.06 + 0.18, duration: 0.28 }}
          className="absolute top-2 left-2 w-12 h-12 rounded-full bg-white border-2 border-white/80 overflow-hidden shadow-md p-0.5 flex items-center justify-center"
        >
          <img
            src={(test.category && (test.category.icon || test.category.image)) ? getImageUrl(test.category.icon || test.category.image) : "/logo.png"}
            alt="Category"
            onError={handleImageError}
            className="w-full h-full object-contain rounded-full"
          />
        </motion.div>

        {/* FREE badge — top-right */}
        {isFree && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 + 0.22, duration: 0.25 }}
            className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black tracking-widest px-2 py-0.5"
          >
            FREE
          </motion.div>
        )}

        {/* Hover shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
      </div>

      {/* ── BODY ── */}
      <div className="p-2 space-y-1">
        {/* Title */}
        <h3 className="text-[13px] font-black text-[#3e4954] tracking-tight font-poppins line-clamp-2 min-h-[2rem] group-hover:text-[#21b731] transition-colors duration-200">
          {test.title}
        </h3>

        {/* Category accent */}
        <div className="flex items-center gap-1.5">
          <div
            className={`h-0.5 w-3 group-hover:w-5 transition-all duration-300 ${
              test.isGrandTest ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
          <span className="text-[8px] font-black text-slate-400 tracking-widest font-poppins">
            {test.subcategory || test.category?.name || "General"}
          </span>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-3 gap-2 border-y border-slate-50 py-2">
          {[
            {
              label: "Duration",
              val: test.durationMinutes > 0 ? `${test.durationMinutes}m` : "—",
              icon: <Clock size={12} />,
            },
            {
              label: "Marks",
              val: test.totalMarks || "0",
              icon: <FileText size={12} />,
            },
            {
              label: "Questions",
              val: test.totalQuestions || 0,
              icon: <BookOpen size={12} />,
            },
          ].map((stat, idx) => (
            <div key={idx} className="text-center space-y-1">
              <div className="text-slate-300 flex justify-center group-hover:text-[#21b731] transition-colors duration-200">
                {stat.icon}
              </div>
              <div className="text-[10px] font-black text-[#3e4954] leading-none">
                {stat.val}
              </div>
              <div className="text-[7px] font-bold text-slate-400 tracking-tighter">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTION BUTTON ── */}
      <div className="px-3 pb-3 mt-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            handleAction();
          }}
          className={`w-full py-2.5 flex items-center justify-center text-[9px] font-black tracking-widest text-white transition-colors duration-200 ${
            test.isGrandTest
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-[#21b731] hover:bg-[#1a9227]"
          }`}
        >
          View Test
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MockTestCard;
