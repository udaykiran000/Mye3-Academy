import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMockTestByIdForEdit,
  updateMockTest,
} from "../../../redux/mockTestSlice";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  Calculator,
  Trash2,
  Save,
  Upload,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../api/axios";
import { getImageUrl, handleImageError } from "../../../utils/imageHelper";

export default function FormMocktest() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category: categoryParam, id } = useParams();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type"); // "mock" or "grand"
  const isEditMode = Boolean(id);

  // States
  const [isFree, setIsFree] = useState(null); // Force selection
  const [isGrandTest, setIsGrandTest] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [displayCategory, setDisplayCategory] = useState("");

  // Subjects blueprint
  const [subjects, setSubjects] = useState([]);

  const { selectedMocktest: currentMocktest } = useSelector(
    (state) => state.mocktest,
  );

  const [form, setForm] = useState({
    category: "",
    subcategory: "",
    title: "",
    description: "",
    durationMinutes: "",
    totalQuestions: "",
    marksPerQuestion: "",
    negativeMarking: "0.25",
    price: "",
  });

  // Calculate total questions assigned in subjects
  const totalSubjectQuestions = subjects.reduce(
    (sum, s) => sum + (Number(s.limit) || 0),
    0,
  );

  // Validation checks for the Save button
  const isLimitExceeded =
    totalSubjectQuestions > (Number(form.totalQuestions) || 0);
  const isLimitUnder =
    Number(form.totalQuestions) > 0 &&
    totalSubjectQuestions < Number(form.totalQuestions);
  const totalMarks =
    (Number(form.totalQuestions) || 0) * (Number(form.marksPerQuestion) || 0);

  // Initial Fetching
  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchMockTestByIdForEdit(id));
    } else {
      setDisplayCategory(categoryParam?.toUpperCase() || "General");
      // Set grand test mode based on URL parameter for new tests
      if (typeParam === "grand") {
        setIsGrandTest(true);
      } else if (typeParam === "mock") {
        setIsGrandTest(false);
      }
    }
  }, [id, isEditMode, categoryParam, typeParam, dispatch]);

  // --- Proactive Data Syncing (Edit Mode) ---
  useEffect(() => {
    if (isEditMode && currentMocktest) {
      const rawData =
        currentMocktest.mocktest || currentMocktest.data || currentMocktest;
      if (!rawData || Object.keys(rawData).length === 0) return;

      // Calculate marksPerQuestion since it's missing in backend schema
      const mPerQ =
        rawData.totalQuestions > 0
          ? rawData.totalMarks / rawData.totalQuestions
          : "";

      setForm({
        category: rawData.category?._id || rawData.category || "",
        subcategory: rawData.subcategory || "",
        title: rawData.title || "",
        description: rawData.description || "",
        durationMinutes: rawData.durationMinutes?.toString() || "",
        totalQuestions: rawData.totalQuestions?.toString() || "",
        marksPerQuestion: mPerQ.toString(),
        negativeMarking: rawData.negativeMarking?.toString() || "0",
        price: rawData.price?.toString() || "",
      });

      // Update Header with Category Name
      if (rawData.category?.name) {
        setDisplayCategory(rawData.category.name.toUpperCase());
      }

      // Sync Thumbnail Preview
      if (rawData.thumbnail) {
        setThumbnailPreview(getImageUrl(rawData.thumbnail));
      }

      // Sync Subjects (Map 'easy' from backend to local 'limit')
      if (rawData.subjects && Array.isArray(rawData.subjects)) {
        setSubjects(
          rawData.subjects.map((s) => ({
            name: s.name || "",
            limit: (s.easy || 0).toString(),
          })),
        );
      }

      setIsFree(rawData.isFree);
      setIsGrandTest(rawData.isGrandTest || false);
      setIsPublished(rawData.isPublished || false);
    }
  }, [currentMocktest, isEditMode]);

  const handleCreateOrSave = async (e) => {
    e.preventDefault();
    
    // MANDATORY FIELDS CHECK
    if (!categoryParam) {
      return toast.error("Category slug is missing from URL");
    }

    if (!form.title.trim()) {
      return toast.error("Test Title is mandatory");
    }

    if (!form.subcategory.trim()) {
      return toast.error("Subcategory is mandatory");
    }

    if (isFree === null) {
      return toast.error("Please select Access Mode (Paid or Free)");
    }

    if (isFree === false && (!form.price || Number(form.price) <= 0)) {
      return toast.error("Amount must be greater than 0 for Paid tests");
    }

    /* Marks per Question and Negative Marking are now optional in the main form */

    if (isLimitExceeded || isLimitUnder) {
      toast("Blueprint mismatch detected. You can fix this later.", { icon: '⚠️' });
    }
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      if (key !== "category") {
        formData.append(key, form[key]);
      }
    });
    formData.append("totalMarks", totalMarks);
    formData.append("isFree", isFree);
    formData.append("isGrandTest", isGrandTest);
    formData.append("isPublished", isPublished);
    formData.append("category", isEditMode ? form.category : categoryParam);
    if (thumbnail) formData.append("thumbnail", thumbnail);

    // Send blueprint back (Mapping single limit to easy)
    formData.append(
      "subjects",
      JSON.stringify(
        subjects.map((s) => ({
          name: s.name,
          easy: Number(s.limit) || 0,
          medium: 0,
          hard: 0,
        })),
      ),
    );

    try {
      if (isEditMode) {
        await dispatch(
          updateMockTest({
            id,
            ...form,
            isFree,
            isGrandTest,
            subjects: subjects.map((s) => ({
              name: s.name,
              easy: Number(s.limit) || 0,
              medium: 0,
              hard: 0,
            })),
            thumbnail,
          }),
        );
        toast.success(`${isGrandTest ? "Grand" : "Mock"} Test Updated!`);
        navigate(-1);
      } else {
        const res = await api.post("/api/admin/mocktests", formData);
        toast.success(`${isGrandTest ? "Grand" : "Mock"} Test Created!`);
        navigate(`/admin/mocktests/${res.data.mocktest._id}/questions`);
      }
    } catch (err) {
      console.error("DEBUG: Mock Test Creation Error", err.response?.data || err);
      toast.error(err.response?.data?.message || "Process failed, check console");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-8 text-slate-800">
      <style>{`
        input[type=number].no-spinner::-webkit-inner-spin-button, 
        input[type=number].no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .mandatory-pulse { border-color: #f43f5e; animation: pulse-red 2s infinite; }
        @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); } }
      `}</style>

      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="flex items-center gap-4 border-b border-slate-300 pb-5">
          <button
            onClick={() => navigate(`/admin/mocktests/${categoryParam}?type=${isGrandTest ? 'grand' : 'mock'}`)}
            className="p-2 hover:bg-white rounded-full transition border border-transparent hover:border-slate-300"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isEditMode ? "Edit" : "Create"} {isGrandTest ? "Grand Test" : "Mock Test"}
            </h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
              {displayCategory} CATEGORY
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateOrSave}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* LEFT COLUMN: PRIMARY DETAILS */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-300 p-6 space-y-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                    Test Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${!form.title.trim() ? "border-rose-400 bg-rose-50/20 mandatory-pulse" : "border-slate-200 focus:border-indigo-500"}`}
                    value={form.title}
                    placeholder="e.g. RRB Constable 2024"
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                    Subcategory <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${!form.subcategory.trim() ? "border-rose-400 bg-rose-50/20 mandatory-pulse" : "border-slate-200 focus:border-indigo-500"}`}
                    value={form.subcategory}
                    placeholder="Enter Subcategory Name"
                    onChange={(e) =>
                      setForm({ ...form, subcategory: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                {[
                  { label: "Duration (min)", key: "durationMinutes" },
                  { label: "Total Qns", key: "totalQuestions" },
                  { label: "Marks / Qn", key: "marksPerQuestion" },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 flex items-center justify-between">
                      <span>{field.label}</span>
                      {field.key === "durationMinutes" && !form.durationMinutes && (
                        <span className="text-[7px] text-indigo-400 normal-case italic">
                          (Auto: 2m/Q)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      placeholder={field.key === "durationMinutes" ? `${(Number(form.totalQuestions) || 0) * 2}` : "0"}
                      className={`no-spinner w-full bg-white border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 ring-indigo-50 outline-none border-slate-300 ${field.key === "durationMinutes" && !form.durationMinutes ? "text-slate-400" : "text-slate-900"}`}
                      value={form[field.key]}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) =>
                        setForm({ ...form, [field.key]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                    Neg Marking
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className={`w-full bg-white border rounded-lg px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none border-slate-300`}
                    value={form.negativeMarking}
                    onWheel={(e) => e.target.blur()}
                    onChange={(e) =>
                      setForm({ ...form, negativeMarking: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-[11px] uppercase tracking-wider">
                  <Calculator size={16} /> Projection:{" "}
                  <span className="ml-1 text-slate-900 font-black">
                    {totalMarks || 0} Marks
                  </span>
                </div>
              </div>
            </div>

            {/* SUBJECT BLUEPRINT - SIMPLIFIED */}
            <div className="bg-white rounded-xl border border-slate-300 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-600 tracking-tight">
                    Subject Blueprint
                  </span>
                  <p
                    className={`text-[10px] font-bold mt-0.5 ${isLimitExceeded || isLimitUnder ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {totalSubjectQuestions} / {form.totalQuestions || 0}{" "}
                    Questions Assigned
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSubjects([
                      ...subjects,
                      { name: "", limit: "" },
                    ])
                  }
                  className="text-[10px] font-black text-emerald-600 border border-emerald-300 px-4 py-1.5 rounded-full hover:bg-emerald-50 transition"
                >
                  + Add Subject
                </button>
              </div>

              {subjects.map((s, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-300"
                >
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">
                      Subject Name
                    </label>
                    <input
                      placeholder="e.g Physics"
                      className="w-full bg-white border border-slate-300 p-2 text-xs rounded-md outline-none"
                      value={s.name}
                      onChange={(e) => {
                        let cp = [...subjects];
                        cp[idx].name = e.target.value;
                        setSubjects(cp);
                      }}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">
                      Questions
                    </label>
                    <input
                      type="number"
                      className="no-spinner w-full bg-white border border-slate-300 p-2 text-xs rounded-md font-bold outline-none"
                      value={s.limit}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) => {
                        let cp = [...subjects];
                        cp[idx].limit = e.target.value;
                        setSubjects(cp);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSubjects(subjects.filter((_, i) => i !== idx))
                    }
                    className="mb-1.5 p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: MEDIA & SIDEBAR */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-5 shadow-sm">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Media Asset
              </label>
              <div className="w-full h-40 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-400 transition-colors">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Upload size={24} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Upload Image or Media
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setThumbnail(file);
                      setThumbnailPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Access Mode <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsFree(false)}
                      className={`py-2 text-[10px] font-bold rounded-md transition ${isFree === false ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}
                    >
                      PAID
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFree(true)}
                      className={`py-2 text-[10px] font-bold rounded-md transition ${isFree === true ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}
                    >
                      FREE
                    </button>
                  </div>
                  {isFree === null && <p className="text-[8px] text-rose-500 font-bold uppercase ml-1 animate-pulse">Required</p>}
                </div>

                {isFree === false && (
                  <div className="space-y-1 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                      Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className={`no-spinner w-full p-2.5 text-sm border rounded-lg outline-none font-black ${(!form.price || Number(form.price) <= 0) ? "border-rose-300 bg-rose-50/5" : "border-slate-300 focus:border-indigo-500"}`}
                      value={form.price}
                      onWheel={(e) => e.target.blur()} 
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                    />
                  </div>
                )}

                {isGrandTest && (
                  <div className="space-y-1 pt-2 animate-in slide-in-from-top-2 border-t border-slate-100 mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mt-2 block">
                      Scheduled For <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full p-2.5 text-sm border border-slate-300 rounded-lg outline-none font-bold focus:border-indigo-500 transition-all"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      required={isGrandTest}
                    />
                    <p className="text-[8px] text-slate-400 font-medium italic ml-1 mt-1">
                      Specify when the grand test will be accessible.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${isLimitExceeded || isLimitUnder ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"}`}
            >
              <Save size={18} />{" "}
              {isEditMode ? "UPDATE" : "CREATE"} {isGrandTest ? "GRAND TEST" : "MOCK TEST"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
