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
  const [bulkMarks, setBulkMarks] = useState("");
  const [bulkNegative, setBulkNegative] = useState("");

  const [qPage, setQPage] = useState(1);

  const Q_PER_PAGE = 10;

  // Question Form
  const [qForm, setQForm] = useState({
    questionType: "mcq",
    title: "",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correct: [],
    correctManualAnswer: "",
    difficulty: "easy",
    category: "",
    marks: "",
    negative: "",
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

        const mPerQ = raw.totalQuestions > 0 ? (raw.totalMarks / raw.totalQuestions).toString() : "";

        setConfigForm({
          subcategory: raw.subcategory || "",
          title: raw.title || "",
          description: raw.description || "",
          durationMinutes: raw.durationMinutes?.toString() || "",
          totalQuestions: raw.totalQuestions?.toString() || "",
          marksPerQuestion: mPerQ,
          negativeMarking: raw.negativeMarking?.toString() || "0.25",
          price: raw.price?.toString() || "",
        });

        if (raw.thumbnail) setThumbnailPreview(getImageUrl(raw.thumbnail));
        if (raw.subjects) {
          setTestSubjects(raw.subjects.map(s => ({ name: s.name, limit: (s.easy || 0).toString() })));
        }

        // Sync QForm defaults from test settings so fields are pre-filled on load
        setQForm(prev => ({
          ...prev,
          category: raw.subjects?.[0]?.name || "",
          marks: mPerQ,
          negative: raw.negativeMarking?.toString() || "",
        }));
        setBulkMarks(mPerQ);

        setBulkNegative(raw.negativeMarking?.toString() || "");

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

  // --- DERIVED STATS ---
  const totalMarks = (Number(configForm.totalQuestions) || 0) * (Number(configForm.marksPerQuestion) || 0);
  const totalAssignedQs = testSubjects.reduce((sum, s) => sum + (Number(s.limit) || 0), 0);

  // --- HANDLERS: TEST SETTINGS ---
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    if (!configForm.title.trim()) return toast.error("Exam Title is missing.");
    if (!configForm.subcategory.trim()) return toast.error("Sub-Category is missing.");


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
      toast.error("Status update failed");
    }
  };

  // --- HANDLERS: QUESTION BUILDER ---
  const onAddQuestion = async (e) => {
    e.preventDefault();
    if (!qForm.category.trim()) return toast.error("Please enter a Subject.");
    if (!qForm.title.trim()) return toast.error("Question Text is missing.");
    if (!qForm.marks) return toast.error("Enter marks for this question.");
    if (qForm.negative === "" || qForm.negative === undefined) return toast.error("Negative marking is required.");
    if (qForm.questionType === "mcq" && qForm.correct.length === 0) return toast.error("Please select a Correct Option.");
    
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("title", qForm.title);
    fd.append("questionType", qForm.questionType);
    fd.append("category", qForm.category);
    fd.append("difficulty", qForm.difficulty);
    fd.append("marks", qForm.marks);
    fd.append("negative", qForm.negative);

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
      setQForm(f => ({ ...f, title: "", options: [{text:""},{text:""},{text:""},{text:""}], correct: [], correctManualAnswer: "" }));
      setThumbnailPreview(null);
      setQPage(1);
      if (document.getElementById("qFileInput")) document.getElementById("qFileInput").value = "";

      // Silently sync test-level settings (duration, negativeMarking) to DB
      const settingsPatch = new FormData();
      if (configForm.durationMinutes) settingsPatch.append("durationMinutes", configForm.durationMinutes);
      settingsPatch.append("negativeMarking", qForm.negative !== "" ? qForm.negative : 0);
      settingsPatch.append("marksPerQuestion", qForm.marks || 0);
      api.put(`/api/admin/mocktests/${id}`, settingsPatch).catch(() => {});
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
    if (!bulkFile || !bulkMarks || bulkNegative === "") return toast.error("File, Marks, and Negative Marks are mandatory.");
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", bulkFile);
      fd.append("marks", bulkMarks);
      fd.append("negative", bulkNegative);
      await api.post(`/api/admin/mocktests/${id}/questions/bulk-upload`, fd);
      toast.success("Bulk Upload Complete");
      setBulkFile(null);
      setBulkRows([]);
      setQPage(1);
      loadData();
    } catch (err) {
      toast.error("Bulk upload failed");
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
            <Link to="/admin/mocktests" className="hover:text-[#21b731] transition-colors">Categories</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-[#21b731]">{isEditMode ? "Mock Test" : "Setup"}</span>
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
                  className={`px-4 py-2 border font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                    isPublished 
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

                      <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                             <label className={labelClass}>Exam Name *</label>
                             <input className={`${inputClass} ${getRequiredClass(configForm.title)}`} value={configForm.title} onChange={e => setConfigForm({...configForm, title: e.target.value})} placeholder="e.g. SSC CGL Mock 01" />
                          </div>
                          <div className="space-y-1.5">
                             <label className={labelClass}>Exam Category *</label>
                             <input className={`${inputClass} ${getRequiredClass(configForm.subcategory)}`} value={configForm.subcategory} onChange={e => setConfigForm({...configForm, subcategory: e.target.value})} placeholder="e.g. SSC CHSL / GD" />
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
                                 <input type="number" className={inputClass} value={configForm.price} onChange={e => setConfigForm({...configForm, price: e.target.value})} placeholder="0.00" />
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">* Pricing to unlock.</p>
                               </div>
                             )}
                          </div>
                       </div>
                   </div>

                   {/* ACTION SECTION */}
                   <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button type="submit" disabled={isSubmitting} className="px-10 py-3.5 bg-[#21b731] text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#1a9227] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                         <Save size={18} /> {isEditMode ? "Save Changes" : "Register & Add"}
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
                
                <div className="bg-white p-6 shadow-[0_15px_50px_rgba(0,0,0,0.12)] border border-slate-100 space-y-6 relative overflow-hidden">
                    <div className="flex gap-2 mb-4 p-1 bg-slate-100 border border-slate-200">

                       <button onClick={() => setEntryMode("manual")} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all ${entryMode === 'manual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}>Manual Question</button>

                       <button onClick={() => setEntryMode("bulk")} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all ${entryMode === 'bulk' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}>Bulk Upload</button>

                    </div>


                   {entryMode === "manual" ? (
                     <form onSubmit={onAddQuestion} className="space-y-3">
                       <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                           <div className="space-y-1.5">
                              <label className={labelClass}>Duration (m)</label>
                              <input type="number" className={`${inputClass} ${getRequiredClass(configForm.durationMinutes)}`} value={configForm.durationMinutes} onChange={e => setConfigForm({...configForm, durationMinutes: e.target.value})} />
                           </div>
                          <div className="space-y-1.5">
                             <label className={labelClass}>Subject *</label>
                             <input className={`${inputClass} ${getRequiredClass(qForm.category)}`} value={qForm.category} onChange={e => setQForm({...qForm, category: e.target.value})} placeholder="e.g. English" />
                          </div>
                          <div className="space-y-1.5">
                             <label className={labelClass}>Level</label>
                             <select className={inputClass} value={qForm.difficulty} onChange={e => setQForm({...qForm, difficulty: e.target.value})}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                             </select>
                          </div>
                          <div className="space-y-1.5">
                             <label className={labelClass}>Marks per question</label>
                             <input type="number" className={`${inputClass} ${getRequiredClass(qForm.marks)}`} value={qForm.marks} onChange={e => setQForm({...qForm, marks: e.target.value})} />
                          </div>
                          <div className="space-y-1.5">
                             <label className={labelClass}>Neg Marking</label>
                             <input type="number" step="0.25" className={`${inputClass} ${getRequiredClass(qForm.negative)}`} value={qForm.negative} onChange={e => setQForm({...qForm, negative: e.target.value})} />
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className={labelClass}>Question Text</label>
                          <textarea className={`${inputClass} h-20 ${getRequiredClass(qForm.title)}`} value={qForm.title} onChange={e => setQForm({...qForm, title: e.target.value})} placeholder="Enter question description..." />
                       </div>

                       {qForm.questionType === "mcq" && (
                         <div className="grid md:grid-cols-2 gap-2">
                            {qForm.options.map((opt, i) => (
                              <div key={i} className={`p-2 border bg-white space-y-1.5 ${!opt.text ? "border-red-300" : "border-slate-200"}`}>
                                <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                                  <span>Option {String.fromCharCode(65+i)}</span>
                                  <input type="checkbox" checked={qForm.correct.includes(i)} onChange={() => setQForm({...qForm, correct: qForm.correct.includes(i) ? [] : [i]})} />
                                </div>
                                <input className={`${inputClass} !py-1.5 !px-2 border-0`} value={opt.text} onChange={e => {
                                  let cp = [...qForm.options]; cp[i].text = e.target.value; setQForm({...qForm, options: cp});
                                }} placeholder={`Option ${String.fromCharCode(65+i)} content...`} />
                              </div>
                            ))}
                         </div>
                       )}

                       <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md mt-2">Save Question</button>
                     </form>
                   ) : (
                     <div className="space-y-4">
                        <div className="p-4 border-2 border-dashed border-slate-200 bg-slate-50 text-center relative hover:bg-indigo-50/50 transition-all">
                           <Upload className="mx-auto text-slate-300 mb-1" size={24} />
                           <p className="text-[10px] font-bold text-slate-500 uppercase">Choose CSV File</p>
                           <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                             const f = e.target.files[0]; if(!f) return;
                             setBulkFile(f);
                             const r = new FileReader(); r.onload = (ev) => setBulkRows(parseBulkCSV(ev.target.result)); r.readAsText(f);
                           }} />
                        </div>
                        {bulkFile && <div className="p-2 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex justify-between items-center">
                          <span>{bulkFile.name} ({bulkRows.length} Rows)</span>
                          <button onClick={() => {setBulkFile(null); setBulkRows([]);}} className="text-rose-500">Remove</button>
                        </div>}
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-2">

                            <div className="space-y-1.5">

                               <label className={labelClass}>Duration (m)</label>

                               <input type="number" className={`${inputClass} ${getRequiredClass(configForm.durationMinutes)}`} value={configForm.durationMinutes} onChange={e => setConfigForm({...configForm, durationMinutes: e.target.value})} />

                            </div>

                            <div className="space-y-1.5">

                               <label className={labelClass}>Subject *</label>

                               <input className={`${inputClass} ${getRequiredClass(qForm.category)}`} value={qForm.category} onChange={e => setQForm({...qForm, category: e.target.value})} placeholder="e.g. English" />

                            </div>

                            <div className="space-y-1.5">

                               <label className={labelClass}>Level</label>

                               <select className={inputClass} value={qForm.difficulty} onChange={e => setQForm({...qForm, difficulty: e.target.value})}>

                                  <option value="easy">Easy</option>

                                  <option value="medium">Medium</option>

                                  <option value="hard">Hard</option>

                               </select>

                            </div>

                            <div className="space-y-1.5">

                              <label className={labelClass}>Marks per question</label>

                              <input type="number" className={`${inputClass} ${getRequiredClass(bulkMarks)}`} value={bulkMarks} onChange={e => setBulkMarks(e.target.value)} />

                            </div>

                            <div className="space-y-1.5">

                              <label className={labelClass}>Neg marking</label>

                              <input type="number" step="0.25" className={`${inputClass} ${getRequiredClass(bulkNegative)}`} value={bulkNegative} onChange={e => setBulkNegative(e.target.value)} />

                            </div>

                         </div>

                        <button onClick={handleBulkSubmit} disabled={isSubmitting || !bulkFile} className="w-full py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">Upload Bulk</button>
                     </div>
                   )}
                </div>
             </div>

             {/* RIGHT: LIST & PREVIEW */}
             <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-200 flex flex-col h-[600px] relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                   <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <Library className="text-indigo-600" size={16} />
                         <span className="text-[9px] font-black text-[#3e4954] uppercase tracking-tight">Questions ({addedQuestions.length})</span>
                      </div>
                      <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 border border-indigo-200">
                        {configForm.totalQuestions || 0} Total
                      </span>
                   </div>

                    <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                       {[...addedQuestions]
                        .reverse()
                        .slice((qPage - 1) * Q_PER_PAGE, qPage * Q_PER_PAGE)
                        .map((q, i) => (
                        <div key={q._id || q.id} onClick={() => setPreview(q)} className={`p-2 border cursor-pointer transition-all ${preview?._id === (q._id || q.id) ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                           <div className="flex justify-between gap-2">
                              <div className="flex-1 space-y-0.5">
                                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{q.category} • {q.difficulty}</p>
                                 <p className="text-[11px] font-bold text-slate-700 line-clamp-1">{q.title}</p>

                                  {q.correct?.length > 0 && <p className="text-[7px] font-black text-emerald-600 mt-0.5">Ans: {q.correct.map(ci => String.fromCharCode(65+ci)).join(", ")}</p>}

                                  {q.questionType === 'manual' && q.correctManualAnswer && <p className="text-[7px] font-black text-emerald-600 mt-0.5 truncate">Ans: {q.correctManualAnswer}</p>}
                              </div>
                              <button onClick={(e) => {e.stopPropagation(); deleteQuestion(q._id || q.id);}} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                           </div>
                        </div>
                      ))}
                   </div>

                    {/* PAGINATION */}
                    {addedQuestions.length > Q_PER_PAGE && (
                      <div className="border-t border-slate-100 p-2 flex items-center justify-between bg-slate-50/50 shrink-0">
                        <button onClick={() => setQPage(p => Math.max(1,p-1))} disabled={qPage === 1}
                          className="px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 transition-all">Prev</button>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{qPage} / {Math.ceil(addedQuestions.length / Q_PER_PAGE)}</span>
                        <button onClick={() => setQPage(p => Math.min(Math.ceil(addedQuestions.length/Q_PER_PAGE), p+1))} disabled={qPage === Math.ceil(addedQuestions.length/Q_PER_PAGE)}
                          className="px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 transition-all">Next</button>
                      </div>
                    )}
                   {/* LIVE DETAIL OVERLAY */}
                   {preview && (
                     <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-4 bg-slate-900 flex justify-between items-center">
                           <span className="text-[9px] font-black text-white uppercase tracking-widest">Preview Question</span>
                           <button onClick={() => setPreview(null)} className="text-[9px] font-black text-slate-400 hover:text-white">CLOSE</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-poppins">
                           <div className="p-3 bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-800 leading-relaxed">{preview.title}</div>
                           {preview.questionType === 'mcq' && (
                             <div className="space-y-2">
                               {preview.options?.map((opt, i) => (
                                 <div key={i} className={`p-2 border flex items-center gap-2 text-[10px] font-bold ${preview.correct?.includes(i) ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-100'}`}>
                                   <div className={`w-4 h-4 flex items-center justify-center text-[8px] font-black border ${preview.correct?.includes(i)?'bg-emerald-500 text-white border-emerald-500':'bg-slate-100 text-slate-400 border-slate-200'}`}>{String.fromCharCode(65+i)}</div>
                                   {opt.text}
                                 </div>
                               ))}
                             </div>
                           )}
                           {preview.questionType === 'manual' && (
                             <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[9px] font-black text-center uppercase tracking-widest">Correct: {preview.correctManualAnswer}</div>
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
