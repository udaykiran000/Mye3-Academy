// frontend/src/pages/student/InstructionsPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyMockTests, clearMyMockTestsStatus } from "../../redux/userSlice"; 
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
  AlertTriangle 
} from 'lucide-react';

const InstructionsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mocktestId } = useParams(); 
  
  const { myMockTests, myMockTestsStatus } = useSelector((state) => state.user);
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------------------------------
      ALWAYS FETCH PURCHASED TESTS (FIX #1)
  ---------------------------------------------------------- */
  useEffect(() => {
    // Fetch every time component mounts to ensure fresh data
    dispatch(fetchMyMockTests());  
  }, [dispatch, mocktestId]);

  /* ---------------------------------------------------------
      LOAD TEST DETAILS FROM PURCHASED LIST OR PUBLIC API
  ---------------------------------------------------------- */
  useEffect(() => {
    const fetchTestDetails = async (id) => {
      try {
        // Fetch test details for non-purchased/public view
        const { data } = await api.get(`/api/public/mocktests/${id}`);
        setTest(data);
      } catch (error) {
        console.error("Failed to fetch public test details:", error);
        // Optionally navigate away if public test not found or accessible
      }
    };

    if (myMockTestsStatus === "succeeded") {
      const foundTest = myMockTests.find(t => t._id === mocktestId);
      if (foundTest) {
        setTest(foundTest);
      } else {
        // If not found in myMockTests, try fetching as public test
        fetchTestDetails(mocktestId);
      }
    }
  }, [myMockTestsStatus, myMockTests, mocktestId]);

  /* ---------------------------------------------------------
      START TEST / RESUME LOGIC (CRITICAL UPDATE)
  ---------------------------------------------------------- */
  const handleStartTest = async () => {
    if (loading || !test) return;

    if (test.isPurchaseRequired) {
      toast.error("You must purchase a new attempt to write this test again.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(test.status === "in-progress" ? "Resuming exam..." : "Generating your unique exam set...");

    try {
      // The start-test endpoint now handles both starting a new test AND checking for resume ability.
      const { data } = await api.post(`/api/student/start-test`, { 
        mockTestId: mocktestId 
      });

      if (!data.attemptId) {
        toast.error("Failed to start test. Missing attempt ID.", { id: toastId });
        setLoading(false);
        return;
      }
      
      // Success: Test is started or resumed
      const message = test.status === "in-progress" ? "Exam resumed successfully!" : "Exam generated successfully! Good luck!";
      toast.success(message, { id: toastId });

      // Clear status to force a refetch of myMockTests on dashboard return
      dispatch(clearMyMockTestsStatus());

      navigate(`/student/write-test/${data.attemptId}`, { 
        state: { endsAt: data.endsAt }
      });

    } catch (err) {
      console.error("Start Test Error:", err);
      const errorMessage = err.response?.data?.message || "Error starting test. Please try again.";
      toast.error(errorMessage, { id: toastId });
      setLoading(false);

      // If the error message is specifically about reaching the attempt limit, 
      // dispatch a refresh to update the UI correctly (e.g. to show 'Buy Again')
      if (errorMessage.includes("Attempt limit reached")) {
        dispatch(fetchMyMockTests());
      }
    }
  };

  /* ---------------------------------------------------------
      LOADING & ERROR STATE
  ---------------------------------------------------------- */
  if (myMockTestsStatus === "loading" || !test) {
    return (
      <div className="flex justify-center items-center h-[80vh] bg-gray-50">
        <ClipLoader size={50} color={"#06b6d4"} />
      </div>
    );
  }

  /* ---------------------------------------------------------
      NO ACCESS / PURCHASE REQUIRED REDIRECT
  ---------------------------------------------------------- */
  // Check if the test is a paid test AND the user has no purchase record (test will be null)
  // or if the test has explicitly flagged the need for re-purchase.
  // We navigate away if the user shouldn't be here at all (i.e., didn't purchase a paid test)
  // or if the public fetch failed.

  // Note: We only check if the test is present in the Redux store (`myMockTests`)
  // If it's not there, we assume the user must view it from the public page first.
  if (myMockTestsStatus === "succeeded" && !myMockTests.find(t => t._id === mocktestId) && test.price > 0) {
     toast.error("You must purchase this test to access the instructions.");
     return <Navigate to={`/mocktests/${mocktestId}`} replace />;
  }


  /* ---------------------------------------------------------
      STATUS CHECK (Refactoring for clarity)
  ---------------------------------------------------------- */
  const isCompleted = test.status === "completed"; // Only "completed" after final score
  const isInProgress = test.status === "in-progress";
  // The backend determines this: attemptsMade >= 1 AND status === 'completed'
  const isPurchaseRequired = test.isPurchaseRequired; 
  const attemptsMade = test.attemptsMade || 0;
  const maxAttempts = test.maxAttempts || 1;

  const { 
    title, 
    description, 
    totalQuestions, 
    durationMinutes, 
    subjects,
    totalMarks 
  } = test;

  const markingScheme = {
    correct: "+1",
    incorrect: test.negativeMarking ? `-${test.negativeMarking}` : "0",
    unanswered: "0",
  };

  /* ---------------------------------------------------------
      CONDITIONAL BUTTON RENDERING
  ---------------------------------------------------------- */
  let primaryButton = null;
  let footerMessage = (
    <p className="text-center text-sm text-gray-500 mt-3">
      By clicking "Start Exam", the system will generate a random set of questions.
    </p>
  );
  
  // 1. ATTEMPT LIMIT REACHED (MUST BUY AGAIN)
  if (isPurchaseRequired) {
    primaryButton = (
      <button
        onClick={() => navigate(`/mocktests/${mocktestId}`)} 
        className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-xl text-xl hover:bg-red-700 transition-all duration-300 shadow-xl flex items-center justify-center"
      >
        <AlertTriangle className="h-6 w-6 mr-3" />
        Attempt Limit Reached (Buy Again)
      </button>
    );

    footerMessage = (
      <p className="text-center text-base text-red-600 mt-3 font-semibold">
        You have used your paid attempt. Purchase again to write this exam.
      </p>
    );

  // 2. COMPLETED (CAN ONLY VIEW REPORT, purchase required for new attempt)
  } else if (isCompleted) {
    primaryButton = (
      <button
        onClick={() => navigate(`/student/report/${test.latestAttemptId}`)}
        className="w-full bg-cyan-600 text-white font-bold py-4 px-6 rounded-xl text-xl hover:bg-cyan-700 transition-all duration-300 shadow-xl flex items-center justify-center"
      >
        <BarChart2 className="h-6 w-6 mr-3" />
        View Report
      </button>
    );

    footerMessage = (
      <p className="text-center text-base text-cyan-600 mt-3 font-semibold">
        You have completed this test. Purchase again to retry (button above will change).
      </p>
    );

  // 3. IN PROGRESS (RESUME)
  } else if (isInProgress) {
    primaryButton = (
      <button
        onClick={handleStartTest} // Re-use handleStartTest, backend handles resume
        disabled={loading}
        className="w-full bg-orange-600 text-white font-bold py-4 px-6 rounded-xl text-xl hover:bg-orange-700 transition-all duration-300 shadow-xl flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <ClipLoader size={24} color={"#ffffff"} className="mr-3" />
            Resuming Exam...
          </>
        ) : (
          <>
            <Play className="h-6 w-6 mr-3" />
            Resume Exam
          </>
        )}
      </button>
    );

    footerMessage = (
      <p className="text-center text-base text-orange-600 mt-3 font-semibold">
        An attempt is already in progress. Click to resume where you left off.
      </p>
    );

  // 4. NOT STARTED (START NEW ATTEMPT)
  } else {
    primaryButton = (
      <button
        onClick={handleStartTest}
        disabled={loading}
        className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-xl text-xl hover:bg-green-700 transition-all duration-300 shadow-xl flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <ClipLoader size={24} color={"#ffffff"} className="mr-3" />
            Generating Exam Set...
          </>
        ) : (
          <>
            <Play className="h-6 w-6 mr-3" />
            Start Exam
          </>
        )}
      </button>
    );
  }

  /* ---------------------------------------------------------
      PAGE UI BELOW
  ---------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="w-full max-w-4xl">

        {/* HEADER */}
        <header className="text-center mb-10 bg-white p-6 rounded-xl shadow-lg border-t-4 border-cyan-500">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{title}</h1>
          <p className="text-lg text-gray-600 italic">Instructions for the Mock Examination</p>
        </header>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          
          <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 border-l-4 border-cyan-500">
            <FileText className="h-8 w-8 text-cyan-600"/>
            <div>
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-xl font-bold text-gray-900">{totalQuestions || 'N/A'}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 border-l-4 border-cyan-500">
            <Clock className="h-8 w-8 text-cyan-600"/>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-xl font-bold text-gray-900">{durationMinutes} Minutes</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 border-l-4 border-cyan-500">
            <CheckSquare className="h-8 w-8 text-cyan-600"/>
            <div>
              <p className="text-sm text-gray-500">Maximum Marks</p>
              <p className="text-xl font-bold text-gray-900">{totalMarks}</p>
            </div>
          </div>

        </div>

        {/* GENERAL INSTRUCTIONS */}
        <section className="bg-white p-8 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <HelpCircle className="h-6 w-6 mr-3 text-red-500"/>
            General Instructions
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {description || "Please read all instructions carefully before starting your exam."}
          </p>
        </section>

        {/* GUIDELINES */}
        <section className="bg-white p-8 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-cyan-600"/>
            Examination Guidelines
          </h2>
          <ul className="space-y-4 text-gray-700">

            {test.price > 0 && (
              <li className={`flex items-start p-3 rounded-lg border-l-4 ${isPurchaseRequired ? 'bg-red-50 border-red-600' : isInProgress ? 'bg-orange-50 border-orange-600' : isCompleted ? 'bg-cyan-50 border-cyan-600' : 'bg-green-50 border-green-600'}`}>
                <AlertTriangle className="h-5 w-5 mt-1 mr-3 text-gray-700"/>
                <div>
                  <strong className="font-semibold text-gray-900">Attempt Policy:</strong> 
                  You have used <strong className="font-bold">{attemptsMade}</strong> of 
                  <strong className="font-bold"> {maxAttempts}</strong> allowed attempt(s).
                </div>
              </li>
            )}

            <li className="flex items-start">
              <Clock className="h-5 w-5 mt-1 mr-3 text-yellow-600"/>
              <div>
                <strong className="font-semibold text-gray-900">Time Limit:</strong> 
                Strictly <strong>{durationMinutes} minutes</strong>.
              </div>
            </li>

            <li className="flex items-start">
              <CheckSquare className="h-5 w-5 mt-1 mr-3 text-green-600"/>
              <div>
                <strong className="font-semibold text-gray-900">Total Questions:</strong> 
                {totalQuestions}
              </div>
            </li>

            {subjects?.length > 0 && (
              <li className="flex items-start">
                <Tag className="h-5 w-5 mt-1 mr-3 text-purple-600"/>
                <div>
                  <strong className="font-semibold text-gray-900">Sections:</strong> 
                  {subjects.map(s => s.name).join(", ")}
                </div>
              </li>
            )}

            <li className="flex items-start">
              <Zap className="h-5 w-5 mt-1 mr-3 text-red-600"/>
              <div>
                <strong className="font-semibold text-gray-900">Technical Note:</strong> 
                Keep a stable internet connection during exam.
              </div>
            </li>

            <li className="flex items-start">
              <CheckSquare className="h-5 w-5 mt-1 mr-3 text-blue-600"/>
              <div>
                <strong className="font-semibold text-gray-900">Submission:</strong> 
                Auto-submit when timer hits zero.
              </div>
            </li>

          </ul>
        </section>

        {/* MARKING SCHEME */}
        <section className="bg-white p-8 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <BarChart2 className="h-6 w-6 mr-3 text-cyan-600"/>
            Marking Scheme
          </h2>

          <div className="grid grid-cols-3 gap-4 text-center border border-gray-200 rounded-lg divide-x divide-gray-200">
            
            <div className="p-4 bg-green-50">
              <p className="text-sm font-medium text-green-700">Correct</p>
              <p className="text-xl font-bold text-green-900">{markingScheme.correct}</p>
            </div>

            <div className="p-4 bg-red-50">
              <p className="text-sm font-medium text-red-700">Incorrect</p>
              <p className="text-xl font-bold text-red-900">{markingScheme.incorrect}</p>
            </div>

            <div className="p-4 bg-yellow-50">
              <p className="text-sm font-medium text-yellow-700">Unanswered</p>
              <p className="text-xl font-bold text-yellow-900">{markingScheme.unanswered}</p>
            </div>

          </div>
        </section>

        {/* FINAL BUTTON */}
        <div className="mb-10">
          {primaryButton}
          {footerMessage}
        </div>

      </div>
    </div>
  );
};

export default InstructionsPage;