// frontend/src/pages/student/InstructionsPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
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
} from "lucide-react";

const InstructionsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mocktestId } = useParams();

  const { myMockTests, myMockTestsStatus } = useSelector((state) => state.user);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchMyMockTests());
  }, [dispatch, mocktestId]);

  useEffect(() => {
    const fetchTestDetails = async (id) => {
      try {
        const { data } = await api.get(`/api/public/mocktests/${id}`);
        setTest(data);
      } catch (error) {
        console.error("Failed to fetch public test details:", error);
      }
    };

    if (myMockTestsStatus === "succeeded") {
      const foundTest = myMockTests.find((t) => t._id === mocktestId);
      if (foundTest) {
        setTest(foundTest);
      } else {
        fetchTestDetails(mocktestId);
      }
    }
  }, [myMockTestsStatus, myMockTests, mocktestId]);

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

  if (myMockTestsStatus === "loading" || !test) {
    return (
      <div className="flex flex-col justify-center items-center h-[90vh] bg-slate-50">
        <ClipLoader size={40} color={"#4f46e5"} />
        <p className="mt-4 text-slate-500 font-medium">
          Fetching instructions...
        </p>
      </div>
    );
  }

  if (
    myMockTestsStatus === "succeeded" &&
    !myMockTests.find((t) => t._id === mocktestId) &&
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
  const isPurchaseRequired = test.isPurchaseRequired;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 mt-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER SECTION */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          </div>
          <p className="text-slate-500 text-sm ml-11">
            Please read all instructions carefully before starting the
            examination.
          </p>
        </div>

        {/* ATTEMPT INFO ALERT */}
        {test.price > 0 && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-center gap-4 ${
              isPurchaseRequired
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            <AlertCircle size={20} />
            <div className="text-sm">
              <span className="font-bold">Attempt Policy:</span> You have used{" "}
              <strong>{test.attemptsMade || 0}</strong> of{" "}
              <strong>{test.maxAttempts || 1}</strong> allowed attempts.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* STATS TILES */}
          {[
            {
              label: "Questions",
              value: totalQuestions,
              icon: HelpCircle,
              color: "text-orange-500",
            },
            {
              label: "Time Limit",
              value: `${durationMinutes} Mins`,
              icon: Clock,
              color: "text-blue-500",
            },
            {
              label: "Max Marks",
              value: totalMarks,
              icon: BarChart2,
              color: "text-emerald-500",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4"
            >
              <item.icon className={item.color} size={28} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  {item.label}
                </p>
                <p className="text-lg font-bold text-slate-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <Info size={18} className="text-slate-400" /> Exam Guidelines
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                Description
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {description ||
                  "General mock test instructions apply to this examination."}
              </p>
            </section>

            <section className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Rules & Regulations
                </h3>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex gap-2">
                    <span>•</span> Ensure stable internet connection.
                  </li>
                  <li className="flex gap-2">
                    <span>•</span> Do not refresh or close the browser tab.
                  </li>
                  <li className="flex gap-2">
                    <span>•</span> The timer will not stop once started.
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Marking Scheme
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">
                      Correct
                    </p>
                    <p className="text-sm font-bold text-emerald-700">+1</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase">
                      Wrong
                    </p>
                    <p className="text-sm font-bold text-red-700">
                      -{test.negativeMarking || 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      Skip
                    </p>
                    <p className="text-sm font-bold text-slate-700">0</p>
                  </div>
                </div>
              </div>
            </section>

            {subjects?.length > 0 && (
              <section className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Included Sections
                </h3>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ACTION BUTTON AREA */}
        <div className="text-center space-y-4">
          {isPurchaseRequired ? (
            <button
              onClick={() => navigate(`/mocktests/${mocktestId}`)}
              className="w-full md:w-80 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-md shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Zap size={18} /> Buy New Attempt
            </button>
          ) : isCompleted ? (
            <button
              onClick={() =>
                navigate(`/student/report/${test.latestAttemptId}`)
              }
              className="w-full md:w-80 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-md shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <BarChart2 size={18} /> View Performance Report
            </button>
          ) : (
            <button
              onClick={handleStartTest}
              disabled={loading}
              className={`w-full md:w-80 font-bold py-3.5 rounded-md shadow-md transition-all flex items-center justify-center gap-2 mx-auto ${
                isInProgress
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white disabled:bg-slate-300`}
            >
              {loading ? (
                <ClipLoader size={18} color="#fff" />
              ) : (
                <Play size={18} />
              )}
              {isInProgress ? "Resume Examination" : "Start Examination Now"}
            </button>
          )}

          <p className="text-xs text-slate-400 font-medium">
            Note: System will automatically submit the test when the timer
            reaches zero.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPage;
