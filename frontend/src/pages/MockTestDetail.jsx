import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicTestById } from "../redux/mockTestSlice";
import { addItemToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import { CgSpinner } from "react-icons/cg";
import api from "../api/axios";
import { Clock, BookOpen, FileText, MinusCircle, Tag, ArrowLeft, ShoppingCart, Play } from "lucide-react";
import { motion } from "framer-motion";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

export default function MockTestDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { userData, myMockTests } = useSelector((state) => state.user);
    const cartItems = useSelector((state) => state.cart.cartItems || []);
    const isAlreadyInCart = cartItems.some((item) => item._id === id);

    const isPurchased = userData?.purchasedTests?.some(pid =>
        pid === id || (pid._id && pid._id === id)
    ) || myMockTests?.some(t => t._id === id);

    const test = useSelector((state) => state.mocktest.selectedMocktest);
    const status = useSelector((state) => state.mocktest.selectedStatus);
    const error = useSelector((state) => state.mocktest.selectedError);

    useEffect(() => {
        if (id) dispatch(fetchPublicTestById(id));
    }, [dispatch, id]);

    const handleAddToCart = () => {
        if (!userData) {
            toast.error("Please login first");
            return navigate("/login");
        }
        if (isAlreadyInCart) return navigate("/cart");
        dispatch(addItemToCart(id[0] === ":" ? id.slice(1) : id));
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f4f7fa]">
                <CgSpinner className="animate-spin text-4xl text-[#21b731]" />
            </div>
        );
    }

    if (status === "failed") {
        return (
            <div className="max-w-xl mx-auto pt-40 text-center">
                <h2 className="text-lg font-black text-red-600 uppercase tracking-widest">Unable to load test</h2>
                <p className="text-slate-500 mt-2 text-sm">{error}</p>
                <Link to="/mocktests" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#21b731] text-white text-[11px] font-black uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back to Tests
                </Link>
            </div>
        );
    }

    if (!test) return null;

    const imgSrc = test.thumbnail
        ? getImageUrl(test.thumbnail)
        : test.category?.image
        ? getImageUrl(test.category.image)
        : "/logo.png";

    const effectivePrice = test.discountPrice > 0 && Number(test.discountPrice) < Number(test.price)
        ? Number(test.discountPrice)
        : Number(test.price);

    const isFree = test.isFree === true || effectivePrice <= 0 || isPurchased;

    const stats = [
        { icon: <BookOpen size={14} />, label: "Questions", val: test.totalQuestions || 0 },
        { 
            icon: <Clock size={14} />, 
            label: "Duration", 
            val: test.durationMinutes > 0 
                ? `${test.durationMinutes} min` 
                : (test.totalQuestions > 0 ? `${test.totalQuestions * 2} min` : "—") 
        },
        { icon: <FileText size={14} />, label: "Total Marks", val: test.totalMarks || 0 },
        { icon: <MinusCircle size={14} />, label: "Negative", val: test.negativeMarking || "None" },
    ];

    return (
        <div className="bg-[#f4f7fa] min-h-screen pt-20 pb-16">
            <div className="max-w-5xl mx-auto px-4 md:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-5 pt-4">
                    <Link to="/mocktests" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#21b731] transition-colors">
                        <ArrowLeft size={12} /> All Tests
                    </Link>
                    <span className="text-slate-300 text-xs">/</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[200px]">{test.title}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* LEFT — MAIN CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="flex-1 min-w-0"
                    >
                        {/* Hero Image */}
                        <div className="relative w-full aspect-[16/7] overflow-hidden bg-slate-200 mb-4">
                            <img
                                src={imgSrc}
                                alt={test.title}
                                onError={handleImageError}
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {/* Category logo */}
                            <div className="absolute top-3 left-3 w-10 h-10 bg-white border-2 border-white/80 overflow-hidden shadow-md flex items-center justify-center">
                                <img
                                    src={(test.category?.icon || test.category?.image) ? getImageUrl(test.category.icon || test.category.image) : "/logo.png"}
                                    alt="cat"
                                    onError={handleImageError}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* FREE badge */}
                            {isFree && (
                                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[8px] font-black tracking-widest px-2 py-0.5">
                                    FREE
                                </div>
                            )}

                            {/* Grand badge */}
                            {test.isGrandTest && (
                                <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-[8px] font-black tracking-widest px-2 py-0.5">
                                    GRAND TEST
                                </div>
                            )}
                        </div>

                        {/* Title + Category */}
                        <div className="bg-white border border-slate-100 shadow-sm px-5 py-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{test.category?.name || "General"}</span>
                                {test.subcategory && (
                                    <>
                                        <span className="text-slate-200">·</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{test.subcategory}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-lg font-black text-[#3e4954] tracking-tight leading-snug">
                                {test.title}
                            </h1>
                            <div className={`mt-2 h-0.5 w-8 ${test.isGrandTest ? "bg-amber-400" : "bg-[#21b731]"}`} />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {stats.map((s, i) => (
                                <div key={i} className="bg-white border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
                                    <div className={`text-[#21b731]`}>{s.icon}</div>
                                    <div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                                        <div className="text-[13px] font-black text-[#3e4954]">{s.val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        {test.description && (
                            <div className="bg-white border border-slate-100 shadow-sm px-5 py-4">
                                <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">About this Test</h2>
                                <p className="text-[13px] text-slate-600 leading-relaxed">{test.description}</p>
                            </div>
                        )}
                    </motion.div>

                    {/* RIGHT — STICKY ACTION PANEL */}
                    <motion.aside
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24"
                    >
                        <div className="bg-white border border-slate-100 shadow-sm">
                            {/* Price header */}
                            <div className={`px-5 py-4 border-b border-slate-50 ${test.isGrandTest ? "bg-amber-50" : "bg-[#f0fff4]"}`}>
                                {isFree ? (
                                    <div className="text-2xl font-black text-[#21b731] tracking-tight">FREE</div>
                                ) : (
                                    <div>
                                        {test.discountPrice > 0 && test.discountPrice < test.price && (
                                            <div className="text-[11px] font-bold text-slate-400 line-through mb-0.5">₹{test.price}</div>
                                        )}
                                        <div className="text-2xl font-black text-[#3e4954]">₹{effectivePrice}</div>
                                        {test.discountPrice > 0 && test.discountPrice < test.price && (
                                            <div className="text-[9px] font-black text-[#21b731] tracking-widest mt-0.5">
                                                {Math.round((1 - test.discountPrice / test.price) * 100)}% OFF
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quick stats */}
                            <div className="px-5 py-3 border-b border-slate-50 flex flex-col gap-2">
                                {[
                                    { label: "Questions", val: test.totalQuestions || 0 },
                                    { 
                                        label: "Duration", 
                                        val: test.durationMinutes > 0 
                                            ? `${test.durationMinutes} min` 
                                            : (test.totalQuestions > 0 ? `${test.totalQuestions * 2} min` : "—") 
                                    },
                                    { label: "Total Marks", val: test.totalMarks || 0 },
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400">{s.label}</span>
                                        <span className="text-[11px] font-black text-[#3e4954]">{s.val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="px-5 py-4">
                                {(test.price > 0 && !isPurchased) ? (
                                    <button
                                        onClick={handleAddToCart}
                                        className={`w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors ${
                                            isAlreadyInCart
                                                ? "bg-[#21b731] hover:bg-[#1a9227]"
                                                : "bg-[#3e4954] hover:bg-[#2e363e]"
                                        }`}
                                    >
                                        <ShoppingCart size={13} />
                                        {isAlreadyInCart ? "Go to Cart" : "Add to Cart"}
                                    </button>
                                ) : (
                                    <Link
                                        to={`/student/instructions/${test._id}`}
                                        className={`w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors ${
                                            test.isGrandTest
                                                ? "bg-amber-500 hover:bg-amber-600"
                                                : "bg-[#21b731] hover:bg-[#1a9227]"
                                        }`}
                                    >
                                        <Play size={12} />
                                        Start Exam Now
                                    </Link>
                                )}

                                {/* Tags */}
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {test.isFree && (
                                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 uppercase tracking-widest">Free</span>
                                    )}
                                    {test.isGrandTest && (
                                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 uppercase tracking-widest">Grand Test</span>
                                    )}
                                    {test.category?.name && (
                                        <span className="text-[8px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 uppercase tracking-widest">{test.category.name}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </div>
            </div>
        </div>
    );
}