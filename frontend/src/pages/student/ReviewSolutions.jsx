import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// --- REDUX ACTIONS ---
import { fetchAttemptResult } from "../../redux/studentSlice";
import { createStudentDoubt } from "../../redux/doubtSlice"; // Imported from your doubtSlice

// --- ICONS ---
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
} from "lucide-react";

// --- HELPER: Image URL ---
const BASE_URL = "import.meta.env.VITE_SERVER_URL";
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};

const ReviewSolutions = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Redux State: Exam Data

  const { reviewData, reviewStatus, reviewError } = useSelector(
    (state) => state.students,
  ); // Local State: Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Local State: Doubt Modal

  const [isDoubtModalOpen, setDoubtModalOpen] = useState(false);
  const [doubtText, setDoubtText] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("idle"); // idle | loading | success
  // Fetch Attempt Data on Mount

  useEffect(() => {
    if (attemptId) {
      dispatch(fetchAttemptResult(attemptId));
    }
  }, [dispatch, attemptId]); // --- DATA PROCESSING ---

  const processedQuestions = useMemo(() => {
    if (!reviewData || !reviewData.questions) return [];
    return reviewData.questions.map((q) => {
      // Find user's answer for this question
      const userAnsObj = reviewData.answers?.find(
        (a) => a.questionId === (q._id || q.id),
      ); // Determine Status
      let status = "unanswered";
      let userSelected = null;

      if (userAnsObj) {
        userSelected = userAnsObj.selectedAnswer;
        status = userAnsObj.isCorrect ? "correct" : "wrong";
      }

      return {
        ...q,
        userSelected,
        status, // correct | wrong | unanswered
        isPassageChild: !!q.parentQuestionId,
      };
    });
  }, [reviewData]);

  const currentQ = processedQuestions[currentIndex]; // --- HANDLER: Submit Doubt ---

  const handleDoubtSubmit = useCallback(async () => {
    if (!doubtText.trim() || !currentQ) return;

    setSubmissionStatus("loading"); // 1. Safe access to Mock Test ID from reviewData

    const mockTestId =
      reviewData?.mockTest?._id ||
      reviewData?.mocktestId?._id ||
      reviewData?.mocktestId ||
      null; // 2. Construct Payload

    const payload = {
      text: doubtText,
      questionId: currentQ._id || currentQ.id,
      attemptId: attemptId,
      mocktestId: mockTestId, // Ensure subject is not null/empty (Backend requires it)
      subject: currentQ.subject || currentQ.category || "General", // Match Mongoose Enum (assuming "mocktest" is the correct enum value)
      type: "mocktest",
    };

    try {
      const resultAction = await dispatch(createStudentDoubt(payload));

      if (createStudentDoubt.fulfilled.match(resultAction)) {
        setSubmissionStatus("success"); // Clear and close after a brief delay for UX
        setTimeout(() => {
          setDoubtModalOpen(false);
          setSubmissionStatus("idle");
          setDoubtText("");
        }, 1500);
      } else {
        setSubmissionStatus("idle");
      }
    } catch (error) {
      console.error("Doubt submission error:", error);
      setSubmissionStatus("idle");
    }
  }, [doubtText, currentQ, reviewData, attemptId, dispatch]); // --- RENDER HELPERS ---

  const getStatusColor = (status) => {
    switch (status) {
      case "correct":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "wrong":
        return "bg-rose-100 text-rose-700 border-rose-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  }; // --- LOADING / ERROR STATES ---

  if (reviewStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
               {" "}
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-500"></div>
             {" "}
      </div>
    );
  }

  if (reviewStatus === "failed" || !reviewData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />       {" "}
        <h2 className="text-2xl font-bold">Failed to load results</h2>       {" "}
        <p className="mb-6 text-gray-500">
          {reviewError || "Unknown error occurred"}
        </p>
               {" "}
        <button
          onClick={() => navigate("/student-dashboard")}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg"
        >
                    Go to Dashboard        {" "}
        </button>
             {" "}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
                  {/* --- SIDEBAR (NAVIGATION) --- */}     {" "}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/80 backdrop-blur-md border-r border-gray-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
               {" "}
        <div className="flex flex-col h-full">
                    {/* Sidebar Header */}         {" "}
          <div className="p-6 border-b border-gray-100">
                         
            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                              <Award className="text-cyan-600" />               
              Review Panel              
            </h2>
                         
            <div className="mt-4 flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                             {" "}
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                Correct
              </div>
                             {" "}
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Wrong
              </div>
                             {" "}
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span> Skip
              </div>
                           
            </div>
                     {" "}
          </div>
                    {/* Question Grid */}         {" "}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                       {" "}
            <div className="grid grid-cols-4 gap-2">
                           {" "}
              {processedQuestions.map((q, idx) => {
                // Determine color
                let colorClass =
                  "bg-gray-100 text-gray-400 border-transparent hover:bg-gray-200";
                if (q.status === "correct")
                  colorClass =
                    "bg-emerald-500 text-white shadow-md shadow-emerald-200";
                if (q.status === "wrong")
                  colorClass =
                    "bg-rose-500 text-white shadow-md shadow-rose-200";
                const isActive = currentIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setSidebarOpen(false);
                    }}
                    className={`h-10 w-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all duration-200 border-2 ${colorClass} ${isActive ? "ring-2 ring-cyan-500 ring-offset-2 scale-110 z-10" : ""}`}
                  >
                                         {idx + 1}                   
                  </button>
                );
              })}
                         {" "}
            </div>
                     {" "}
          </div>
                             {" "}
          <div className="p-4 border-t border-gray-100">
                         
            <button
              onClick={() => navigate("/student-dashboard")}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition"
            >
                              Exit Review              
            </button>
                     {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </aside>
            {/* --- MAIN CONTENT --- */}     {" "}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header */}       {" "}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 lg:hidden z-30">
                     
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-gray-100 rounded-lg"
          >
                          <Menu size={20} className="text-gray-700" />         
             
          </button>
                     
          <span className="font-bold text-gray-800">
            Q {currentIndex + 1} / {processedQuestions.length}
          </span>
                     
          <button
            onClick={() => navigate("/student-dashboard")}
            className="p-2 bg-gray-100 rounded-lg"
          >
                          <ArrowLeft size={20} className="text-gray-700" />     
                 
          </button>
                 {" "}
        </header>
                {/* Scrollable Question Area */}       {" "}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                     
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
                                        {/* STATUS BANNER */}             {" "}
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between shadow-sm gap-3 ${getStatusColor(currentQ?.status)}`}
            >
                               
              <div className="flex items-center gap-3">
                                   {" "}
                {currentQ?.status === "correct" && (
                  <CheckCircle className="w-6 h-6" />
                )}
                                   {" "}
                {currentQ?.status === "wrong" && (
                  <XCircle className="w-6 h-6" />
                )}
                                   {" "}
                {currentQ?.status === "unanswered" && (
                  <AlertCircle className="w-6 h-6" />
                )}
                                   {" "}
                <span className="text-lg font-bold capitalize">
                  {currentQ?.status} Answer
                </span>
                                 
              </div>
                               
              <span className="text-sm font-semibold opacity-75">
                Marks:{" "}
                {currentQ?.status === "correct"
                  ? `+${currentQ.marks}`
                  : currentQ?.status === "wrong"
                    ? `-${currentQ.negative}`
                    : "0"}
              </span>
                           {" "}
            </div>
                          {/* PARENT PASSAGE */}             {" "}
            {currentQ?.parentQuestionId && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-inner">
                                   {" "}
                <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                  <BookOpen size={18} /> Reference Passage
                </h3>
                                   {" "}
                {/* ⭐ FIX: Use questionText from parentQuestionId */}         
                         {" "}
                <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                  {currentQ.parentQuestionId.questionText}
                </p>
                                   {" "}
                {currentQ.parentQuestionId.questionImageUrl && (
                  <img
                    src={getImageUrl(
                      currentQ.parentQuestionId.questionImageUrl,
                    )}
                    className="mt-4 rounded-lg border w-full max-h-60 object-contain bg-white"
                    alt="Passage"
                  />
                )}
                                 
              </div>
            )}
                          {/* QUESTION CARD */}             {" "}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                               
              <div className="p-6 lg:p-8">
                                    {/* Header + Doubt Button (Desktop) */}     
                             {" "}
                <div className="flex justify-between items-start gap-4 mb-4">
                                         {" "}
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-800 leading-snug">
                                               
                    <span className="text-cyan-500 mr-2">
                      Q{currentIndex + 1}.
                    </span>
                                               
                    {/* ⭐ FIX: Use questionText instead of title */}           
                                   {currentQ?.questionText}                     
                     {" "}
                  </h2>
                                                                 {" "}
                  <button
                    onClick={() => setDoubtModalOpen(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition whitespace-nowrap"
                  >
                                                <MessageCircle size={16} />     
                                          Ask Doubt                        {" "}
                  </button>
                                     {" "}
                </div>
                                                        {/* Question Image */} 
                                 {" "}
                {currentQ?.questionImageUrl && (
                  <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                               
                    <img
                      src={getImageUrl(currentQ.questionImageUrl)}
                      className="w-full max-h-96 object-contain"
                      alt="Question"
                    />
                                           {" "}
                  </div>
                )}
                                    {/* OPTIONS */}                   {" "}
                <div className="space-y-3 mt-6">
                                         
                  {currentQ?.questionType === "mcq" &&
                    currentQ.options.map((opt, idx) => {
                      const isUserSelected =
                        String(idx) === String(currentQ.userSelected);
                      const isCorrectOption = currentQ.correct?.includes(idx); // Style Logic

                      let cardStyle =
                        "border-gray-200 bg-white hover:bg-gray-50";
                      let icon = (
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                      );

                      if (isCorrectOption) {
                        cardStyle =
                          "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500";
                        icon = (
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        );
                      } else if (isUserSelected && !isCorrectOption) {
                        cardStyle =
                          "border-rose-500 bg-rose-50 ring-1 ring-rose-500";
                        icon = <XCircle className="w-6 h-6 text-rose-600" />;
                      }

                      return (
                        <div
                          key={idx}
                          className={`relative p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${cardStyle}`}
                        >
                                                         {" "}
                          <div className="flex-shrink-0 mt-0.5">{icon}</div>   
                                                     {" "}
                          <div className="flex-1">
                                                               
                            <p
                              className={`text-base font-medium ${isCorrectOption ? "text-emerald-900" : "text-gray-700"}`}
                            >
                              {opt.text}
                            </p>
                                                               
                            {opt.imageUrl && (
                              <img
                                src={getImageUrl(opt.imageUrl)}
                                className="mt-2 h-20 rounded border bg-white"
                                alt="option"
                              />
                            )}
                                                           {" "}
                          </div>
                                                         {" "}
                          {isUserSelected && (
                            <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-gray-800 text-white opacity-20">
                              Your Choice
                            </span>
                          )}
                                                       
                        </div>
                      );
                    })}
                                                                 
                  {/* MANUAL ANSWER */}                       
                  {currentQ?.questionType === "manual" && (
                    <div className="space-y-4">
                                                 {" "}
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                       
                        <span className="text-xs font-bold text-gray-500 uppercase">
                          Your Answer
                        </span>
                                                       
                        <p className="text-gray-800 font-medium mt-1">
                          {currentQ.userSelected || "No Answer"}
                        </p>
                                                   {" "}
                      </div>
                                                 {" "}
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                                       
                        <span className="text-xs font-bold text-emerald-600 uppercase">
                          Correct Answer
                        </span>
                                                       
                        <p className="text-emerald-900 font-medium mt-1">
                          {currentQ.correctManualAnswer}
                        </p>
                                                   {" "}
                      </div>
                                               
                    </div>
                  )}
                                     {" "}
                </div>
                                 
              </div>
                               {/* EXPLANATION AREA */}                 
              <div className="bg-slate-50 border-t border-slate-200 p-6 lg:p-8">
                                   {" "}
                <div className="flex justify-between items-center mb-3">
                                         {" "}
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                               <BookOpen size={16} />{" "}
                    Explanation                        {" "}
                  </h3>
                                                                 {" "}
                  {/* Mobile Ask Doubt Button */}                       {" "}
                  <button
                    onClick={() => setDoubtModalOpen(true)}
                    className="md:hidden flex items-center gap-1 text-indigo-600 text-xs font-bold px-2 py-1 bg-indigo-50 rounded border border-indigo-100"
                  >
                                               <MessageCircle size={14} /> Ask
                    Doubt                        {" "}
                  </button>
                                     {" "}
                </div>
                                                       {" "}
                <div className="prose prose-slate max-w-none text-slate-700">
                                         
                  {currentQ?.explanation ? (
                    <p>{currentQ.explanation}</p>
                  ) : (
                    <p className="italic text-slate-400">
                      No explanation provided for this question.
                    </p>
                  )}
                                     {" "}
                </div>
                                 
              </div>
                           {" "}
            </div>
                       
          </div>
                 {" "}
        </div>
                {/* Footer Navigation (Mobile) */}       {" "}
        <div className="bg-white border-t border-gray-200 p-4 lg:hidden flex justify-between">
                     
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 font-bold"
          >
                          Previous            
          </button>
                     
          <button
            disabled={currentIndex === processedQuestions.length - 1}
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white disabled:opacity-50 font-bold"
          >
                          Next            
          </button>
                 {" "}
        </div>
             {" "}
      </main>
            {/* --- MOBILE SIDEBAR OVERLAY --- */}     {" "}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
            {/* --- ASK DOUBT MODAL --- */}     {" "}
      {isDoubtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                     
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all scale-100 border border-gray-100">
                                        {/* Modal Header */}             {" "}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                               
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                   {" "}
                <MessageCircle className="text-indigo-600" size={20} />         
                          Raise a Doubt                  
              </h3>
                               
              <button
                onClick={() => setDoubtModalOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition"
              >
                                    <X size={20} className="text-gray-500" />   
                             
              </button>
                           {" "}
            </div>
                          {/* Modal Body */}             {" "}
            <div className="p-6">
                               
              <div className="mb-4">
                                   {" "}
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Ref Question
                </label>
                                   {" "}
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 line-clamp-2">
                                         {currentQ?.questionText}               
                     {" "}
                </p>
                                 
              </div>
                               
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Your Query
              </label>
                               
              <textarea
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                placeholder="Describe your doubt clearly..."
                className="w-full h-32 p-3 text-sm text-gray-700 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white transition"
              ></textarea>
                               {/* Success Message */}                 
              {submissionStatus === "success" && (
                <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-2 rounded-lg">
                                         <CheckCircle size={16} /> Doubt
                  submitted successfully!                    {" "}
                </div>
              )}
                           {" "}
            </div>
                          {/* Modal Footer */}             {" "}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl bg-gray-50">
                               
              <button
                onClick={() => setDoubtModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                                    Cancel                  
              </button>
                               
              <button
                onClick={handleDoubtSubmit}
                disabled={submissionStatus === "loading" || !doubtText.trim()}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition
                       ${submissionStatus === "loading" ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}
                       disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                                   {" "}
                {submissionStatus === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Submit Doubt
                  </>
                )}
                                 
              </button>
                           {" "}
            </div>
                       
          </div>
                 {" "}
        </div>
      )}
         {" "}
    </div>
  );
};

export default ReviewSolutions;
