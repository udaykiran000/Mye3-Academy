import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  BarChart4,
  Library,
  ChevronRight,
} from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  let cleaned = imagePath.trim();
  if (!cleaned.startsWith("/")) cleaned = "/" + cleaned;
  return `${api.defaults.baseURL.replace(/\/api\/?$/, "")}${cleaned}`;
};

export default function AdminQuestions() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- LOCAL STATES ---
  const [mocktest, setMocktest] = useState(null);
  const [addedQuestions, setAddedQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    questionType: "mcq",
    title: "",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correct: [], // Marks the correct index(es)
    correctManualAnswer: "",
    difficulty: "easy",
    category: "",
  });

  // --- INITIAL DATA SYNC ---
  const loadData = async () => {
    try {
      setLoading(true);
      const [testRes, qRes] = await Promise.allSettled([
        api.get(`/api/admin/mocktests/${id}`),
        api.get(`/api/admin/mocktests/${id}/questions`),
      ]);

      if (testRes.status === "fulfilled") {
        setMocktest(testRes.value.data);
        if (testRes.value.data?.subjects?.length > 0) {
          setForm((f) => ({
            ...f,
            category: testRes.value.data.subjects[0].name,
          }));
        }
      }
      if (qRes.status === "fulfilled") {
        setAddedQuestions(qRes.value.data || []);
      }
    } catch (err) {
      toast.error("Resource repository mismatch detected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  // --- LOGIC TRACKER (Limits & Status) ---
  const stats = useMemo(() => {
    const limits = {};
    mocktest?.subjects?.forEach((s) => {
      const name = (s.name || s).toString().toLowerCase();
      limits[name] =
        Number(s.easy || 0) + Number(s.medium || 0) + Number(s.hard || 0);
    });

    const counts = {};
    addedQuestions.forEach((q) => {
      const sub = (q.category || "general").toLowerCase();
      counts[sub] = (counts[sub] || 0) + 1;
    });

    return { limits, counts, totalLimit: mocktest?.totalQuestions || 0 };
  }, [addedQuestions, mocktest]);

  // --- COMMIT QUESTION TO DATABASE ---
  const onAddQuestion = async (e) => {
    e.preventDefault();

    // ✅ ENFORCEMENT: Check Overall Mocktest Question Capacity
    if (addedQuestions.length >= stats.totalLimit) {
      return toast.error(
        "ACCESS DENIED: Overall capacity for this test is already full (Limit reached).",
      );
    }

    // ✅ ENFORCEMENT: Check Individual Subject Limits
    const subKey = form.category.toLowerCase();
    const subLimit = stats.limits[subKey] || 0;
    const currentSubCount = stats.counts[subKey] || 0;
    if (subLimit > 0 && currentSubCount >= subLimit) {
      return toast.error(
        `POOL OVERFLOW: Subject limit for ${subKey.toUpperCase()} has been satisfied.`,
      );
    }

    // ✅ INTEGRITY: Verify MCQ Answers
    if (form.questionType === "mcq" && form.correct.length === 0) {
      return toast.error(
        "SELECTION REQUIRED: Mark at least one correct index path!",
      );
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("questionType", form.questionType);
    fd.append("category", form.category);
    fd.append("difficulty", form.difficulty);
    fd.append("marks", mocktest?.marksPerQuestion || 1);
    fd.append("negative", mocktest?.negativeMarking || 0);

    const qImgFile = document.getElementById("fileInputRef")?.files[0];
    if (qImgFile) fd.append("questionImage", qImgFile);

    if (form.questionType === "mcq") {
      fd.append("options", JSON.stringify(form.options));
      fd.append("correct", JSON.stringify(form.correct));
    } else {
      fd.append("correctManualAnswer", form.correctManualAnswer);
    }

    try {
      const res = await api.post(`/api/admin/mocktests/${id}/questions`, fd);
      // 🔥 HOLISTIC SYNC: Pushing actual saved record with unique ID to state immediately
      setAddedQuestions((prev) => [...prev, res.data.question || res.data]);
      toast.success("Blueprint Synced Successfully");

      // RESET COMPONENT FORM
      setForm((f) => ({
        ...f,
        title: "",
        options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
        correct: [],
        correctManualAnswer: "",
      }));
      setPreview(null);
      if (document.getElementById("fileInputRef"))
        document.getElementById("fileInputRef").value = "";
    } catch (err) {
      toast.error("Operation commit interruption.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteQuestion = async (qId) => {
    if (!window.confirm("Archive resource from question bank?")) return;
    try {
      // ✅ USING THE CORRECT 404-RESOLVED ENDPOINT
      await api.delete(`/api/admin/mocktests/questions/${qId}`);
      setAddedQuestions((prev) => prev.filter((q) => q._id !== qId));
      toast.success("Pool Updated");
    } catch (err) {
      toast.error("Action restricted by Controller sync.");
    }
  };

  const handleTogglePublish = async () => {
    try {
      const res = await api.put(`/api/admin/mocktests/${id}/publish`);
      setMocktest((prev) => ({ ...prev, isPublished: res.data.isPublished }));
      toast.success(res.data.isPublished ? "Service: LIVE" : "Service: DRAFT");
    } catch (err) {
      toast.error("State sync failed.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center animate-pulse gap-3 text-slate-300 font-bold uppercase tracking-widest text-xs">
        <Database /> INITIALIZING SYSTEM SYNC...
      </div>
    );

  return (
    <div className="bg-[#f8fafc] min-h-screen px-4 md:px-8 py-8 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-6">
        {/* HEADER CONTROL AREA */}
        <div className="bg-white border border-slate-200 px-6 py-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 border border-slate-100 rounded text-slate-400 hover:text-indigo-600 transition shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                {mocktest?.title}
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded shadow-inner">
                  DIRECTORY: {addedQuestions.length} / {stats.totalLimit} ITEMS
                </span>
              </h1>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-0.5">
                Asset Registry Integration
              </p>
            </div>
          </div>

          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2 rounded-md font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 border transition-all ${mocktest?.isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-50 shadow-md" : "bg-white text-slate-400 border-slate-200"}`}
          >
            {mocktest?.isPublished ? <Globe size={14} /> : <Lock size={14} />}
            {mocktest?.isPublished ? "COMMIT LIVE" : "DRAFT MODE"}
          </button>
        </div>

        {/* BLUEPRINT METRIC TRACKER */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {mocktest?.subjects?.map((s, idx) => {
            const key = (s.name || s).toString().toLowerCase();
            const lim = stats.limits[key] || 0;
            const cnt = stats.counts[key] || 0;
            const isFilled = cnt >= lim && lim > 0;
            return (
              <div
                key={idx}
                className={`flex-none bg-white border px-5 py-2.5 rounded-lg flex items-center gap-5 transition-colors ${isFilled ? "border-amber-200 bg-amber-50 shadow-inner" : "border-slate-100 shadow-sm"}`}
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-tighter ${isFilled ? "text-amber-600" : "text-slate-400"}`}
                >
                  {s.name || s}
                </span>
                <div
                  className={`px-3 py-1 rounded-md text-[11px] font-black ${isFilled ? "bg-amber-400 text-white" : "bg-slate-100 text-indigo-500 border border-slate-100"}`}
                >
                  {cnt} / {lim}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT: CONSTRUCTION CONSOLE ================= */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-50 opacity-60">
              <BarChart4 className="text-indigo-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 italic">
                Generate Question Architecture
              </h2>
            </div>

            <form onSubmit={onAddQuestion} className="space-y-7">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Mapping Segment",
                    key: "category",
                    options: mocktest?.subjects?.map((sub) => sub.name) || [
                      "general",
                    ],
                  },
                  {
                    label: "Intelligence Depth",
                    key: "difficulty",
                    options: ["easy", "medium", "hard"],
                  },
                  {
                    label: "Interface Format",
                    key: "questionType",
                    options: ["mcq", "manual"],
                  },
                ].map((config) => (
                  <div key={config.key} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                      {config.label}
                    </label>
                    <select
                      className="w-full bg-[#fbfcfd] border border-slate-100 rounded-md p-2.5 text-[11px] font-bold text-slate-600 outline-none uppercase tracking-wide cursor-pointer focus:ring-1 focus:ring-indigo-100"
                      value={form[config.key]}
                      onChange={(e) =>
                        setForm({ ...form, [config.key]: e.target.value })
                      }
                    >
                      {config.options?.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Base Narrative (Statement)
                </label>
                <textarea
                  className="w-full bg-[#fcfdfe] border border-slate-100 rounded-lg p-5 text-[13px] h-36 outline-none focus:border-indigo-100 font-medium placeholder:text-slate-200 leading-relaxed shadow-inner"
                  placeholder="Draft the analytical statement of the entry..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="border-2 border-dashed border-slate-50 bg-[#fafbfc]/30 p-5 rounded-lg text-center relative group hover:border-indigo-200 transition cursor-pointer">
                <ImageIcon
                  className="mx-auto text-slate-200 mb-1.5"
                  size={24}
                />
                <p className="text-[11px] font-bold text-slate-300 uppercase italic">
                  Add Logical Illustration (Visual Resource)
                </p>
                <input
                  id="fileInputRef"
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) =>
                    setPreview(URL.createObjectURL(e.target.files[0]))
                  }
                />
                {preview && (
                  <div className="mt-4 flex items-center justify-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-in slide-in-from-top-2">
                    <img
                      src={preview}
                      className="w-14 h-14 object-cover rounded shadow-sm bg-white"
                    />
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                      Asset Binding Successful
                    </p>
                  </div>
                )}
              </div>

              {/* LOGIC PATH SELECTIONS (MCQ Fix) */}
              {form.questionType === "mcq" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-5">
                  {form.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${form.correct.includes(i) ? "bg-emerald-50 border-emerald-100 shadow-sm shadow-emerald-100" : "bg-slate-50 border-slate-100"}`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span className="text-slate-400 opacity-60">
                          Logic Path: {String.fromCharCode(65 + i)}
                        </span>
                        {/* SINGLE SELECT SYNC LOGIC */}
                        <input
                          type="checkbox"
                          className="accent-emerald-600 scale-105"
                          checked={form.correct.includes(i)}
                          onChange={() =>
                            setForm({
                              ...form,
                              correct: form.correct.includes(i) ? [] : [i],
                            })
                          }
                        />
                      </div>
                      <input
                        className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-full"
                        placeholder="Specify outcome definition..."
                        value={opt.text}
                        onChange={(e) => {
                          let cp = [...form.options];
                          cp[i].text = e.target.value;
                          setForm({ ...form, options: cp });
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              {form.questionType === "manual" && (
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col gap-2">
                  <label className="text-[11px] font-black text-indigo-500 uppercase tracking-tighter italic">
                    Fixed Key Allocation
                  </label>
                  <input
                    className="w-full bg-white border-none p-3 rounded-md text-[13px] font-black text-indigo-600 shadow-sm outline-none"
                    placeholder="Target Constant: 100.5"
                    value={form.correctManualAnswer}
                    onChange={(e) =>
                      setForm({ ...form, correctManualAnswer: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-lg font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.98] ${isSubmitting ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"}`}
                >
                  {isSubmitting
                    ? "COMMIT IN PROGRESS..."
                    : "Push Index to Repository"}
                </button>
              </div>
            </form>
          </div>

          {/* ================= RIGHT: BANK DIRECTORY ================= */}
          <div className="lg:col-span-5 h-[800px] flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Library className="text-slate-400" size={18} />
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Asset Index Store
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-300">
                <Database size={12} /> DATA MODE: SYNC
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar scroll-smooth">
              {addedQuestions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-[11px] uppercase tracking-tighter text-slate-400 gap-4">
                  <Library size={32} /> System Bank Dataset: (Zero Indices)
                </div>
              ) : (
                [...addedQuestions].reverse().map((q) => (
                  <div
                    key={q?._id || Math.random()}
                    className="bg-slate-50 border border-slate-100 rounded-lg p-5 relative group hover:bg-white hover:border-indigo-100 transition shadow-sm overflow-hidden animate-in fade-in zoom-in-95"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {/* ✅ ID CRASH PROTECTION FIX: q?._id?.slice */}
                        <span className="text-[10px] font-black text-indigo-400 tracking-tight">
                          ENTRY INDEX: #{q?._id?.slice(-4) || "AS-P"}
                        </span>
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm text-white ${q.difficulty === "hard" ? "bg-rose-400" : q.difficulty === "medium" ? "bg-amber-400" : "bg-emerald-400"}`}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteQuestion(q?._id)}
                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-rose-50 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <p className="text-[13px] font-medium text-slate-700 leading-relaxed italic line-clamp-3 mb-4 tracking-tight px-1">
                      "{q.title || "Reference Title Incomplete"}"
                    </p>

                    {/* KEY & PERFORMANCE DISPLAY AREA */}
                    <div className="mt-auto border-t border-slate-100/60 pt-3 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                            {q.category || "GENMAP"}
                          </span>
                          <span className="text-[9px] font-black text-indigo-300">
                            ({q.questionType?.toUpperCase()})
                          </span>
                        </div>
                        {/* ✅ DISPLAYING THE ACTUAL CORRECT ANSWER AS REQUESTED */}
                        <div className="bg-indigo-50 border border-indigo-50 px-3 py-1 rounded shadow-inner w-fit mt-1">
                          <p className="text-[9px] font-black text-indigo-600 uppercase">
                            Correct Log:{" "}
                            {q.questionType === "mcq"
                              ? q.correct
                                  ?.map((v) => String.fromCharCode(65 + v))
                                  .join(", ")
                              : q.correctManualAnswer || "0.00"}
                          </p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded shadow-sm">
                        <CheckCircle2 size={11} strokeWidth={3} /> +
                        {q.marks || 1} POINTS
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
