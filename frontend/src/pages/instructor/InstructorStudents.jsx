import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";

import {
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle,
  FaTimes,
  FaChartBar,
  FaQuestionCircle,
} from "react-icons/fa";

import { Search, GraduationCap, Phone, Info, Globe, Building2, ExternalLink, Calendar, CheckCircle2, Clock } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const InstructorStudents = () => {
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activityType, setActivityType] = useState(null); // 'purchased', 'attempts', 'doubts'
  const [activityData, setActivityData] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const fetchStudents = async () => {
    setStatus("loading");
    try {
      const { data } = await api.get("/api/instructor/students");
      setStudents(data);
      setStatus("succeeded");
    } catch (err) {
      console.error("Fetch Students Error:", err);
      setError(err.response?.data?.message || "Failed to load students");
      setStatus("failed");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openActivityModal = async (student, type) => {
    setSelectedStudent(student);
    setActivityType(type);
    setIsModalLoading(true);
    setActivityData(null);
    try {
      const { data } = await api.get(`/api/instructor/students/${student._id}/activity`);
      setActivityData(data);
    } catch (err) {
      toast.error("Failed to fetch activity details");
    } finally {
      setIsModalLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter((s) => {
      const fullName = `${s.firstname || ""} ${s.lastname || ""}`.toLowerCase();
      return fullName.includes(term) || s.email?.toLowerCase().includes(term);
    });
  }, [searchTerm, students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans text-gray-800">
      <Link
        to="/instructor-dashboard"
        className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800 mb-4 transition font-medium"
      >
        <FaArrowLeft /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="text-cyan-600" size={32} />
            Student Directory
          </h1>
          <p className="text-gray-500 mt-1">
            Browse overall student performance and activity.
          </p>
        </div>
      </div>

      <div className="relative w-full md:w-96 mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search students..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-xl rounded-xl border">
        <div className="overflow-x-visible">
          {status === "loading" && (
            <div className="flex justify-center items-center p-10">
              <FaSpinner className="animate-spin text-4xl text-cyan-600" />
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center justify-center p-10 text-red-600">
              <FaExclamationTriangle className="text-4xl mb-2" />
              <p>Error: {error}</p>
            </div>
          )}

          {status === "succeeded" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                  <th className="p-4 pl-6">Student Info</th>
                  <th className="p-4">Registration</th>
                  <th className="p-4 text-center">Activity Metrics</th>
                  <th className="p-4 text-center">Doubts</th>
                  <th className="p-4 text-center">Contact</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((s) => {
                    const fullName = `${s.firstname || ""} ${s.lastname || ""}`.trim();
                    return (
                      <tr key={s._id} className="group hover:bg-cyan-50/30 transition-all duration-300 border-b border-gray-50 last:border-0">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={`https://ui-avatars.com/api/?background=0ea5e9&color=fff&bold=true&name=${encodeURIComponent(fullName)}`}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 text-sm capitalize group-hover:text-cyan-600 transition-colors">
                                {fullName || "Unnamed"}
                              </span>
                              <span className="text-xs text-gray-400 font-medium lowercase">
                                {s.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                           <div className="flex flex-col gap-1.5">
                            {s.registrationSource === "self" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 shadow-sm w-fit">
                                <Globe size={12} /> SELF
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 shadow-sm w-fit uppercase">
                                <Building2 size={12} /> INSTITUTION
                              </span>
                            )}
                            <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest pl-1 mt-0.5">
                              Joined {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => openActivityModal(s, 'purchased')}
                              className="flex flex-col items-center p-2 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50 transition-all duration-300"
                            >
                              <span className="text-lg font-black text-blue-700">{s.purchasedTestCount || 0}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Purchased</span>
                            </button>
                            <div className="w-px h-8 bg-gray-100"></div>
                            <button 
                              onClick={() => openActivityModal(s, 'attempts')}
                              className="flex flex-col items-center p-2 rounded-xl border border-transparent hover:border-orange-100 hover:bg-orange-50 transition-all duration-300"
                            >
                              <span className="text-lg font-black text-orange-700">{s.attemptCount || 0}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Attempts</span>
                            </button>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                           <button 
                              onClick={() => openActivityModal(s, 'doubts')}
                              className="inline-flex flex-col items-center gap-0.5 p-2 rounded-xl border border-transparent hover:border-purple-100 hover:bg-purple-50 transition-all duration-300"
                            >
                              <span className="text-lg font-black text-purple-700">{s.doubtCount || 0}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Doubts</span>
                            </button>
                        </td>

                        <td className="p-4 text-center">
                           <div className="flex items-center justify-center gap-2 text-gray-500">
                              <Phone size={14} className="text-cyan-500" />
                              <span className="text-xs">{s.phoneNumber || "N/A"}</span>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

       {/* MODAL SYSTEM */}
      {selectedStudent && activityType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 capitalize">{activityType} Details</h2>
                <p className="text-sm text-gray-500">Student: <span className="font-semibold text-cyan-600">{selectedStudent.firstname} {selectedStudent.lastname}</span></p>
              </div>
              <button 
                onClick={() => { setSelectedStudent(null); setActivityType(null); }}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isModalLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <FaSpinner className="animate-spin text-4xl text-cyan-600 mb-4" />
                  <p className="text-gray-500">Fetching records...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityType === 'purchased' && (
                    <div className="space-y-3">
                      {activityData?.purchasedTests?.length > 0 ? (
                        activityData.purchasedTests.map((test, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div>
                                <h4 className="font-bold text-gray-800">{test.title}</h4>
                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <Calendar size={12} /> Purchased on {new Date(test.date).toLocaleDateString()}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">{test.orderId}</span>
                          </div>
                        ))
                      ) : <p className="text-center py-10 text-gray-400">No tests purchased.</p>}
                    </div>
                  )}

                  {activityType === 'attempts' && (
                    <div className="space-y-3">
                      {activityData?.attempts?.length > 0 ? (
                        activityData.attempts.map((att, i) => (
                          <div key={i} className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-gray-800">{att.mocktestId?.title || "Deleted Test"}</h4>
                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <Clock size={12} /> {new Date(att.createdAt).toLocaleDateString()} • {att.status}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-black text-orange-600">{att.score}</span>
                                <span className="text-xs text-gray-400 block font-semibold uppercase">Score</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                               <div className="bg-white/80 p-2 rounded border border-orange-100 text-center">
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Correct</span>
                                  <span className="text-sm font-bold text-green-600">{att.correctCount || 0}</span>
                               </div>
                               <div className="bg-white/80 p-2 rounded border border-orange-100 text-center flex items-center justify-center">
                                  <Link 
                                    to={`/student/review/${att._id}`}
                                    className="text-[10px] text-orange-600 font-bold uppercase hover:underline flex items-center gap-1"
                                  >
                                    Review <ExternalLink size={10} />
                                  </Link>
                               </div>
                            </div>
                          </div>
                        ))
                      ) : <p className="text-center py-10 text-gray-400">No attempts found.</p>}
                    </div>
                  )}

                  {activityType === 'doubts' && (
                    <div className="space-y-4">
                      {activityData?.doubts?.length > 0 ? (
                        activityData.doubts.map((doubt, i) => (
                          <div key={i} className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                            <div className="flex justify-between items-center mb-2">
                               <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                 doubt.status === 'answered' ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                               }`}>
                                 {doubt.status}
                               </span>
                               <span className="text-[10px] text-gray-400">{new Date(doubt.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 mb-1">Q: {doubt.text}</h4>
                            <p className="text-xs text-cyan-600 mb-3 font-semibold">{doubt.mocktestId?.title || doubt.subject}</p>
                            {doubt.answer && (
                               <div className="bg-white/60 p-3 rounded-lg border border-purple-100">
                                  <p className="text-xs text-gray-600 font-medium">A: {doubt.answer}</p>
                               </div>
                            )}
                          </div>
                        ))
                      ) : <p className="text-center py-10 text-gray-400">No doubts raised.</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
               <button onClick={() => { setSelectedStudent(null); setActivityType(null); }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {status === "succeeded" && totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1 rounded ${currentPage === index + 1 ? "bg-cyan-600 text-white" : "bg-gray-200"}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorStudents;
