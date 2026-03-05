// frontend/src/pages/student/InstructionsPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchMyMockTests,
  clearMyMockTestsStatus,
} from "../../redux/userSlice";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import {
  Clock,
  HelpCircle,
  FileText,
  Zap,
  CheckSquare,
  Tag,
  Play,
  BarChart2,
  AlertCircle,
  Info,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

const InstructionsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mocktestId } = useParams();

  const { myMockTests, myMockTestsStatus } = useSelector((state) => state.user);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    dispatch(fetchMyMockTests());
  }, [dispatch, mocktestId]);

  useEffect(() => {
    const fetchTestDetails = async (id) => {
      try {
        setLoading(true);
        console.log("📡 FETCHING STUDENT-SPECIFIC DETAILS FOR:", id);
        // Use student-specific route for retry status
        const { data } = await api.get(`/api/student/my-mocktest/${id}`);
        
        if (data.success && data.test) {
          setTest(data.test);
        } else {
          setFetchError(true);
        }
      } catch (error) {
        console.error("❌ FETCH ERROR:", error);
        // Fallback to public
        try {
          const { data } = await api.get(`/api/public/mocktests/${id}`);
          if (data.success && data.test) setTest(data.test);
          else setFetchError(true);
        } catch (e) {
          setFetchError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (mocktestId) {
      // 1. First try to find in Redux store (if available)
      const foundInStore = myMockTests?.find((t) => t._id === mocktestId);

      if (foundInStore) {
        console.log("✅ FOUND IN STORE:", foundInStore.title);
        setTest(foundInStore);
      }
      // 2. If not in store, and store is not loading, fetch from API
      else if (myMockTestsStatus !== "loading") {
        console.log("⚠️ NOT IN STORE, FETCHING API...");
        fetchTestDetails(mocktestId);
      }
    }
  }, [myMockTestsStatus, myMockTests, mocktestId]);

  // Fail-safe: If still loading after 5 seconds, show error
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((myMockTestsStatus === "loading" || !test) && myMockTestsStatus !== "failed") {
        // Did not load in time
        setFetchError(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [myMockTestsStatus, test]);

  const handleStartTest = async () => {
    if (loading || !test) return;
    if (test.isPurchaseRequired) {
      toast.error("Attempt limit reached. Please purchase again.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Preparing your test...");
    try {
      const { data } = await api.post(`/api/student/start-test`, {
        mockTestId: mocktestId,
      });
      toast.success("Exam started!", { id: toastId });
      dispatch(clearMyMockTestsStatus());
      navigate(`/student/write-test/${data.attemptId}`, {
        state: { endsAt: data.endsAt },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error starting test.", {
        id: toastId,
      });
      setLoading(false);
    }
  };

  // Show loader if we don't have a test yet and no error has occurred
  if (!test && !fetchError) {
    return (
      <div className="flex flex-col justify-center items-center h-[90vh] bg-slate-50">
        <ClipLoader size={40} color={"#4f46e5"} />
        <p className="mt-4 text-slate-500 font-medium">
          Loading test details...
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col justify-center items-center h-[90vh] bg-slate-50">
        <AlertCircle size={40} className="text-red-500" />
        <p className="mt-4 text-slate-500 font-medium">
          Unable to load test details. Please try again later.
        </p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  if (
    myMockTestsStatus === "succeeded" &&
    !myMockTests?.find((t) => t._id === mocktestId) &&
    test.price > 0
  ) {
    return <Navigate to={`/mocktests/${mocktestId}`} replace />;
  }

  const {
    title,
    description,
    totalQuestions,
    durationMinutes,
    subjects,
    totalMarks,
  } = test;
  const isCompleted = test.status === "completed";
  const isInProgress = test.status === "in-progress";
  const isReadyToRetry = test.status === "ready_to_retry";
  const isPurchaseRequired = test.isPurchaseRequired;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 mt-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <button
            onClick={() => navigate("/student-dashboard?tab=my-tests")}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={12} /> Go Back
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 font-black text-sm italic tracking-tighter text-slate-700 hover:text-blue-600 transition-colors"
          >
            <div className="bg-blue-600 p-1">
              <GraduationCap className="text-white w-3 h-3" strokeWidth={3} />
            </div>
            Mye3 Academy
          </Link>
        </div>

        {/* HEADER SECTION — SHARP */}
        <div className="bg-white border border-slate-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-600 p-1.5">
              <FileText className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{title}</h1>
          </div>
          <p className="text-slate-500 text-[11px] ml-10">
            Please read all instructions carefully before starting the examination.
          </p>
        </div>

        {/* ATTEMPT INFO ALERT — SHARP */}
        {test.price > 0 && (
          <div
            className={`mb-4 p-3 border flex items-center gap-4 ${isPurchaseRequired
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
          >
            <AlertCircle size={18} />
            <div className="text-[11px]">
              <span className="font-bold uppercase tracking-wide">Attempt Policy:</span> You have used{" "}
              <strong>{test.attemptsMade || 0}</strong> of{" "}
              <strong>{test.maxAttempts || 1}</strong> consumed.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* STATS TILES — SHARP */}
          {[
            {
              label: "Questions",
              value: totalQuestions,
              icon: HelpCircle,
              color: "text-orange-600",
            },
            {
              label: "Time Limit",
              value: test.durationMinutes > 0
                ? `${test.durationMinutes} Mins`
                : (test.totalQuestions > 0 ? `${test.totalQuestions * 2} Mins` : "—"),
              icon: Clock,
              color: "text-blue-600",
            },
            {
              label: "Max Marks",
              value: totalMarks,
              icon: BarChart2,
              color: "text-emerald-600",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 p-4 flex items-center gap-3 shadow-sm"
            >
              <item.icon className={item.color} size={24} />
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-base font-black text-slate-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT CARD — SHARP */}
        <div className="bg-white border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-slate-700 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
              <Info size={16} className="text-slate-400" /> Exam Guidelines
            </h2>
          </div>

          <div className="p-5 space-y-6">
            <section>
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2">
                Description
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                {description ||
                  "General mock test instructions apply to this examination."}
              </p>
            </section>

            <section className="grid md:grid-cols-2 gap-6 border-t border-slate-50 pt-6">
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Rules & Regulations
                </h3>
                <ul className="text-[10px] text-slate-500 space-y-2 font-bold uppercase tracking-tight">
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 bg-blue-600 mt-1 shrink-0"></span> Stable internet required.
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 bg-blue-600 mt-1 shrink-0"></span> Refreshing will end attempt.
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 bg-blue-600 mt-1 shrink-0"></span> Timer keeps running.
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Marking Scheme
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 p-2 border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-0.5">
                      Correct
                    </p>
                    <p className="text-xs font-black text-emerald-700">
                      +{test.marksPerQuestion || 1} M
                    </p>
                  </div>
                  <div className="bg-red-50 p-2 border border-red-100">
                    <p className="text-[9px] font-black text-red-600 uppercase mb-0.5">
                      Wrong
                    </p>
                    <p className="text-xs font-black text-red-700">
                      -{test.negativeMarking || 0} M
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {subjects?.length > 0 && (
              <section className="pt-5 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">
                  Included Sections
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-widest border border-slate-200"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ACTION BUTTON AREA — SHARP */}
        <div className="text-center space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            {isPurchaseRequired ? (
              <button
                onClick={() => navigate(`/mocktests/${mocktestId}`)}
                className="w-full md:w-72 bg-red-600 hover:bg-red-700 text-white font-black py-3.5 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
              >
                <Zap size={16} /> Buy New Attempt
              </button>
            ) : (isReadyToRetry || !isCompleted || isInProgress) ? (
              <>
                <button
                  onClick={handleStartTest}
                  disabled={loading}
                  className={`w-full md:w-72 font-black py-3.5 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[11px] ${isInProgress
                    ? "bg-amber-600 hover:bg-amber-700"
                    : isReadyToRetry ? "bg-[#21b731] hover:bg-[#1a9227]" : "bg-blue-600 hover:bg-blue-700"
                    } text-white disabled:bg-slate-300`}
                >
                  {loading ? (
                    <ClipLoader size={16} color="#fff" />
                  ) : (
                    <Play size={16} fill="white" />
                  )}
                  {isInProgress ? "Resume Examination" : isReadyToRetry ? "Start Re-attempt" : "Start Examination"}
                </button>
                
                {test.attemptsMade > 0 && (
                   <button
                    onClick={() => navigate(`/student/test-attempts/${mocktestId}`)}
                    className="w-full md:w-72 bg-white border-2 border-slate-800 text-slate-800 hover:bg-slate-50 font-black py-3.5 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
                  >
                    <BarChart2 size={16} /> View All Attempts
                  </button>
                )}
              </>
            ) : isCompleted ? (
              <button
                onClick={() =>
                  navigate(`/student/test-attempts/${mocktestId}`)
                }
                className="w-full md:w-72 bg-indigo-900 hover:bg-black text-white font-black py-3.5 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
              >
                <BarChart2 size={16} /> View Analytics Report
              </button>
            ) : null}
          </div>

          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            AUTO-SUBMIT AT 00:00
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPage;

// style updated - reduced card sizes
