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

  const [form, setForm] = useState({
    questionType: "mcq",
    title: "",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correct: [],
    correctManualAnswer: "",
    difficulty: "easy",
    category: "",
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

  const handleBulkSubmit = async () => {
    if (!bulkFile) return toast.error("Select CSV file");

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("file", bulkFile);
      fd.append("isFree", bulkFree);
      fd.append("publish", bulkPublish);

      await api.post(`/api/admin/mocktests/${id}/questions/bulk-upload`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Bulk uploaded successfully");

      setBulkFile(null);
      setBulkRows([]);
      loadData();
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Bulk upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAddQuestion = async (e) => {
    e.preventDefault();

    if (addedQuestions.length >= stats.totalLimit) {
      return toast.error("Question limit reached.");
    }

    const subKey = form.category.toLowerCase();
    const subLimit = stats.limits[subKey] || 0;
    const currentSubCount = stats.counts[subKey] || 0;
    if (subLimit > 0 && currentSubCount >= subLimit) {
      return toast.error(`Subject limit reached.`);
    }

    if (form.questionType === "mcq" && form.correct.length === 0) {
      return toast.error("Select at least one correct option.");
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
      setAddedQuestions((prev) => [...prev, res.data.question || res.data]);
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
      toast.error("Failed to save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteQuestion = async (qId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/api/admin/mocktests/questions/${qId}`);
      setAddedQuestions((prev) => prev.filter((q) => q._id !== qId));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleTogglePublish = async () => {
    try {
      const res = await api.put(`/api/admin/mocktests/${id}/publish`);
      setMocktest((prev) => ({ ...prev, isPublished: res.data.isPublished }));
      toast.success(res.data.isPublished ? "Published" : "Draft");
    } catch (err) {
      toast.error("Update failed");
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
              onClick={() => navigate(-1)}
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
            className={`px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
              mocktest?.isPublished
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            {mocktest?.isPublished ? <Globe size={14} /> : <Lock size={14} />}
            {mocktest?.isPublished ? "LIVE" : "DRAFT"}
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Language / Subject",
                      key: "category",
                      options: mocktest?.subjects?.map((sub) => sub.name) || [
                        "general",
                      ],
                    },
                    {
                      label: "Difficulty Level",
                      key: "difficulty",
                      options: ["easy", "medium", "hard"],
                    },
                    {
                      label: "Question Type",
                      key: "questionType",
                      options: ["mcq", "manual"],
                    },
                  ].map((config) => (
                    <div key={config.key} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        {config.label}
                      </label>

                      <select
                        className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-sm font-bold text-slate-700 outline-none"
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
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <input
                  type="file"
                  name="file"
                  accept=".csv"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    setBulkFile(f);
                    const reader = new FileReader();
                    reader.onload = (ev) =>
                      setBulkRows(parseBulkCSV(ev.target.result));
                    reader.readAsText(f);
                  }}
                />

                {bulkRows.length > 0 && (
                  <p className="font-bold">Rows Loaded: {bulkRows.length}</p>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setBulkFree(!bulkFree)}
                    className={`px-4 py-2 rounded font-bold ${
                      bulkFree ? "bg-emerald-500 text-white" : "bg-slate-100"
                    }`}
                  >
                    {bulkFree ? "FREE" : "PAID"}
                  </button>

                  <button
                    onClick={() => setBulkPublish(!bulkPublish)}
                    className={`px-4 py-2 rounded font-bold ${
                      bulkPublish ? "bg-indigo-600 text-white" : "bg-slate-100"
                    }`}
                  >
                    {bulkPublish ? "PUBLISH" : "DRAFT"}
                  </button>
                </div>

                <button
                  onClick={handleBulkSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-3 rounded font-extrabold"
                >
                  Upload CSV
                </button>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-extrabold text-slate-700 mb-4">
              Question Preview
            </h3>

            {addedQuestions.length === 0 ? (
              <p className="text-sm font-bold text-slate-700">
                No Questions Added
              </p>
            ) : (
              addedQuestions.map((q) => (
                <div key={q._id} className="border p-4 rounded mb-3">
                  <div className="flex justify-between">
                    <p className="font-bold text-slate-700">{q.title}</p>
                    <button onClick={() => deleteQuestion(q._id)}>
                      <Trash2 size={14} className="text-rose-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
