import React, { useEffect, useState } from "react";
import { Trophy, Medal, Clock, Loader2, User } from "lucide-react";
import api from "../../api/axios"; // Ensure this path points to your axios instance

const GrandTestRankers = ({ mockTestId, testTitle }) => {
  const [rankers, setRankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        setMessage(null);
        
        const { data } = await api.get(`/api/student/grandtest-leaderboard/${mockTestId}`);
        
        // Handle different response structures
        const list = data.leaderboard || data; 

        if (Array.isArray(list) && list.length > 0) {
          setRankers(list);
        } else {
          setMessage("No ranks generated yet.");
        }
      } catch (err) {
        console.log("Leaderboard info:", err.response?.data?.message);
        setMessage(err.response?.data?.message || "Leaderboard unavailable");
      } finally {
        setLoading(false);
      }
    };

    if (mockTestId) fetchRankings();
  }, [mockTestId]);

  // Helper for avatar URL
  const getAvatar = (path) => {
    if (!path) return "https://ui-avatars.com/api/?background=random";
    return path.startsWith("http") ? path : `http://localhost:8000/${path.replace(/\\/g, "/")}`;
  };

  // 1. Loading State
  if (loading) {
      return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex justify-center items-center h-48">
             <Loader2 className="animate-spin text-blue-600 w-8 h-8"/>
        </div>
      );
  }

  // 2. No Data / Waiting State
  if (!rankers || rankers.length === 0) {
      return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <Trophy className="text-gray-400" size={20} />
                <h3 className="text-lg font-bold text-gray-700">
                Top Rankers: <span className="text-blue-600">{testTitle}</span>
                </h3>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Clock className="text-gray-400 mb-2 w-8 h-8" />
                <p className="text-gray-500 font-medium text-sm">
                    {message || "Results are being processed..."}
                </p>
            </div>
        </div>
      );
  }

  // 3. Success State (Table View)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-white">
        <Trophy className="text-yellow-500 fill-yellow-500" size={24} />
        <h3 className="text-lg font-bold text-gray-800">
          Top Rankers: <span className="text-blue-600">{testTitle}</span>
        </h3>
      </div>

       
       
      

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Profile
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Marks
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Rank
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rankers.map((student, idx) => {
              // Determine Rank Icon/Style
              let RankDisplay = <span className="text-gray-600 font-bold">#{student.rank}</span>;
              let rowHighlight = "";

              if (student.rank === 1) {
                RankDisplay = <Trophy size={20} className="text-yellow-500 mx-auto fill-yellow-500" />;
                rowHighlight = "bg-yellow-50/30"; // Subtle highlight for #1
              } else if (student.rank === 2) {
                RankDisplay = <Medal size={20} className="text-gray-400 mx-auto" />;
              } else if (student.rank === 3) {
                RankDisplay = <Medal size={20} className="text-orange-500 mx-auto" />;
              }

              return (
                <tr key={idx} className={`hover:bg-gray-50 transition-colors ${rowHighlight}`}>
                  {/* Column 1: Profile (Avatar) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm"
                          src={getAvatar(student.avatar)}
                          alt={student.name}
                          onError={(e) => { e.target.src = "https://ui-avatars.com/api/?background=random"; }} 
                        />
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                  </td>

                  {/* Column 3: Marks */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {student.score} / {student.totalMarks}
                    </span>
                  </td>

                  {/* Column 4: Rank */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {RankDisplay}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GrandTestRankers;