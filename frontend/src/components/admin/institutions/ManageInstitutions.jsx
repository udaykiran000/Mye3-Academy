import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInstitutions,
  toggleInstitutionStatus,
  deleteInstitution,
} from "../../../redux/institutionSlice";
import api from "../../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { Search, Home, Building2, Lock, Unlock, Pencil, Trash2, X, ArrowLeft, Plus, Download, MoreVertical, Users, Mail, Phone, ArrowRight, User as UserIcon, ChevronRight } from "lucide-react";
import { FaCheckCircle, FaBan, FaSpinner, FaExclamationTriangle, FaTimes, FaGraduationCap } from "react-icons/fa";
import toast from "react-hot-toast";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${api.defaults.baseURL}/${path}`;
};

const ITEMS_PER_PAGE = 12;

const ManageInstitutions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { institutions, status, error } = useSelector(
    (state) => state.institutions
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Student Drill-down state
  const [selectedInstForStudents, setSelectedInstForStudents] = useState(null);
  const [instStudents, setInstStudents] = useState([]);
  const [isInstStudentsLoading, setIsInstStudentsLoading] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchInstitutions());
    }
  }, [status, dispatch]);

  const filteredInstitutions = useMemo(() => {
    if (!searchTerm.trim()) return institutions;

    const term = searchTerm.toLowerCase().trim();

    return institutions.filter((inst) => {
      const firstName = inst.firstname?.toLowerCase() || "";
      const lastName = inst.lastname?.toLowerCase() || "";
      const email = inst.email?.toLowerCase() || "";
      const fullName = `${firstName} ${lastName}`;

      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        email.includes(term) ||
        fullName.includes(term)
      );
    });
  }, [searchTerm, institutions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInstitutions.length / ITEMS_PER_PAGE)
  );

  const paginatedInstitutions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInstitutions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredInstitutions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleToggleStatus = (inst) => {
    const actionLabel = inst.isActive ? "Block" : "Unblock";
    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} this institution?`
      )
    )
      return;

    dispatch(toggleInstitutionStatus(inst._id));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this institution?"))
      return;

    dispatch(deleteInstitution(id));
  };
  
  const handleDownloadReport = async () => {
    try {
      const response = await api.get("/api/admin/users/institutions/report", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Institutions_Report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Institution report downloaded successfully");
    } catch (err) {
      console.error("Download Error:", err);
      toast.error("Failed to download report");
    }
  };

  const handleViewStudents = async (inst) => {
    setSelectedInstForStudents(inst);
    setIsInstStudentsLoading(true);
    setInstStudents([]);
    try {
      // Fetch all students and filter by addedBy (simplified approach)
      const { data } = await api.get("/api/admin/users/students");
      const filtered = data.filter(s => s.addedBy?._id === inst._id || s.addedBy === inst._id);
      setInstStudents(filtered);
    } catch (err) {
      toast.error("Failed to fetch registered students");
    } finally {
      setIsInstStudentsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-[#EDF0FF] font-poppins">
      {/* WHITE HEADER STRIP */}
      <div className="bg-white border-b border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-8 animate-in fade-in slide-in-from-top-1 duration-700">
          <div className="space-y-3 mb-6">
            <Link
              to="/admin"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#7e7e7e] hover:text-indigo-600 transition"
            >
              <ArrowLeft size={12} /> Back to Dashboard
            </Link>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
              <div>
                <h1 className="text-2xl font-black text-[#3e4954] tracking-tight uppercase flex items-center gap-3">
                  <Building2 className="text-indigo-600" size={24} />
                  Manage Institutions
                </h1>
                <p className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-[0.1em] opacity-60 mt-1">
                  View, manage, and organize your institutions and their registrations
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Search Integrated into Header Row */}
              <div className="relative group">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search institutions..."
                  className="bg-slate-50 border border-slate-100 rounded-none pl-9 pr-8 py-2.5 text-xs focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none w-56 md:w-64 transition-all font-poppins text-[#3e4954] font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-[#7e7e7e] px-4 py-2.5 rounded-none shadow-sm hover:bg-slate-50 transition font-black text-[10px] uppercase tracking-widest border-b-2 hover:border-b-indigo-600"
                >
                  <Download size={14} /> Report
                </button>
                
                <Link
                  to="/admin/users/institutions/add"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-none shadow-lg shadow-indigo-100 transition flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus size={16} /> Add Institution
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 md:px-6 pb-12">
        <div className="space-y-6">

      {status === "loading" && (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">Loading institutions...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="flex justify-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {status === "succeeded" && filteredInstitutions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Building2 size={48} className="text-gray-300 mb-4" />
          <p>No institutions found matching "{searchTerm}".</p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-2 text-indigo-600 hover:underline text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {status === "succeeded" && filteredInstitutions.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] border border-gray-100">
            <div className="overflow-x-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fdfdfd] border-b border-gray-100 text-[#3e4954] uppercase text-[10px] font-black tracking-widest">
                    <th className="px-6 py-3">Institution</th>
                    <th className="px-4 py-3">Contact Info</th>
                    <th className="px-4 py-3 text-center">Students</th>
                    <th className="px-4 py-3">Joined Date</th>
                    <th className="px-4 py-3 text-center">Status & Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedInstitutions.map((inst) => {
                    const avatarFallback = `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(
                      `${inst.firstname || ""} ${inst.lastname || ""}`.trim() ||
                        "Institution"
                    )}`;

                    const avatarSrc = inst.avatar
                      ? getImageUrl(inst.avatar)
                      : avatarFallback;

                    return (
                      <tr
                        key={inst._id}
                        className="hover:bg-slate-50 transition duration-150 border-b border-slate-100 last:border-0"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarSrc || avatarFallback}
                              alt={inst.firstname}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm"
                              onError={(e) => {
                                e.target.src = avatarFallback;
                              }}
                            />
                            <div>
                               <p className="font-extrabold text-gray-800 text-xs">
                                {inst.firstname} {inst.lastname}
                              </p>
                              <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider">
                                Institution
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-[11px] font-bold text-gray-700">{inst.email}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {inst.phoneNumber || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div 
                            onClick={() => handleViewStudents(inst)}
                            className="inline-flex flex-col items-center group/students cursor-pointer"
                          >
                            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-none border border-indigo-100 shadow-sm transition-transform group-hover/students:scale-105">
                              <Users size={12} />
                              <span className="font-black text-xs">{inst.studentCount || 0}</span>
                            </div>
                            <span className="text-[8px] font-black text-gray-400 mt-1 uppercase tracking-widest">Registered</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          <div className="font-black text-gray-700 text-[11px]">
                            {inst.createdAt ? new Date(inst.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            }) : "—"}
                          </div>
                          <div className="text-[9px] text-gray-400 font-black uppercase tracking-tight opacity-70">Access Granted</div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-3 relative">
                            {/* PREMIUM TOGGLE RESTORED */}
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleToggleStatus(inst)}
                                className={`group/toggle relative inline-flex h-4 w-9 items-center rounded-full transition-all duration-300 focus:outline-none ring-2 ring-offset-2 ring-transparent focus:ring-indigo-500 shadow-sm ${
                                  inst.isActive ? "bg-green-500" : "bg-gray-200"
                                }`}
                                title={inst.isActive ? "Deactivate Institution" : "Activate Institution"}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all shadow-md ${
                                    inst.isActive ? "translate-x-5" : "translate-x-1"
                                  }`}
                                />
                              </button>
                              <span className={`text-[8px] font-black uppercase tracking-widest ${inst.isActive ? "text-green-600" : "text-gray-400"}`}>
                                {inst.isActive ? "Active" : "Blocked"}
                              </span>
                            </div>

                            {/* HOVER ACTION MENU */}
                            <div className="relative group/actions z-10">
                              <button 
                                className={`p-1.5 rounded-none transition-all duration-300 border bg-white text-gray-400 border-gray-100 group-hover/actions:bg-[#1e293b] group-hover/actions:text-white group-hover/actions:border-[#1e293b] group-hover/actions:shadow-lg`}
                              >
                                <MoreVertical size={14} />
                              </button>
                              
                              {/* Floating Menu */}
                              <div className="absolute top-1/2 right-full mr-2 -translate-y-1/2 hidden group-hover/actions:block animate-in fade-in zoom-in slide-in-from-right-2 duration-200 z-[100]">
                                <div className="bg-[#1e293b] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden min-w-[170px] border border-gray-700/50 backdrop-blur-xl">
                                  <div className="px-4 py-2 bg-gray-800/80 border-b border-gray-700">
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Inst. Controls</p>
                                  </div>
                                  
                                  <button
                                    onClick={() => navigate(`/admin/users/institutions/edit/${inst._id}`)}
                                    className="w-full text-left px-4 py-3.5 text-xs flex items-center gap-3 hover:bg-indigo-600/30 text-gray-300 hover:text-white font-bold transition-all border-l-4 border-transparent hover:border-indigo-500"
                                  >
                                    <Pencil size={14} className="text-indigo-400" />
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
                                    Delete Institution
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

          {status === "succeeded" && filteredInstitutions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white border border-slate-200 p-4 shadow-sm">
              <div className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest font-poppins">
                Showing <span className="text-[#3e4954]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-[#3e4954]">{Math.min(currentPage * ITEMS_PER_PAGE, filteredInstitutions.length)}</span> of <span className="text-[#21b731]">{filteredInstitutions.length}</span> results
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-10 h-10 flex items-center justify-center border border-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#3e4954] transition-all"
                >
                  <ChevronRight size={16} className="rotate-180" />
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
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
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
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {/* Student List Modal */}
      {selectedInstForStudents && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="text-indigo-600" size={24} /> Registered Students
                </h2>
                <p className="text-sm text-gray-500">
                  Institution: <span className="font-semibold text-indigo-600">{selectedInstForStudents.firstname} {selectedInstForStudents.lastname}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedInstForStudents(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isInstStudentsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
                  <p className="text-gray-500 font-medium">Fetching registered students...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {instStudents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {instStudents.map((student) => (
                        <div key={student._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-300 transition-all hover:bg-white hover:shadow-md group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                              {student.firstname?.[0]}{student.lastname?.[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-bold text-gray-800 text-sm truncate">{student.firstname} {student.lastname}</h4>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <Mail size={10} /> {student.email}
                                </span>
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <Phone size={10} /> {student.phoneNumber || "No Phone"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                student.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}>
                                {student.isActive ? "Active" : "Blocked"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                             <div className="flex gap-4">
                               <div className="text-center">
                                 <span className="text-[9px] font-black text-gray-400 uppercase block leading-none mb-1">Tests</span>
                                 <span className="text-xs font-bold text-gray-700">{student.purchasedTestCount || 0}</span>
                               </div>
                               <div className="text-center">
                                 <span className="text-[9px] font-black text-gray-400 uppercase block leading-none mb-1">Attempts</span>
                                 <span className="text-xs font-bold text-gray-700">{student.attemptCount || 0}</span>
                               </div>
                             </div>
                             <button
                               onClick={() => navigate(`/admin/users/students`)}
                               className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               Manage <ArrowRight size={10} />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                      <UserIcon size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-lg font-bold">No Students Yet</p>
                      <p className="text-xs max-w-xs mx-auto mt-1">This institution hasn't registered any students to the platform yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
               <button 
                  onClick={() => setSelectedInstForStudents(null)}
                  className="px-6 py-2 bg-[#1e293b] text-white rounded-xl hover:bg-slate-800 transition font-bold text-sm shadow-lg"
               >
                 Got It
               </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ManageInstitutions;
