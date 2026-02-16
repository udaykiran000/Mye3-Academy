import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMyAttempts } from "../../redux/attemptSlice";
import { ChartCard, Th, Td } from "../../components/student/DashboardUIKIt";
import { ClipLoader } from "react-spinners";

const PerformanceHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((state) => state.attempts);

  useEffect(() => {
    dispatch(fetchMyAttempts());
  }, [dispatch]);

  return (
    <ChartCard title="Attempt History">
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <ClipLoader size={40} color="#06b6d4" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>Test Name</Th>
                <Th>Date</Th>
                <Th>Score</Th>
                <Th>Percentage</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {list && list.length > 0 ? (
                list.map((att) => {
                  // 1. Logic for calculating score percentage
                  const totalMarks = att.mocktestId?.totalMarks || 0;
                  const obtainedScore = att.score || 0;
                  const percentage =
                    totalMarks > 0
                      ? ((obtainedScore / totalMarks) * 100).toFixed(2)
                      : "0.00";

                  return (
                    <tr key={att._id} className="hover:bg-gray-50">
                      <Td className="font-semibold text-gray-900">
                        {att.mocktestId?.title || "Untitled Mock Test"}
                      </Td>
                      <Td>{new Date(att.createdAt).toLocaleDateString()}</Td>
                      <Td>
                        <span className="text-blue-600 font-semibold">
                          {obtainedScore} / {totalMarks}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            Number(percentage) >= 50
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {percentage}%
                        </span>
                      </Td>
                      <Td>
                        <button
                          onClick={() => navigate(`/student/review/${att._id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Review
                        </button>
                      </Td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    No attempts found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </ChartCard>
  );
};

export default PerformanceHistory;
