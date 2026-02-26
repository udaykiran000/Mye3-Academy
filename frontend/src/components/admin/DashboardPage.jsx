// frontend/src/components/admin/DashboardPage.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Users,
    GraduationCap,
    UserCog,
    BookOpen,
    FileCheck,
    IndianRupee,
    LayoutDashboard,
    ArrowRight,
    Sparkles,
    Activity,
    Trophy,
    ListChecks
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchAdminStats } from "../../redux/dashboardSlice";
import StatCard from "./StatCard";
import { ClipLoader } from "react-spinners"; 
import CategorySalesChart from "./CategorySalesChart";
import TestTypeBreakdown from "./TestTypeBreakdown";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const DashboardPage = () => {
    const dispatch = useDispatch();
    const { stats, loading, error } = useSelector((state) => state.dashboard);

    useEffect(() => {
        dispatch(fetchAdminStats());
    }, [dispatch]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh]">
                <ClipLoader size={50} color={"#21b731"} loading={loading} />
                <p className="mt-4 text-[#7e7e7e] font-medium animate-pulse">Fetching your latest stats...</p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-rose-500 text-center p-12 bg-white rounded-[32px] border border-slate-100 max-w-2xl mx-auto shadow-xl">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-[#3e4954]">Connection Error</h2>
                <p className="text-[#7e7e7e] mb-6">We couldn't retrieve the latest administrative data.</p>
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-400">
                    {error || 'No response from data service'}
                </div>
            </div>
        );
    }

    const formattedRevenue = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(stats.revenue || 0);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-10"
        >

            {/* KPI STATS GRID - ALIGNED TO EDUMIN SCREENSHOT */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={stats.students || "3,280"}
                    icon={<Users />}
                    gradient="from-[#6a73fa] to-[#8c94ff]"
                    progress={80}
                    trend="up"
                    trendValue="+12.5%"
                />
                <StatCard
                    title="New Students"
                    value={stats.activeUsers || "245"}
                    icon={<GraduationCap />}
                    gradient="from-[#ff9d43] to-[#ffb870]"
                    progress={50}
                    trend="up"
                    trendValue="+8.2%"
                />
                <StatCard
                    title="Categories"
                    value={stats.tests || "28"}
                    icon={<BookOpen />}
                    gradient="from-[#8e44ad] to-[#a55eca]"
                    progress={76}
                    trend="up"
                    trendValue="+4.1%"
                />
                <StatCard
                    title="Fees Collection"
                    value={formattedRevenue}
                    icon={<IndianRupee />}
                    gradient="from-[#ff0000] to-[#ff4d4d]"
                    progress={30}
                    trend="down"
                    trendValue="-2.4%"
                />
            </motion.div>

            {/* CHARTS SECTION */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* REVENUE BREAKDOWN */}
                {/* TOP RANKERS SECTION - PREMIUM UI */}
                <div className="bg-white p-8 rounded-none border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-[#3e4954] tracking-tight flex items-center gap-2">
                                <Trophy className="text-amber-500" size={24} />
                                Top Rankers
                            </h3>
                            <p className="text-[11px] font-bold text-[#7e7e7e] uppercase tracking-widest mt-1">Leading students by total score</p>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors group">
                            <span className="text-[10px] font-bold text-[#7e7e7e] group-hover:text-indigo-600 uppercase">View All</span>
                            <ArrowRight size={14} className="text-[#7e7e7e] group-hover:text-indigo-600" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 relative z-10">
                        {stats.topRankers && stats.topRankers.length > 0 ? (
                            stats.topRankers.map((ranker, index) => {
                                const rankColors = [
                                    { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", medal: "🥇", ring: "ring-amber-400" },
                                    { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", medal: "🥈", ring: "ring-slate-300" },
                                    { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", medal: "🥉", ring: "ring-orange-300" }
                                ];
                                const style = rankColors[index] || rankColors[2];

                                return (
                                    <motion.div 
                                        key={ranker.studentId}
                                        whileHover={{ x: 10 }}
                                        className={`flex items-center justify-between p-4 ${style.bg} border ${style.border} rounded-2xl transition-all duration-300 group`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${style.ring} ring-offset-2 bg-white shadow-sm`}>
                                                    {ranker.avatar ? (
                                                        <img src={ranker.avatar} alt={ranker.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-xl">
                                                            {ranker.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute -top-2 -left-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border border-slate-50 text-lg">
                                                    {style.medal}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className={`font-black ${style.text} text-base`}>{ranker.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                                        <BookOpen size={10} /> {ranker.examsTaken} Exams
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-black ${style.text} tracking-tighter`}>{ranker.totalScore}</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Points</div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <Sparkles className="text-slate-200 mb-3" size={48} />
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No ranking data yet</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Decorative background element */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full opacity-30 z-0"></div>
                </div>

                {/* TEST DISTRIBUTION */}
                <div className="bg-white p-8 rounded-none border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-[#3e4954] tracking-tight">Exam Breakdown</h3>
                            <p className="text-[11px] font-bold text-[#7e7e7e] uppercase tracking-widest mt-1">Analytics for each exam type</p>
                        </div>
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Global
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <TestTypeBreakdown data={stats.testTypeSales} />
                    </div>
                </div>
            </motion.div>

        </motion.div>
    );
};

export default DashboardPage;
