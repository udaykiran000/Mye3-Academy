import React, { useState, useEffect } from "react";
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
    Check
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
            toast.error("⚠️ Failed to update publish status");
            getMocktests();
        }
    };

    return (
        <div className="pt-2">
            <div className="mb-2">
                <Link
                    to={`/admin/categories`}
                    className="flex items-center gap-2 text-[10px] font-black text-[#7e7e7e] hover:text-[#21b731] transition-all uppercase tracking-[0.2em] font-poppins"
                >
                    <ArrowLeft size={14} /> Back to Categories
                </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-2 mb-4">
                <div className="flex items-center gap-5">
                    <div className="w-1.5 h-8 bg-[#21b731]" />
                    <div>
                        <h1 className="text-lg lg:text-xl font-black text-[#3e4954] uppercase tracking-tighter font-poppins mb-0">
                            {formatCategoryName(category)}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 border border-slate-200">
                        <button 
                            onClick={() => setFilterType("all")}
                            className={`px-3 py-1.5 text-[8.5px] font-black uppercase tracking-widest transition-all ${
                                filterType === 'all' 
                                ? 'bg-[#3e4954] text-white shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            All ({mocktests.length})
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
                            activeColor="bg-[#21b731] text-white shadow-md"
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
                            activeColor="bg-amber-500 text-white shadow-md"
                        />
                    </div>

                    {/* View mode toggle - Now next to filters */}
                    <div className="flex items-center gap-1.5 ml-1">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 transition-all border ${
                                viewMode === 'grid' 
                                ? 'bg-[#21b731] text-white border-[#21b731] shadow-md shadow-green-100' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                            }`}
                            title="Grid View"
                        >
                            <LayoutGrid size={13} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 transition-all border ${
                                viewMode === 'list' 
                                ? 'bg-[#21b731] text-white border-[#21b731] shadow-md shadow-green-100' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                            }`}
                            title="List View"
                        >
                            <List size={13} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to={`/admin/mocktests/${category}/new?type=mock`}
                        className="flex items-center gap-3 px-4 py-2 bg-[#21b731] text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-green-100 hover:bg-[#1a9227] active:scale-95"
                    >
                        <Plus size={14} /> Create Mock Test
                    </Link>
                    <Link
                        to={`/admin/mocktests/${category}/new?type=grand`}
                        className="flex items-center gap-3 px-4 py-2 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-amber-100 hover:bg-amber-600 active:scale-95"
                    >
                        <Trophy size={14} /> Create Grand Test
                    </Link>
                </div>
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
                            <p className="text-lg font-medium">No exams found for this category yet.</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Click on the buttons above to register a new Mock or Grand Exam.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={viewMode === 'grid' 
                                ? "grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" 
                                : "flex flex-col gap-3"
                            }
                        >
                             {mocktests
                                .filter(t => {
                                    const [mainType, subType] = filterType.split(":");
                                    
                                    let typeMatch = true;
                                    if (mainType === 'mock') typeMatch = !t.isGrandTest;
                                    if (mainType === 'grand') typeMatch = t.isGrandTest;
                                    if (mainType === 'all') typeMatch = true;

                                    let subMatch = true;
                                    if (subType === 'PAID') subMatch = !t.isFree;
                                    if (subType === 'FREE') subMatch = t.isFree;

                                    return typeMatch && subMatch;
                                })
                                .map((test, i) => (
                                <motion.div
                                    key={test._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`group bg-white border rounded-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex ${
                                        viewMode === 'list' ? 'flex-row items-center h-20 p-3 gap-4 lg:gap-6' : 'flex-col hover:-translate-y-1'
                                    } ${
                                        test.isGrandTest ? 'border-amber-100' : 'border-slate-200'
                                    }`}
                                >
                                    {/* THUMBNAIL */}
                                    <div className={`relative bg-[#f8f9fa] flex-shrink-0 ${viewMode === 'list' ? 'w-14 h-14' : 'h-24 overflow-hidden'}`}>
                                        <img
                                            src={getImageUrl(test.thumbnail)}
                                            alt={test.title}
                                            onError={handleImageError}
                                            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                                        />
                                        {viewMode === 'grid' && (
                                            <>
                                                <div className="absolute top-1 left-1 flex flex-col gap-1">
                                                    <span className={`px-1.5 py-0.5 text-[7.5px] font-black uppercase tracking-widest border ${
                                                        test.isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-[#3e4954] text-white border-[#3e4954]"
                                                    }`}>
                                                        {test.isPublished ? "Live" : "Draft"}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <span className={`px-1.5 py-0.5 text-[7.5px] font-black uppercase tracking-widest border ${
                                                            test.isGrandTest ? "bg-amber-500 text-white border-amber-600" : "bg-emerald-500 text-white border-emerald-600"
                                                        }`}>
                                                            {test.isGrandTest ? "Grand" : "Mock"}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 text-[7.5px] font-black uppercase tracking-widest border ${
                                                            test.isFree ? "bg-blue-500 text-white border-blue-600" : "bg-indigo-600 text-white border-indigo-700"
                                                        }`}>
                                                            {test.isFree ? "Free" : "Paid"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(test._id)}
                                                    className="absolute top-1 right-1 p-1.5 bg-white/80 hover:bg-rose-500 text-slate-400 hover:text-white border border-slate-100 hover:border-rose-500 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* CONTENT AREA */}
                                    <div className={`flex flex-col justify-center ${viewMode === 'list' ? 'flex-1 min-w-0' : 'p-4 space-y-3'}`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className={`font-black text-[#3e4954] uppercase tracking-tight group-hover:text-[#21b731] transition-colors font-poppins truncate ${viewMode === 'list' ? 'text-sm mb-0' : 'text-[13px] line-clamp-2 min-h-[1.8rem]'}`}>
                                                    {test.title}
                                                </h3>
                                                {viewMode === 'list' && (
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <span className={`px-1 py-0.5 text-[6.5px] font-black uppercase tracking-widest border ${
                                                            test.isGrandTest ? "bg-amber-500 text-white border-amber-600" : "bg-emerald-500 text-white border-emerald-600"
                                                        }`}>
                                                            {test.isGrandTest ? "Grand" : "Mock"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`h-0.5 w-3 group-hover:w-5 transition-all ${
                                                    test.isGrandTest ? "bg-amber-400" : "bg-emerald-400"
                                                }`} />
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-poppins">
                                                    {test.subcategory || "Base Segment"}
                                                </span>
                                            </div>
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
                                                        { label: "MCQs", val: test.questions?.length ?? 0, icon: <Book size={10} />, color: "text-slate-300" }
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
                                        <div className="px-4 pb-4 space-y-3">
                                            <div className="grid grid-cols-3 gap-2 border-y border-slate-50 py-3">
                                                {[
                                                    { label: "Duration", val: test.durationMinutes > 0 ? `${test.durationMinutes}m` : "—", icon: <Clock size={12} /> },
                                                    { label: "Marks", val: test.totalMarks || "0", icon: <Save size={12} /> },
                                                    { label: "Questions", val: test.questions?.length ?? 0, icon: <Book size={12} /> }
                                                ].map((stat, idx) => (
                                                    <div key={idx} className="text-center space-y-1">
                                                        <div className="text-slate-300 flex justify-center">{stat.icon}</div>
                                                        <div className="text-[10px] font-black text-[#3e4954] leading-none">{stat.val}</div>
                                                        <div className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ACTIONS & STATUS (Consolidated) */}
                                    <div className={`${viewMode === 'list' ? 'flex items-center gap-3 pr-4 border-l border-slate-100 pl-4 py-2' : 'px-4 pb-4 space-y-2'}`}>
                                        
                                        {viewMode === 'list' && (
                                            <>
                                                {/* Status Toggle Integrated */}
                                                <div className="flex flex-col items-center min-w-[40px]">
                                                    <button
                                                        onClick={() => handleTogglePublish(test._id, test.isPublished)}
                                                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 focus:outline-none border ${
                                                            test.isPublished 
                                                            ? 'bg-emerald-500 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                                                            : 'bg-slate-200 border-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
                                                                test.isPublished ? 'translate-x-5' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                    <span className={`text-[7px] font-black uppercase tracking-widest mt-1 ${test.isPublished ? 'text-[#21b731]' : 'text-slate-400'}`}>
                                                        {test.isPublished ? "Live" : "Draft"}
                                                    </span>
                                                </div>

                                                {/* Actions Divider */}
                                                <div className="h-8 w-[1px] bg-slate-100 mx-1" />
                                            </>
                                        )}

                                        <div className={`${viewMode === 'list' ? 'flex gap-2' : 'grid grid-cols-2 gap-1.5 text-center'}`}>
                                            <button
                                                onClick={() => navigate(`/admin/mocktests/${category}/edit/${test._id}`)}
                                                className={`flex items-center justify-center gap-1.5 border-2 border-slate-100 text-[#7e7e7e] font-black uppercase tracking-widest hover:border-[#3e4954] hover:text-[#3e4954] transition-all bg-slate-50/50 ${viewMode === 'list' ? 'h-10 px-4 text-[9px]' : 'py-2 text-[8px]'}`}
                                            >
                                                <Edit size={12} /> {viewMode === 'list' ? "Settings" : "Edit"}
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/mocktests/${test._id}/questions`)}
                                                className={`flex items-center justify-center gap-1.5 font-black uppercase tracking-widest shadow-lg transition-all ${
                                                    test.isGrandTest 
                                                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100' 
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                                } ${viewMode === 'list' ? 'h-10 px-4 text-[9px]' : 'py-2 text-[8px]'}`}
                                            >
                                                {test.isGrandTest ? <Trophy size={12} /> : <Layers size={12} />} {viewMode === 'list' ? "Questions" : "Questions"}
                                            </button>
                                        </div>
                                        
                                        {viewMode === 'list' ? (
                                            <button
                                                onClick={() => handleDelete(test._id)}
                                                className="h-10 px-3 flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] transition-all border-2 bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100"
                                                title="Delete"
                                            >
                                                <Trash2 size={12}/>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleTogglePublish(test._id, test.isPublished)}
                                                className={`w-full py-2.5 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                                                    test.isPublished 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                                    : 'bg-slate-50 text-[#7e7e7e] border-slate-100 hover:bg-slate-100'
                                                }`}
                                            >
                                                {test.isPublished ? <><Eye size={12}/> Live</> : <><EyeOff size={12}/> Publish</>}
                                            </button>
                                        )}
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
        <div className="relative group" onMouseLeave={() => setIsOpen(false)}>
            <div className="flex h-full">
                <button 
                    onClick={() => setFilter(id)}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 text-[8.5px] font-black uppercase tracking-widest transition-all ${
                        isActive ? `${activeColor}` : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {icon} 
                    <span className="hidden sm:inline">{subType === "ALL" ? label : subType}</span>
                    <span className="sm:hidden">{label}</span>
                </button>
                
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`px-1 transition-all border-l ${
                        isActive ? `border-white/20 hover:bg-black/5` : 'border-slate-200 text-slate-400 hover:text-slate-600'
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
                        className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-xl z-50 p-1 min-w-[120px]"
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => {
                                    setFilter(opt.id === "ALL" ? id : `${id}:${opt.id}`);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 text-[8px] font-black uppercase tracking-widest transition-all ${
                                    subType === opt.id 
                                    ? (id === 'mock' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600') 
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {subType === opt.id && <Check size={10} />}
                                    {opt.label}
                                </div>
                                <span className="text-[7px] text-slate-300">({opt.count})</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

