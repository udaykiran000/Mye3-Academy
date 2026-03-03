import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link, useLocation } from "react-router-dom";
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
  ChevronUp,
  ChevronDown,
  Settings,
  Layout,
  Clock,
  Zap,
  Calculator,
  AlertCircle,
  FileText,
  Upload,
  Trophy,
  Save,
  Target,
  Maximize2
} from "lucide-react";
import api from "../../../api/axios";
import toast from "react-hot-toast";
import { getImageUrl } from "../../../utils/imageHelper";

export default function AdminQuestions() {
  const { category: categorySlug, id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type"); // "mock" or "grand"

  const location = useLocation();
  const isEditMode = Boolean(id);
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes("/questions")) return "builder";
    return "settings";
  });

  // --- TEST CONFIG STORAGE ---
  const [testData, setTestData] = useState(null);
  const [configForm, setConfigForm] = useState({
    subcategory: "",
    title: "",
    description: "",
    durationMinutes: "",
    totalQuestions: "",
    marksPerQuestion: "",
    negativeMarking: "",
    price: "",
  });
  const [isFree, setIsFree] = useState(true);
  const [isGrandTest, setIsGrandTest] = useState(typeParam === "grand");
  const [testSubjects, setTestSubjects] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [categoryObj, setCategoryObj] = useState(null);

  // --- QUESTION BUILDER STORAGE ---
  const [addedQuestions, setAddedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [entryMode, setEntryMode] = useState("manual");

  // Bulk states
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkRows, setBulkRows] = useState([]);
  const _stickyInit = (() => { if (!id) return {}; try { return JSON.parse(localStorage.getItem(`qDefaults_${id}`) || "{}"); } catch { return {}; } })();
  const [bulkMarks, setBulkMarks] = useState(_stickyInit.marks || "");
  const [bulkNegative, setBulkNegative] = useState(_stickyInit.negative !== undefined ? _stickyInit.negative : "");

  const [qPage, setQPage] = useState(1);

  const Q_PER_PAGE = 12;

  // --- LOCALSTORAGE HELPERS (sticky defaults per test) ---
  const lsKey = id ? `qDefaults_${id}` : null;
  const loadSticky = () => {
    if (!lsKey) return {};
    try { return JSON.parse(localStorage.getItem(lsKey) || "{}"); } catch { return {}; }
  };
  const saveSticky = (patch) => {
    if (!lsKey) return;
    const current = loadSticky();
    localStorage.setItem(lsKey, JSON.stringify({ ...current, ...patch }));
  };

  // Question Form — initialise with localStorage values if present
  const _sticky = loadSticky();
  const [qForm, setQForm] = useState({
    questionType: "mcq",
    title: "",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correct: [],
    correctManualAnswer: "",
    difficulty: _sticky.difficulty || "easy",
    category: _sticky.category || "",
    marks: _sticky.marks || "",
    negative: _sticky.negative !== undefined ? _sticky.negative : "",
  });

  // --- INITIAL LOAD ---
  const loadData = async () => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [testRes, qRes] = await Promise.allSettled([
        api.get(`/api/admin/mocktests/${id}`),
        api.get(`/api/admin/mocktests/${id}/questions`),
      ]);

      if (testRes.status === "fulfilled") {
        const raw = testRes.value.data.mocktest || testRes.value.data;
        setTestData(raw);
        setIsGrandTest(raw.isGrandTest);
        setIsFree(raw.isFree);
        setIsPublished(raw.isPublished);

        const mPerQ = raw.marksPerQuestion?.toString() || (raw.totalQuestions > 0 ? (raw.totalMarks / raw.totalQuestions).toFixed(1).replace(/\.0$/, '') : "1");

        setConfigForm({
          subcategory: raw.subcategory || "",
          title: raw.title || "",
          description: raw.description || "",
          durationMinutes: raw.durationMinutes?.toString() || "",
          totalQuestions: raw.totalQuestions?.toString() || "",
          marksPerQuestion: mPerQ,
          negativeMarking: raw.negativeMarking?.toString() || "0",
          price: raw.price?.toString() || "",
        });

        if (raw.thumbnail) setThumbnailPreview(getImageUrl(raw.thumbnail));
        if (raw.subjects) {
          setTestSubjects(raw.subjects.map(s => ({ name: s.name, limit: (s.easy || 0).toString() })));
        }

        // Restore user's own saved sticky defaults (if any)
        const savedDefaults = (() => { try { return JSON.parse(localStorage.getItem(`qDefaults_${id}`) || "{}"); } catch { return {}; } })();

        setQForm(prev => ({
          ...prev,
          category: raw.subcategory || savedDefaults.category || "",
          marks: raw.marksPerQuestion?.toString() || savedDefaults.marks?.toString() || "1",
          negative: raw.negativeMarking?.toString() || savedDefaults.negative?.toString() || "0",
          difficulty: savedDefaults.difficulty || "easy",
        }));

        // ONLY use sticky duration if database value is null or zero
        if ((!raw.durationMinutes || Number(raw.durationMinutes) <= 0) && savedDefaults.duration) {
          setConfigForm(prev => ({ ...prev, durationMinutes: savedDefaults.duration.toString() }));
        }

        setBulkMarks(raw.marksPerQuestion?.toString() || savedDefaults.marks?.toString() || "1");
        setBulkNegative(raw.negativeMarking?.toString() || savedDefaults.negative?.toString() || "0");

      }

      if (qRes.status === "fulfilled") {
        setAddedQuestions(qRes.value.data.questions || []);
      }

      // Fetch category image
      try {
        const catRes = await api.get("/api/public/categories");
        const matched = catRes.data.categories.find(c => c.slug === categorySlug);
        setCategoryObj(matched);
      } catch (catErr) {
        console.error("Failed to fetch category image", catErr);
      }
    } catch (err) {
      toast.error("Failed to load test data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, isEditMode]);

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname.includes("/questions") || location.pathname.includes("/edit/")) {
      setActiveTab("builder");
    } else {
      setActiveTab("settings");
    }
  }, [location.pathname]);

  // --- DERIVED STATS ---
  const totalMarks = (Number(configForm.totalQuestions) || 0) * (Number(configForm.marksPerQuestion) || 0);
  const totalAssignedQs = testSubjects.reduce((sum, s) => sum + (Number(s.limit) || 0), 0);

  // --- HANDLERS: TEST SETTINGS ---
  const handleSaveSettings = async (e, fromHeader = false) => {
    if (e) e.preventDefault();
    if (!configForm.title.trim()) return toast.error("Exam Title is missing.");
    if (!configForm.subcategory.trim()) return toast.error("Sub-Category is missing.");
    // Allow header save to skip thumbnail if it's already there or we just want to update stats
    if (!fromHeader && !thumbnail && !thumbnailPreview) return toast.error("Exam Thumbnail is required.");


    setIsSubmitting(true);
    const fd = new FormData();
    Object.keys(configForm).forEach(key => fd.append(key, configForm[key]));
    fd.append("totalMarks", totalMarks);
    fd.append("isFree", isFree);
    fd.append("isGrandTest", isGrandTest);
    fd.append("category", isEditMode ? (testData?.category?._id || categorySlug) : categorySlug);
    fd.append("subjects", JSON.stringify(testSubjects.map(s => ({ name: s.name, easy: Number(s.limit) || 0, medium: 0, hard: 0 }))));
    if (thumbnail) fd.append("thumbnail", thumbnail);

    try {
      if (isEditMode) {
        await api.put(`/api/admin/mocktests/${id}`, fd);
        toast.success("Settings Updated");
        loadData();
        setActiveTab("builder");
      } else {
        const res = await api.post("/api/admin/mocktests", fd);
        toast.success("Exam Registered Successfully!");
        navigate(`/admin/mocktests/${res.data.mocktest._id}/questions`, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save exam details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!id) return;
    try {
      const res = await api.put(`/api/admin/mocktests/${id}/publish`);
      setIsPublished(res.data.mocktest.isPublished);
      toast.success(res.data.mocktest.isPublished ? "Test is now LIVE" : "Moved to Draft");
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
    }
  };

  // --- HANDLERS: QUESTION BUILDER ---
  const onAddQuestion = async (e) => {
    e.preventDefault();
    if (!configForm.durationMinutes) return toast.error("Duration (minutes) is required.");
    if (!qForm.category.trim()) return toast.error("Subject is required.");
    if (!qForm.marks) return toast.error("Marks per question is required.");
    if (qForm.negative === "" || qForm.negative === undefined) return toast.error("Neg Marking is required.");
    if (!qForm.title.trim()) return toast.error("Question Text is missing.");
    if (qForm.questionType === "mcq" && qForm.correct.length === 0) return toast.error("Please select a Correct Option.");

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("title", qForm.title);
    fd.append("questionType", qForm.questionType);
    fd.append("category", qForm.category);
    fd.append("difficulty", qForm.difficulty);
    fd.append("marks", qForm.marks);
    fd.append("negative", qForm.negative);
    if (configForm.durationMinutes) fd.append("durationMinutes", configForm.durationMinutes);

    const qImgFile = document.getElementById("qFileInput")?.files[0];
    if (qImgFile) fd.append("questionImage", qImgFile);

    if (qForm.questionType === "mcq") {
      fd.append("options", JSON.stringify(qForm.options));
      fd.append("correct", JSON.stringify(qForm.correct));
    } else {
      fd.append("correctManualAnswer", qForm.correctManualAnswer);
    }

    try {
      const res = await api.post(`/api/admin/mocktests/${id}/questions`, fd);
      setAddedQuestions(prev => [...prev, res.data.question]);
      toast.success("Question Added to Bank");
      // Only reset transient fields — keep sticky defaults (category, marks, negative, difficulty)
      setQForm(f => ({ ...f, title: "", options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }], correct: [], correctManualAnswer: "" }));
      setThumbnailPreview(null);
      setQPage(1);
      if (document.getElementById("qFileInput")) document.getElementById("qFileInput").value = "";
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteQuestion = async (qId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/api/admin/mocktests/questions/${qId}`);
      setAddedQuestions(prev => prev.filter(q => (q.id || q._id) !== qId));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const parseBulkCSV = (text) => {
    const rows = text.split("\n").filter(Boolean);
    const headers = rows[0].split(",");
    return rows.slice(1).map(r => {
      const cols = r.split(",");
      const obj = {};
      headers.forEach((h, i) => (obj[h.trim()] = cols[i]?.trim()));
      return obj;
    });
  };

  const handleBulkSubmit = async () => {
    if (!configForm.durationMinutes) return toast.error("Duration (minutes) is required.");
    if (!qForm.category.trim()) return toast.error("Subject is required.");
    if (!bulkFile) return toast.error("Please choose a CSV file.");
    if (!bulkMarks) return toast.error("Marks per question is required.");
    if (bulkNegative === "") return toast.error("Neg Marking is required.");
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", bulkFile);
      fd.append("marks", bulkMarks);
      fd.append("negative", bulkNegative);
      if (configForm.durationMinutes) fd.append("durationMinutes", configForm.durationMinutes);
      await api.post(`/api/admin/mocktests/${id}/questions/bulk-upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Bulk Upload Complete");
      setBulkFile(null);
      setBulkRows([]);
      setQPage(1);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#EDF0FF] flex items-center justify-center font-poppins text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
      Preparing Exam Manager...
    </div>
  );

  const inputClass = "w-full bg-white border px-4 py-3 text-sm font-bold text-[#3e4954] outline-none focus:border-[#21b731] transition-all font-poppins placeholder:text-slate-300 placeholder:font-normal";
  const getRequiredClass = (val) => !val ? "border-red-500" : "border-slate-200";
  const labelClass = "text-[9px] font-black text-[#7e7e7e] uppercase tracking-[0.2em] mb-2 block font-poppins";

  return (
    <div className="bg-[#EDF0FF] min-h-screen pt-4 lg:pt-6 px-4 pb-4 font-poppins">
      <div className="max-w-[1500px] mx-auto space-y-6">

        {/* HEADER SECTION */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest">
            <Link to="/admin" className="hover:text-[#21b731] transition-colors">Home</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <Link to="/admin/categories" className="hover:text-[#21b731] transition-colors">Categories</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <Link to={`/admin/mocktests/${categorySlug}`} className="hover:text-[#21b731] transition-colors">{categorySlug}</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-[#21b731]">{isEditMode ? "Mock Test" : "New"}</span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 flex items-center justify-center border ${isGrandTest ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-[#21b731]/5 border-[#21b731]/10 text-[#21b731]'}`}>
                {categoryObj?.image ? (
                  <img src={getImageUrl(categoryObj.image)} alt={categoryObj.name} className="w-7 h-7 object-contain" />
                ) : (
                  isGrandTest ? <Trophy size={20} /> : <Layout size={20} />
                )}
              </div>
              <div>
                <h1 className="text-xl font-black text-[#3e4954] uppercase tracking-tighter leading-none mb-1">
                  {isEditMode ? configForm.title : `Create ${isGrandTest ? "Grand" : "Mock"} Test`}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <p className="text-[#7e7e7e] text-[9px] font-black uppercase tracking-[0.2em]">{categorySlug}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isGrandTest ? 'bg-amber-500' : 'bg-[#21b731]'}`} />
                    <p className="text-[#7e7e7e] text-[9px] font-black uppercase tracking-[0.2em]">{isGrandTest ? "Grand Test" : "Mock Test"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditMode && (
                <button
                  onClick={handleTogglePublish}
                  className={`px-4 py-2 border font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isPublished
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                    : "bg-[#3e4954] text-white border-[#3e4954] hover:bg-black"
                    }`}
                >
                  {isPublished ? <Globe size={13} /> : <Lock size={13} />}
                  {isPublished ? "Online" : "Draft"}
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-slate-200 bg-white text-[9px] font-black uppercase tracking-[0.2em] text-[#7e7e7e] hover:border-slate-800 hover:text-slate-800 transition-all"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {/* ARCHITECTURAL TABS */}
        <div className="flex items-center border-b border-slate-200 mt-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all relative ${activeTab === 'settings' ? 'text-[#3e4954]' : 'text-[#7e7e7e] hover:text-[#3e4954]'}`}
          >
            <Settings size={13} /> Mock test
            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#21b731]" />}
          </button>
          <button
            disabled={!isEditMode}
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all relative ${!isEditMode ? 'opacity-30 cursor-not-allowed' : (activeTab === 'builder' ? 'text-[#3e4954]' : 'text-[#7e7e7e] hover:text-[#3e4954]')}`}
          >
            <Library size={13} /> Add questions {isEditMode && <span className="ml-1 opacity-40">[{addedQuestions.length}]</span>}
            {activeTab === 'builder' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#21b731]" />}
          </button>
        </div>

        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="max-w-2xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2">
            <div className="bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)] relative overflow-hidden">
              <div className={`h-1 w-full ${isGrandTest ? 'bg-amber-500' : 'bg-[#21b731]'}`} />

              <div className="p-4 space-y-4">
                {/* IDENTITY SECTION */}
                <div className="space-y-3">
                  <div className="border-b border-slate-50 pb-2">
                    <h2 className="text-[11px] font-black text-[#3e4954] uppercase tracking-[0.2em]">create or edit mock test</h2>
                  </div>

                  {/* THUMBNAIL UPLOAD */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className={`w-40 h-24 border-2 border-dashed flex items-center justify-center overflow-hidden group transition-all ${thumbnailPreview ? 'border-slate-200 bg-slate-50 hover:border-indigo-400' : 'border-red-400 bg-red-50 hover:border-red-500'}`}>
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} className="w-full h-full object-cover" />
                      ) : categoryObj?.image ? (
                        <img src={getImageUrl(categoryObj.image)} className="w-full h-full object-cover opacity-50" />
                      ) : (
                        <ImageIcon size={24} className="text-slate-300 group-hover:text-indigo-400" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                      <label className={labelClass}>Exam Thumbnail <span className="text-red-500">*</span></label>
                      <input
                        type="file"
                        accept="image/*"
                        id="thumbUpload"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files[0];
                          if (f) {
                            setThumbnail(f);
                            setThumbnailPreview(URL.createObjectURL(f));
                          }
                        }}
                      />
                      <label
                        htmlFor="thumbUpload"
                        className="px-6 py-2 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-600 hover:text-indigo-600 cursor-pointer transition-all text-center"
                      >
                        Upload Thumbnail
                      </label>
                      <p className="text-[8px] font-bold tracking-tighter">
                        {!thumbnailPreview
                          ? <span className="text-red-500">Required — please upload an image</span>
                          : <span className="text-slate-400">* Recommended size: 400x240</span>
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Exam Name *</label>
                      <input className={`${inputClass} ${getRequiredClass(configForm.title)}`} value={configForm.title} onChange={e => setConfigForm({ ...configForm, title: e.target.value })} placeholder="e.g. SSC CGL Mock 01" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Exam Category *</label>
                      <input className={`${inputClass} ${getRequiredClass(configForm.subcategory)}`} value={configForm.subcategory} onChange={e => setConfigForm({ ...configForm, subcategory: e.target.value })} placeholder="e.g. SSC CHSL / GD" />
                    </div>
                  </div>
                </div>

                {/* PRICING SECTION */}
                <div className="space-y-4">
                  <div className="border-b border-slate-50 pb-2">
                    <h2 className="text-[11px] font-black text-[#3e4954] uppercase tracking-[0.2em]">Price & Enrollment</h2>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200">
                        <button type="button" onClick={() => setIsFree(false)} className={`py-3 text-[9px] font-black uppercase tracking-widest transition-all ${!isFree ? 'bg-[#3e4954] text-white shadow-lg' : 'text-[#7e7e7e] hover:text-[#3e4954]'}`}>Paid</button>
                        <button type="button" onClick={() => setIsFree(true)} className={`py-3 text-[9px] font-black uppercase tracking-widest transition-all ${isFree ? 'bg-[#21b731] text-white shadow-lg' : 'text-[#7e7e7e] hover:text-[#3e4954]'}`}>Free</button>
                      </div>
                      {!isFree && (
                        <div className="space-y-2 animate-in zoom-in-95 duration-300">
                          <label className={labelClass}>Enrollment Fee (₹)</label>
                          <input type="number" className={inputClass} value={configForm.price} onChange={e => setConfigForm({ ...configForm, price: e.target.value })} placeholder="0" min="0" />
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">* Pricing to unlock.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACTION SECTION */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="px-10 py-3.5 bg-[#21b731] text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#1a9227] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                    <Save size={18} /> {isEditMode ? "Save Changes" : "Create Mock Test"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {activeTab === "builder" && isEditMode && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-4 duration-500 mt-2">

            {/* LEFT: QUESTION BUILDER */}
            <div className="lg:col-span-7 space-y-4">

              <div className="bg-white p-6 shadow-[0_15px_50px_rgba(0,0,0,0.12)] border border-slate-100 space-y-4 relative overflow-hidden">

                {/* SHARED FIELDS — PREMIUM SHARP DESIGN */}
                <div className="grid grid-cols-1 md:grid-cols-6 border-b border-slate-200 bg-slate-50/50">
                  <div className="p-3 border-r border-slate-200">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Duration (m)</label>
                    <input
                      type="number"
                      className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-bold text-[#3e4954] outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      value={configForm.durationMinutes}
                      onChange={e => { const v = e.target.value; setConfigForm({ ...configForm, durationMinutes: v }); saveSticky({ duration: v }); }}
                    />
                  </div>
                  <div className="p-3 border-r border-slate-200">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Subject</label>
                    <input
                      className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-bold text-[#3e4954] outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      value={qForm.category}
                      onChange={e => { const v = e.target.value; setQForm({ ...qForm, category: v }); setConfigForm(prev => ({ ...prev, subcategory: v })); saveSticky({ category: v }); }}
                      placeholder="e.g. English"
                    />
                  </div>
                  <div className="p-3 border-r border-slate-200">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Level</label>
                    <select
                      className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-bold text-[#3e4954] outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      value={qForm.difficulty}
                      onChange={e => { const v = e.target.value; setQForm({ ...qForm, difficulty: v }); saveSticky({ difficulty: v }); }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="p-3 border-r border-slate-200">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block text-indigo-600">Marks / Q</label>
                    <input
                      type="number"
                      className="w-full bg-white border border-indigo-100 px-3 py-2 text-sm font-bold text-[#3e4954] outline-none focus:border-indigo-500 transition-all"
                      value={qForm.marks}
                      onChange={e => { const v = e.target.value; setQForm({ ...qForm, marks: v }); setConfigForm(prev => ({ ...prev, marksPerQuestion: v })); saveSticky({ marks: v }); }}
                    />
                  </div>
                  <div className="p-3 border-r border-slate-200">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block text-rose-500">Neg Marking</label>
                    <input
                      type="number"
                      step="0.25"
                      className="w-full bg-white border border-rose-100 px-3 py-2 text-sm font-bold text-[#3e4954] outline-none focus:border-rose-500 transition-all"
                      value={qForm.negative}
                      onChange={e => { const v = e.target.value; setQForm({ ...qForm, negative: v }); setConfigForm(prev => ({ ...prev, negativeMarking: v })); saveSticky({ negative: v }); }}
                    />
                  </div>
                  <div className="p-3 flex items-center justify-center bg-white">
                    <button
                      onClick={() => handleSaveSettings(null, true)}
                      disabled={isSubmitting}
                      className={`w-full h-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95'
                        }`}
                    >
                      {isSubmitting ? <span className="animate-spin">...</span> : <><Save size={14} /> Save Info</>}
                    </button>
                  </div>
                </div>

                {/* MODE TOGGLE — SHARP PREMIUM */}
                <div className="flex bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onClick={() => setEntryMode("manual")}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-indigo-400'}`}
                  >
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setEntryMode("bulk")}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'bulk' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-indigo-400'}`}
                  >
                    Bulk Upload
                  </button>
                </div>


                {entryMode === "manual" ? (
                  <form onSubmit={onAddQuestion} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Question Text</label>
                      <textarea className={`${inputClass} h-20 ${getRequiredClass(qForm.title)}`} value={qForm.title} onChange={e => setQForm({ ...qForm, title: e.target.value })} placeholder="Enter question description..." />
                    </div>

                    {qForm.questionType === "mcq" && (
                      <div className="grid md:grid-cols-2 gap-2">
                        {qForm.options.map((opt, i) => (
                          <div key={i} className={`p-2 border bg-white space-y-1.5 ${!opt.text ? "border-red-300" : "border-slate-200"}`}>
                            <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                              <span>Option {String.fromCharCode(65 + i)}</span>
                              <input type="checkbox" checked={qForm.correct.includes(i)} onChange={() => setQForm({ ...qForm, correct: qForm.correct.includes(i) ? [] : [i] })} />
                            </div>
                            <input className={`${inputClass} !py-1.5 !px-2 border-0`} value={opt.text} onChange={e => {
                              let cp = [...qForm.options]; cp[i].text = e.target.value; setQForm({ ...qForm, options: cp });
                            }} placeholder={`Option ${String.fromCharCode(65 + i)} content...`} />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#2e3b83] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#1e2755] transition-all shadow-lg active:scale-[0.98]"
                    >
                      {isSubmitting ? "Processing..." : "Register Question to Bank"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {/* CSV UPLOAD DROP ZONE */}
                    {!bulkFile ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 bg-slate-50 text-center relative hover:bg-indigo-50/50 transition-all">
                        <Upload className="mx-auto text-slate-300 mb-2" size={28} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Drop CSV File Here</p>
                        <p className="text-[8px] font-bold text-slate-300 mt-1">or click to browse</p>
                        <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                          const f = e.target.files[0]; if (!f) return;
                          setBulkFile(f);
                          const r = new FileReader(); r.onload = (ev) => setBulkRows(parseBulkCSV(ev.target.result)); r.readAsText(f);
                        }} />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* FILE INFO BAR */}
                        <div className="p-2 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex justify-between items-center">
                          <span className="flex items-center gap-2">
                            <FileText size={12} />
                            {bulkFile.name} — {bulkRows.length} questions
                          </span>
                          <button onClick={() => { setBulkFile(null); setBulkRows([]); }} className="text-rose-500 hover:text-rose-700 transition-colors">Remove</button>
                        </div>

                        {/* QUESTION PREVIEW LIST */}
                        <div className="border border-slate-200 overflow-hidden">
                          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <Library size={13} className="text-indigo-500" />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Preview — {bulkRows.length} Questions</span>
                          </div>
                          <div className="max-h-[320px] overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                            {bulkRows.length > 0 ? (
                              bulkRows.map((row, idx) => {
                                const qText = row.question || row.title || row.Question || row.Title || "";
                                const ans = row.answer || row.correct || row.Answer || row.Correct || "";
                                const optA = row.a || row.A || row.option_a || row.OptionA || "";
                                const optB = row.b || row.B || row.option_b || row.OptionB || "";
                                const optC = row.c || row.C || row.option_c || row.OptionC || "";
                                const optD = row.d || row.D || row.option_d || row.OptionD || "";
                                return (
                                  <div key={idx} className="p-3 bg-white border-b border-slate-100 hover:bg-slate-50 transition-all group relative">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 flex items-center justify-center bg-slate-800 text-white text-[9px] font-black">{idx + 1}</span>
                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{row.category || "General"} • {row.difficulty || "medium"}</span>
                                      </div>
                                    </div>
                                    <h4 className="text-[11px] font-bold text-slate-700 leading-snug truncate pr-6">{qText}</h4>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-1 py-0.5">ANS: {ans}</span>
                                      <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">+{row.marks || 0} M</span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center p-8 opacity-20">
                                <PlusCircle size={40} className="mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No questions to preview</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SAVE BUTTON */}
                        <button onClick={handleBulkSubmit} disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                          <Save size={14} />
                          {isSubmitting ? "Saving..." : `Save ${bulkRows.length} Questions`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: LIST & PREVIEW — PREMIUM DARK LIST */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 flex flex-col h-[600px] relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Library className="text-indigo-600" size={16} />
                    <span className="text-[9px] font-black text-[#3e4954] uppercase tracking-tight">Questions ({addedQuestions.length})</span>
                  </div>
                  <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 border border-indigo-200">
                    {configForm.totalQuestions || 0} Total Qs
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                  {[...addedQuestions]
                    .reverse()
                    .slice((qPage - 1) * Q_PER_PAGE, qPage * Q_PER_PAGE)
                    .map((q, i) => {
                      const globalNum = addedQuestions.length - ((qPage - 1) * Q_PER_PAGE + i);
                      return (
                        <div
                          key={q._id || q.id}
                          onClick={() => setPreview(q)}
                          className={`p-3 border transition-all cursor-pointer relative group ${preview?._id === (q._id || q.id) ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
                        >
                          <div className="flex justify-between gap-3">
                            <div className="flex gap-2 items-start flex-1 min-w-0">
                              <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-slate-900 text-white text-[9px] font-black">{globalNum}</span>
                              <div className="flex-1 space-y-1 min-w-0">
                                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none">{q.category} • {q.difficulty}</p>
                                <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2">{q.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-1 py-0.5">Ans: {q.correct?.map(ci => String.fromCharCode(65 + ci)).join(", ")}</span>
                                  <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">+{q.marks} Marks</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteQuestion(q._id || q.id); }}
                              className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {addedQuestions.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-8 opacity-20">
                      <PlusCircle size={40} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No questions added</p>
                    </div>
                  )}
                </div>

                {/* PAGINATION */}
                {addedQuestions.length > Q_PER_PAGE && (
                  <div className="border-t border-slate-100 p-2 flex items-center justify-between bg-slate-50 shrink-0">
                    <button onClick={() => setQPage(p => Math.max(1, p - 1))} disabled={qPage === 1}
                      className="px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 transition-all">Prev</button>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{qPage} / {Math.ceil(addedQuestions.length / Q_PER_PAGE)}</span>
                    <button onClick={() => setQPage(p => Math.min(Math.ceil(addedQuestions.length / Q_PER_PAGE), p + 1))} disabled={qPage === Math.ceil(addedQuestions.length / Q_PER_PAGE)}
                      className="px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 transition-all">Next</button>
                  </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                  <button onClick={() => navigate(-1)} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all">Cancel</button>
                  <button
                    onClick={handleTogglePublish}
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${isPublished ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700'}`}
                  >
                    {isPublished ? "Back to Draft" : "Go LIVE Now"}
                  </button>
                </div>

                {/* PREVIEW OVERLAY */}
                {preview && (
                  <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 bg-slate-900 flex justify-between items-center shrink-0">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Question Detail</span>
                      <button onClick={() => setPreview(null)} className="text-[9px] font-black text-white bg-white/10 px-2 py-1 hover:bg-rose-500 transition-all">CLOSE</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 leading-relaxed italic">"{preview.title}"</div>
                      {preview.questionType === 'mcq' && (
                        <div className="space-y-2">
                          {preview.options?.map((opt, i) => (
                            <div key={i} className={`p-3 border flex items-center gap-3 text-[10px] font-bold ${preview.correct?.includes(i) ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-100'}`}>
                              <div className={`w-5 h-5 flex items-center justify-center text-[9px] font-black border ${preview.correct?.includes(i) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{String.fromCharCode(65 + i)}</div>
                              {opt.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
