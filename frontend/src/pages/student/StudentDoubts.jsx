// frontend/src/pages/student/StudentDoubts.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentDoubts, createStudentDoubt } from "../../redux/doubtSlice";
import { getSocket } from "../../socket";
import { MessageCircle, Plus, Filter, CheckCircle, Clock, Loader2, X, Send } from "lucide-react";
import toast from "react-hot-toast";

const StudentDoubts = () => {
  const dispatch = useDispatch();
  const { myDoubts, myStatus } = useSelector((state) => state.doubts);
  
  // Local State
  const [filter, setFilter] = useState("all"); // 'all', 'answered', 'pending'
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [subject, setSubject] = useState("");
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Fetch
  useEffect(() => {
    dispatch(fetchStudentDoubts());
  }, [dispatch]);

  // 2. Socket Listener for Live Updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (data) => {
      toast.success("An instructor answered your doubt!", { duration: 4000 });
      dispatch(fetchStudentDoubts());
    };

    socket.on("doubtAnswered", handler);
    return () => socket.off("doubtAnswered", handler);
  }, [dispatch]);

  // 3. Handle General Doubt Submission
  const handleSubmitGeneralDoubt = async (e) => {
    e.preventDefault();
    if (!subject || !query) return toast.error("Please fill all fields");

    setIsSubmitting(true);
    const result = await dispatch(createStudentDoubt({
      type: "general",
      subject: subject,
      text: query
    }));
    setIsSubmitting(false);

    if (createStudentDoubt.fulfilled.match(result)) {
      setIsModalOpen(false);
      setSubject("");
      setQuery("");
    }
  };

  // Filter Logic
  const filteredDoubts = myDoubts.filter(d => {
    if (filter === "answered") return d.status === "answered";
    if (filter === "pending") return d.status !== "answered";
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="text-blue-600" /> My Doubts & Queries
          </h1>
          <p className="text-gray-500 text-sm mt-1">Ask questions about tests or general subjects.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-transform transform hover:scale-105"
        >
          <Plus size={18} /> Ask New Doubt
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'answered'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
              ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {myStatus === "loading" ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600 w-8 h-8"/></div>
      ) : filteredDoubts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No doubts found in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((doubt) => (
            <div key={doubt._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start gap-4">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded border border-blue-100 uppercase tracking-wide">
                    {doubt.subject}
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full border
                    ${doubt.status === 'answered' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}
                  `}>
                    {doubt.status === 'answered' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                    {doubt.status}
                  </span>
                </div>
                
                <h3 className="mt-3 text-gray-800 font-semibold text-lg leading-relaxed">{doubt.text}</h3>
                
                {doubt.mocktestId && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    Reference: {doubt.mocktestId.title || "Mock Test Question"}
                  </p>
                )}
              </div>

              {/* Answer Section */}
              {doubt.answer && (
                <div className="bg-green-50/50 border-t border-green-100 p-5">
                  <div className="flex gap-3">
                    <div className="min-w-[24px] h-6 rounded-full bg-green-200 flex items-center justify-center text-green-700">
                      <MessageCircle size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-800 uppercase mb-1">Instructor Answer</p>
                      <p className="text-gray-800 text-sm leading-relaxed">{doubt.answer}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(doubt.answeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- ASK GENERAL DOUBT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-bold text-gray-800 mb-4">Ask a General Doubt</h2>
            
            <form onSubmit={handleSubmitGeneralDoubt} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="">Select Subject</option>
                  <option value="mathematics">Maths</option>
                  <option value="physics">English</option>
                  <option value="chemistry">Reasoning</option>
                  <option value="biology">Aptitute</option>
                  <option value="general">General / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Question</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Type your question clearly..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDoubts;