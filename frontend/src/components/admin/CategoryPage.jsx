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
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast"; 
import api from "../../api/axios";
import { ClipLoader } from "react-spinners";

export default function CategoryPage() {
    const { category } = useParams();
    const navigate = useNavigate();

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
            const res = await api.get(`/api/admin/mocktests/category?category=${category}`);
            setMocktests(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch mocktests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getMocktests();
    }, [category]);

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
                to="/admin/tests/add-new-test"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-4 transition font-medium"
            >
                <FaArrowLeft />
                Back to All Categories
            </Link>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
                <h1 className="text-4xl font-bold text-gray-800 text-center sm:text-left tracking-tight">
                    {formatCategoryName(category)}{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        Mocktests
                    </span>
                </h1>

                <Link
                    to={`/admin/mocktests/${category}/new`}
                    className="mt-5 sm:mt-0 flex items-center gap-2 px-5 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 shadow-lg transition-all"
                >
                    <FaPlus /> Create Mocktest
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
                            <p className="text-lg font-medium">No mocktests found yet.</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Click “Create Mocktest” to add one.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            {mocktests.map((test, i) => (
                                <motion.div
                                    key={test._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -5 }}
                                    className="group relative bg-white border border-slate-200 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col"
                                >
                                    <div className="relative p-6 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-semibold text-slate-800 leading-snug line-clamp-2" title={test.title}>
                                                    {test.title}
                                                </h3>

                                                <span
                                                    className={`ml-2 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                                                        test.isPublished
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {test.isPublished ? "Published" : "Draft"}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <FaBook className="text-gray-400" />
                                                {/* ✅ FIX: Improved Fallback Priority */}
                                                {test.subcategory || test.categorySlug || formatCategoryName(category) || "General"}
                                            </p>
                                        </div>

                                        <div className="mt-4 border-t border-slate-100"></div>

                                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                                            <p>
                                                <FaClock className="inline text-blue-500 mr-2" />
                                                Duration:{" "}
                                                <span className="font-medium text-slate-800">
                                                    {test.durationMinutes || "--"} mins
                                                </span>
                                            </p>
                                            <p>
                                                📊 Marks:{" "}
                                                <span className="font-medium text-slate-800">
                                                    {test.totalMarks || "--"}
                                                </span>
                                            </p>
                                            <p>
                                                ❓ Questions:{" "}
                                                <span className="font-medium text-slate-800">
                                                    {/* ✅ FIX: Display Question Count */}
                                                    {test.totalQuestions || 0}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="mt-4 border-t border-slate-100"></div>

                                        <div className="flex justify-between items-center mt-4 pt-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/mocktests/${category}/edit/${test._id}`
                                                        )
                                                    }
                                                    className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600 flex items-center gap-1"
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        navigate(`/admin/mocktests/${test._id}/questions`)
                                                    }
                                                    className="bg-green-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-600 flex items-center gap-1"
                                                >
                                                    Questions
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleTogglePublish(test._id, test.isPublished)}
                                                    title={test.isPublished ? "Unpublish" : "Publish"}
                                                    className={`p-1.5 rounded-full transition ${
                                                        test.isPublished
                                                            ? "text-green-500 hover:text-green-600"
                                                            : "text-gray-400 hover:text-blue-500"
                                                    }`}
                                                >
                                                    {test.isPublished ? (
                                                        <FaToggleOn size={22} />
                                                    ) : (
                                                        <FaToggleOff size={22} />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(test._id)}
                                                    className="flex items-center gap-1 text-red-500 hover:text-red-600 font-medium text-sm transition p-1"
                                                    title="Delete Mocktest"
                                                >
                                                    <FaTrash size={16} />
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

