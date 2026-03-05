import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchStudents,
  blockStudent,
  deleteStudent,
} from "../../../redux/adminStudentSlice";
import api from "../../../api/axios";
import toast from "react-hot-toast";

import {
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBan,
  FaDownload,
  FaChartBar,
  FaQuestionCircle,
  FaTimes,
  FaArrowRight,
  FaEllipsisV,
  FaTrash,
  FaEdit,
} from "react-icons/fa";

import { Search, GraduationCap, Phone, Info, Globe, Building2, Download, ExternalLink, Calendar, CheckCircle2, Clock, MoreVertical, Trash2, Pencil, Plus } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const ManageStudents = () => {
  const dispatch = useDispatch();

  const { students, status, error } = useSelector(
    (state) => state.adminStudents
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === "idle") dispatch(fetchStudents());
  }, [status, dispatch]);

  const handleDownloadReport = async () => {
    try {
      const response = await api.get("/api/admin/users/students/report", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Students_Report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully");
    } catch (err) {
      console.error("Download Error:", err);
      toast.error("Failed to download report");
    }
  };

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activityType, setActivityType] = useState(null); // 'purchased', 'attempts', 'doubts'
  const [activityData, setActivityData] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const openActivityModal = async (student, type) => {
    setSelectedStudent(student);
    setActivityType(type);
    setIsModalLoading(true);
    setActivityData(null);
    try {
      const { data } = await api.get(`/api/admin/users/students/${student._id}/activity`);
      setActivityData(data);
    } catch (err) {
      toast.error("Failed to fetch activity details");
    } finally {
      setIsModalLoading(false);
    }
  };

  const [activeMenu, setActiveMenu] = useState(null);

  const handleBlock = (id) => {
    if (window.confirm("Are you sure you want to change this student's status?")) {
      dispatch(blockStudent(id));
      setActiveMenu(null);
    }
  };

  const handleStudentDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      dispatch(deleteStudent(id));
      setActiveMenu(null);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = students;

    // Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) => {
        const fullName = `${s.firstname || ""} ${s.lastname || ""}`.toLowerCase();
        return fullName.includes(term) || s.email?.toLowerCase().includes(term);
      });
    }

    // Status Filter
    if (statusFilter !== "all") {
      const isActiveValue = statusFilter === "active";
      result = result.filter((s) => s.isActive === isActiveValue);
    }

    // Source Filter
    if (sourceFilter !== "all") {
      result = result.filter((s) => s.registrationSource === sourceFilter);
    }

    // Sort by Newest First
    return [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [searchTerm, statusFilter, sourceFilter, students]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  );

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [currentPage, filteredStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter]);

  return (
    <div className="min-h-screen bg-[#EDF0FF] font-poppins">
      {/* WHITE HEADER STRIP */}
      <div className="bg-white border-b border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-8 animate-in fade-in slide-in-from-top-1 duration-700">
          <div className="space-y-3 mb-6">
            <Link
              to="/admin"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#7e7e7e] hover:text-cyan-600 transition"
            >
              <FaArrowLeft size={12} /> Back to Dashboard
            </Link>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-cyan-600 shadow-[0_0_10px_rgba(8,145,178,0.2)]" />
              <div>
                <h1 className="text-2xl font-black text-[#3e4954] tracking-tight uppercase flex items-center gap-3">
                  <GraduationCap className="text-cyan-600" size={24} />
                  Manage Students
                </h1>
                <p className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-[0.1em] opacity-60 mt-1">
                  Track student registrations and activity across the platform
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Search Integrated into Header Row */}
              <div className="relative group">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-600 transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-slate-50 border border-slate-100 rounded-none pl-9 pr-4 py-2.5 text-xs focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/5 outline-none w-40 md:w-48 transition-all font-poppins text-[#3e4954] font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-none px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-cyan-600 transition-all text-[#3e4954] w-32"
              >
                <option value="all">Recently</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-none px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-cyan-600 transition-all text-[#3e4954] w-32"
              >
                <option value="all">All Sources</option>
                <option value="self">Self</option>
                <option value="institution">Institution</option>
                <option value="admin">Admin</option>
              </select>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-[#7e7e7e] px-4 py-2.5 rounded-none shadow-sm hover:bg-slate-50 transition font-black text-[10px] uppercase tracking-widest border-b-2 hover:border-b-cyan-600"
                >
                  <Download size={14} /> Report
                </button>
                
                <Link
                  to="/admin/users/students/add"
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-none shadow-lg shadow-cyan-100 transition font-black text-[10px] uppercase tracking-widest hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus size={16} /> Add Student
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 md:px-6 pb-12">
        <div className="space-y-6">

      <div className="bg-white shadow-[0_15px_50px_rgba(0,0,0,0.12)] rounded-xl border border-slate-100">
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
                <tr className="bg-[#fdfdfd] border-b border-gray-100 text-[#3e4954] uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-3">Student Info</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3 text-center">Activity Metrics</th>
                  <th className="px-4 py-3 text-center">Doubts</th>
                  <th className="px-4 py-3 text-center">Status & Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((s) => {
                    const fullName = `${s.firstname || ""} ${
                      s.lastname || ""
                    }`.trim();

                    return (
                      <tr key={s._id} className="group hover:bg-slate-50 transition-all duration-300 border-b border-slate-100 last:border-0">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={`https://ui-avatars.com/api/?background=0ea5e9&color=fff&bold=true&name=${encodeURIComponent(fullName)}`}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-white shadow-sm transition-transform group-hover:scale-105"
                              />
                              {s.isActive && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white rounded-full shadow-sm"></div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-gray-800 text-xs capitalize transition-colors">
                                {fullName || "Unnamed"}
                              </span>
                              <span className="text-xs text-gray-500 font-semibold lowercase">
                                {s.email}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Phone size={8} className="text-cyan-500" />
                                <span className="text-[11px] text-gray-500 tracking-tighter">{s.phoneNumber || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {s.registrationSource === "self" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest w-fit">
                                <Globe size={10} /> SELF
                              </span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[8px] font-black bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-widest w-fit">
                                  <Building2 size={10} /> {s.addedBy?.firstname ? "INSTITUTION" : "ADMIN"}
                                </span>
                                {s.addedBy && (
                                  <span className="text-[8px] font-black text-gray-400 pl-0.5 uppercase tracking-tighter opacity-70">
                                    {s.addedBy.firstname} {s.addedBy.lastname}
                                  </span>
                                )}
                              </div>
                            )}
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wide pl-0.5 mt-0.5">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => openActivityModal(s, 'purchased')}
                              className="group/stat flex flex-col items-center p-1 rounded-none border border-transparent hover:border-blue-100 hover:bg-blue-50 transition-all duration-300"
                            >
                              <span className="text-sm font-black text-blue-700 tracking-tighter">
                                {s.purchasedTestCount || 0}
                              </span>
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Pct</span>
                            </button>
                            
                            <div className="w-px h-6 bg-gray-100"></div>
 
                            <button 
                              onClick={() => openActivityModal(s, 'attempts')}
                              className="group/stat flex flex-col items-center p-1 rounded-none border border-transparent hover:border-orange-100 hover:bg-orange-50 transition-all duration-300"
                            >
                              <span className="text-sm font-black text-orange-700 tracking-tighter">
                                {s.attemptCount || 0}
                              </span>
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Att</span>
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                           <button 
                              onClick={() => openActivityModal(s, 'doubts')}
                              className="inline-flex flex-col items-center gap-0.5 p-1 rounded-none border border-transparent hover:border-purple-100 hover:bg-purple-50 transition-all duration-300 group/doubt"
                            >
                              <div className="relative">
                                <span className="text-sm font-black text-purple-700 block tracking-tighter">
                                  {s.doubtCount || 0}
                                </span>
                                {s.doubtCount > 0 && (
                                  <div className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Dbt</span>
                            </button>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-3 relative">
                            {/* PREMIUM TOGGLE RESTORED */}
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleBlock(s._id)}
                                className={`group/toggle relative inline-flex h-4 w-9 items-center rounded-full transition-all duration-300 focus:outline-none ring-2 ring-offset-2 ring-transparent focus:ring-cyan-500 shadow-sm ${
                                  s.isActive ? "bg-green-500" : "bg-gray-200"
                                }`}
                                title={s.isActive ? "Deactivate Student" : "Activate Student"}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all shadow-md ${
                                    s.isActive ? "translate-x-5" : "translate-x-1"
                                  }`}
                                />
                              </button>
                              <span className={`text-[8px] font-black uppercase tracking-widest ${s.isActive ? "text-green-600" : "text-gray-400"}`}>
                                {s.isActive ? "Active" : "Blocked"}
                              </span>
                            </div>

                            {/* HOVER ACTION MENU - REPOSITIONED TO AVOID CLIPPING */}
                            <div className="relative group/actions z-10">
                              <button 
                                className={`p-1.5 rounded-none transition-all duration-300 border bg-white text-gray-400 border-gray-100 group-hover/actions:bg-[#1e293b] group-hover/actions:text-white group-hover/actions:border-[#1e293b] group-hover/actions:shadow-lg`}
                              >
                                <MoreVertical size={14} />
                              </button>
                              
                              {/* Menu positioned to the left and slightly down to stay within screen */}
                              <div className="absolute top-1/2 right-full mr-2 -translate-y-1/2 hidden group-hover/actions:block animate-in fade-in zoom-in slide-in-from-right-2 duration-200 z-[100]">
                                <div className="bg-[#1e293b] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden min-w-[150px] border border-gray-700/50 backdrop-blur-xl">
                                  <div className="px-4 py-2 bg-gray-800/80 border-b border-gray-700">
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Student Tools</p>
                                  </div>
                                  
                                  <Link
                                    to={`/admin/users/students/edit/${s._id}`}
                                    className="w-full text-left px-4 py-3.5 text-xs flex items-center gap-3 hover:bg-cyan-600/30 text-gray-300 hover:text-white font-bold transition-all border-l-4 border-transparent hover:border-cyan-500"
                                  >
                                    <Pencil size={14} className="text-cyan-400" />
                                    Edit Student
                                  </Link>

                                  <button
                                    onClick={() => handleBlock(s._id)}
                                    className={`w-full text-left px-4 py-3.5 text-xs flex items-center gap-3 font-bold transition-all border-l-4 border-transparent ${
                                      s.isActive 
                                        ? "hover:bg-orange-600/30 text-gray-300 hover:text-orange-400 hover:border-orange-500" 
                                        : "hover:bg-green-600/30 text-gray-300 hover:text-green-400 hover:border-green-500"
                                    }`}
                                  >
                                    {s.isActive ? <FaBan size={14} className="text-orange-400" /> : <FaCheckCircle size={14} className="text-green-400" />}
                                    {s.isActive ? "Block Access" : "Unblock Access"}
                                  </button>

                                  <div className="h-px bg-gray-700/50 mx-2 my-1"></div>

                                  <button
                                    onClick={() => handleStudentDelete(s._id)}
                                    className="w-full text-left px-4 py-3.5 text-xs flex items-center gap-3 hover:bg-red-600/30 text-gray-300 hover:text-red-400 font-bold transition-all border-l-4 border-transparent hover:border-red-500"
                                  >
                                    <Trash2 size={14} className="text-red-400" />
                                    Delete Student
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
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
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 capitalize">
                  {activityType} Details
                </h2>
                <p className="text-sm text-gray-500">
                  Student: <span className="font-semibold text-cyan-600">{selectedStudent.firstname} {selectedStudent.lastname}</span>
                </p>
              </div>
              <button 
                onClick={() => { setSelectedStudent(null); setActivityType(null); }}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isModalLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <FaSpinner className="animate-spin text-4xl text-cyan-600 mb-4" />
                  <p className="text-gray-500">Fetching activity records...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityType === 'purchased' && (
                    <div className="space-y-3">
                      {activityData?.purchasedTests?.length > 0 ? (
                        activityData.purchasedTests.map((test, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100 hover:border-blue-300 transition group">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
                                <GraduationCap size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 group-hover:text-blue-700 transition">{test.title}</h4>
                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <Calendar size={12} /> Purchased on {new Date(test.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Order ID</span>
                               <span className="text-xs text-gray-600">{test.orderId}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-gray-400">
                          <CheckCircle2 size={40} className="mx-auto mb-2 opacity-20" />
                          <p>No tests purchased yet.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activityType === 'attempts' && (
                    <div className="space-y-3">
                      {activityData?.attempts?.length > 0 ? (
                        activityData.attempts.map((att, i) => (
                          <div key={i} className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 hover:border-orange-300 transition group">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-gray-800 group-hover:text-orange-700 transition">{att.mocktestId?.title || "Deleted Test"}</h4>
                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <Clock size={12} /> {new Date(att.createdAt).toLocaleDateString()} • {att.status}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-black text-orange-600">{att.score}</span>
                                <span className="text-xs text-gray-400 block font-semibold uppercase">Score</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                               <div className="bg-white/80 p-2 rounded border border-orange-100 text-center">
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Correct</span>
                                  <span className="text-sm font-bold text-green-600">{att.correctCount || 0}</span>
                               </div>
                               <div className="bg-white/80 p-2 rounded border border-orange-100 text-center">
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Accuracy</span>
                                  <span className="text-sm font-bold text-blue-600">
                                    {(att.correctCount && att.answers?.length) ? Math.round((att.correctCount / att.answers.length) * 100) : 0}%
                                  </span>
                               </div>
                               <div className="bg-white/80 p-2 rounded border border-orange-100 text-center flex items-center justify-center">
                                  <Link 
                                    to={`/student/review/${att._id}`}
                                    className="text-[10px] text-orange-600 font-bold uppercase hover:underline flex items-center gap-1"
                                  >
                                    Results <ExternalLink size={10} />
                                  </Link>
                               </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-gray-400">
                          <FaChartBar size={40} className="mx-auto mb-2 opacity-20" />
                          <p>No test attempts found.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activityType === 'doubts' && (
                    <div className="space-y-4">
                      {activityData?.doubts?.length > 0 ? (
                        activityData.doubts.map((doubt, i) => (
                          <div key={i} className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 relative group">
                            <div className="flex justify-between items-center mb-2">
                               <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                 doubt.status === 'answered' ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                               }`}>
                                 {doubt.status}
                               </span>
                               <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                 <Calendar size={10} /> {new Date(doubt.createdAt).toLocaleDateString()}
                               </span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 mb-1">Q: {doubt.text}</h4>
                            <p className="text-xs text-cyan-600 mb-3 flex items-center gap-1">
                               <Info size={12} /> Related to: <span className="font-semibold">{doubt.mocktestId?.title || doubt.subject}</span>
                            </p>
                            
                            <div className="bg-white/60 p-3 rounded-lg border border-purple-100">
                               <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Resolution Detail</p>
                               {doubt.status === 'pending' ? (
                                 <p className="text-xs italic text-gray-500">Awaiting instructor assignment...</p>
                               ) : (
                                 <div className="space-y-2">
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-[10px] font-bold text-cyan-700">
                                        {doubt.assignedInstructor?.firstname?.[0] || "A"}
                                      </div>
                                      <span className="text-xs font-medium text-gray-700">Assigned: {doubt.assignedInstructor ? `${doubt.assignedInstructor.firstname} ${doubt.assignedInstructor.lastname}` : "Admin"}</span>
                                   </div>
                                   {doubt.answer ? (
                                     <div className="pl-8 border-l-2 border-green-400 mt-2">
                                        <p className="text-xs text-gray-600 font-medium">A: {doubt.answer}</p>
                                     </div>
                                   ) : (
                                     <p className="text-[10px] text-orange-600 pl-8">Instructor currently reviewing...</p>
                                   )}
                                 </div>
                               )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-gray-400">
                          <FaQuestionCircle size={40} className="mx-auto mb-2 opacity-20" />
                          <p>No doubts raised by this student.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
               <button 
                  onClick={() => { setSelectedStudent(null); setActivityType(null); }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-bold text-sm"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}

      {status === "succeeded" && filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest font-poppins">
            Showing <span className="text-[#3e4954]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-[#3e4954]">{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}</span> of <span className="text-[#21b731]">{filteredStudents.length}</span> results
          </div>
          
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="w-10 h-10 flex items-center justify-center border border-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#3e4954] transition-all"
            >
              <FaArrowRight size={16} className="rotate-180" />
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
                      className={`w-10 h-10 text-[11px] font-black transition-all border ${
                        currentPage === pageNum 
                          ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-100' 
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
              <FaArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;
