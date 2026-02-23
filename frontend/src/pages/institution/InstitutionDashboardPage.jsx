import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaUserGraduate,
  FaClipboardList,
  FaQuestionCircle,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";

import StatCard from "../../components/admin/StatCard";
import { fetchInstitutionStats } from "../../redux/institutionDashboardSlice";

const InstitutionDashboardPage = () => {
  const dispatch = useDispatch();

  const { stats, loading, error } = useSelector(
    (state) => state.institutionDashboard || {}
  );

  useEffect(() => {
    dispatch(fetchInstitutionStats());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <ClipLoader size={60} color={"#4f46e5"} />
        <p className="ml-4 text-indigo-600 font-medium">
          Loading institution dashboard...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-red-500 text-center p-6 bg-red-50 border rounded-xl m-10">
        Dashboard Error: {error || "Failed to load statistics"}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 md:p-10 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-2 text-slate-900">
        Institution Overview
      </h1>
      <p className="text-lg text-indigo-600 mb-10">
        Monitor your campus student activity and performance.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard
          title="Campus Students"
          value={stats.students || 0}
          icon={<FaUserGraduate />}
          bgColor="bg-white border border-slate-100 shadow-sm"
          iconColor="text-indigo-600 bg-indigo-50 p-3 rounded-xl"
        />

        <StatCard
          title="Total Attempts"
          value={stats.attempts || 0}
          icon={<FaClipboardList />}
          bgColor="bg-white border border-slate-100 shadow-sm"
          iconColor="text-orange-600 bg-orange-50 p-3 rounded-xl"
        />

        <StatCard
          title="Raised Doubts"
          value={stats.doubts || 0}
          icon={<FaQuestionCircle />}
          bgColor="bg-white border border-slate-100 shadow-sm"
          iconColor="text-purple-600 bg-purple-50 p-3 rounded-xl"
        />
      </div>

      <div className="mt-12 p-8 bg-indigo-600 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 w-full md:w-2/3">
           <h2 className="text-3xl font-black text-white mb-4">Empower Your Campus</h2>
           <p className="text-indigo-100 text-lg leading-relaxed mb-6">
             Manage your students effortlessly. Track their progress through mock tests, monitor their doubts, and ensure they are ready for their exams.
           </p>
           <div className="flex gap-4">
              <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                View Performance
              </button>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>
    </div>
  );
};

export default InstitutionDashboardPage;
