import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const StudentMocktests = () => {
  const [mocktests, setMocktests] = useState([]);
  const navigate = useNavigate();

  // ✅ Load mocktests
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get("/api/student/mocktests");
        setMocktests(res.data.tests || []);
      } catch (err) {
        toast.error("Failed to load mocktests");
      }
    };
    fetchTests();
  }, []);

  // ✅ Define startTest
  const startTest = async (mocktestId) => {
    try {
      const res = await api.post(`/api/student/start-test/${mocktestId}`);
      const { attemptId, questions } = res.data;

      if (!attemptId) {
        toast.error("Unable to start test — please try again");
        return;
      }

      // Save to localStorage (optional)
      localStorage.setItem("currentAttemptId", attemptId);
      localStorage.setItem("currentQuestions", JSON.stringify(questions));

      toast.success("Mocktest started!");
      navigate(`/student/test/${attemptId}`); // Redirect to test page
    } catch (err) {
      toast.error(err.response?.data?.message || "Error starting test");
    }
  };

  return (
    <div className="p-6 mt-20">
      <h1 className="text-2xl font-bold mb-4">Available Mocktests</h1>

      {mocktests.length === 0 ? (
        <p>No mocktests available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mocktests.map((t) => (
            <div key={t._id} className="p-4 border rounded shadow bg-white">
              <h2 className="text-xl font-semibold">{t.title}</h2>
              <p className="text-sm text-gray-600">Category: {t.category}</p>
              <p className="text-sm">Duration: {t.duration} mins</p>
              <p className="text-sm">
                Available: {new Date(t.availableFrom).toLocaleString()} -{" "}
                {new Date(t.availableTo).toLocaleString()}
              </p>
              <button
                onClick={() => startTest(t._id)}
                className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Start Test
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMocktests;
