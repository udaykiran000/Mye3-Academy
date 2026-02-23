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

  const [mocktest, setMocktest] = useState(null);
  const [addedQuestions, setAddedQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [entryMode, setEntryMode] = useState("manual");
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkFree, setBulkFree] = useState(false);
  const [bulkPublish, setBulkPublish] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkMarks, setBulkMarks] = useState("");
  const [bulkNegative, setBulkNegative] = useState("");

  const [form, setForm] = useState({
    questionType: "mcq",
    title: "",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correct: [],
    correctManualAnswer: "",
    difficulty: "easy",
    category: "English",
    marks: "",
    negative: "",
  });

  const parseBulkCSV = (text) => {
    const rows = text.split("\n").filter(Boolean);
    const headers = rows[0].split(",");
    return rows.slice(1).map((r) => {
      const cols = r.split(",");
      const obj = {};
      headers.forEach((h, i) => (obj[h.trim()] = cols[i]?.trim()));
      return obj;
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [testRes, qRes] = await Promise.allSettled([
        api.get(`/api/admin/mocktests/${id}`),
        api.get(`/api/admin/mocktests/${id}/questions`),
      ]);

      if (testRes.status === "fulfilled") {
        const testData = testRes.value.data;
        setMocktest(testData);
        
        setForm((f) => ({
          ...f,
          category: testData?.subjects?.length > 0 ? testData.subjects[0].name : "English",
          marks: testData?.marksPerQuestion || "",
          negative: testData?.negativeMarking || "0",
        }));
      }
      if (qRes.status === "fulfilled") {
        setAddedQuestions(qRes.value.data.questions || []);
      }
    } catch (err) {
      toast.error("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const stats = useMemo(() => {
    const limits = {};
    mocktest?.subjects?.forEach((s) => {
      const name = (s.name || "").toString().toLowerCase().trim();
      limits[name] = {
        easy: Number(s.easy || 0),
        medium: Number(s.medium || 0),
        hard: Number(s.hard || 0),
        total: Number(s.easy || 0) + Number(s.medium || 0) + Number(s.hard || 0)
      };
    });

    const counts = {};
    addedQuestions.forEach((q) => {
      const sub = (q.category || "general").toLowerCase().trim();
      const diff = (q.difficulty || "easy").toLowerCase().trim();
      
      if (!counts[sub]) counts[sub] = { easy: 0, medium: 0, hard: 0, total: 0 };
      counts[sub][diff] = (counts[sub][diff] || 0) + 1;
      counts[sub].total += 1;
    });

    return { limits, counts, totalLimit: mocktest?.totalQuestions || 0 };
  }, [addedQuestions, mocktest]);

  const handleBulkSubmit = async () => {
    if (!bulkFile) return toast.error("Select a CSV file first");
    if (!bulkMarks || Number(bulkMarks) <= 0) return toast.error("Marks per Question is required");
    if (bulkNegative === "" || bulkNegative === null) return toast.error("Negative Marking is required (enter 0 for none)");

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("file", bulkFile);
      fd.append("marks", bulkMarks);
      fd.append("negative", bulkNegative);

      await api.post(`/api/admin/mocktests/${id}/questions/bulk-upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("✅ Bulk uploaded successfully!");
      setBulkFile(null);
      setBulkRows([]);
      setBulkMarks("");
      setBulkNegative("");
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || "Bulk upload failed";
      console.log(err.response?.data);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAddQuestion = async (e) => {
    e.preventDefault();

    // MANDATORY FIELD VALIDATION (STRICT)
    if (!form.marks || Number(form.marks) <= 0) {
      return toast.error("Marks per Question is mandatory.");
    }
    if (form.negative === "" || form.negative === null) {
      return toast.error("Negative Marking is mandatory (Set 0 for none).");
    }

    if (form.questionType === "mcq") {
      if (form.correct.length === 0) return toast.error("Select at least one correct option.");
      const emptyOptions = form.options.some(opt => !opt.text.trim());
      if (emptyOptions) return toast.error("All MCQ options must have text.");
    }

    if (form.questionType === "manual" && !form.correctManualAnswer.trim()) {
      return toast.error("Correct answer is mandatory for manual entry.");
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("questionType", form.questionType);
    fd.append("category", form.category);
    fd.append("difficulty", form.difficulty);
    fd.append("marks", form.marks);
    fd.append("negative", form.negative);

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
      setAddedQuestions((prev) => [...prev, res.data.question]);
      toast.success("Question saved");

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
      const msg = err.response?.data?.message || "Failed to save.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteQuestion = async (qId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/api/admin/mocktests/questions/${qId}`);

      // ✅ FIX: Use a more robust filter and ensure it matches 'id' or '_id'
      setAddedQuestions((prev) => prev.filter((q) => (q.id || q._id) !== qId));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleTogglePublish = async () => {
    try {
      const res = await api.put(`/api/admin/mocktests/${id}/publish`);
      // Update local state: Correcting path to mocktest.isPublished
      setMocktest((prev) => ({ ...prev, isPublished: res.data.mocktest.isPublished }));
      toast.success(res.data.mocktest.isPublished ? "Published Successfully" : "Moved to Draft");
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed";
      toast.error(msg);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center gap-3 text-slate-900 font-bold uppercase tracking-widest text-sm">
        <Database /> Loading...
      </div>
    );

  return (
    <div className="bg-[#f8fafc] min-h-screen px-4 md:px-8 py-8 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white border border-slate-200 px-6 py-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/admin/mocktests/${mocktest?.categorySlug || mocktest?.category?.slug}?type=${mocktest?.isGrandTest ? 'grand' : 'mock'}`)}
              className="p-2 border border-slate-200 rounded text-slate-00 hover:text-indigo-600 transition shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <h1 className="text-xl font-extrabold text-slate-700 uppercase tracking-tight">
                {mocktest?.title}
              </h1>
              <p className="text-xs font-bold text-slate-700 uppercase mt-1">
                Question Management
              </p>
            </div>
          </div>

          <button
            onClick={handleTogglePublish}
            className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 border transition-all shadow-sm active:scale-95 ${
              mocktest?.isPublished
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                : "bg-slate-900 text-white border-slate-900 hover:bg-black"
            }`}
          >
            {mocktest?.isPublished ? (
              <>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Status: Live (Unpublish)
              </>
            ) : (
              <>
                <Lock size={14} />
                Status: Draft (Publish Test)
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <BarChart4 className="text-indigo-500" size={18} />
              <h2 className="text-sm font-extrabold uppercase text-slate-700">
                Question Builder
              </h2>
            </div>

            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={() => setEntryMode("manual")}
                className={`px-4 py-2 rounded font-bold ${
                  entryMode === "manual"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border"
                }`}
              >
                Manual Entry
              </button>

              <button
                type="button"
                onClick={() => setEntryMode("bulk")}
                className={`px-4 py-2 rounded font-bold ${
                  entryMode === "bulk"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border"
                }`}
              >
                Bulk CSV Upload
              </button>
            </div>

            {entryMode === "manual" && (
              <form onSubmit={onAddQuestion} className="space-y-7">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    {
                      label: "Subject",
                      key: "category",
                      options:
                        mocktest?.subjects?.length > 0
                          ? mocktest.subjects.map((sub) => sub.name)
                          : [
                              "English",
                              "Mathematics",
                              "Physics",
                              "Chemistry",
                              "General Science",
                              "Others",
                            ],
                    },
                    {
                      label: "Difficulty",
                      key: "difficulty",
                      options: ["easy", "medium", "hard"],
                    },
                    {
                      label: "Type",
                      key: "questionType",
                      options: ["mcq", "manual"],
                    },
                  ].map((config) => (
                    <div key={config.key} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">
                        {config.label}
                      </label>

                      <select
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-50"
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

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">
                      Marks <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g 1"
                      className={`no-spinner w-full bg-white border rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-2 ring-indigo-50 ${(!form.marks || Number(form.marks) <= 0) ? "border-rose-300 bg-rose-50/5" : "border-slate-300"}`}
                      value={form.marks}
                      onChange={(e) => setForm({ ...form, marks: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">
                      Neg <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      placeholder="e.g 0.25"
                      className={`no-spinner w-full bg-white border rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-2 ring-indigo-50 ${(form.negative === "" || form.negative === null) ? "border-rose-300 bg-rose-50/5" : "border-slate-300"}`}
                      value={form.negative}
                      onChange={(e) => setForm({ ...form, negative: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Question Text
                  </label>
                  <textarea
                    className="w-full bg-white border border-slate-300 rounded-lg p-4 text-sm h-36 outline-none font-bold text-slate-900 placeholder:text-slate-400"
                    placeholder="Enter question..."
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="border-2 border-dashed border-indigo-300 bg-indigo-50 p-5 rounded-lg text-center relative">
                  <ImageIcon
                    className="mx-auto text-indigo-400 mb-2"
                    size={24}
                  />
                  <p className="text-sm font-bold text-indigo-600">
                    Upload Image (Optional)
                  </p>
                  <input
                    id="fileInputRef"
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) =>
                      setPreview(URL.createObjectURL(e.target.files[0]))
                    }
                  />
                </div>

                {form.questionType === "mcq" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {form.options.map((opt, i) => (
                      <div key={i} className="p-4 rounded border bg-slate-50">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">
                            Answer Option {String.fromCharCode(65 + i)}
                          </span>
                          <input
                            type="checkbox"
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
                          className="w-full border border-slate-300 p-2 rounded font-bold text-slate-700"
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
                  <input
                    className="w-full border border-slate-300 p-3 rounded font-bold text-slate-700"
                    placeholder="Correct Answer"
                    value={form.correctManualAnswer}
                    onChange={(e) =>
                      setForm({ ...form, correctManualAnswer: e.target.value })
                    }
                  />
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded font-extrabold text-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Question"}
                </button>
              </form>
            )}

            {entryMode === "bulk" && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">

                {/* FILE CHOOSER */}
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wide block mb-2">CSV File</label>
                  {bulkFile ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-emerald-700 flex-1 truncate">{bulkFile.name}</span>
                      <span className="text-[10px] font-black text-emerald-500">{bulkRows.length} rows</span>
                      <button
                        onClick={() => { setBulkFile(null); setBulkRows([]); }}
                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition-all"
                        title="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                      <Database size={24} className="text-slate-300 mb-2" />
                      <span className="text-xs font-bold text-slate-500">Click to choose CSV file</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">.csv files only</span>
                      <input
                        type="file"
                        name="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (!f) return;
                          setBulkFile(f);
                          const reader = new FileReader();
                          reader.onload = (ev) => setBulkRows(parseBulkCSV(ev.target.result));
                          reader.readAsText(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* MARKS & NEGATIVE — MANDATORY */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wide block mb-1">
                      Marks / Question <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      placeholder="e.g. 1"
                      value={bulkMarks}
                      onChange={(e) => setBulkMarks(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-2 ring-indigo-50 ${
                        !bulkMarks ? "border-rose-300 bg-rose-50/20" : "border-slate-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wide block mb-1">
                      Negative Marking <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="0 for none"
                      value={bulkNegative}
                      onChange={(e) => setBulkNegative(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-2 ring-indigo-50 ${
                        bulkNegative === "" ? "border-rose-300 bg-rose-50/20" : "border-slate-300"
                      }`}
                    />
                  </div>
                </div>

                {/* CSV FORMAT HINT */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected CSV columns</p>
                  <p className="text-[10px] font-mono text-slate-500">question, subject, level, questiontype, optiona_text, optionb_text, optionc_text, optiond_text, correctindex</p>
                </div>

                {/* UPLOAD BUTTON */}
                <button
                  onClick={handleBulkSubmit}
                  disabled={isSubmitting || !bulkFile}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-extrabold text-sm transition-all"
                >
                  {isSubmitting ? "Uploading..." : `Upload ${bulkRows.length > 0 ? `(${bulkRows.length} questions)` : "CSV"}`}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: QUESTION LIST & PREVIEW */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Library className="text-indigo-600" size={20} />
                  <h3 className="text-sm font-black text-slateate-800 uppercase tracking-tight">
                    Review Questions ({addedQuestions.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {addedQuestions.length > 0 && (
                    <>
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                        {mocktest?.totalQuestions ? `${addedQuestions.length} / ${mocktest.totalQuestions}` : addedQuestions.length}
                      </span>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete ALL ${addedQuestions.length} questions? This cannot be undone.`)) return;
                          try {
                            await api.delete(`/api/admin/mocktests/${id}/questions/all`);
                            setAddedQuestions([]);
                            setPreview(null);
                            toast.success(`🗑️ All questions cleared`);
                          } catch (err) {
                            toast.error(err.response?.data?.message || "Failed to clear questions");
                          }
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                        title="Delete all questions"
                      >
                        <Trash2 size={11} /> Clear All
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                {addedQuestions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mx-1">
                     <Database className="text-slate-300 mb-3" size={32} />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">No Questions Added Yet</p>
                  </div>
                ) : (
                  addedQuestions.map((q, idx) => (
                    <div 
                      key={q.id || q._id} 
                      onClick={() => setPreview(q)}
                      className={`group relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
                        (preview?._id === (q.id || q._id) || preview?.id === (q.id || q._id))
                          ? "bg-indigo-50 border-indigo-400 shadow-md ring-4 ring-indigo-50"
                          : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 space-y-2">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-indigo-600 w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                                {idx + 1}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                                {q.category} • {q.difficulty}
                              </span>
                           </div>
                           <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                             {q.title}
                           </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(q.id || q._id);
                          }}
                          className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ACTIVE QUESTION PREVIEW OVERLAY / BOX */}
              {preview && (
                 <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-5 border-b border-slate-100 bg-slate-900 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-emerald-400" size={18} />
                          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">
                            Live Detail Preview
                          </h4>
                       </div>
                       <button 
                         onClick={() => setPreview(null)}
                         className="text-[10px] font-black text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all"
                       >
                         CLOSE
                       </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                       <div className="space-y-3">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Question Text</span>
                          <div className="text-sm font-bold text-slate-800 leading-loose bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                             {preview.title}
                          </div>
                       </div>

                       {preview.questionType === 'mcq' && (
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Options Breakdown</span>
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">CORRECT ANSWER INDICATED</span>
                             </div>
                             <div className="grid gap-3">
                                {preview.options?.map((opt, i) => {
                                   const isCorrect = Array.isArray(preview.correct) && preview.correct.includes(i);
                                   return (
                                      <div 
                                        key={i} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-xs font-bold transition-all ${
                                          isCorrect 
                                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-md ring-4 ring-emerald-50" 
                                            : "bg-white border-slate-100 text-slate-500"
                                        }`}
                                      >
                                         <div className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 text-[10px] font-black transition-all ${
                                           isCorrect ? "bg-emerald-500 text-white border-emerald-500 rotate-12" : "bg-slate-50 text-slate-400 border-slate-200"
                                         }`}>
                                           {String.fromCharCode(65 + i)}
                                         </div>
                                         <span className="flex-1 leading-relaxed">{opt.text}</span>
                                         {isCorrect && (
                                           <div className="bg-emerald-600 text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                             <CheckCircle2 size={10} />
                                             CORRECT
                                           </div>
                                         )}
                                      </div>
                                   );
                                })}
                             </div>
                          </div>
                       )}

                       {preview.questionType === 'manual' && (
                          <div className="space-y-3">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expected Answer</span>
                             <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl shadow-sm">
                                <p className="text-xs font-black text-emerald-800 text-center tracking-wide">{preview.correctManualAnswer}</p>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
