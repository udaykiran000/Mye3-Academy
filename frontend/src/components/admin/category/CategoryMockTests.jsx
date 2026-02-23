import React, { useState, useEffect } from "react";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaClock,
    FaBook,
    FaToggleOn,
    FaToggleOff,
    FaArrowLeft,
} from "react-icons/fa";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast"; 
import api from "../../../api/axios";
import { ClipLoader } from "react-spinners";
import { getImageUrl, handleImageError } from "../../../utils/imageHelper";

export default function CategoryMockTests() {
    const { category } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get("type"); // "mock" or "grand"

    const [mocktests, setMocktests] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatCategoryName = (slug) => {
        if (!slug) return "All Categories";
        return slug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getMocktests = async () => {
        setLoading(true);
        try {
            // We pass isGrandTest to the backend for better filtering
            const isGrand = type === "grand" ? "true" : "false";
            const res = await api.get(`/api/admin/mocktests/category?category=${category}&isGrandTest=${isGrand}`);
            setMocktests(res.data.mocktests || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch mocktests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getMocktests();
    }, [category, type]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this test?")) return;
        
        try {
            await api.delete(`/api/admin/mocktests/${id}`);
            toast.success("🗑️ Mocktest deleted successfully!");
            setMocktests((prev) => prev.filter((t) => t._id !== id));
        } catch {
            toast.error("❌ Failed to delete mocktest");
        }
    };

    const handleTogglePublish = async (id, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            setMocktests((prev) =>
                prev.map((t) => (t._id === id ? { ...t, isPublished: newStatus } : t))
            );

            const res = await api.put(`/api/admin/mocktests/${id}/publish`);
            toast.success(res.data.message || (newStatus ? "Published" : "Unpublished"));
        } catch (err) {
            toast.error("⚠️ Failed to update publish status");
            getMocktests();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 px-6 py-10">
            <Link
                to={`/admin/tests/add-new-test?type=${type}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-4 transition font-medium"
            >
                <FaArrowLeft />
                Back to Exams Directory
            </Link>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
                <h1 className="text-4xl font-bold text-gray-800 text-center sm:text-left tracking-tight flex items-center gap-4">
                    <span className="uppercase">{formatCategoryName(category)}</span>
                    <span className={`px-4 py-1.5 rounded-xl text-lg font-black uppercase tracking-widest shadow-sm border ${
                        type === 'grand' 
                        ? 'bg-amber-100 text-amber-700 border-amber-200' 
                        : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    }`}>
                        {type === 'grand' ? 'Grand Tests' : 'Mocktests'}
                    </span>
                </h1>
                <Link
                    to={`/admin/mocktests/${category}/new?type=${type}`}
                    className={`mt-5 sm:mt-0 flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold transition-all shadow-lg hover:translate-y-[-2px] hover:shadow-xl ${
                        type === 'grand'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-700'
                    }`}
                >
                    <FaPlus /> Create {type === 'grand' ? 'Grand Test' : 'Mocktest'}
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[50vh]">
                    <ClipLoader size={50} color={"#2563EB"} />
                    <p className="ml-4 text-lg text-gray-600">Loading Tests...</p>
                </div>
            ) : (
                <AnimatePresence>
                    {mocktests.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-gray-500 mt-20"
                        >
                            <p className="text-lg font-medium">No {type === 'grand' ? 'grand tests' : 'mocktests'} found yet.</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Click “Create {type === 'grand' ? 'Grand Test' : 'Mocktest'}” to add one.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                        >
                            {mocktests.map((test, i) => (
                                <motion.div
                                    key={test._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 overflow-hidden flex flex-col"
                                >
                                    {/* COMPACT IMAGE HEADER */}
                                    <div className="relative h-32 bg-slate-50 overflow-hidden">
                                        <img
                                            src={getImageUrl(test.thumbnail)}
                                            alt={test.title}
                                            onError={handleImageError}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-3 right-3 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                                                test.isPublished 
                                                ? "bg-emerald-500 text-white border-emerald-400" 
                                                : "bg-amber-400 text-white border-amber-300"
                                            }`}>
                                                {test.isPublished ? "Active" : "Draft"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        {/* HEADER INFO */}
                                        <div className="mb-4">
                                            <h3 className="text-lg font-black text-slate-800 leading-tight line-clamp-2 min-h-[2.5rem] mb-1.5 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                {test.title}
                                            </h3>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <FaBook size={10} className="text-slate-300" />
                                                {test.subcategory || "General Category"}
                                            </p>
                                        </div>

                                        {/* STATS GRID - NEAT & COMPACT */}
                                        <div className="grid grid-cols-3 gap-2 mb-6">
                                            {[
                                            { 
                                                label: "Mins", 
                                                val: (() => {
                                                    // ALWAYS check question count first
                                                    const qCount = test.questions?.length ?? 0;
                                                    if (qCount === 0) return "—"; // No questions = no time to show
                                                    if (test.durationMinutes > 0) return `${test.durationMinutes}⏱`;
                                                    return `${qCount * 2}`; // Auto: 2 mins per question
                                                })(),
                                                icon: <FaClock /> 
                                            },
                                            { label: "Marks", val: test.totalMarks || "0", icon: "📊" },
                                            { label: "Qs", val: test.questions?.length ?? test.totalQuestions ?? 0, icon: "❓" }
                                            ].map((stat, idx) => (
                                                <div key={idx} className="bg-slate-50/80 border border-slate-100 p-2 rounded-xl text-center group-hover:bg-white group-hover:border-blue-50 transition-colors">
                                                    <div className="text-slate-400 text-xs mb-0.5">{stat.icon}</div>
                                                    <div className="text-xs font-black text-slate-800">{stat.val}</div>
                                                    <div className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* REFINED ACTIONS - COMPACT GRID */}
                                        <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
                                            <button
                                                onClick={() => navigate(`/admin/mocktests/${category}/edit/${test._id}`)}
                                                className="flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95"
                                            >
                                                <FaEdit /> Fix
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/mocktests/${test._id}/questions`)}
                                                className="flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                            >
                                                Manage Qs
                                            </button>
                                            
                                            <div className="col-span-2 flex items-center gap-2 mt-0.5">
                                                <button
                                                    onClick={() => handleTogglePublish(test._id, test.isPublished)}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        test.isPublished 
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                                                        : 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100'
                                                    }`}
                                                >
                                                    {test.isPublished ? <><FaToggleOn size={14}/> Active</> : <><FaToggleOff size={14}/> Go Live</>}
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(test._id)}
                                                    className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 rounded-lg hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                                    title="Remove Test"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}

