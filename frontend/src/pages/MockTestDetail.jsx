import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicTestById } from "../redux/mockTestSlice";
import { toast } from "react-toastify";
import { CgSpinner } from "react-icons/cg";
import api from "../api/axios";
import { Clock, BookOpen, FileText, MinusCircle, Tag, ArrowLeft, Play, ShieldCheck, Target } from "lucide-react";
import { motion } from "framer-motion";
import { getImageUrl, handleImageError } from "../utils/imageHelper";
import { addPurchasedTest, fetchMyMockTests } from "../redux/userSlice";

export default function MockTestDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { userData, myMockTests } = useSelector((state) => state.user);
    const test = useSelector((state) => state.mocktest.selectedMocktest);
    const status = useSelector((state) => state.mocktest.selectedStatus);
    const error = useSelector((state) => state.mocktest.selectedError);

    useEffect(() => {
        if (id) dispatch(fetchPublicTestById(id));
        
        // Cleanup: dismiss any hanging toasts when leaving the page
        return () => toast.dismiss();
    }, [dispatch, id]);

    const isPurchased =
        userData?.purchasedTests?.some((pid) => pid === id || (pid._id && pid._id === id)) ||
        myMockTests?.some((t) => t._id === id);

    const effectivePrice =
        test?.discountPrice > 0 && Number(test?.discountPrice) < Number(test?.price)
            ? Number(test?.discountPrice)
            : Number(test?.price || 0);

    const canStart = test?.isFree || effectivePrice <= 0 || isPurchased;

    const [isProcessing, setIsProcessing] = React.useState(false);

    // Dynamic Razorpay Script Loader
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUnlock = async () => {
        if (!userData) {
            toast.error("Please login to unlock tests");
            return navigate("/login");
        }

        if (canStart) {
            return navigate(`/student/instructions/${id}`);
        }

        setIsProcessing(true);
        const toastId = toast.loading("Initializing purchase...");

        try {
            // 1. Check if it's actually free (backend safety) or needs payment
            if (effectivePrice <= 0 || test.isFree) {
                const { data } = await api.post("/api/payment/enroll-free", {
                    cartItems: [id]
                });

                if (data.success) {
                    dispatch(addPurchasedTest(id));
                    dispatch(fetchMyMockTests()); // Refresh store
                    toast.update(toastId, { render: "Enrolled successfully!", type: "success", isLoading: false, autoClose: 3000 });
                    navigate(`/student/instructions/${id}`);
                }
                setIsProcessing(false);
                return;
            }

            // 2. Create Order first to see if it's a Mock order or Real
            const { data: orderData } = await api.post("/api/payment/create-order", {
                cartItems: [id]
            });

            if (!orderData.success) {
                throw new Error(orderData.message || "Order creation failed");
            }

            // 3. Handle Mock vs Real Flow
            if (orderData.id.startsWith("mock_order_")) {
                toast.update(toastId, { render: "Simulating mock payment...", isLoading: true });
                
                // Realism delay
                await new Promise(r => setTimeout(r, 1500));

                const { data: verifyData } = await api.post("/api/payment/verify-payment", {
                    razorpay_order_id: orderData.id,
                    razorpay_payment_id: "mock_pay_" + Date.now(),
                    razorpay_signature: "mock_sig_" + Date.now(),
                });

                if (verifyData.success) {
                    dispatch(addPurchasedTest(id));
                    dispatch(fetchMyMockTests());
                    toast.update(toastId, { render: "Test Unlocked (Test Mode)!", type: "success", isLoading: false, autoClose: 3000 });
                    navigate(`/student/instructions/${id}`);
                } else {
                    toast.update(toastId, { render: "Mock verification failed.", type: "error", isLoading: false, autoClose: 3000 });
                }
                setIsProcessing(false);
                return;
            }

            // 4. Paid Flow - Real Razorpay Flow
            const res = await loadRazorpayScript();
            if (!res) {
                toast.update(toastId, { render: "Razorpay SDK failed to load.", type: "error", isLoading: false, autoClose: 3000 });
                setIsProcessing(false);
                return;
            }

            // 5. Open Razorpay Checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Mye3 Academy",
                description: `Payment for ${test.title}`,
                image: "/logo.png",
                order_id: orderData.id,
                handler: async (response) => {
                    try {
                        toast.update(toastId, { render: "Verifying payment...", isLoading: true });
                        const { data: verifyData } = await api.post("/api/payment/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyData.success) {
                            dispatch(addPurchasedTest(id));
                            dispatch(fetchMyMockTests());
                            toast.update(toastId, { render: "Test Unlocked Successfully!", type: "success", isLoading: false, autoClose: 3000 });
                            navigate(`/student/instructions/${id}`);
                        } else {
                            toast.update(toastId, { render: "Verification failed.", type: "error", isLoading: false, autoClose: 5000 });
                        }
                    } catch (err) {
                        toast.update(toastId, { render: "Payment verification failed.", type: "error", isLoading: false, autoClose: 5000 });
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: userData.name,
                    email: userData.email,
                },
                theme: {
                    color: "#2563eb",
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                        toast.dismiss(toastId);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Purchase Error:", error);
            const msg = error.response?.data?.message || error.message || "Something went wrong.";
            toast.update(toastId, { render: msg, type: "error", isLoading: false, autoClose: 5000 });
            setIsProcessing(false);
        }
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

        <div className="flex items-center gap-2 mb-8 pt-4">
            <Link to="/mocktests" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#21b731] transition-colors">
                <ArrowLeft size={12} /> All Tests
            </Link>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] truncate max-w-[200px]">{test.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* LEFT — MAIN CONTENT */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-1 min-w-0"
            >
                {/* Hero Area */}
                <div className="relative w-full aspect-[21/9] overflow-hidden bg-slate-200 mb-6 shadow-2xl shadow-slate-200/50">
                    <img
                        src={imgSrc}
                        alt={test.title}
                        onError={handleImageError}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Category logo */}
                    <div className="absolute top-4 left-4 w-12 h-12 bg-white rounded-none border-2 border-white overflow-hidden shadow-xl flex items-center justify-center">
                        <img
                            src={(test.category?.icon || test.category?.image) ? getImageUrl(test.category.icon || test.category.image) : "/logo.png"}
                            alt="cat"
                            onError={handleImageError}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {/* Tags */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        {test.isGrandTest && (
                            <div className="bg-amber-500 text-white text-[9px] font-black tracking-[0.2em] px-3 py-1 uppercase shadow-lg">
                                GRAND TEST
                            </div>
                        )}
                        {(test.isFree || effectivePrice <= 0) && (
                            <div className="bg-emerald-500 text-white text-[9px] font-black tracking-[0.2em] px-3 py-1 uppercase shadow-lg">
                                FREE
                            </div>
                        )}
                    </div>
                </div>

                {/* Title Card */}
                <div className="bg-white rounded-none border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] px-6 py-8 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#122b5e]"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 uppercase tracking-[0.2em]">{test.category?.name || "General"}</span>
                        {test.subcategory && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l border-slate-200 pl-3">{test.subcategory}</span>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#122b5e] tracking-tight leading-tight max-w-2xl text-shadow-sm">
                        {test.title}
                    </h1>
                </div>

                {/* Stats Grid - Premium Style */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white rounded-none border border-slate-100 shadow-sm px-5 py-5 flex flex-col gap-3 relative overflow-hidden group hover:border-[#122b5e] transition-all">
                            <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-[#122b5e] transition-all duration-300"></div>
                            <div className="w-8 h-8 rounded-none bg-slate-50 flex items-center justify-center text-[#122b5e] group-hover:bg-[#122b5e] group-hover:text-white transition-colors">
                                {s.icon}
                            </div>
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{s.label}</div>
                                <div className="text-[16px] font-black text-[#122b5e]">{s.val}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Description Area */}
                {test.description && (
                    <div className="bg-white rounded-none border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] px-6 py-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-6 h-1 bg-[#122b5e]"></div>
                            <h2 className="text-[11px] font-black text-[#122b5e] uppercase tracking-[0.3em]">Module Overview</h2>
                        </div>
                        <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                            {test.description}
                        </p>
                    </div>
                )}
            </motion.div>

            {/* RIGHT — STICKY ACTION PANEL */}
            <motion.aside
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24"
            >
                <div className="bg-white rounded-none border border-slate-100 shadow-[0_30px_70px_rgba(0,0,0,0.1)] overflow-hidden">
                    {/* Price Header */}
                    <div className="bg-gradient-to-br from-[#122b5e] to-[#1e4db7] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                        <div className="relative z-10">
                            {(test.isFree || effectivePrice <= 0) ? (
                                <div className="text-4xl font-black tracking-tight text-white">FREE</div>
                            ) : (
                                <div>
                                    {test.discountPrice > 0 && test.discountPrice < test.price && (
                                        <div className="text-[13px] font-bold text-blue-200/60 line-through mb-1">₹{test.price}</div>
                                    )}
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[14px] font-black">₹</span>
                                        <span className="text-4xl font-black text-white tracking-tighter">{effectivePrice}</span>
                                    </div>
                                    {test.discountPrice > 0 && test.discountPrice < test.price && (
                                        <div className="mt-3 inline-flex px-2 py-0.5 bg-white/20 rounded-none text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                                            SAVE {Math.round((1 - test.discountPrice / test.price) * 100)}%
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Features list */}
                    <div className="p-6 space-y-4 border-b border-slate-50">
                        {[
                            { label: "Total Questions", val: test.totalQuestions || 0, icon: <BookOpen size={12} className="text-blue-500" /> },
                            { 
                                label: "Exam Duration", 
                                val: test.durationMinutes > 0 ? `${test.durationMinutes} min` : "Auto-calc", 
                                icon: <Clock size={12} className="text-blue-500" /> 
                            },
                            { label: "Maximum Marks", val: test.totalMarks || 0, icon: <FileText size={12} className="text-blue-500" /> },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {s.icon}
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{s.label}</span>
                                </div>
                                <span className="text-[12px] font-black text-[#122b5e]">{s.val}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="p-6">
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleUnlock}
                            disabled={isProcessing}
                            className={`w-full flex items-center justify-center gap-3 py-5 px-6 rounded-none font-black uppercase tracking-[0.2em] text-[11px] text-white transition-all shadow-xl disabled:bg-slate-300 ${
                                canStart 
                                    ? (test.isGrandTest ? "bg-[#122b5e] hover:bg-black" : "bg-[#21b731] hover:bg-[#1a9227]") 
                                    : "bg-gradient-to-r from-[#122b5e] to-[#1e40af] hover:from-black hover:to-slate-900"
                            }`}
                        >
                            {isProcessing ? (
                                <CgSpinner className="animate-spin" size={18} />
                            ) : (
                                <Play size={14} className="fill-current" />
                            )}
                            {canStart ? "Begin Assessment" : "Unlock Full Access"}
                        </motion.button>

                        <div className="mt-6 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Instant Activation</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Target size={14} className="text-blue-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Complete Performance Analytics</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.aside>
                </div>
            </div>
        </div>
    );
}