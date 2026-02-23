import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInstructors,
  toggleInstructorStatus,
  deleteInstructor,
} from "../../../redux/instructorSlice";
import api from "../../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { Search, User, Lock, Unlock, Pencil, Trash2, X, ArrowLeft, Plus, Download, MoreVertical, Calendar, Clock, MessageSquare, Info, ExternalLink } from "lucide-react";
import { FaCheckCircle, FaBan, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import toast from "react-hot-toast";

// Helper to resolve image URLs
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${api.defaults.baseURL}/${path}`;
};

const ITEMS_PER_PAGE = 6;

const ManageInstructors = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { instructors, status, error } = useSelector(
    (state) => state.instructors
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Doubts
  const [selectedInstForDoubts, setSelectedInstForDoubts] = useState(null);
  const [doubtList, setDoubtList] = useState([]);
  const [isDoubtLoading, setIsDoubtLoading] = useState(false);

  const openDoubtModal = async (inst) => {
    setSelectedInstForDoubts(inst);
    setIsDoubtLoading(true);
    setDoubtList([]);
    try {
      const { data } = await api.get(`/api/admin/users/instructors/${inst._id}/doubts`);
      setDoubtList(data);
    } catch (err) {
      toast.error("Failed to fetch doubts");
    } finally {
      setIsDoubtLoading(false);
    }
  };

  // 1. Initial load
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchInstructors());
    }
  }, [status, dispatch]);

  // 2. Filter by name (first, last, or full) and email
  const filteredInstructors = useMemo(() => {
    if (!searchTerm.trim()) return instructors;

    const term = searchTerm.toLowerCase().trim();

    return instructors.filter((inst) => {
      // Safely get values, defaulting to empty string if null/undefined
      const firstName = inst.firstname?.toLowerCase() || "";
      const lastName = inst.lastname?.toLowerCase() || "";
      const email = inst.email?.toLowerCase() || "";
      
      // Create a full name string for searching "John Doe"
      const fullName = `${firstName} ${lastName}`;

      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        email.includes(term) ||
        fullName.includes(term) // Allows searching combined names
      );
    });
  }, [searchTerm, instructors]);

  // 3. Pagination Logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredInstructors.length / ITEMS_PER_PAGE)
  );

  const paginatedInstructors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInstructors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredInstructors]);

  // Reset page when search changes so user doesn't get stuck on empty page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 4. Handlers
  const handleToggleStatus = (inst) => {
    const actionLabel = inst.isActive ? "Block" : "Unblock";
    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} this instructor?`
      )
    )
      return;

    dispatch(toggleInstructorStatus(inst._id));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this instructor?"))
      return;

    dispatch(deleteInstructor(id));
  };
  
  const handleDownloadReport = async () => {
    try {
      const response = await api.get("/api/admin/users/instructors/report", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Instructors_Report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Instructor report downloaded successfully");
    } catch (err) {
      console.error("Download Error:", err);
      toast.error("Failed to download report");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans text-gray-800">
      <Link
        to="/admin"
        className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800 mb-4 transition font-medium"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
            <User className="text-cyan-600" /> Manage Instructors
          </h1>
          <p className="text-gray-500 mt-1">
            View, manage, and organize your instructors.
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
            to="/admin/users/instructors/add"
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2 font-medium"
          >
            <Plus size={18} /> Add Instructor
          </Link>
        </div>
      </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Clear Search Button */}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

      {/* Loading State */}
      {status === "loading" && (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">Loading instructors...</p>
        </div>
      )}

      {/* Error State */}
      {status === "failed" && (
        <div className="flex justify-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Empty State (Search or No Data) */}
      {status === "succeeded" && filteredInstructors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <User size={48} className="text-gray-300 mb-4" />
          <p>No instructors found matching "{searchTerm}".</p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-2 text-cyan-600 hover:underline text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Instructors Table */}
      {status === "succeeded" && filteredInstructors.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="overflow-x-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                    <th className="p-4 pl-6">Instructor</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Doubt Progress</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-center">Status & Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedInstructors.map((inst) => {
                    const avatarFallback = `https://ui-avatars.com/api/?background=0bc&color=fff&name=${encodeURIComponent(
                      `${inst.firstname || ""} ${inst.lastname || ""}`.trim() ||
                        "Instructor"
                    )}`;

                    const avatarSrc = inst.avatar
                      ? getImageUrl(inst.avatar)
                      : avatarFallback;

                    return (
                      <tr
                        key={inst._id}
                        className="hover:bg-gray-50 transition duration-150"
                      >
                        {/* Name & Avatar */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarSrc || avatarFallback}
                              alt={inst.firstname}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                              onError={(e) => {
                                e.target.src = avatarFallback;
                              }}
                            />
                            <div>
                              <p className="font-semibold text-gray-800">
                                {inst.firstname} {inst.lastname}
                              </p>
                              <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full font-medium">
                                Instructor
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="p-4">
                          <p className="text-sm text-gray-700">{inst.email}</p>
                          <p className="text-xs text-gray-500">
                            {inst.phoneNumber || "—"}
                          </p>
                        </td>

                        {/* DOUBT METRICS */}
                        <td className="p-4">
                          <div 
                            onClick={() => openDoubtModal(inst)}
                            className="flex flex-col gap-1.5 min-w-[120px] cursor-pointer group/metric hover:bg-cyan-50/50 p-2 rounded-lg transition-colors border border-transparent hover:border-cyan-100"
                            title="Click to view details"
                          >
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                              <span className="text-gray-400 group-hover/metric:text-cyan-600 transition-colors">Response Rate</span>
                              <span className="text-cyan-600">
                                {inst.doubtStats?.resolved || 0} / {inst.doubtStats?.total || 0}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                                style={{ 
                                  width: `${inst.doubtStats?.total > 0 ? (inst.doubtStats.resolved / inst.doubtStats.total) * 100 : 0}%` 
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-black">
                                 {inst.doubtStats?.pending || 0} PENDING
                               </span>
                               <span className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100 font-bold">
                                 {inst.doubtStats?.total || 0} TOTAL
                               </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-sm text-gray-600">
                          <div className="font-medium text-gray-700">
                            {inst.createdAt ? new Date(inst.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            }) : "—"}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Access Granted</div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-4 relative">
                            {/* PREMIUM TOGGLE RESTORED */}
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleToggleStatus(inst)}
                                className={`group/toggle relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ring-2 ring-offset-2 ring-transparent focus:ring-cyan-500 shadow-sm ${
                                  inst.isActive ? "bg-green-500" : "bg-gray-200"
                                }`}
                                title={inst.isActive ? "Deactivate Instructor" : "Activate Instructor"}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-md ${
                                    inst.isActive ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                              <span className={`text-[9px] font-bold uppercase tracking-tight ${inst.isActive ? "text-green-600" : "text-gray-400"}`}>
                                {inst.isActive ? "Active" : "Blocked"}
                              </span>
                            </div>

                            {/* HOVER ACTION MENU */}
                            <div className="relative group/actions z-10">
                              <button 
                                className={`p-2.5 rounded-xl transition-all duration-300 border bg-white text-gray-400 border-gray-100 group-hover/actions:bg-[#1e293b] group-hover/actions:text-white group-hover/actions:border-[#1e293b] group-hover/actions:shadow-lg`}
                              >
                                <MoreVertical size={18} />
                              </button>
                              
                              {/* Floating Menu */}
                              <div className="absolute top-1/2 right-full mr-2 -translate-y-1/2 hidden group-hover/actions:block animate-in fade-in zoom-in slide-in-from-right-2 duration-200 z-[100]">
                                <div className="bg-[#1e293b] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden min-w-[170px] border border-gray-700/50 backdrop-blur-xl">
                                  <div className="px-4 py-2 bg-gray-800/80 border-b border-gray-700">
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Inst. Controls</p>
                                  </div>
                                  
                                  <button
                                    onClick={() => navigate(`/admin/users/instructors/edit/${inst._id}`)}
                                    className="w-full text-left px-4 py-3.5 text-xs flex items-center gap-3 hover:bg-cyan-600/30 text-gray-300 hover:text-white font-bold transition-all border-l-4 border-transparent hover:border-cyan-500"
                                  >
                                    <Pencil size={14} className="text-cyan-400" />
                                    Edit Details
                                  </button>

                                  <button
                                    onClick={() => handleToggleStatus(inst)}
                                    className={`w-full text-left px-4 py-3.5 text-xs flex items-center gap-3 font-bold transition-all border-l-4 border-transparent ${
                                      inst.isActive 
                                        ? "hover:bg-orange-600/30 text-gray-300 hover:text-orange-400 hover:border-orange-500" 
                                        : "hover:bg-green-600/30 text-gray-300 hover:text-green-400 hover:border-green-500"
                                    }`}
                                  >
                                    {inst.isActive ? <FaBan size={14} className="text-orange-400" /> : <FaCheckCircle size={14} className="text-green-400" />}
                                    {inst.isActive ? "Block Access" : "Unblock Access"}
                                  </button>

                                  <div className="h-px bg-gray-700/50 mx-2 my-1"></div>

                                  <button
                                    onClick={() => handleDelete(inst._id)}
                                    className="w-full text-left px-4 py-3.5 text-xs flex items-center gap-3 hover:bg-red-600/30 text-gray-300 hover:text-red-400 font-bold transition-all border-l-4 border-transparent hover:border-red-500"
                                  >
                                    <Trash2 size={14} className="text-red-400" />
                                    Delete Instructor
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 rounded transition ${
                    currentPage === index + 1
                      ? "bg-cyan-600 text-white shadow-md"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* DOUBT DETAILS MODAL */}
      {selectedInstForDoubts && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Doubt Details</h2>
                <p className="text-sm text-gray-500">
                  Instructor: <span className="font-semibold text-cyan-600">{selectedInstForDoubts.firstname} {selectedInstForDoubts.lastname}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedInstForDoubts(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isDoubtLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-4xl text-cyan-600 mb-4" />
                  <p className="text-gray-500">Loading assigned doubts...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {doubtList.length > 0 ? (
                    doubtList.map((doubt, i) => (
                      <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-cyan-200 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                             <div className="flex items-center gap-2 mb-1">
                               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                 doubt.status === 'answered' 
                                   ? 'bg-green-50 text-green-600 border-green-200' 
                                   : 'bg-amber-50 text-amber-600 border-amber-200'
                               }`}>
                                 {doubt.status}
                               </span>
                               <span className="text-[10px] text-gray-400 font-bold font-mono">ID: {doubt._id.slice(-6)}</span>
                             </div>
                             <p className="text-xs text-gray-500 flex items-center gap-1">
                               <Calendar size={12} className="text-gray-400" />
                               Asked on {new Date(doubt.createdAt).toLocaleDateString()}
                             </p>
                          </div>
                          
                          <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                               <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs uppercase shadow-inner">
                                 {doubt.student?.firstname?.[0] || "S"}
                               </div>
                               <div className="flex flex-col text-left">
                                  <span className="text-xs font-black text-gray-800 tracking-tight leading-none capitalize">{doubt.student?.firstname} {doubt.student?.lastname}</span>
                                  <span className="text-[9px] text-gray-400 font-medium leading-none mt-1">{doubt.student?.email}</span>
                               </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-100 mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                           <div className="flex items-start gap-3">
                              <MessageSquare size={16} className="text-cyan-500 mt-0.5 shrink-0" />
                              <div>
                                 <p className="text-[10px] text-gray-400 font-bold tracking-[2px] uppercase mb-1">Student's Question</p>
                                 <p className="text-sm text-gray-800 font-medium leading-relaxed">{doubt.text}</p>
                              </div>
                           </div>
                        </div>

                        {doubt.mocktestId && (
                           <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/30 rounded-lg border border-blue-100/50 mb-4 w-fit">
                              <Info size={12} className="text-blue-500" />
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Linked Test:</span>
                              <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{doubt.mocktestId.title}</span>
                              <ExternalLink size={10} className="text-gray-400" />
                           </div>
                        )}

                        {doubt.status === 'answered' ? (
                          <div className="bg-green-50/30 p-4 rounded-xl border border-green-100 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-1 opacity-10">
                                <FaCheckCircle size={40} className="text-green-500" />
                             </div>
                             <p className="text-[10px] text-green-600 font-black tracking-[2px] uppercase mb-1">Instructor's Answer</p>
                             <p className="text-sm text-gray-700 leading-relaxed italic">"{doubt.answer}"</p>
                             <div className="mt-2 flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                <Clock size={10} /> {new Date(doubt.answeredAt).toLocaleString()}
                             </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
                             <Clock className="text-amber-500 animate-pulse" size={18} />
                             <div>
                                <p className="text-xs font-bold text-amber-700">Awaiting Response</p>
                                <p className="text-[10px] text-amber-600 font-medium">This doubt is currently being reviewed by the instructor.</p>
                             </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-60">
                      <MessageSquare size={64} strokeWidth={1} className="mb-4" />
                      <h3 className="text-xl font-black uppercase tracking-[3px]">Clean Slate</h3>
                      <p className="text-sm font-medium">No doubts have been assigned to this instructor yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
              <button 
                onClick={() => setSelectedInstForDoubts(null)}
                className="px-8 py-2.5 bg-[#1e293b] text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-[2px]"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInstructors;