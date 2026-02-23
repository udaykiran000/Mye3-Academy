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

import { Search, GraduationCap, Phone, Info, Globe, Building2, Download, ExternalLink, Calendar, CheckCircle2, Clock, MoreVertical, Trash2, Pencil } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const ManageStudents = () => {
  const dispatch = useDispatch();

  const { students, status, error } = useSelector(
    (state) => state.adminStudents
  );

  const [searchTerm, setSearchTerm] = useState("");
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
    if (!searchTerm.trim()) return students;

    const term = searchTerm.toLowerCase();

    return students.filter((s) => {
      const fullName = `${s.firstname || ""} ${s.lastname || ""}`.toLowerCase();
      return (
        fullName.includes(term) || s.email?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, students]);

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
  }, [searchTerm]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans text-gray-800">
      <Link
        to="/admin"
        className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800 mb-4 transition font-medium"
      >
        <FaArrowLeft /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="text-cyan-600" size={32} />
            Manage Students
          </h1>
          <p className="text-gray-500 mt-1">
            Track student registrations and activity.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition font-medium"
          >
            <Download size={18} /> Download Report
          </button>
          
          <Link
            to="/admin/users/students/add"
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow-md transition font-medium"
          >
            <GraduationCap size={18} /> + Add Student
          </Link>
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
                  <th className="p-4 text-center">Status & Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((s) => {
                    const fullName = `${s.firstname || ""} ${
                      s.lastname || ""
                    }`.trim();

                    return (
                      <tr key={s._id} className="group hover:bg-cyan-50/30 transition-all duration-300 border-b border-gray-50 last:border-0">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={`https://ui-avatars.com/api/?background=0ea5e9&color=fff&bold=true&name=${encodeURIComponent(fullName)}`}
                                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-sm transition-transform group-hover:scale-105"
                              />
                              {s.isActive && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 text-sm capitalize group-hover:text-cyan-600 transition-colors">
                                {fullName || "Unnamed"}
                              </span>
                              <span className="text-xs text-gray-400 font-medium lowercase">
                                {s.email}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Phone size={10} className="text-cyan-500" />
                                <span className="text-[10px] font-mono text-gray-500 tracking-tighter">{s.phoneNumber || "N/A"}</span>
                              </div>
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
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 shadow-sm w-fit uppercase">
                                  <Building2 size={12} /> {s.addedBy?.firstname ? "INSTITUTION" : "ADMIN"}
                                </span>
                                {s.addedBy && (
                                  <span className="text-[9px] font-bold text-gray-400 pl-1 uppercase tracking-tight">
                                    {s.addedBy.firstname} {s.addedBy.lastname}
                                  </span>
                                )}
                              </div>
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
                              className="group/stat flex flex-col items-center p-2 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50 transition-all duration-300"
                            >
                              <span className="text-lg font-black text-blue-700 group-hover/stat:scale-110 transition-transform tracking-tighter">
                                {s.purchasedTestCount || 0}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter group-hover/stat:text-blue-500 mt-0.5">Purchased</span>
                            </button>
                            
                            <div className="w-px h-8 bg-gray-100"></div>

                            <button 
                              onClick={() => openActivityModal(s, 'attempts')}
                              className="group/stat flex flex-col items-center p-2 rounded-xl border border-transparent hover:border-orange-100 hover:bg-orange-50 transition-all duration-300"
                            >
                              <span className="text-lg font-black text-orange-700 group-hover/stat:scale-110 transition-transform tracking-tighter">
                                {s.attemptCount || 0}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter group-hover/stat:text-orange-500 mt-0.5">Attempts</span>
                            </button>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                           <button 
                              onClick={() => openActivityModal(s, 'doubts')}
                              className="inline-flex flex-col items-center gap-0.5 p-2 rounded-xl border border-transparent hover:border-purple-100 hover:bg-purple-50 transition-all duration-300 group/doubt"
                            >
                              <div className="relative">
                                <span className="text-lg font-black text-purple-700 group-hover/doubt:scale-110 transition-transform block tracking-tighter">
                                  {s.doubtCount || 0}
                                </span>
                                {s.doubtCount > 0 && (
                                  <div className="absolute -top-1 -right-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter group-hover/doubt:text-purple-500 mt-0.5">Doubts</span>
                            </button>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-4 relative">
                            {/* PREMIUM TOGGLE RESTORED */}
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleBlock(s._id)}
                                className={`group/toggle relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ring-2 ring-offset-2 ring-transparent focus:ring-cyan-500 shadow-sm ${
                                  s.isActive ? "bg-green-500" : "bg-gray-200"
                                }`}
                                title={s.isActive ? "Deactivate Student" : "Activate Student"}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-md ${
                                    s.isActive ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                              <span className={`text-[9px] font-bold uppercase tracking-tight ${s.isActive ? "text-green-600" : "text-gray-400"}`}>
                                {s.isActive ? "Active" : "Blocked"}
                              </span>
                            </div>

                            {/* HOVER ACTION MENU - REPOSITIONED TO AVOID CLIPPING */}
                            <div className="relative group/actions z-10">
                              <button 
                                className={`p-2.5 rounded-xl transition-all duration-300 border bg-white text-gray-400 border-gray-100 group-hover/actions:bg-[#1e293b] group-hover/actions:text-white group-hover/actions:border-[#1e293b] group-hover/actions:shadow-lg`}
                              >
                                <MoreVertical size={18} />
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
                              <span className="text-xs font-mono text-gray-600">{test.orderId}</span>
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

      {status === "succeeded" && totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            onClick={() =>
              setCurrentPage((p) => Math.max(1, p - 1))
            }
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === index + 1
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
