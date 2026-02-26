// frontend/src/components/admin/DashboardPage.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Users,
    GraduationCap,
    BookOpen,
    IndianRupee,
    LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchAdminStats } from "../../redux/dashboardSlice";
import StatCard from "./StatCard";
import { ClipLoader } from "react-spinners"; 
import CategorySalesChart from "./CategorySalesChart";
import TestTypeBreakdown from "./TestTypeBreakdown";
import TopStudentsBoard from "./TopStudentsBoard";
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
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400">
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
                    bgColor="#6A73FA"
                    progress={80}
                    link="/admin/users/students/manage"
                />
                <StatCard
                    title="Fresh Enrollments"
                    value={stats.activeUsers || "245"}
                    icon={<GraduationCap />}
                    bgColor="#FFAA16"
                    progress={50}
                    link="/admin/users/students/manage"
                />
                <StatCard
                    title="Total Mocktests"
                    value={stats.tests || "28"}
                    icon={<BookOpen />}
                    bgColor="#673BB7"
                    progress={76}
                    link="/admin/tests/manage-tests"
                />
                <StatCard
                    title="Revenue"
                    value={formattedRevenue || "25160$"}
                    icon={<IndianRupee />}
                    bgColor="#FF1616"
                    progress={30}
                    link="/admin/payments"
                />
            </motion.div>

            {/* CHARTS SECTION */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* TEST DISTRIBUTION */}
                <div className="bg-white p-5 rounded-none border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-[#3e4954] tracking-tight">Mock & Grand Test Reports</h3>
                            <p className="text-[11px] font-bold text-[#7e7e7e] uppercase tracking-widest mt-1">Real-time performance distribution</p>
                        </div>
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Global
                        </div>
                    </div>
                    <div className="h-[450px]">
                        <TestTypeBreakdown 
                            data={stats.testTypeSales} 
                            monthlyData={stats.monthlyTestSales} 
                        />
                    </div>
                </div>

                {/* TOP STUDENTS BOARD */}
                <TopStudentsBoard students={stats.topStudents} />
            </motion.div>

        </motion.div>
    );
};

export default DashboardPage;
