// frontend/src/components/admin/DashboardPage.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaBook,
    FaClipboardList,                                    
    FaDollarSign,
} from "react-icons/fa";
import { fetchAdminStats } from "../../redux/dashboardSlice";
import StatCard from "./StatCard";
import { ClipLoader } from "react-spinners"; 
import CategorySalesChart from "./CategorySalesChart";
import TestTypeBreakdown from "./TestTypeBreakdown";

const DashboardPage = () => {
    const dispatch = useDispatch();
    const { stats, loading, error } = useSelector((state) => state.dashboard);

    useEffect(() => {
        dispatch(fetchAdminStats());
    }, [dispatch]);

    // --- Loading and Error States ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <ClipLoader size={60} color={"#4f46e5"} loading={loading} />
                <p className="ml-4 text-indigo-600 font-medium">Loading critical metrics...</p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-red-500 text-center p-6 bg-red-50 border border-red-200 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-2">Data Fetch Error ❌</h2>
                <p>Could not retrieve admin statistics. Please check the backend service.</p>
                <p className="text-sm mt-2">Error detail: {error || 'No stats object received'}</p>
            </div>
        );
    }

    // Format revenue as currency
    const formattedRevenue = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
    }).format(stats.revenue || 0);

    // --- Dashboard Content (Futuristic Styling) ---
    return (
        <div className="p-6 md:p-10 min-h-screen bg-gray-50">
            <h1 className="text-4xl font-extrabold mb-2 text-gray-900 tracking-tight">
                Admin Dashboard
            </h1>
            <p className="text-lg text-indigo-600 mb-10">
                Data-driven insights for real-time platform management.
            </p>

            {/* 1. Stats Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formattedRevenue}
                    icon={<FaDollarSign />}
                    bgColor="bg-gradient-to-br from-green-500 to-green-600"
                    iconColor="text-green-200"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.orders}
                    icon={<FaClipboardList />}
                    bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                    iconColor="text-blue-200"
                />
                <StatCard
                    title="Total Students"
                    value={stats.students}
                    icon={<FaUserGraduate />}
                    bgColor="bg-gradient-to-br from-yellow-500 to-yellow-600"
                    iconColor="text-yellow-200"
                />
                <StatCard
                    title="Total Instructors"
                    value={stats.instructors}
                    icon={<FaChalkboardTeacher />}
                    bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                    iconColor="text-purple-200"
                />
                <StatCard
                    title="Total Mock Tests"
                    value={stats.mockTests}
                    icon={<FaBook />}
                    bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600"
                    iconColor="text-indigo-200"
                />
                <StatCard
                    title="Total Test Attempts"
                    value={stats.attempts}
                    icon={<FaUsers />}
                    bgColor="bg-gradient-to-br from-pink-500 to-pink-600"
                    iconColor="text-pink-200"
                />
            </div>

            {/* 2. Charts Section (Glassmorphism/Floating Panels) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                
                {/* Chart 1: Category Sales */}
                <div className="p-6 bg-white shadow-xl rounded-2xl border border-gray-100 transform hover:shadow-2xl transition-shadow duration-300">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Revenue Breakdown by Category</h2>
                    {/* Pass categorySales data */}
                    <CategorySalesChart data={stats.categorySales} /> 
                </div>
                
                {/* Chart 2: Test Type Breakdown */}
                <div className="p-6 bg-white shadow-xl rounded-2xl border border-gray-100 transform hover:shadow-2xl transition-shadow duration-300">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Test Type Distribution</h2>
                    {/* Pass testTypeSales data */}
                    <TestTypeBreakdown data={stats.testTypeSales} /> 
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;