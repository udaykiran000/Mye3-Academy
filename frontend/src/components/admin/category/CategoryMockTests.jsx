import React, { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Clock,
    Book,
    Eye,
    EyeOff,
    ArrowLeft,
    Trophy,
    Layers,
    Save,
    LayoutGrid,
    List,
    ChevronDown,
    Check,
    Users,
    ChevronRight as ChevronRightIcon
} from "lucide-react";
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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [filterType, setFilterType] = useState('all'); // 'all', 'mock', 'grand'

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

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
            // Fetch both mock and grand tests in parallel for a consolidated view
            const [mockRes, grandRes] = await Promise.all([
                api.get(`/api/admin/mocktests/category?category=${category}&isGrandTest=false`),
                api.get(`/api/admin/mocktests/category?category=${category}&isGrandTest=true`)
            ]);

            const allTests = [
                ...(mockRes.data.mocktests || []),
                ...(grandRes.data.mocktests || [])
            ];

            setMocktests(allTests);
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
            toast.error(err.response?.data?.message || "⚠️ Failed to update publish status");
            getMocktests();
        }
    };

    /* ---------------------- PAGINATION LOGIC ---------------------- */
    const filteredTests = useMemo(() => {
        return mocktests.filter(t => {
            const [mainType, subType] = filterType.split(":");

            let typeMatch = true;
            if (mainType === 'mock') typeMatch = !t.isGrandTest;
            if (mainType === 'grand') typeMatch = t.isGrandTest;
            if (mainType === 'all') typeMatch = true;

            let subMatch = true;
            if (subType === 'PAID') subMatch = !t.isFree;
            if (subType === 'FREE') subMatch = t.isFree;

            return typeMatch && subMatch;
        });
    }, [mocktests, filterType]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, category]);

    const totalPages = Math.max(1, Math.ceil(filteredTests.length / itemsPerPage));
    const paginatedTests = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTests.slice(start, start + itemsPerPage);
    }, [filteredTests, currentPage]);

    return (
        <div className="min-h-screen bg-[#EDF0FF]">
            {/* WHITE HEADER STRIP */}
            <div className="bg-white border-b border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-2">
                <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-3 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-1 mb-2"
                    >
                        <Link
                            to={`/admin/categories`}
                            className="flex items-center gap-2 text-[10px] font-black text-[#7e7e7e] hover:text-[#21b731] transition-all tracking-[0.2em] font-poppins uppercase"
                        >
                            <ArrowLeft size={14} /> Back to categories
                        </Link>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-1.5 h-10 bg-[#21b731] shadow-[0_0_10px_#21b731/20]" />
                            <div>
                                <h1 className="text-lg font-black text-[#3e4954] tracking-tight font-poppins mb-1 uppercase">
                                    {formatCategoryName(category)}
                                </h1>
                                <p className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-[0.1em] opacity-60">Manage mock and grand tests for this segment</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex flex-col sm:flex-row flex-wrap items-center gap-4"
                        >
                            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-100 shadow-inner">
                                <button
                                    onClick={() => setFilterType("all")}
                                    className={`px-4 py-2 text-[9px] font-black tracking-widest transition-all ${filterType === 'all'
                                            ? 'bg-[#3e4954] text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    All tests ({filteredTests.length})
                                </button>

                                <FilterTabWithDropdown
                                    id="mock"
                                    label="Mock"
                                    icon={<Layers size={11} />}
                                    activeFilter={filterType}
                                    setFilter={setFilterType}
                                    counts={{
                                        all: mocktests.filter(t => !t.isGrandTest).length,
                                        paid: mocktests.filter(t => !t.isGrandTest && !t.isFree).length,
                                        free: mocktests.filter(t => !t.isGrandTest && t.isFree).length,
                                    }}
                                    activeColor="bg-[#21b731] text-white shadow-lg shadow-green-100 font-poppins"
                                />

                                <FilterTabWithDropdown
                                    id="grand"
                                    label="Grand"
                                    icon={<Trophy size={11} />}
                                    activeFilter={filterType}
                                    setFilter={setFilterType}
                                    counts={{
                                        all: mocktests.filter(t => t.isGrandTest).length,
                                        paid: mocktests.filter(t => t.isGrandTest && !t.isFree).length,
                                        free: mocktests.filter(t => t.isGrandTest && t.isFree).length,
                                    }}
                                    activeColor="bg-amber-500 text-white shadow-lg shadow-amber-100 font-poppins"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {/* View mode toggle */}
                                <div className="flex items-center gap-1 bg-white p-1 border border-slate-200">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 transition-all ${viewMode === 'grid'
                                                ? 'bg-slate-100 text-[#3e4954]'
                                                : 'text-slate-300 hover:text-slate-500'
                                            }`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid size={15} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 transition-all ${viewMode === 'list'
                                                ? 'bg-slate-100 text-[#3e4954]'
                                                : 'text-slate-300 hover:text-slate-500'
                                            }`}
                                        title="List View"
                                    >
                                        <List size={15} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/admin/mocktests/${category}/new?type=mock`}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-[#21b731] text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-green-100 hover:bg-[#1a9227] hover:-translate-y-0.5"
                                    >
                                        <Plus size={16} /> Mock
                                    </Link>
                                    <Link
                                        to={`/admin/mocktests/${category}/new?type=grand`}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-amber-100 hover:bg-amber-600 hover:-translate-y-0.5"
                                    >
                                        <Trophy size={16} /> Grand
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pb-6">

                {loading ? (
                    <div className="flex justify-center items-center min-h-[50vh]">
                        <ClipLoader size={50} color={"#2563EB"} />
                        <p className="ml-4 text-lg text-gray-600">Loading Mocktests...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {paginatedTests.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="text-center text-gray-500 mt-20"
                            >
                                <p className="text-lg font-bold font-poppins">No tests found for this selection.</p>
                                <p className="text-sm text-gray-400 mt-1 font-poppins uppercase tracking-widest font-black">
                                    Try adjusting your filters or click on the buttons above to create a new Mocktest.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`${currentPage}-${filterType}-${viewMode}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="w-full"
                            >
                                <div className={viewMode === 'grid'
                                    ? "grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                                    : "flex flex-col gap-2"
                                }>
                                    {paginatedTests.map((test, i) => (
                                        <motion.div
                                            key={test._id}
                                            initial="initial"
                                            animate="animate"
                                            whileHover="hover"
                                            variants={{
                                                initial: { opacity: 0, y: 30 },
                                                animate: { opacity: 1, y: 0 },
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                                delay: (i % itemsPerPage) * 0.04
                                            }}
                                            whileTap={{ scale: 0.99 }}
                                            className={`group relative bg-white border border-slate-100 transition-all duration-400 shadow-[0_15px_55px_rgba(0,0,0,0.12)] hover:shadow-[0_25px_85px_rgba(0,0,0,0.16)] overflow-hidden flex cursor-pointer ${viewMode === 'list' ? 'flex-row items-center h-20 p-3 gap-4 lg:gap-6' : 'flex-col'
                                                } ${test.isGrandTest ? 'border-amber-100' : 'border-slate-200'
                                                }`}
                                        >
                                            {/* Hover Indicator for List View */}
                                            {viewMode === 'list' && (
                                                <motion.div
                                                    initial={{ scaleY: 0 }}
                                                    whileHover={{ scaleY: 1 }}
                                                    className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${test.isGrandTest ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                />
                                            )}
                                            {/* THUMBNAIL */}
                                            <div className={`relative bg-slate-50 flex-shrink-0 ${viewMode === 'list' ? 'w-12 h-12' : 'aspect-[4/3] w-full overflow-hidden'}`}>
                                                <motion.img
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.8 }}
                                                    src={test.thumbnail ? getImageUrl(test.thumbnail) : (test.category?.image ? getImageUrl(test.category.image) : "/logo.png")}
                                                    alt={test.title}
                                                    onError={handleImageError}
                                                    className={`w-full h-full scale-110 group-hover:scale-100 transition-transform duration-700 ${viewMode === 'list' ? 'object-contain p-2' : 'object-cover'}`}
                                                />
                                                {/* Shine Sweep Effect */}
                                                {viewMode === 'grid' && (
                                                    <motion.div
                                                        variants={{
                                                            hover: { x: ['-100%', '100%'], transition: { duration: 0.8, ease: "easeInOut" } }
                                                        }}
                                                        className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-20 pointer-events-none"
                                                    />
                                                )}
                                                {viewMode === 'grid' && (
                                                    <>
                                                        <motion.div
                                                            variants={{
                                                                hidden: { opacity: 0 },
                                                                show: {
                                                                    opacity: 1,
                                                                    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
                                                                }
                                                            }}
                                                            initial="hidden"
                                                            animate="show"
                                                            className="absolute top-1 left-1 flex flex-col gap-1"
                                                        >
                                                            <motion.span
                                                                variants={{ hidden: { opacity: 0, y: -5 }, show: { opacity: 1, y: 0 } }}
                                                                className={`px-1.5 py-0.5 text-[7.5px] font-black tracking-wide border ${test.isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-[#3e4954] text-white border-[#3e4954]"
                                                                    }`}
                                                            >
                                                                {test.isPublished ? "Live" : "Draft"}
                                                            </motion.span>
                                                            <div className="flex gap-1">
                                                                <motion.span
                                                                    variants={{ hidden: { opacity: 0, y: -5 }, show: { opacity: 1, y: 0 } }}
                                                                    className={`px-1.5 py-0.5 text-[7.5px] font-black tracking-wide border ${test.isGrandTest ? "bg-amber-500 text-white border-amber-600" : "bg-emerald-500 text-white border-emerald-600"
                                                                        }`}
                                                                >
                                                                    {test.isGrandTest ? "Grand" : "Mock"}
                                                                </motion.span>
                                                                <motion.span
                                                                    variants={{ hidden: { opacity: 0, y: -5 }, show: { opacity: 1, y: 0 } }}
                                                                    className={`px-1.5 py-0.5 text-[7.5px] font-black tracking-wide border ${test.isFree ? "bg-blue-500 text-white border-blue-600" : "bg-indigo-600 text-white border-indigo-700"
                                                                        }`}
                                                                >
                                                                    {test.isFree ? "Free" : "Paid"}
                                                                </motion.span>
                                                            </div>
                                                        </motion.div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.15 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(test._id); }}
                                                            className="absolute top-1 right-1 p-1.5 bg-white/80 hover:bg-rose-500 text-slate-400 hover:text-white border border-slate-100 hover:border-rose-500 transition-all z-20"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={13} />
                                                        </motion.button>
                                                    </>
                                                )}
                                            </div>

                                            {/* CONTENT AREA */}
                                            <div className={`flex flex-col justify-center ${viewMode === 'list' ? 'flex-1 min-w-0' : 'p-2 space-y-1'}`}>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className={`font-black text-[#3e4954] tracking-tight group-hover:text-[#21b731] transition-colors font-poppins truncate ${viewMode === 'list' ? 'text-sm mb-0' : 'text-[13px] line-clamp-2 min-h-[1.8rem]'}`}>
                                                            {test.title}
                                                        </h3>
                                                        {viewMode === 'list' && (
                                                            <div className="flex gap-1 flex-shrink-0">
                                                                <span className={`px-1 py-0.5 text-[6.5px] font-black tracking-wide border ${test.isGrandTest ? "bg-amber-500 text-white border-amber-600" : "bg-emerald-500 text-white border-emerald-600"
                                                                    }`}>
                                                                    {test.isGrandTest ? "Grand" : "Mock"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <div className={`h-0.5 w-3 group-hover:w-5 transition-all ${test.isGrandTest ? "bg-amber-400" : "bg-emerald-400"
                                                            }`} />
                                                        <span className="text-[8px] font-black text-slate-400 tracking-widest font-poppins">
                                                            {test.subcategory || "Base Segment"}
                                                        </span>
                                                    </motion.div>
                                                </div>
                                            </div>

                                            {/* LIST VIEW STATS (Only in List View) */}
                                            {viewMode === 'list' && (
                                                <div className="hidden md:flex items-center gap-4 lg:gap-8 pr-6">
                                                    <div className="flex items-center gap-6 pr-6">
                                                        {/* Engagement Stats */}
                                                        <div className="flex gap-4">
                                                            {[
                                                                { label: "Pricing", val: test.isFree ? "FREE" : `₹${test.price}`, icon: <Users size={10} />, color: test.isFree ? "text-blue-400" : "text-indigo-600" },
                                                                { label: "Attempts", val: test.attempts?.length || "0", icon: <Users size={10} />, color: "text-blue-400" }
                                                            ].map((stat, idx) => (
                                                                <div key={idx} className="flex flex-col items-center min-w-[45px]">
                                                                    <div className={`${stat.color} mb-0.5`}>{stat.icon}</div>
                                                                    <span className={`text-[10px] font-black leading-none ${stat.label === 'Pricing' ? 'px-1 py-0.5 border border-slate-100 bg-slate-50' : 'text-[#3e4954]'}`}>{stat.val}</span>
                                                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{stat.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="h-6 w-[1px] bg-slate-100" />

                                                        {/* Exam Specs Grouped */}
                                                        <div className="flex gap-4 bg-slate-50/50 px-3 py-1 rounded-sm border border-slate-100/50">
                                                            {[
                                                                { label: "Time", val: test.durationMinutes > 0 ? `${test.durationMinutes}m` : "—", icon: <Clock size={10} />, color: "text-slate-300" },
                                                                { label: "Marks", val: test.totalMarks || "0", icon: <Save size={10} />, color: "text-slate-300" },
                                                                { label: "MCQs", val: test.totalQuestions || 0, icon: <Book size={10} />, color: "text-slate-300" }
                                                            ].map((stat, idx) => (
                                                                <div key={idx} className="flex flex-col items-center min-w-[40px]">
                                                                    <div className={`${stat.color} mb-0.5`}>{stat.icon}</div>
                                                                    <span className="text-[10px] font-black text-[#3e4954] leading-none">{stat.val}</span>
                                                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{stat.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* GRID VIEW STATS (Only in Grid View) */}
                                            {viewMode === 'grid' && (
                                                <div className="px-3 pb-3 space-y-1">
                                                    <div className="grid grid-cols-3 gap-2 border-y border-slate-50 py-2">
                                                        {[
                                                            { label: "Duration", val: test.durationMinutes > 0 ? `${test.durationMinutes}m` : "—", icon: <Clock size={12} /> },
                                                            { label: "Marks", val: test.totalMarks || "0", icon: <Save size={12} /> },
                                                            { label: "Questions", val: test.totalQuestions || 0, icon: <Book size={12} /> }
                                                        ].map((stat, idx) => (
                                                            <div key={idx} className="text-center space-y-1">
                                                                <motion.div
                                                                    variants={{
                                                                        hover: { scale: 1.2, rotate: 5, color: test.isGrandTest ? '#f59e0b' : '#10b981' }
                                                                    }}
                                                                    className="text-slate-300 flex justify-center"
                                                                >
                                                                    {stat.icon}
                                                                </motion.div>
                                                                <div className="text-[10px] font-black text-[#3e4954] leading-none">{stat.val}</div>
                                                                <div className="text-[7px] font-bold text-slate-400 tracking-tighter">{stat.label}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ACTIONS & STATUS (Consolidated) */}
                                            <div className={`${viewMode === 'list' ? 'flex items-center gap-3 pr-4 border-l border-slate-100 pl-4 py-2' : 'px-3 pb-3 space-y-1.5'}`}>

                                                {viewMode === 'list' && (
                                                    <>
                                                        {/* Status Toggle Integrated */}
                                                        <div className="flex flex-col items-center min-w-[40px]">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleTogglePublish(test._id, test.isPublished); }}
                                                                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${test.isPublished
                                                                        ? (test.isGrandTest ? 'bg-amber-500' : 'bg-[#21b731]')
                                                                        : 'bg-slate-200 border-slate-300'
                                                                    }`}
                                                            >
                                                                <motion.span
                                                                    layout
                                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                    className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ${test.isPublished ? 'ml-5' : 'ml-1'
                                                                        }`}
                                                                />
                                                            </button>
                                                            <span className={`text-[7px] font-black tracking-widest mt-1 ${test.isPublished ? 'text-[#21b731]' : 'text-slate-400'}`}>
                                                                {test.isPublished ? "Live" : "Draft"}
                                                            </span>
                                                        </div>

                                                        {/* Actions Divider */}
                                                        <div className="h-8 w-[1px] bg-slate-100 mx-1" />
                                                    </>
                                                )}

                                                <div className={`${viewMode === 'list' ? 'flex gap-2' : 'grid grid-cols-2 gap-1.5 text-center'}`}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => navigate(`/admin/mocktests/${category}/edit/${test._id}`)}
                                                        className={`flex items-center justify-center gap-1.5 border-2 border-slate-100 text-[#7e7e7e] font-black tracking-widest hover:border-[#3e4954] hover:text-[#3e4954] transition-all bg-slate-50/50 ${viewMode === 'list' ? 'h-10 px-4 text-[9px]' : 'py-2 text-[8px]'}`}
                                                    >
                                                        <Edit size={12} /> {viewMode === 'list' ? "Settings" : "Edit"}
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.03, boxShadow: test.isGrandTest ? "0 10px 25px rgba(245, 158, 11, 0.4)" : "0 10px 25px rgba(79, 70, 229, 0.4)" }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => navigate(`/admin/mocktests/${test._id}/questions`)}
                                                        className={`flex items-center justify-center gap-1.5 font-black tracking-widest shadow-lg transition-all ${test.isGrandTest
                                                                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100'
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                                            } ${viewMode === 'list' ? 'h-10 px-4 text-[9px]' : 'py-2 text-[8px]'}`}
                                                    >
                                                        {test.isGrandTest ? <Trophy size={12} /> : <Layers size={12} />} {viewMode === 'list' ? "Manage questions" : "Questions"}
                                                    </motion.button>
                                                </div>

                                                {viewMode === 'list' ? (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(test._id); }}
                                                        className="h-10 px-3 flex items-center justify-center gap-1.5 text-[8px] font-black tracking-widest transition-all border-2 bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </motion.button>
                                                ) : (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={(e) => { e.stopPropagation(); handleTogglePublish(test._id, test.isPublished); }}
                                                        className={`w-full py-2.5 flex items-center justify-center gap-2 text-[8px] font-black tracking-widest transition-all border-2 ${test.isPublished
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                                : 'bg-slate-50 text-[#7e7e7e] border-slate-100 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {test.isPublished ? <><Eye size={12} /> Live</> : <><EyeOff size={12} /> Publish test</>}
                                                    </motion.button>
                                                )}
                                            </div>

                                        </motion.div>
                                    ))}
                                </div>

                                {/* PAGINATION CONTROLS */}
                                {filteredTests.length > 0 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white border border-slate-200 p-4 shadow-sm">
                                        <div className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest font-poppins">
                                            Showing <span className="text-[#3e4954]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-[#3e4954]">{Math.min(currentPage * itemsPerPage, filteredTests.length)}</span> of <span className="text-[#21b731]">{filteredTests.length}</span> results
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => prev - 1)}
                                                className="w-10 h-10 flex items-center justify-center border border-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#3e4954] transition-all"
                                            >
                                                <ChevronRightIcon size={16} className="rotate-180" />
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {[...Array(totalPages)].map((_, i) => {
                                                    const pageNum = i + 1;
                                                    if (
                                                        pageNum === 1 ||
                                                        pageNum === totalPages ||
                                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={`w-10 h-10 text-[11px] font-black transition-all border ${currentPage === pageNum
                                                                        ? 'bg-[#21b731] border-[#21b731] text-white shadow-lg shadow-green-100'
                                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-[#3e4954]'
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    } else if (
                                                        pageNum === currentPage - 2 ||
                                                        pageNum === currentPage + 2
                                                    ) {
                                                        return <span key={pageNum} className="px-1 text-slate-300 font-bold">...</span>;
                                                    }
                                                    return null;
                                                })}
                                            </div>

                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                className="w-10 h-10 flex items-center justify-center border border-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#3e4954] transition-all"
                                            >
                                                <ChevronRightIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

/* ---------------------- HELPER COMPONENTS ---------------------- */

const FilterTabWithDropdown = ({ id, label, icon, activeFilter, setFilter, counts, activeColor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isActive = activeFilter === id || activeFilter.startsWith(`${id}:`);
    const subType = activeFilter.includes(":") ? activeFilter.split(":")[1] : "ALL";

    const options = [
        { id: "ALL", label: `All ${label}`, count: counts.all },
        { id: "PAID", label: "Paid Only", count: counts.paid },
        { id: "FREE", label: "Free Only", count: counts.free },
    ];

    return (
        <div className="relative group"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div className="flex h-full">
                <button
                    onClick={() => setFilter(id)}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 text-[8.5px] font-black tracking-widest transition-all ${isActive ? `${activeColor}` : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    {icon}
                    <span className="hidden sm:inline">
                        {isActive && activeFilter.includes(":")
                            ? `${label}: ${activeFilter.split(":")[1].toLowerCase()}`
                            : label}
                    </span>
                    <span className="sm:hidden">{label}</span>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className={`px-1 transition-all border-l ${isActive ? `border-white/20 hover:bg-black/5` : 'border-slate-200 text-slate-400 hover:text-slate-600'
                        } ${isActive ? activeColor : ''}`}
                >
                    <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 pt-1 bg-transparent z-50 min-w-[120px]"
                    >
                        <div className="bg-white border border-slate-200 shadow-xl p-1">
                            {options.map((opt) => {
                                const isSelected = activeFilter.startsWith(`${id}:`)
                                    ? activeFilter.split(":")[1] === opt.id
                                    : opt.id === "ALL" && activeFilter === id;

                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => {
                                            setFilter(opt.id === "ALL" ? id : `${id}:${opt.id}`);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-2 text-[8px] font-black tracking-widest transition-all ${isSelected
                                                ? (id === 'mock' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')
                                                : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isSelected && <Check size={10} />}
                                            {opt.label}
                                        </div>
                                        <span className="text-[7px] text-slate-300">({opt.count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
