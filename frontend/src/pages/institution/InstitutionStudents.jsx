import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { ClipLoader } from "react-spinners";

import {
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle,
  FaTimes,
  FaChartBar,
  FaClipboardList,
  FaQuestionCircle,
} from "react-icons/fa";

import { Search, GraduationCap, Phone, Info, Calendar, Clock, ExternalLink, Plus, Mail, Lock, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchInstitutionStudents } from "../../redux/institutionDashboardSlice";

const ITEMS_PER_PAGE = 8;

const InstitutionStudents = () => {
  const dispatch = useDispatch();
  const { students, loading, error } = useSelector((state) => state.institutionDashboard || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Student Form State
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Activity Modal State
  const [selectedStudentForActivity, setSelectedStudentForActivity] = useState(null);
  const [activityType, setActivityType] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchInstitutionStudents());
  }, [dispatch]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/api/institution/students/add", newStudent);
      toast.success("Student added successfully!");
      setShowAddModal(false);
      setNewStudent({ firstName: "", lastName: "", email: "", password: "", phone: "" });
      dispatch(fetchInstitutionStudents());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActivityModal = async (student, type) => {
    setSelectedStudentForActivity(student);
    setActivityType(type);
    setIsActivityLoading(true);
    try {
      const { data } = await api.get(`/api/institution/students/${student._id}/activity`);
      setActivityData(data);
    } catch (err) {
      toast.error("Failed to load activity details");
    } finally {
      setIsActivityLoading(false);
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

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredStudents]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campus Students</h1>
          <p className="text-slate-500 font-medium">Manage and track students registered by your institution.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          <Plus size={20} /> Add New Student
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center">
            <ClipLoader color="#4f46e5" size={40} />
            <p className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Refreshing Database...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-20 text-center">
            <GraduationCap size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No students found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 h-14">
                  <th className="px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student Info</th>
                  <th className="px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact</th>
                  <th className="px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Activity</th>
                  <th className="px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Registration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 transition duration-200 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 overflow-hidden shadow-sm group-hover:rotate-3 transition">
                          <img
                            src={`https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&name=${encodeURIComponent(s.firstname + " " + s.lastname)}`}
                            alt="avatar"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 capitalize leading-tight">{s.firstname} {s.lastname}</h4>
                          <span className="text-xs text-slate-400 font-medium">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-600">
                             <Phone size={12} className="text-indigo-600" />
                             <span className="text-xs font-bold tracking-tighter">{s.phoneNumber || "N/A"}</span>
                        </div>
                         <span className="text-[10px] text-slate-300 font-black uppercase">Verified ID</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex justify-center items-center gap-4">
                          <button 
                            onClick={() => openActivityModal(s, 'attempts')}
                            className="flex flex-col items-center bg-orange-50 px-3 py-2 rounded-xl border border-orange-100 hover:bg-orange-100 transition active:scale-95"
                          >
                             <span className="text-sm font-black text-orange-700">{s.attemptCount || 0}</span>
                             <span className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Tests</span>
                          </button>
                          <button 
                             onClick={() => openActivityModal(s, 'doubts')}
                             className="flex flex-col items-center bg-purple-50 px-3 py-2 rounded-xl border border-purple-100 hover:bg-purple-100 transition active:scale-95"
                          >
                             <span className="text-sm font-black text-purple-700">{s.doubtCount || 0}</span>
                             <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter">Doubts</span>
                          </button>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date(s.createdAt).toLocaleDateString()}</span>
                       <br/>
                       <span className="text-[9px] text-slate-300 font-bold">Portal Registered</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
               <button
                 key={i}
                 onClick={() => setCurrentPage(i + 1)}
                 className={`w-10 h-10 rounded-xl font-bold text-sm transition ${currentPage === i+1 ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"}`}
               >
                 {i + 1}
               </button>
            ))}
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in h-[85vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">Add New Student</h2>
                  <p className="text-sm text-slate-500">Provide credentials for the new campus access.</p>
               </div>
               <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 transition flex items-center justify-center text-slate-400">
                  <FaTimes size={20} />
               </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">First Name</label>
                        <div className="relative">
                           <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                           <input 
                              type="text" required
                              className="w-full bg-slate-50 border-none rounded-2xl pl-12 py-3.5 focus:ring-2 focus:ring-indigo-600"
                              placeholder="Kiran"
                              value={newStudent.firstName}
                              onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                           />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Last Name</label>
                        <input 
                            type="text" required
                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-600"
                            placeholder="Kumar"
                            value={newStudent.lastName}
                            onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                            type="email" required
                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 py-3.5 focus:ring-2 focus:ring-indigo-600"
                            placeholder="student@campus.com"
                            value={newStudent.email}
                            onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Temporary Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                            type="password" required
                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 py-3.5 focus:ring-2 focus:ring-indigo-600"
                            placeholder="••••••••"
                            value={newStudent.password}
                            onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                            type="tel"
                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 py-3.5 focus:ring-2 focus:ring-indigo-600"
                            placeholder="9876543210"
                            value={newStudent.phone}
                            onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                        />
                    </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95 flex justify-center disabled:opacity-50"
                >
                  {isSubmitting ? <ClipLoader size={18} color="#fff" /> : "Authorize Student"}
                </button>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVITY MODAL */}
      {selectedStudentForActivity && activityType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 capitalize">{activityType} Tracking</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                             Student: <span className="text-indigo-600 font-black">{selectedStudentForActivity.firstname} {selectedStudentForActivity.lastname}</span>
                        </p>
                    </div>
                    <button onClick={() => { setSelectedStudentForActivity(null); setActivityType(null); }} className="w-10 h-10 rounded-full hover:bg-slate-100 transition flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* TAB SWITCHER WITHIN MODAL */}
                <div className="flex bg-slate-100/50 p-2 mx-6 mt-6 rounded-2xl gap-2">
                    {['attempts', 'purchased', 'doubts'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActivityType(tab)}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activityType === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          {tab}
                        </button>
                    ))}
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {isActivityLoading ? (
                        <div className="py-20 text-center">
                            <ClipLoader color="#4f46e5" size={40} />
                            <p className="mt-4 text-[10px] text-slate-400 font-black tracking-widest">FETCHING PERFORMANCE DATA...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-4">
                            {/* ATTEMPTS VIEW */}
                            {activityType === 'attempts' && (
                                activityData?.attempts?.length > 0 ? (
                                    activityData.attempts.map((att) => (
                                        <div key={att._id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition group">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:rotate-6 transition">
                                                        <Clock size={24} />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-800 text-sm">{att.mocktestId?.title || "Mock Test"}</h5>
                                                        <span className="text-[10px] text-slate-400 font-black uppercase">{new Date(att.createdAt).toLocaleDateString()} at {new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-baseline justify-end gap-0.5">
                                                        <span className="text-2xl font-black text-slate-900 leading-none">{att.score}</span>
                                                        <span className="text-xs font-black text-slate-300">/ {att.mocktestId?.totalMarks || 0}</span>
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Final Result</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                                                        <CheckCircle size={12} />
                                                        <span className="text-[10px] font-black">{att.correctCount || 0} Correct</span>
                                                    </div>
                                                </div>
                                                <Link
                                                  to={`/student/review/${att._id}`}
                                                  target="_blank"
                                                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
                                                >
                                                  Review Result <ExternalLink size={12} />
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyActivityState icon={<FaClipboardList size={40} />} message="NO EXAM ATTEMPTS FOUND" />
                                )
                            )}

                            {/* PURCHASED TESTS VIEW */}
                            {activityType === 'purchased' && (
                                activityData?.purchasedTests?.length > 0 ? (
                                    activityData.purchasedTests.map((test, idx) => (
                                        <div key={idx} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <ShoppingBag size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800 text-sm">{test.title}</h5>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase">Order ID: {test.orderId}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{new Date(test.date).toLocaleDateString()}</span>
                                                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Lifetime Access</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyActivityState icon={<ShoppingBag size={40} />} message="NO TEST PURCHASES RECORDED" />
                                )
                            )}

                            {/* DOUBTS VIEW */}
                            {activityType === 'doubts' && (
                                activityData?.doubts?.length > 0 ? (
                                    activityData.doubts.map((d) => (
                                        <div key={d._id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-1 h-full bg-purple-100 group-hover:bg-purple-600 transition-all"></div>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg tracking-widest ${d.status === 'answered' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                    {d.status}
                                                </span>
                                                <span className="text-[10px] text-slate-300 font-black tracking-widest uppercase">{new Date(d.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic pr-4">" {d.text} "</p>
                                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase">Topic: {d.mocktestId?.title || "General"}</span>
                                                {d.assignedInstructor && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] text-slate-300 font-black uppercase">Expert:</span>
                                                        <span className="text-[9px] font-black text-indigo-600 uppercase">{d.assignedInstructor.firstname}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyActivityState icon={<FaQuestionCircle size={40} />} message="NO DOUBTS RAISED YET" />
                                )
                            )}
                        </div>
                    )}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={() => { setSelectedStudentForActivity(null); setActivityType(null); }} 
                        className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition shadow-sm"
                    >
                        Close Portal
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

/* Helper UI Components */
const EmptyActivityState = ({ icon, message }) => (
    <div className="py-20 text-center text-slate-300">
        <div className="mb-4 flex justify-center opacity-20">{icon}</div>
        <p className="text-[11px] font-black tracking-[0.2em]">{message}</p>
    </div>
);
const CheckCircle = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const ShoppingBag = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;

export default InstitutionStudents;
