import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInstructorDoubts,
  answerInstructorDoubt,
} from "../../redux/doubtSlice";
import { getSocket } from "../../socket";
import toast from "react-hot-toast";
import {
  Send,
  Clock,
  User,
  MessageCircle,
  FileText,
  ImageIcon,
} from "lucide-react";

// Helper to resolve Image URLs
const BASE_URL = "import.meta.env.VITE_SERVER_URL";
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};

const InstructorDoubts = () => {
  const dispatch = useDispatch();
  const { instructorDoubts, instructorStatus } = useSelector(
    (state) => state.doubts,
  );
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    dispatch(fetchInstructorDoubts());

    const socket = getSocket();
    if (socket) {
      socket.on("doubtAssigned", () => {
        toast("New doubt assigned to you!", { icon: "📝" });
        dispatch(fetchInstructorDoubts());
      });
      return () => socket.off("doubtAssigned");
    }
  }, [dispatch]);

  const handleAnswer = (id) => {
    if (!answers[id]?.trim()) return toast.error("Answer cannot be empty");
    dispatch(answerInstructorDoubt({ id, answer: answers[id] }));
    setAnswers((prev) => ({ ...prev, [id]: "" }));
  };

  const pendingDoubts = instructorDoubts.filter((d) => d.status !== "answered");
  const answeredDoubts = instructorDoubts.filter(
    (d) => d.status === "answered",
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        My Assigned Doubts
      </h1>

      {/* PENDING SECTION */}
      <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
        <Clock className="text-orange-500" /> Pending ({pendingDoubts.length})
      </h3>

      <div className="space-y-8 mb-12">
        {pendingDoubts.map((d) => (
          <div
            key={d._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row"
          >
            {/* LEFT SIDE: CONTEXT (Question & Doubt) */}
            <div className="md:w-3/5 p-6 border-b md:border-b-0 md:border-r border-gray-100">
              {/* Metadata */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded uppercase">
                    {d.subject}
                  </span>
                  {d.type === "mocktest" && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      Mock Test Q
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium bg-gray-50 px-2 py-1 rounded-full">
                  <User size={12} /> {d.student?.firstname}{" "}
                  {d.student?.lastname}
                </span>
              </div>

              {/* ✅ ORIGINAL QUESTION CONTEXT */}
              {d.questionId && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileText size={14} /> Original Question
                  </h4>
                  <p className="text-gray-800 font-medium text-sm leading-relaxed whitespace-pre-line mb-3">
                    {d.questionId.title}
                  </p>
                  {d.questionId.questionImageUrl && (
                    <div className="mt-2">
                      <img
                        src={getImageUrl(d.questionId.questionImageUrl)}
                        alt="Question Reference"
                        className="max-h-48 rounded border bg-white object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STUDENT DOUBT */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MessageCircle size={14} /> Student Query
                </h4>
                <p className="text-gray-800 text-lg font-semibold">{d.text}</p>
              </div>
            </div>

            {/* RIGHT SIDE: ANSWER INPUT */}
            <div className="md:w-2/5 p-6 bg-gray-50 flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-2">
                Your Explanation
              </label>
              <textarea
                className="flex-1 w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3 bg-white"
                rows="6"
                placeholder="Type clear and concise explanation..."
                value={answers[d._id] || ""}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, [d._id]: e.target.value }))
                }
              />
              <button
                onClick={() => handleAnswer(d._id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Send size={16} /> Submit Answer
              </button>
            </div>
          </div>
        ))}

        {pendingDoubts.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-400">
              Great job! You have no pending doubts.
            </p>
          </div>
        )}
      </div>

      {/* ANSWERED SECTION */}
      <h3 className="text-lg font-bold text-gray-700 mb-4 border-t pt-8">
        Answered History
      </h3>
      <div className="space-y-4 opacity-80">
        {answeredDoubts.map((d) => (
          <div
            key={d._id}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4"
          >
            <div>
              <p className="text-sm font-bold text-gray-800 mb-1">
                Q: {d.text}
              </p>
              <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                Ans: {d.answer}
              </p>
            </div>
            <div className="flex items-center gap-2 min-w-fit">
              <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">
                Answered
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructorDoubts;
