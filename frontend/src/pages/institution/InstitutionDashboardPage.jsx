import React, { useState, useEffect } from "react";
import { FaUserGraduate, FaBook, FaCheckCircle } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import api from "../../api/axios";
import StatCard from "../../components/admin/StatCard";

const InstitutionDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/api/institution/dashboard-stats");
        setStats(response.data);
      } catch (err) {
        setError("Failed to fetch dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh]">
        <ClipLoader size={60} color={"#ffffff"} />
        <p className="mt-4 text-white font-medium">Loading institution dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-xl text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2">Institution Dashboard</h1>
        <p className="text-white/70">Overview of your registered students and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Our Students"
          value={stats?.students || 0}
          icon={<FaUserGraduate />}
          bgColor="bg-white/10 backdrop-blur-md border border-white/20"
          iconColor="text-white"
        />
        <StatCard
          title="Available Tests"
          value={stats?.tests || 0}
          icon={<FaBook />}
          bgColor="bg-white/10 backdrop-blur-md border border-white/20"
          iconColor="text-white"
        />
        <StatCard
          title="Total Attempts"
          value={stats?.attempts || 0}
          icon={<FaCheckCircle />}
          bgColor="bg-white/10 backdrop-blur-md border border-white/20"
          iconColor="text-white"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Recently Registered Students</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.studentList?.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {student.firstname.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{student.firstname} {student.lastname}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.studentList || stats.studentList.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">No students registered under your institution yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboardPage;
