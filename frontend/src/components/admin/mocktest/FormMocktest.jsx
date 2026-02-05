import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMockTestByIdForEdit,
  updateMockTest,
} from "../../../redux/mockTestSlice";
import { useNavigate, useParams } from "react-router-dom";
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

export default function FormMocktest() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category: categoryParam, id } = useParams();
  const isEditMode = Boolean(id);

  // States
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isFree, setIsFree] = useState(null); // No default selection (Proactive check)
  const [isGrandTest, setIsGrandTest] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [displayCategory, setDisplayCategory] = useState("");

  const { selectedMocktest: currentMocktest } = useSelector(
    (state) => state.mocktest,
  );

  const [form, setForm] = useState({
    category: "",
    subcategory: "",
    title: "",
    description: "",
    durationMinutes: "", // Default empty
    totalQuestions: "", // Default empty
    marksPerQuestion: "", // Default empty
    negativeMarking: "0.25",
    price: "",
  });

  // --- Holistic System Calculations ---
  // Calculate total questions assigned in subjects (Single limit field)
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
    }
  }, [id, isEditMode, categoryParam, dispatch]);

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
        const baseUrl = api.defaults.baseURL.replace(/\/api\/?$/, "");
        setThumbnailPreview(
          rawData.thumbnail.startsWith("http")
            ? rawData.thumbnail
            : `${baseUrl}${rawData.thumbnail}`,
        );
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
    }
  }, [currentMocktest, isEditMode]);

  const handleCreateOrSave = async (e) => {
    e.preventDefault();
    if (isFree === null)
      return toast.error("Please select Access Mode (Paid/Free)");
    if (isLimitExceeded || isLimitUnder)
      return toast.error(
        `Blueprint mismatch! Subject questions total must be ${form.totalQuestions}`,
      );
    if (!form.title.trim()) return toast.error("Test Title is missing");

    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    formData.append("totalMarks", totalMarks);
    formData.append("isFree", isFree);
    formData.append("isGrandTest", isGrandTest);
    formData.append("category", isEditMode ? form.category : categoryParam);
    if (thumbnail) formData.append("thumbnail", thumbnail);

    // Send blueprint back (Mapping limit to easy, medium/hard to 0 as discussed)
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
            subjects,
            thumbnail,
          }),
        );
        toast.success("Mock Test Updated!");
        navigate(-1);
      } else {
        const res = await api.post("/api/admin/mocktests", formData);
        toast.success("Mock Test Created!");
        navigate(`/admin/mocktests/${res.data.mocktest._id}/questions`);
      }
    } catch (err) {
      toast.error("Process failed, check console");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-8 text-slate-800">
      <style>{`
        input[type=number].no-spinner::-webkit-inner-spin-button, 
        input[type=number].no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="flex items-center gap-4 border-b border-slate-300 pb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-full transition border border-transparent hover:border-slate-300"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isEditMode ? "Edit Mock Test" : "Create Mock Test"}
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
                    Test Title
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-sm outline-none"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                    Subcategory
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-sm outline-none"
                    value={form.subcategory}
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
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      className="no-spinner w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 ring-indigo-50 outline-none"
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
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none"
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
                    setSubjects([...subjects, { name: "", limit: "" }])
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
                      Qn Limit
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
                    Access Mode
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
                </div>
                {isFree === false && (
                  <div className="space-y-1 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="no-spinner w-full p-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-bold"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                    />
                  </div>
                )}
                <div className="flex items-center justify-between p-3 border border-slate-300 rounded-lg bg-slate-50">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">
                    Grand Test Mode
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsGrandTest(!isGrandTest)}
                    className={`w-11 h-6 rounded-full transition-all relative ${isGrandTest ? "bg-orange-500" : "bg-slate-300"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isGrandTest ? "left-6" : "left-1"}`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLimitExceeded || isLimitUnder}
              className={`w-full py-4 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${isLimitExceeded || isLimitUnder ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"}`}
            >
              <Save size={18} />{" "}
              {isEditMode ? "UPDATE MOCK TEST" : "CREATE MOCK TEST"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
