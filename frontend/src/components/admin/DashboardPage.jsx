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
                <div className="bg-white p-8 rounded-none border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-[#3e4954] tracking-tight">Sales by Category</h3>
                            <p className="text-[11px] font-bold text-[#7e7e7e] uppercase tracking-widest mt-1">Sales Distribution by Category</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span className="text-[10px] font-bold text-[#7e7e7e] uppercase">Current Term</span>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <CategorySalesChart data={stats.categorySales} />
                    </div>
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
