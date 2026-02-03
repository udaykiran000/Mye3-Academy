import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMockTestByIdForEdit,
  updateMockTest,
} from "../../redux/mockTestSlice";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Layers,
  Calculator,
  Trash2,
  Save,
  FileEdit,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";

export default function FormMocktest() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category: categoryParam, id } = useParams();
  const isEditMode = Boolean(id);

  // States
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isFree, setIsFree] = useState(false);
  const [isGrandTest, setIsGrandTest] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [subjects, setSubjects] = useState([]); // Simplified: can be empty initially
  const [displayCategory, setDisplayCategory] = useState("");

  const { selectedMocktest: currentMocktest, selectedStatus } = useSelector(
    (state) => state.mocktest,
  );

  const [form, setForm] = useState({
    category: "",
    subcategory: "",
    title: "",
    description: "",
    durationMinutes: "60",
    totalQuestions: "100",
    marksPerQuestion: "2",
    negativeMarking: "0.50",
    price: "0",
    discountPrice: "0",
  });

  // Calculate stats purely for visual feedback
  const totalMarks =
    (Number(form.totalQuestions) || 0) * (Number(form.marksPerQuestion) || 0);

  // Fetch or setup basic metadata
  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchMockTestByIdForEdit(id));
    } else {
      setDisplayCategory(categoryParam?.toUpperCase() || "General");
    }
  }, [id, isEditMode, categoryParam, dispatch]);

  // Sync edit data carefully
  useEffect(() => {
    if (isEditMode && currentMocktest) {
      const data =
        currentMocktest.mocktest || currentMocktest.data || currentMocktest;
      if (!data) return;

      setForm({
        category: data.category?._id || data.category || "",
        subcategory: data.subcategory || "",
        title: data.title || "",
        description: data.description || "",
        durationMinutes: data.durationMinutes?.toString() || "",
        totalQuestions: data.totalQuestions?.toString() || "",
        marksPerQuestion: data.marksPerQuestion?.toString() || "2",
        negativeMarking: data.negativeMarking?.toString() || "0.25",
        price: data.price?.toString() || "0",
        discountPrice: data.discountPrice?.toString() || "0",
      });

      if (data.thumbnail) {
        setThumbnailPreview(
          data.thumbnail.startsWith("http")
            ? data.thumbnail
            : `${api.defaults.baseURL.replace(/\/api\/?$/, "")}${data.thumbnail}`,
        );
      }

      setSubjects(
        data.subjects?.map((s) => ({
          name: s.name,
          limit: (
            Number(s.easy || 0) +
            Number(s.medium || 0) +
            Number(s.hard || 0)
          ).toString(),
        })) || [],
      );

      setIsFree(data.isFree || false);
      setIsGrandTest(data.isGrandTest || false);
      setScheduledFor(
        data.scheduledFor
          ? new Date(data.scheduledFor).toISOString().slice(0, 16)
          : "",
      );
    }
  }, [currentMocktest, isEditMode]);

  const handleCreateOrSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Test Title is missing");

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("subcategory", form.subcategory);
    formData.append("description", form.description);
    formData.append("durationMinutes", form.durationMinutes);
    formData.append("totalQuestions", form.totalQuestions);
    formData.append("totalMarks", totalMarks);
    formData.append("marksPerQuestion", form.marksPerQuestion);
    formData.append("negativeMarking", form.negativeMarking);
    formData.append("price", isFree ? 0 : form.price);
    formData.append("discountPrice", isFree ? 0 : form.discountPrice);
    formData.append("isFree", isFree);
    formData.append("isGrandTest", isGrandTest);
    formData.append("category", isEditMode ? form.category : categoryParam);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    if (isGrandTest && scheduledFor)
      formData.append("scheduledFor", scheduledFor);

    // Add subjects as blueprint data if they exist
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
            subjects,
            thumbnail,
            scheduledFor,
          }),
        ); // Simpler Update Redux call
        toast.success("Blueprint Updated!");
        navigate(-1);
      } else {
        const res = await api.post("/api/admin/mocktests", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Blueprint Initialized!");
        navigate(`/admin/mocktests/${res.data.mocktest._id}/questions`);
      }
    } catch (err) {
      toast.error("Process failed check console");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] px-4 md:px-8 py-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* COMPACT DASHBOARD HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {isEditMode ? "Edit Mock Test Entry" : "Create Test Blueprint"}
              </h1>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                {displayCategory} DIRECTORY
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleCreateOrSave}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* ================= LEFT: CONFIGURATION FIELDS ================= */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <Settings size={14} className="text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  General Parameters
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Test Title
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-100 rounded-md px-4 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-100"
                    placeholder="Grand Test #05"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Examination Code / Subcategory
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-100 rounded-md px-4 py-2 text-sm font-medium outline-none"
                    placeholder="e.g. Constable GD"
                    value={form.subcategory}
                    onChange={(e) =>
                      setForm({ ...form, subcategory: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                {[
                  { label: "Duration (min)", key: "durationMinutes" },
                  { label: "Questions", key: "totalQuestions" },
                  { label: "Marks / Qn", key: "marksPerQuestion" },
                  { label: "Neg Marking", key: "negativeMarking" },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-300 uppercase">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white border border-slate-100 rounded px-2 py-2 text-xs font-bold"
                      value={form[field.key]}
                      onChange={(e) =>
                        setForm({ ...form, [field.key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Dynamic Summary Panel */}
              <div className="flex items-center justify-between p-3 bg-indigo-50/40 rounded-md border border-indigo-50">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase">
                  <Calculator size={14} /> Automatic Projection
                </div>
                <p className="text-xs font-black text-slate-700 uppercase">
                  Max Score Cap:{" "}
                  <span className="text-indigo-600">{totalMarks} Marks</span>
                </p>
              </div>
            </div>

            {/* SUBJECT BLUEPRINT - NOW COMPLETELY OPTIONAL AS PER REQUEST */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Subject Distributions (Optional)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSubjects([...subjects, { name: "", limit: "" }])
                  }
                  className="text-[10px] font-black text-emerald-500 border border-emerald-100 px-3 py-1 rounded-full hover:bg-emerald-50 transition"
                >
                  + Add Module
                </button>
              </div>

              {subjects.length === 0 && (
                <p className="text-[11px] text-slate-400 italic">
                  No subject-wise blueprint set yet. Tests can still be created.
                </p>
              )}

              {subjects.map((s, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 items-end bg-slate-50/50 p-3 rounded-md animate-in slide-in-from-left-2 duration-300 border border-slate-50"
                >
                  <div className="flex-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase">
                      Subject
                    </label>
                    <input
                      className="w-full bg-white border border-slate-100 p-2 text-xs rounded outline-none"
                      value={s.name}
                      onChange={(e) => {
                        let cp = [...subjects];
                        cp[idx].name = e.target.value;
                        setSubjects(cp);
                      }}
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[8px] font-bold text-slate-400 uppercase">
                      Limit
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white border border-slate-100 p-2 text-xs rounded outline-none"
                      value={s.limit}
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
                    className="mb-2 text-rose-300 hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ================= RIGHT: THUMBNAIL & LOGISTICS ================= */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase">
                Visual Identity (Icon)
              </label>
              <div className="w-full h-32 rounded bg-slate-50 border-2 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden group">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-slate-300 italic">
                    Identity Missing
                  </span>
                )}
                <input
                  type="file"
                  onChange={(e) => {
                    setThumbnail(e.target.files[0]);
                    setThumbnailPreview(URL.createObjectURL(e.target.files[0]));
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-3 pt-3">
                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition border border-slate-50">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Access Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFree(false)}
                      className={`text-[9px] px-2 py-0.5 rounded ${!isFree ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                      PAID
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFree(true)}
                      className={`text-[9px] px-2 py-0.5 rounded ${isFree ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                      FREE
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl space-y-4">
              <button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-md font-bold text-sm transition-all shadow-indigo-100/50 flex items-center justify-center gap-2 group active:scale-95"
              >
                <Save
                  size={16}
                  className="group-hover:rotate-12 transition-transform"
                />
                {isEditMode ? "COMMIT UPDATES" : "INITIALIZE BLUEPRINT"}
              </button>
              <p className="text-[10px] text-center text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                System Status: Non-published Blueprint Mode
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
