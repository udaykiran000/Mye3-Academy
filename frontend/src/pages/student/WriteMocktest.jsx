import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// ✅ FIX: Use the correct, singular import path for your configured API instance
import api from '../../api/axios'; 
import toast from "react-hot-toast";
import { 
  Clock, Menu, X, ChevronLeft, ChevronRight, 
  Trophy, Home, CheckCircle 
} from 'lucide-react'; 

// 1. Base URL configuration (Used for image paths)
const BASE_URL = "http://localhost:8000";

// 2. Simple Spinner Component
const SimpleSpinner = ({ size = 24, color = "#06b6d4", className = "" }) => (
  <svg 
    className={`animate-spin ${className}`} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4"></circle>
    <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
  </svg>
);

// 3. IMAGE URL HELPER 
const getImageUrl = (path) => {
  if (!path) return null;
  // If it's already a full URL (e.g. Cloudinary), return as is
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  
  // Ensure there is a leading slash before appending to BASE_URL
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};

/* --------------------------------------
    TIMER COMPONENT
-------------------------------------- */
const Timer = ({ expiryTimestamp, onTimeUp }) => {
  const [remaining, setRemaining] = useState(expiryTimestamp - Date.now());

  const timerColor = remaining < 60000 * 5 // Less than 5 minutes
    ? "text-red-500" 
    : (remaining < 60000 * 15 ? "text-yellow-500" : "text-green-600");

  useEffect(() => {
    const interval = setInterval(() => {
      const r = expiryTimestamp - Date.now();
      if (r <= 1000) { 
        clearInterval(interval);
        setRemaining(0);
        onTimeUp();
      } else {
        setRemaining(r);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimestamp, onTimeUp]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className={`flex items-center text-xl font-extrabold ${timerColor} p-2 rounded-lg bg-white border`}>
      <Clock className="h-5 w-5 mr-2" />
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
};

/* --------------------------------------
    QUESTION RENDERER
-------------------------------------- */
const QuestionRenderer = ({ question, answers, handleAnswer }) => {
  if (!question) return null; 
  const qId = question.id || question._id;

  /* ----------------------------------------------------
      1. PASSAGE BLOCK (STANDALONE PASSAGE QUESTION)
  ----------------------------------------------------- */
  if (question.questionType === "passage") {
    return (
      <div className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded-xl shadow-inner mb-6">
        <h3 className="text-xl font-bold text-purple-900 mb-4">Reading Passage</h3>

        {question.questionText && (
          <p className="whitespace-pre-line mb-4 text-gray-700 leading-relaxed">
            {question.questionText}
          </p>
        )}

        {/* Passage Image */}
        {question.questionImageUrl && (
          <img 
            src={getImageUrl(question.questionImageUrl)} 
            className="max-h-80 w-full object-contain rounded-lg border my-4 bg-white" 
            alt="Passage" 
          />
        )}

        <p className="text-sm italic mt-4 text-purple-700 font-semibold">
          (Note: Questions based on this passage follow next.)
        </p>
      </div>
    );
  }

  /* ----------------------------------------------------
      2. MCQ / MANUAL QUESTION WITH OPTIONAL PARENT PASSAGE
  ----------------------------------------------------- */
  return (
    <div className="space-y-6">

      {/* Parent Passage Context */}
      {question.parentQuestionId && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-4 text-sm text-gray-700">
          <h4 className="font-bold text-blue-800 mb-2">Reference Passage:</h4>

          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">

            {/* Use parentQuestionId.questionText */}
            <p className="whitespace-pre-line mb-2">
              {question.parentQuestionId.questionText}
            </p>

            {/* Parent Passage Image */}
            {question.parentQuestionId.questionImageUrl && (
              <img 
                src={getImageUrl(question.parentQuestionId.questionImageUrl)} 
                className="h-32 w-auto mt-2 rounded border bg-white" 
                alt="Passage Reference" 
              />
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MAIN QUESTION TEXT
      ----------------------------------------------------- */}
      <h3 className="text-xl font-bold text-gray-800">
        Q: {question.questionText}
      </h3>

      {/* Question Image */}
      {question.questionImageUrl && (
        <img 
          src={getImageUrl(question.questionImageUrl)} 
          className="max-h-80 w-full object-contain rounded-lg border shadow-sm bg-white" 
          alt="Question" 
        />
      )}

      {/* ----------------------------------------------------
          OPTIONS / MANUAL ANSWER
      ----------------------------------------------------- */}
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
        <p className="text-sm font-semibold mb-3 text-gray-600">Choose your answer:</p>

        {/* MULTIPLE CHOICE */}
        {question.options.map((opt, idx) => {
          const chosen = answers[qId]?.selected?.[0] === idx;
          const optionLabel = String.fromCharCode(65 + idx);

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(qId, "mcq", idx)}
              className={`w-full text-left p-4 rounded-lg flex items-center space-x-4 transition-all duration-150 border-2 ${
                chosen
                  ? "bg-cyan-100 border-cyan-500 shadow-md"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0 ${
                  chosen ? "bg-cyan-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {optionLabel}
              </span>

              <div className="flex-grow">
                <span className="text-base text-gray-800">
                  {opt.text || `Option ${optionLabel}`}
                </span>

                {opt.imageUrl && (
                  <img
                    src={getImageUrl(opt.imageUrl)}
                    alt="option"
                    className="h-16 w-auto object-contain mt-2 rounded border bg-white"
                  />
                )}
              </div>
            </button>
          );
        })}

        {/* MANUAL ANSWER */}
        {question.questionType === "manual" && (
          <textarea
            rows="6"
            className="w-full border-2 border-gray-300 p-4 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none text-gray-700 shadow-inner"
            placeholder="Write your answer here..."
            value={answers[qId]?.manual || ""}
            onChange={(e) => handleAnswer(qId, "manual", e.target.value)}
          />
        )}
      </div>

      {/* FOOTER (marks / negative) */}
      <div className="flex justify-between items-center text-sm font-medium text-gray-600 pt-3 border-t border-gray-100">
        <span>Marks: <strong>{question.marks || 1}</strong></span>
        <span>Negative: <strong className="text-red-500">{question.negative || 0}</strong></span>
      </div>

    </div>
  );
};

/* --------------------------------------
    QUESTION NAVIGATION PANEL
-------------------------------------- */
const QuestionNavigationPanel = ({ questions, currentIndex, setCurrentIndex, answers, isMobile, onClose }) => {
  const getQuestionStatus = (qid) => {
    const answer = answers[qid];
    if (answer?.selected?.length || (answer?.manual && answer.manual.trim().length > 0)) {
      return 'answered';
    }
    return 'unanswered';
  };

  const statusMap = {
    answered: 'bg-green-500 text-white',
    unanswered: 'bg-red-500 text-white',
    current: 'bg-cyan-600 text-white ring-4 ring-cyan-200',
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };

  const handleNavClick = (index) => {
    setCurrentIndex(index);
    if (isMobile) onClose();
  };

  // Filter out passage containers from the navigation palette
  const actionableQuestions = questions.filter(q => q.questionType !== 'passage');
 
  return (
    <div className={`flex flex-col p-4 h-full overflow-y-auto ${isMobile ? 'bg-white' : 'bg-gray-50'}`}>
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex justify-between items-center">
        Question Palette
        {isMobile && (
          <button onClick={onClose} className="text-gray-500 p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        )}
      </h3>
      <div className="grid grid-cols-2 gap-2 text-xs font-medium mb-4 p-3 bg-white rounded-lg shadow-sm">
        <div className="flex items-center">
          <span className="w-4 h-4 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
          Answered ({actionableQuestions.filter(q => getQuestionStatus(q.id || q._id) === 'answered').length})
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 rounded-full bg-red-500 mr-2 flex-shrink-0"></span>
          Unanswered ({actionableQuestions.filter(q => getQuestionStatus(q.id || q._id) === 'unanswered').length})
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3 flex-grow content-start">
        {actionableQuestions.map((q, index) => {
          const qId = q.id || q._id;
          const status = getQuestionStatus(qId);
          let colorClass = statusMap.default;
          
          if (questions.indexOf(q) === currentIndex) colorClass = statusMap.current;
          else if (status === 'answered') colorClass = statusMap.answered;
          else if (status === 'unanswered') colorClass = statusMap.unanswered;
          
          return (
            <button 
              key={qId} 
              onClick={() => {
                // Find the true index in the full list
                const trueIndex = questions.indexOf(q);
                handleNavClick(trueIndex);
              }} 
              className={`h-10 w-10 flex items-center justify-center font-bold rounded-lg transition-colors duration-150 shadow-md ${colorClass}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};


/* --------------------------------------
    MAIN COMPONENT: WriteMocktest
-------------------------------------- */
const WriteMocktest = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Result Modal State
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  
  // ✅ State: Controls whether the user sees the dashboard/review buttons
  // This should be true if the student has purchased at least ONE mocktest (has dashboard)
  const [hasDashboardAccess, setHasDashboardAccess] = useState(false); 

  const handleAnswer = useCallback((qid, type, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: {
        selected: type === "mcq" ? [value] : prev[qid]?.selected || [],
        manual: type === "manual" ? value : prev[qid]?.manual || "",
      },
    }));
  }, []);
  
  const subjects = useMemo(() => {
  if (!attempt || !attempt.questions) return [];

  const normalized = attempt.questions
    .map((q) => (q.subject || q.category || "").trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase()); // normalize

  const uniqueSet = new Set(normalized);

  // Convert back to pretty format (Maths, English, Reasoning)
  const prettySubjects = [...uniqueSet].map(
    (s) => s.charAt(0).toUpperCase() + s.slice(1)
  );

  return ["all", ...prettySubjects];
}, [attempt]);



  const filteredQuestions = useMemo(() => {
    if (!attempt || !attempt.questions) return [];
    
    if (selectedSubject === "all") {
      // ✅ Show ALL questions exactly as backend sent (already randomised)
      return attempt.questions;
    }

    // ✅ Filter by subject OR category (to be safe for older data)
    return attempt.questions.filter(
      (q) =>
        q.subject === selectedSubject ||
        q.category === selectedSubject
    );
  }, [attempt, selectedSubject]);

  // ✅ FIX: define current safely based on filteredQuestions + index
  const current = filteredQuestions.length > 0 
    ? filteredQuestions[currentIndex] 
    : null;

  // Navigation questions (for palette) - uses the currently filtered list
  const navigationQuestions = useMemo(() => {
    if (!attempt || !attempt.questions) return [];
    return filteredQuestions; 
  }, [filteredQuestions]);

  
  /* --- SUBMIT HANDLER --- */
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      if (!window.confirm("Are you sure you want to submit the exam? This cannot be undone.")) {
        return;
      }
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isAutoSubmit ? "Auto-submitting test..." : "Submitting test...");

    // Format answers
    const formattedAnswers = Object.entries(answers).map(([id, a]) => ({
      questionId: id,
      selectedAnswer: a.manual?.trim() !== "" ? a.manual : (a.selected?.length ? a.selected[0] : null),
    }));

    const finalData = { answers: formattedAnswers };

    try {
      const res = await api.post(`/api/student/submit-test/${attemptId}`, finalData);
      
      toast.dismiss(toastId);
      
      setResultData({
        score: res.data.score || 0,
        totalMarks: res.data.totalMarks || attempt.totalMarks || 0, // Use backend totalMarks if available
      });
      setShowResultModal(true);

    } catch (err) {
      console.error("Submission Error:", err);
      toast.error(err.response?.data?.message || "Error submitting test", { id: toastId });
      setIsSubmitting(false);
    }
  }, [attemptId, answers, attempt, isSubmitting]);

  const handleTimeUp = useCallback(() => {
    toast.error("Time up! Auto-submitting...");
    handleSubmit(true);
  }, [handleSubmit]);


  /* --- LOAD ATTEMPT --- */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/student/attempt/${attemptId}`);
        setAttempt(data);
        
        // ✅ ACCESS CONTROL LOGIC:
        // hasDashboardAccess should come from backend:
        // true if student has purchased at least ONE mocktest (has dashboard)
        // Fallback to mocktestId.isPremium if you still use that.
        setHasDashboardAccess(
          !!(data.hasDashboardAccess || data.studentHasDashboard || data.mocktestId?.isPremium)
        ); 

        // Resume state if exists
        const restored = {};
        if (data.answers) {
          data.questions.forEach((q) => {
            const qId = q.id || q._id;
            const existingAnswer = data.answers.find(a => a.questionId === qId);
            // Convert selectedAnswer (which is a number for MCQs) back into a selectable format
            const selected = existingAnswer
              ? (typeof existingAnswer.selectedAnswer === "number" ? [existingAnswer.selectedAnswer] : [])
              : [];
            const manual = existingAnswer
              ? (typeof existingAnswer.selectedAnswer === "string" ? existingAnswer.selectedAnswer : "")
              : "";
            restored[qId] = { selected, manual };
          });
          setAnswers(restored);
        }

      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load test");
        navigate("/student-dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId, navigate]);

  useEffect(() => {
    if (currentIndex >= filteredQuestions.length && filteredQuestions.length > 0) {
      setCurrentIndex(filteredQuestions.length - 1);
    } else if (currentIndex < 0 && filteredQuestions.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredQuestions, currentIndex]);
  
  // ✅ Determine if THIS mocktest is free (price = 0)
  const isFreeTest = useMemo(() => {
    const price = attempt?.mocktestId?.price;
    if (price === undefined || price === null) return false;
    if (typeof price === "number") return price === 0;
    if (typeof price === "string") return price === "0";
    return false;
  }, [attempt]);


  if (loading || !attempt) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <SimpleSpinner size={50} color={"#06b6d4"} />
      </div>
    );
  }

  // Check if test is already completed and close the page if modal isn't showing
  if ((attempt.status === 'finished' || attempt.status === 'completed') && !showResultModal) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Exam Completed!</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">This attempt is closed.</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const endsAt = attempt.endsAt;
  const questionNumber = currentIndex + 1;
  const totalQuestionCount = filteredQuestions.length;
  
  const totalAnswered = filteredQuestions.filter(q => {
    const qId = q.id || q._id;
    return q.questionType !== 'passage' && 
      (answers[qId]?.selected?.length || (answers[qId]?.manual && answers[qId].manual.trim().length > 0));
  }).length;


  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-inter relative">
      
      {/* --- SCORE MODAL (WITH ACCESS CHECK) --- */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center border border-gray-200">
              
            {/* Icon and Text */}
            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-yellow-50">
              <Trophy className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Test Submitted!</h2>
            <p className="text-gray-500 mb-8">You have successfully completed the exam.</p>
            
            {/* --- SCORE BOX (ALWAYS VISIBLE) --- */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-6 mb-8">
              <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wide mb-1">Your Score</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-black text-gray-900">{resultData?.score}</span>
                <span className="text-xl text-gray-400 font-medium mb-1">/ {resultData?.totalMarks}</span> 
              </div>
            </div>

            {/* ✅ CONDITIONAL BUTTONS AND MESSAGE */}
            {hasDashboardAccess ? (
              /* 1. STUDENT HAS DASHBOARD (Purchased at least one mocktest) */
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { navigate(`/student/review/${attemptId}`); }}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Review Solutions
                </button>

                <button 
                  onClick={() => navigate("/student-dashboard")}
                  className="w-full py-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </button>
              </div>
            ) : isFreeTest ? (
              /* 2. FREE TEST + NO DASHBOARD:
                  👉 Only show total score (no extra buttons below) */
              <div className="mt-2"></div>
            ) : (
              /* 3. NON-FREE TEST + NO DASHBOARD (fallback case) */
              <div className="mt-4 text-center">
                <p className="text-gray-700 font-medium mb-4">
                  Thank you for completing the test!
                </p>
                <p className="text-sm text-gray-500">
                  To access the Review Solutions and your Dashboard, please purchase a plan.
                </p>
                <button 
                  onClick={() => navigate("/pricing")} 
                  className="mt-6 px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md"
                >
                  View Pricing
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-lg border-b border-gray-200">
        <div className="flex justify-between items-center px-4 py-3 sm:px-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsNavOpen(true)} className="lg:hidden p-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block truncate">
              {attempt.mocktestId?.title || 'Mock Test'}
            </h1>
          </div>
          <Timer expiryTimestamp={new Date(endsAt).getTime()} onTimeUp={handleTimeUp} />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-grow overflow-hidden pt-[60px]"> 
        <div className="flex-1 flex flex-col overflow-hidden">
          
          <div className="sticky top-0 z-10 bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center border-b border-gray-200">
            <h2 className="text-lg font-semibold text-cyan-700 mb-2 sm:mb-0">
              Question {questionNumber} of {totalQuestionCount} 
              <span className="text-gray-500 ml-4 font-normal text-sm">({totalAnswered} Answered)</span>
            </h2>
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedSubject}
                onChange={(e) => { setSelectedSubject(e.target.value); setCurrentIndex(0); }}
                className="block w-full sm:w-48 px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
              >
                <option value="all">All Sections</option>
                {subjects.slice(1).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-grow custom-scrollbar">
            {current && (current.id || current._id) ? (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <QuestionRenderer 
                  question={current} 
                  answers={answers} 
                  handleAnswer={handleAnswer} 
                />
              </div>
            ) : (
              <div className="text-center p-10 bg-white rounded-xl shadow-lg text-gray-500">
                {filteredQuestions.length === 0 ? "No questions match the current subject filter." : "No questions found in this section or test."}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 bg-white p-4 shadow-t-lg border-t border-gray-200 flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                disabled={currentIndex === 0 || filteredQuestions.length === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="px-4 py-2 flex items-center bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors font-semibold"
              >
                <ChevronLeft className="h-5 w-5 mr-1" /> Previous
              </button>
              <button
                disabled={currentIndex === filteredQuestions.length - 1 || filteredQuestions.length === 0}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-4 py-2 flex items-center bg-cyan-600 text-white rounded-lg disabled:opacity-50 hover:bg-cyan-700 transition-colors font-semibold"
              >
                Next <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </div>
            
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className={`px-6 py-3 flex items-center justify-center font-bold rounded-xl transition-all duration-300 shadow-lg transform active:scale-95 ${
                isSubmitting ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <SimpleSpinner size={20} color={"#ffffff"} className="mr-2" /> Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" /> Final Submit
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="hidden lg:block w-72 flex-shrink-0 border-l border-gray-200 overflow-y-auto custom-scrollbar">
          <QuestionNavigationPanel 
            questions={navigationQuestions} 
            currentIndex={currentIndex} 
            setCurrentIndex={setCurrentIndex} 
            answers={answers}
            isMobile={false}
          />
        </aside>
      </div>

      {isNavOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex lg:hidden">
          <div className="w-full h-full bg-white max-w-sm absolute right-0 shadow-2xl">
            <QuestionNavigationPanel 
              questions={navigationQuestions} 
              currentIndex={currentIndex} 
              setCurrentIndex={setCurrentIndex} 
              answers={answers}
              isMobile={true}
              onClose={() => setIsNavOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 

export default WriteMocktest;
