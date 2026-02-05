import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaUserGraduate,
  FaBook,
  FaClipboardList,
  FaQuestionCircle,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";

import StatCard from "../../components/admin/StatCard";
import CategorySalesChart from "../../components/admin/CategorySalesChart";
import TestTypeBreakdown from "../../components/admin/TestTypeBreakdown";
import { fetchInstructorStats } from "../../redux/instructorDashboardSlice";

const InstructorDashboardPage = () => {
  const dispatch = useDispatch();

  const { stats, loading, error } = useSelector(
    (state) => state.instructorDashboard || {},
  );

  useEffect(() => {
    dispatch(fetchInstructorStats());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <ClipLoader size={60} color={"#4f46e5"} />
        <p className="ml-4 text-indigo-600 font-medium">
          Loading instructor dashboard...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-red-500 text-center p-6 bg-red-50 border rounded-xl">
        Dashboard Error
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-200 md:p-10 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-extrabold mb-2 text-gray-900">
        Instructor Dashboard
      </h1>

      <p className="text-lg text-indigo-600 mb-10">
        Teaching performance overview
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Students"
          value={stats.students || 0}
          icon={<FaUserGraduate />}
          bgColor="bg-gradient-to-br from-yellow-500 to-yellow-600"
          iconColor="text-yellow-200"
        />

        <StatCard
          title="Total Tests"
          value={stats.tests || 0}
          icon={<FaBook />}
          bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600"
          iconColor="text-indigo-200"
        />

        <StatCard
          title="Free Tests"
          value={stats.freeTests || 0}
          icon={<FaClipboardList />}
          bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          iconColor="text-blue-200"
        />

        <StatCard
          title="Paid Tests"
          value={stats.paidTests || 0}
          icon={<FaClipboardList />}
          bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          iconColor="text-purple-200"
        />

        <StatCard
          title="Attempts"
          value={stats.attempts || 0}
          icon={<FaUserGraduate />}
          bgColor="bg-gradient-to-br from-pink-500 to-pink-600"
          iconColor="text-pink-200"
        />

        <StatCard
          title="Assigned Doubts"
          value={stats.doubts || 0}
          icon={<FaQuestionCircle />}
          bgColor="bg-gradient-to-br from-green-500 to-green-600"
          iconColor="text-green-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <div className="p-6 bg-white shadow rounded-xl">
          <h2 className="text-xl font-bold mb-4">Tests by Category</h2>
          <CategorySalesChart data={stats.categoryBreakdown || []} />
        </div>

        <div className="p-6 bg-white shadow rounded-xl">
          <h2 className="text-xl font-bold mb-4">Free vs Paid Tests</h2>
          <TestTypeBreakdown data={stats.testTypeBreakdown || []} />
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
