// frontend/src/pages/admin/AdminDoubts.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminDoubts, assignDoubtToInstructor } from "../../redux/doubtSlice";
import { fetchInstructors } from "../../redux/instructorSlice"; 
import { getSocket } from "../../socket"; // Socket import
import toast from "react-hot-toast";
import { User, BookOpen, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const AdminDoubts = () => {
  const dispatch = useDispatch();
  const { adminDoubts, adminStatus } = useSelector((state) => state.doubts);
  const { instructors } = useSelector((state) => state.instructors);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    dispatch(fetchAdminDoubts());
    dispatch(fetchInstructors());

    // Listen for new doubts live!
    const socket = getSocket();
    if (socket) {
        socket.on("newDoubtReceived", (data) => {
            toast(data.message, { icon: '🔔' });
            dispatch(fetchAdminDoubts());
        });
        return () => socket.off("newDoubtReceived");
    }
  }, [dispatch]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.max(1, Math.ceil(adminDoubts.length / ITEMS_PER_PAGE));

  const paginatedDoubts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return adminDoubts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, adminDoubts]);

  // Reset page when data changes (e.g., new doubt received)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [adminDoubts.length, totalPages, currentPage]);

  const handleAssign = (id, instructorId) => {
    if (!instructorId || instructorId === "Select") return;
    dispatch(assignDoubtToInstructor({ id, instructorId, status: "assigned" }));
  };

  return (
    <div className="px-6 py-2 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
           <BookOpen className="text-blue-600" size={20}/> Doubt Management
        </h2>
        <span className="bg-white px-2 py-0.5 rounded-none border-2 border-slate-100 text-[10px] font-black text-gray-500 shadow-sm uppercase tracking-widest">
          Total: {adminDoubts.length}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#fdfdfd] text-[#3e4954] uppercase font-black text-[10px] tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student & Subject</th>
                <th className="px-4 py-3 w-1/3">Doubt Query</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDoubts.map((d) => (
                <tr key={d._id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900 flex items-center gap-2 text-xs">
                       <User size={14} className="text-slate-400"/> 
                       {d.student?.firstname} {d.student?.lastname}
                    </div>
                    <div className="text-[9px] text-[#21b731] font-black uppercase tracking-wider mt-0.5">
                        {d.subject}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-xs">
                     <p className="line-clamp-2 font-bold text-gray-700 leading-relaxed" title={d.text}>{d.text}</p>
                     {d.mocktestId && <span className="text-[8px] text-blue-600 font-extrabold uppercase tracking-widest mt-1 block">Test Related</span>}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest border
                      ${d.status === 'pending' ? 'bg-rose-50 text-rose-600 border-rose-100' : ''}
                      ${d.status === 'assigned' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                      ${d.status === 'answered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ''}
                    `}>
                      {d.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      className="border border-slate-200 px-2 py-1 text-[10px] font-bold text-gray-700 focus:border-blue-500 outline-none w-full bg-slate-50 rounded-none cursor-pointer"
                      value={d.assignedInstructor?._id || ""}
                      onChange={(e) => handleAssign(d._id, e.target.value)}
                      disabled={d.status === 'answered'}
                    >
                      <option value="">Select Instructor</option>
                      {instructors?.map((i) => (
                        <option key={i._id} value={i._id}>
                          {i.firstname} {i.lastname}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3 text-right">
                     {d.status === 'pending' && (
                        <button className="text-rose-500 hover:text-rose-700 text-[9px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Reject</button>
                     )}
                     {d.status === 'answered' && (
                        <span className="text-emerald-600 font-black text-[9px] uppercase tracking-widest flex items-center justify-end gap-1"><CheckCircle size={12}/> Success</span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {adminDoubts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-0 bg-white border-t border-slate-100 p-4 shadow-sm">
            <div className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest font-poppins">
              Showing <span className="text-[#3e4954]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-[#3e4954]">{Math.min(currentPage * ITEMS_PER_PAGE, adminDoubts.length)}</span> of <span className="text-[#21b731]">{adminDoubts.length}</span> results
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
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
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
      </div>
    </div>
  );
};

export default AdminDoubts;