import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
// ✅ FIX: Use the correct, singular import path for your configured API instance
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Clock,
  Menu,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Home,
  CheckCircle,
} from "lucide-react";

// 1. Base URL configuration (Used for image paths)
const BASE_URL = "import.meta.env.VITE_SERVER_URL";

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
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill={color}
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    ></path>
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

  const timerColor =
    remaining < 60000 * 5 // Less than 5 minutes
      ? "text-red-500"
      : remaining < 60000 * 15
        ? "text-yellow-500"
        : "text-green-600";

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
    <div
      className={`flex items-center text-xl font-extrabold ${timerColor} p-2 rounded-lg bg-white border`}
    >
      <Clock className="h-5 w-5 mr-2" />
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
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
        <h3 className="text-xl font-bold text-purple-900 mb-4">
          Reading Passage
        </h3>

        {question.title && (
          <p className="whitespace-pre-line mb-4 text-gray-700 leading-relaxed">
            {question.title}
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
              {question.parentQuestionId.title}
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
        Q: {question.title || question.questionText}
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
        <p className="text-sm font-semibold mb-3 text-gray-600">
          Choose your answer:
        </p>

        {/* MULTIPLE CHOICE */}
        {question.options.map((opt, idx) => {
          const chosen = answers[qId]?.selected?.[0] === idx;
          const optionLabel = String.fromCharCode(65 + idx);

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(qId, "mcq", idx)}
              className={`w-full text-left p-4 rounded-lg flex items-center space-x-4 transition-all duration-150 border-2 ${chosen
                  ? "bg-cyan-100 border-cyan-500 shadow-md"
                  : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0 ${chosen
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-200 text-gray-600"
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

      {/* FOOTER (dynamic markings) */}
      <div className="flex justify-between items-center text-sm font-medium text-gray-600 pt-3 border-t border-gray-100">
        <span>
          Marks: <strong>{question.marksPerQuestion || question.marks || 1}</strong>
        </span>
        <span>
          Negative:{" "}
          <strong className="text-red-500">
            {question.globalNegative !== undefined && question.globalNegative !== null
              ? question.globalNegative
              : (question.negative || 0)}
          </strong>
        </span>
      </div>
    </div>
  );
};

/* --------------------------------------
    QUESTION NAVIGATION PANEL
-------------------------------------- */
const QuestionNavigationPanel = ({
  questions,
  currentIndex,
  setCurrentIndex,
  answers,
  isMobile,
  onClose,
  expiryTimestamp,
  onTimeUp,
}) => {
  const getQuestionStatus = (qid) => {
    const answer = answers[qid];
    if (
      answer?.selected?.length ||
      (answer?.manual && answer.manual.trim().length > 0)
    ) {
      return "answered";
    }
    return "unanswered";
  };

  const statusMap = {
    answered: "bg-green-500 text-white",
    unanswered: "bg-red-500 text-white",
    current: "bg-cyan-600 text-white ring-4 ring-cyan-200",
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  const handleNavClick = (index) => {
    setCurrentIndex(index);
    if (isMobile) onClose();
  };

  // Filter out passage containers from the navigation palette
  const actionableQuestions = questions.filter(
    (q) => q.questionType !== "passage",
  );

  return (
    <div
      className={`flex flex-col p-4 h-full overflow-y-auto ${isMobile ? "bg-white" : "bg-gray-50"}`}
    >
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex justify-between items-center">
        Question Palette
        {isMobile && (
          <button
            onClick={onClose}
            className="text-gray-500 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        )}
      </h3>
      {/* Exam Lockdown: Timer relocated from header to sidebar */}
      <div className="mb-4">
        <Timer
          expiryTimestamp={expiryTimestamp}
          onTimeUp={onTimeUp}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-medium mb-4 p-3 bg-white rounded-lg shadow-sm">
        <div className="flex items-center">
          <span className="w-4 h-4 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
          Answered (
          {
            actionableQuestions.filter(
              (q) => getQuestionStatus(q.id || q._id) === "answered",
            ).length
          }
          )
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 rounded-full bg-red-500 mr-2 flex-shrink-0"></span>
          Unanswered (
          {
            actionableQuestions.filter(
              (q) => getQuestionStatus(q.id || q._id) === "unanswered",
            ).length
          }
          )
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3 flex-grow content-start">
        {actionableQuestions.map((q, index) => {
          const qId = q.id || q._id;
          const status = getQuestionStatus(qId);
          let colorClass = statusMap.default;

          if (questions.indexOf(q) === currentIndex)
            colorClass = statusMap.current;
          else if (status === "answered") colorClass = statusMap.answered;
          else if (status === "unanswered") colorClass = statusMap.unanswered;

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
  const { userData } = useSelector((state) => state.user);

  // ── FULLSCREEN LOCKDOWN ──
  const [fsWarning, setFsWarning] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const MAX_VIOLATIONS = 3;

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    setFsWarning(false);
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const isSubmittedRef = React.useRef(false); // tracks if exam is done
  const endsAt = attempt?.endsAt;

  const handleAnswer = useCallback((qid, type, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: {
        selected: type === "mcq" ? [value] : prev[qid]?.selected || [],
        manual: type === "manual" ? value : prev[qid]?.manual || "",
      },
    }));
  }, []);

  const isFreeTest = useMemo(() => {
    const price = attempt?.mocktestId?.price;
    if (price === undefined || price === null) return false;
    if (typeof price === "number") return price === 0;
    if (typeof price === "string") return price === "0";
    return false;
  }, [attempt]);

  const subjects = useMemo(() => {
    if (!attempt || !attempt.questions) return [];
    const normalized = attempt.questions
      .map((q) => (q.subject || q.category || "").trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    const uniqueSet = new Set(normalized);
    const prettySubjects = [...uniqueSet].map(
      (s) => s.charAt(0).toUpperCase() + s.slice(1),
    );
    return ["all", ...prettySubjects];
  }, [attempt]);

  const filteredQuestions = useMemo(() => {
    if (!attempt || !attempt.questions) return [];
    if (selectedSubject === "all") return attempt.questions;
    return attempt.questions.filter(
      (q) => q.subject === selectedSubject || q.category === selectedSubject,
    );
  }, [attempt, selectedSubject]);

  const current = useMemo(() => {
    return filteredQuestions.length > 0 ? filteredQuestions[currentIndex] : null;
  }, [filteredQuestions, currentIndex]);

  const navigationQuestions = useMemo(() => {
    return filteredQuestions;
  }, [filteredQuestions]);

  const actionableQuestions = useMemo(() => {
    return filteredQuestions.filter(q => q.questionType !== "passage");
  }, [filteredQuestions]);

  const currentActionableIndex = useMemo(() => {
    if (!current || current.questionType === "passage") return -1;
    return actionableQuestions.indexOf(current);
  }, [current, actionableQuestions]);

  const totalAnswered = useMemo(() => {
    return actionableQuestions.filter((q) => {
      const qId = q.id || q._id;
      return (
        answers[qId]?.selected?.length ||
        (answers[qId]?.manual && answers[qId].manual.trim().length > 0)
      );
    }).length;
  }, [actionableQuestions, answers]);

  // Result Modal State
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  // ✅ State: Controls whether the user sees the dashboard/review buttons
  // This should be true if the student has purchased at least ONE mocktest (has dashboard)
  const [hasDashboardAccess, setHasDashboardAccess] = useState(false);





  /* --- SUBMIT HANDLER --- */
  const handleSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (!isAutoSubmit) {
        if (
          !window.confirm(
            "Are you sure you want to submit the exam? This cannot be undone.",
          )
        ) {
          return;
        }
      }

      if (isSubmitting) return;
      exitFullscreen(); // ← exit fullscreen on submit
      setIsSubmitting(true);
      const toastId = toast.loading(
        isAutoSubmit ? "Auto-submitting test..." : "Submitting test...",
      );

      // Format answers
      const formattedAnswers = Object.entries(answers).map(([id, a]) => ({
        questionId: id,
        selectedAnswer:
          a.manual?.trim() !== ""
            ? a.manual
            : a.selected?.length
              ? a.selected[0]
              : null,
      }));

      const finalData = { answers: formattedAnswers };

      try {
        const res = await api.post(
          `/api/student/submit-test/${attemptId}`,
          finalData,
        );

        toast.dismiss(toastId);

        exitFullscreen();
        isSubmittedRef.current = true; // mark exam done — stop all warnings
        setFsWarning(false);
        setResultData({
          score: res.data.score || 0,
          totalMarks: res.data.totalMarks || attempt.totalMarks || 0,
        });
        setShowResultModal(true);
      } catch (err) {
        console.error("Submission Error:", err);
        toast.error(err.response?.data?.message || "Error submitting test", {
          id: toastId,
        });
        setIsSubmitting(false);
      }
    },
    [attemptId, answers, attempt, isSubmitting],
  );

  const handleTimeUp = useCallback(() => {
    toast.error("Time up! Auto-submitting...");
    exitFullscreen();
    handleSubmit(true);
  }, [handleSubmit]);

  /* --- LOAD ATTEMPT --- */
  useEffect(() => {
    // Auto-enter fullscreen when exam starts
    enterFullscreen();

    // Detect tab switch / window blur
    const handleVisibilityChange = () => {
      if (isSubmittedRef.current) return; // exam done, ignore
      if (document.hidden) {
        setFsWarning(true);
        setTabViolations((v) => {
          const next = v + 1;
          if (next >= MAX_VIOLATIONS) {
            toast.error("Too many tab switches! Auto-submitting...");
            handleSubmit(true);
          }
          return next;
        });
      }
    };
    const handleBlur = () => {
      if (isSubmittedRef.current) return; // exam done, ignore
      if (!document.hidden) {
        setFsWarning(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- LOAD ATTEMPT --- */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/student/attempt/${attemptId}`);
        if (data.success && data.attempt) {
          setAttempt(data.attempt);
        } else {
          // Fallback for older structure or errors
          setAttempt(data);
        }

        // ✅ ACCESS CONTROL LOGIC:
        // hasDashboardAccess should come from backend:
        // true if student has purchased at least ONE mocktest (has dashboard)
        // Fallback to mocktestId.isPremium if you still use that.
        setHasDashboardAccess(
          !!(
            data.hasDashboardAccess ||
            data.studentHasDashboard ||
            data.mocktestId?.isPremium
          ),
        );

        // Resume state if exists
        const restored = {};
        if (data.attempt.answers?.length > 0) {
          data.attempt.questions.forEach((q) => {
            const qId = q.id || q._id;
            const existingAnswer = data.attempt.answers.find(
              (a) => a.questionId === qId || a.questionId?.toString() === qId?.toString(),
            );
            // Convert selectedAnswer (which is a number for MCQs) back into a selectable format
            const selected = existingAnswer
              ? typeof existingAnswer.selectedAnswer === "number"
                ? [existingAnswer.selectedAnswer]
                : []
              : [];
            const manual = existingAnswer
              ? typeof existingAnswer.selectedAnswer === "string"
                ? existingAnswer.selectedAnswer
                : ""
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
    if (
      currentIndex >= filteredQuestions.length &&
      filteredQuestions.length > 0
    ) {
      setCurrentIndex(filteredQuestions.length - 1);
    } else if (currentIndex < 0 && filteredQuestions.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredQuestions, currentIndex]);



  if (loading || !attempt) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <SimpleSpinner size={50} color={"#06b6d4"} />
      </div>
    );
  }

  // Check if test is already completed and close the page if modal isn't showing
  if (
    (attempt.status === "finished" || attempt.status === "completed") &&
    !showResultModal
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Exam Completed!
        </h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          This attempt is closed.
        </p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }



  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans relative">

      {/* ── FULLSCREEN / TAB-SWITCH WARNING OVERLAY ── */}
      {fsWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm mx-4 p-8 text-center shadow-2xl border-t-4 border-red-500">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-black text-red-600 uppercase tracking-widest mb-2">
              Security Protocol Active
            </h2>
            <p className="text-[13px] text-slate-600 mb-1">
              Switching tabs or exiting fullscreen is monitored.
            </p>
            <p className="text-[11px] text-red-500 font-bold mb-6">
              Warning {tabViolations} / {MAX_VIOLATIONS}
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full py-3 bg-[#21b731] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#1a9227] transition-colors shadow-lg"
            >Continue Exam</button>
          </div>
        </div>
      )}

      {/* --- SCORE MODAL --- */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center border border-gray-200">
            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-yellow-50">
              <Trophy className="w-10 h-10 text-yellow-600" />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Test Submitted!
            </h2>

            <p className="text-gray-500 mb-8">
              You have successfully completed the exam.
            </p>

            {/* SCORE */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-6 mb-8">
              <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wide mb-1">
                Your Score
              </p>

              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-black text-gray-900">
                  {resultData?.score}
                </span>
                <span className="text-xl text-gray-400 font-medium mb-1">
                  / {resultData?.totalMarks}
                </span>
              </div>
            </div>

            {/* BUTTONS — SAME AS FIRST CODE */}
            <div className="flex flex-col gap-3">
              {/* REVIEW */}
              <button
                onClick={() => navigate(`/student/review/${attemptId}`)}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Review Answers
              </button>

              {/* HOME */}
              <button
                onClick={() => navigate("/student-dashboard")}
                className="w-full py-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Exit to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: pt-[60px] removed to hide the header space */}
      <div className="flex flex-grow overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center border-b border-gray-200">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 mb-1 self-start">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {current?.questionType === "passage" ? "READING CONTEXT" : "LIVE EXAMINATION"}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                {current?.questionType === "passage" ? (
                  "Reading Passage"
                ) : (
                  <>Question {currentActionableIndex + 1} of {actionableQuestions.length}</>
                )}
                <span className="text-slate-400 ml-4 font-bold text-sm">
                  ({totalAnswered} Answered)
                </span>
              </h2>
            </div>
            <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentIndex(0);
                }}
                className="block w-full sm:w-48 px-3 py-2 border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 text-[11px] font-black uppercase tracking-widest"
              >
                <option value="all">All Sections</option>
                {subjects.slice(1).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-grow custom-scrollbar">
            {current && (current.id || current._id) ? (
              <div className="bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
                <div className="lg:hidden mb-4">
                  <Timer
                    expiryTimestamp={new Date(endsAt).getTime()}
                    onTimeUp={handleTimeUp}
                  />
                </div>
                <QuestionRenderer
                  question={{
                    ...current,
                    marksPerQuestion: attempt.marksPerQuestion !== undefined && attempt.marksPerQuestion !== null
                      ? attempt.marksPerQuestion
                      : (attempt.totalQuestions > 0
                        ? (attempt.totalMarks / attempt.totalQuestions).toFixed(1).replace(/\.0$/, '')
                        : current.marks),
                    globalNegative: attempt.negativeMarking
                  }}
                  answers={answers}
                  handleAnswer={handleAnswer}
                />
              </div>
            ) : (
              <div className="text-center p-10 bg-white border border-slate-200 text-gray-400 font-bold uppercase text-[11px] tracking-widest">
                {filteredQuestions.length === 0
                  ? "No questions match the current subject filter."
                  : "No questions found in this section or test."}
              </div>
            )}
          </div>

          {/* ── BOTTOM NAV BAR ── */}
          <div className="sticky bottom-0 z-10 bg-white px-4 py-3 border-t border-slate-200 flex justify-center items-center gap-3">
            <button
              disabled={currentIndex === 0 || filteredQuestions.length === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="px-6 py-3 flex items-center bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:grayscale transition-colors font-black uppercase text-[10px] tracking-widest"
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </button>
            <button
              disabled={
                currentIndex === filteredQuestions.length - 1 ||
                filteredQuestions.length === 0
              }
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="px-6 py-3 flex items-center bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-30 disabled:grayscale transition-colors font-black uppercase text-[10px] tracking-widest"
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>

        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 border-l border-slate-200 bg-slate-50/30">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <QuestionNavigationPanel
              questions={navigationQuestions}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              answers={answers}
              isMobile={false}
              expiryTimestamp={new Date(endsAt).getTime()}
              onTimeUp={handleTimeUp}
            />
          </div>
          {/* ── FINAL SUBMIT pinned at bottom of sidebar ── */}
          <div className="border-t border-slate-200 p-4 flex-shrink-0 bg-white">
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className={`w-full py-4 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg ${isSubmitting
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
                }`}
            >
              {isSubmitting ? (
                <><SimpleSpinner size={18} color="#fff" /> PROCESSING...</>
              ) : (
                <><CheckCircle className="h-5 w-5" /> Final Submit</>
              )}
            </button>
          </div>
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
              expiryTimestamp={new Date(endsAt).getTime()}
              onTimeUp={handleTimeUp}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WriteMocktest;
