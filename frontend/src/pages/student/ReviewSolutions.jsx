import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAttemptResult } from "../../redux/studentSlice";
import { createStudentDoubt } from "../../redux/doubtSlice";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Menu,
  X,
  BookOpen,
  Award,
  MessageCircle,
  Send,
  Loader2,
  Target,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_SERVER_URL || "";
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const ReviewSolutions = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { reviewData, reviewStatus, reviewError } = useSelector((s) => s.students);
  const attempt = reviewData?.attempt || reviewData;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDoubtModalOpen, setDoubtModalOpen] = useState(false);
  const [doubtText, setDoubtText] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("idle");

  useEffect(() => {
    if (attemptId) dispatch(fetchAttemptResult(attemptId));
  }, [dispatch, attemptId]);

  /* ── Processed questions ── */
  const processedQuestions = useMemo(() => {
    if (!attempt?.questions) return [];
    return attempt.questions.map((q) => {
      const userAnsObj = attempt.answers?.find((a) => a.questionId === (q._id || q.id));
      let status = "unanswered";
      let userSelected = null;
      if (userAnsObj) {
        userSelected = userAnsObj.selectedAnswer;
        status = userAnsObj.isCorrect ? "correct" : "wrong";
      }
      return { ...q, userSelected, status, isPassageChild: !!q.parentQuestionId };
    });
  }, [attempt]);

  /* ── Score breakdown ── */
  const scoreBreakdown = useMemo(() => {
    if (!processedQuestions.length) return null;
    
    // Get test-level global settings
    const testMetadata = attempt?.mocktestId || attempt?.mockTest || {};
    const globalMarks = (testMetadata.marksPerQuestion !== undefined && testMetadata.marksPerQuestion !== null)
      ? Number(testMetadata.marksPerQuestion)
      : null;
    const globalNegative = (testMetadata.negativeMarking !== undefined && testMetadata.negativeMarking !== null)
      ? Number(testMetadata.negativeMarking)
      : 0;

    let correct = 0, wrong = 0, skipped = 0, earned = 0, deducted = 0;
    
    for (const q of processedQuestions) {
      const qMarks = globalMarks !== null ? globalMarks : (Number(q.marks) || 1);

      if (q.status === "correct") { 
        correct++; 
        earned += qMarks; 
      }
      else if (q.status === "wrong") { 
        wrong++; 
        deducted += globalNegative; 
      }
      else skipped++;
    }
    
    const total = earned - deducted;
    const maxMarks = processedQuestions.reduce((s, q) => s + (globalMarks !== null ? globalMarks : (Number(q.marks) || 1)), 0);
    const pct = maxMarks > 0 ? ((total / maxMarks) * 100).toFixed(1) : "0.0";
    
    return { correct, wrong, skipped, earned, deducted, total, maxMarks, pct };
  }, [processedQuestions, attempt]);

  const currentQ = processedQuestions[currentIndex];

  /* ── Doubt submit ── */
  const handleDoubtSubmit = useCallback(async () => {
    if (!doubtText.trim() || !currentQ) return;
    setSubmissionStatus("loading");
    const mockTestId = attempt?.mockTest?._id || attempt?.mocktestId?._id || attempt?.mocktestId || null;
    const payload = {
      text: doubtText,
      questionId: currentQ._id || currentQ.id,
      attemptId,
      mocktestId: mockTestId,
      subject: currentQ.subject || currentQ.category || "General",
      type: "mocktest",
    };
    try {
      const res = await dispatch(createStudentDoubt(payload));
      if (createStudentDoubt.fulfilled.match(res)) {
        setSubmissionStatus("success");
        setTimeout(() => { setDoubtModalOpen(false); setSubmissionStatus("idle"); setDoubtText(""); }, 1500);
      } else setSubmissionStatus("idle");
    } catch { setSubmissionStatus("idle"); }
  }, [doubtText, currentQ, attempt, attemptId, dispatch]);

  /* ── Status helpers ── */
  const statusMap = {
    correct: { bg: "bg-emerald-50 border-emerald-300 text-emerald-800", icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, label: "Correct Answer" },
    wrong:   { bg: "bg-rose-50 border-rose-300 text-rose-800",          icon: <XCircle className="w-5 h-5 text-rose-600" />,          label: "Wrong Answer"   },
    unanswered: { bg: "bg-amber-50 border-amber-300 text-amber-800",    icon: <AlertCircle className="w-5 h-5 text-amber-600" />,      label: "Not Attempted"  },
  };
  const statusInfo = statusMap[currentQ?.status] || statusMap.unanswered;
  const marksLabel = currentQ?.status === "correct"
    ? `+${currentQ.marks}`
    : currentQ?.status === "wrong"
    ? `-${currentQ.negative || 0}`
    : "±0";

  /* ── Loading / Error ── */
  if (reviewStatus === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500" />
    </div>
  );
  if (reviewStatus === "failed" || !reviewData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc] gap-4">
      <AlertCircle className="w-14 h-14 text-rose-500" />
      <h2 className="text-2xl font-black text-slate-800">Failed to load results</h2>
      <p className="text-slate-500">{reviewError || "Unknown error"}</p>
      <button onClick={() => navigate("/student-dashboard")} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">Go to Dashboard</button>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f0f2f8] font-sans overflow-hidden">

      {/* ═══════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════ */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100
        flex flex-col transition-transform duration-300 shadow-xl
        lg:relative lg:shadow-none lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Sidebar top — branding */}
        <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <Award size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">Review Panel</h2>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
                {processedQuestions.length} Questions
              </p>
            </div>
          </div>
          {/* Status legend row */}
          <div className="flex items-center gap-3 mt-3">
            {[
              { color: "bg-emerald-500", label: "Correct" },
              { color: "bg-rose-500",    label: "Wrong"   },
              { color: "bg-slate-400",   label: "Skip"    },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-5 gap-1.5">
            {processedQuestions.map((q, idx) => {
              let cls = "bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200";
              if (q.status === "correct") cls = "bg-emerald-500 text-white shadow-sm shadow-emerald-200";
              if (q.status === "wrong")   cls = "bg-rose-500 text-white shadow-sm shadow-rose-200";
              const isActive = currentIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => { setCurrentIndex(idx); setSidebarOpen(false); }}
                  className={`h-9 w-full rounded-lg text-xs font-black flex items-center justify-center transition-all border-2 ${cls} ${isActive ? "ring-2 ring-indigo-500 ring-offset-1 scale-110 z-10" : ""}`}
                >{idx + 1}</button>
              );
            })}
          </div>
        </div>

        {/* Score breakdown */}
        {scoreBreakdown && (
          <div className="mx-3 mb-3 rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-3 py-2 bg-slate-900 flex items-center gap-2">
              <Target size={11} className="text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Score Breakdown</span>
            </div>
            {/* Counts */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
              {[
                { val: scoreBreakdown.correct, label: "Correct", cls: "text-emerald-600" },
                { val: scoreBreakdown.wrong,   label: "Wrong",   cls: "text-rose-600" },
                { val: scoreBreakdown.skipped, label: "Skipped", cls: "text-slate-500" },
              ].map(({ val, label, cls }) => (
                <div key={label} className="flex flex-col items-center py-2">
                  <span className={`text-sm font-black ${cls}`}>{val}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
            {/* Calc */}
            <div className="bg-slate-50 border-t border-slate-100 px-3 py-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle size={9} /> Earned</span>
                <span className="text-[10px] font-black text-emerald-700">+{scoreBreakdown.earned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><MinusCircle size={9} /> Negative</span>
                <span className="text-[10px] font-black text-rose-700">−{scoreBreakdown.deducted}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-1 mt-0.5">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Total</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-base font-black ${scoreBreakdown.total < 0 ? "text-rose-700" : "text-slate-900"}`}>
                    {scoreBreakdown.total}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">/ {scoreBreakdown.maxMarks}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] font-bold text-slate-400">Performance</span>
                  <span className={`text-[9px] font-black ${Number(scoreBreakdown.pct) >= 50 ? "text-emerald-600" : "text-rose-600"}`}>
                    {scoreBreakdown.pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${Number(scoreBreakdown.pct) >= 50 ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${Math.max(0, Math.min(100, Number(scoreBreakdown.pct)))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exit */}
        <div className="px-3 pb-3">
          <button
            onClick={() => navigate("/student-dashboard?tab=performance")}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
          >
            <LogOut size={13} />Exit Review
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top bar — 3-column layout: left | center | right */}
        <header className="h-12 bg-white border-b border-slate-100 flex items-center px-4 shrink-0 shadow-sm relative">
          {/* LEFT: Mobile menu (mobile) | Back button (desktop) */}
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 bg-slate-100 rounded-lg mr-2">
              <Menu size={18} className="text-slate-700" />
            </button>
            <button
              onClick={() => navigate("/student-dashboard?tab=performance")}
              className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-indigo-600 transition px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
            >
              <ArrowLeft size={13} /><span className="hidden sm:inline">My Performance</span>
            </button>
          </div>

          {/* CENTER: Q nav — absolutely centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg bg-slate-100 disabled:opacity-30 hover:bg-slate-200 transition"
            >
              <ChevronLeft size={16} className="text-slate-700" />
            </button>
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
              Q {currentIndex + 1} <span className="text-slate-400 font-bold">/ {processedQuestions.length}</span>
            </span>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(processedQuestions.length - 1, i + 1))}
              disabled={currentIndex === processedQuestions.length - 1}
              className="p-1.5 rounded-lg bg-slate-100 disabled:opacity-30 hover:bg-slate-200 transition"
            >
              <ChevronRight size={16} className="text-slate-700" />
            </button>
          </div>

          {/* RIGHT: Ask Doubt */}
          <div className="ml-auto">
            <button
              onClick={() => setDoubtModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black border border-indigo-100 hover:bg-indigo-100 transition"
            >
              <MessageCircle size={13} /><span className="hidden sm:inline">Ask Doubt</span>
            </button>
          </div>
        </header>

        {/* Scrollable question area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-5 py-4 space-y-4">

            {/* Status banner */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${statusInfo.bg} shadow-sm`}>
              <div className="flex items-center gap-2.5">
                {statusInfo.icon}
                <span className="font-black text-sm">{statusInfo.label}</span>
              </div>
              <span className={`text-sm font-black px-3 py-1 rounded-full bg-white/60 border ${
                currentQ?.status === "correct" ? "border-emerald-300 text-emerald-700" :
                currentQ?.status === "wrong"   ? "border-rose-300 text-rose-700" :
                "border-amber-300 text-amber-700"
              }`}>
                Marks: {marksLabel}
              </span>
            </div>

            {/* Passage */}
            {currentQ?.parentQuestionId && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                <h3 className="text-blue-900 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <BookOpen size={13} />Reference Passage
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{currentQ.parentQuestionId.title}</p>
                {currentQ.parentQuestionId.questionImageUrl && (
                  <img src={getImageUrl(currentQ.parentQuestionId.questionImageUrl)}
                    className="mt-3 rounded-lg border w-full max-h-48 object-contain bg-white" alt="Passage" />
                )}
              </div>
            )}

            {/* Question card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5">
                {/* Question header — no duplicate Ask Doubt here */}
                <div className="mb-4">
                  <h2 className="text-base font-black text-slate-800 leading-snug">
                    <span className="text-indigo-500 mr-1.5">Q{currentIndex + 1}.</span>
                    {currentQ?.title}
                  </h2>
                </div>

                {/* Question image */}
                {currentQ?.questionImageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img src={getImageUrl(currentQ.questionImageUrl)}
                      className="w-full max-h-72 object-contain" alt="Question" />
                  </div>
                )}

                {/* MCQ options */}
                {currentQ?.questionType?.toLowerCase() === "mcq" && (
                  <div className="space-y-2.5 mt-4">
                    {currentQ.options.map((opt, idx) => {
                      const isUserSelected = String(idx) === String(currentQ.userSelected);
                      const isCorrectOption = currentQ.correct?.includes(idx);
                      let cardStyle = "border-slate-200 bg-slate-50/50 hover:bg-slate-50";
                      let iconEl = (
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-black shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                      );
                      if (isCorrectOption) {
                        cardStyle = "border-emerald-400 bg-emerald-50";
                        iconEl = <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />;
                      } else if (isUserSelected && !isCorrectOption) {
                        cardStyle = "border-rose-400 bg-rose-50";
                        iconEl = <XCircle className="w-6 h-6 text-rose-500 shrink-0" />;
                      }
                      return (
                        <div key={idx} className={`relative flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${cardStyle}`}>
                          {iconEl}
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${isCorrectOption ? "text-emerald-900" : "text-slate-700"}`}>
                              {opt.text}
                            </p>
                            {opt.imageUrl && (
                              <img src={getImageUrl(opt.imageUrl)} className="mt-2 h-16 rounded border bg-white object-contain" alt="option" />
                            )}
                          </div>
                          {isUserSelected && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-700 text-white opacity-70">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual answer */}
                {currentQ?.questionType === "manual" && (
                  <div className="space-y-3 mt-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Your Answer</span>
                      <p className="text-slate-800 font-semibold text-sm">{currentQ.userSelected || "No Answer Given"}</p>
                    </div>
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Correct Answer</span>
                      <p className="text-emerald-900 font-semibold text-sm">{currentQ.correctManualAnswer}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Marks & Negative Info */}
              <div className="flex justify-between items-center px-5 py-3 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Marks: </span>
                  <span className="text-emerald-600">
                    +{(attempt?.mocktestId?.marksPerQuestion !== undefined && attempt?.mocktestId?.marksPerQuestion !== null)
                        ? attempt.mocktestId.marksPerQuestion
                        : (currentQ?.marks || 1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Negative: </span>
                  <span className="text-rose-600">
                    -{(attempt?.mocktestId?.negativeMarking !== undefined && attempt?.mocktestId?.negativeMarking !== null)
                        ? attempt.mocktestId.negativeMarking
                        : (currentQ?.negative || 0)}
                  </span>
                </div>
              </div>

              {/* Explanation */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen size={13} />Explanation
                  </h3>
                  <button
                    onClick={() => setDoubtModalOpen(true)}
                    className="md:hidden flex items-center gap-1 text-indigo-600 text-xs font-bold px-2 py-1 bg-indigo-50 rounded border border-indigo-100"
                  >
                    <MessageCircle size={12} />Ask
                  </button>
                </div>
                {currentQ?.explanation
                  ? <p className="text-slate-600 text-sm leading-relaxed">{currentQ.explanation}</p>
                  : <p className="text-slate-400 italic text-sm">No explanation provided.</p>}
              </div>
            </div>

            {/* Bottom nav */}
            <div className="flex justify-between pb-4">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition shadow-sm"
              >
                <ChevronLeft size={14} />Previous
              </button>
              <button
                disabled={currentIndex === processedQuestions.length - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl disabled:opacity-30 hover:bg-indigo-700 transition shadow-sm"
              >
                Next<ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Ask Doubt Modal ── */}
      {isDoubtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <MessageCircle className="text-indigo-600" size={18} />Raise a Doubt
              </h3>
              <button onClick={() => setDoubtModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Question Ref</label>
                <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 line-clamp-2">{currentQ?.title}</p>
              </div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Your Query</label>
              <textarea
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                placeholder="Describe your doubt clearly..."
                className="w-full h-28 p-3 text-sm text-slate-700 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
              />
              {submissionStatus === "success" && (
                <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 p-2 rounded-lg">
                  <CheckCircle size={14} />Doubt submitted!
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setDoubtModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancel</button>
              <button
                onClick={handleDoubtSubmit}
                disabled={submissionStatus === "loading" || !doubtText.trim()}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg shadow-md transition ${submissionStatus === "loading" ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"} disabled:opacity-70`}
              >
                {submissionStatus === "loading" ? <><Loader2 size={14} className="animate-spin" />Sending...</> : <><Send size={14} />Submit</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSolutions;
