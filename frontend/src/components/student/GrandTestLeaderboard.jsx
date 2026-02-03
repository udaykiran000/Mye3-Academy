import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGrandTestLeaderboard } from '../../redux/studentSlice'; // ✅ Import from studentSlice
import { Trophy, Medal, Loader2, User } from 'lucide-react';

// Helper for Avatar URL
const getAvatar = (path) => {
  if (!path) return "https://ui-avatars.com/api/?background=random&color=fff";
  return path.startsWith("http") ? path : `http://localhost:8000/${path.replace(/\\/g, "/")}`;
};

const GrandTestLeaderboard = ({ mockTestId, title }) => {
  const dispatch = useDispatch();
  
  // ✅ Read from 'students' slice
  const { leaderboards } = useSelector((state) => state.students);
  
  // Get specific data for this test
  const leaderboard = leaderboards[mockTestId];

  useEffect(() => {
    // Fetch if data missing
    if (!leaderboard && mockTestId) {
      dispatch(fetchGrandTestLeaderboard(mockTestId));
    }
  }, [dispatch, mockTestId, leaderboard]);

  // --- LOADING STATE ---
  if (!leaderboard) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-center py-8">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  // --- EMPTY STATE ---
  if (leaderboard.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-300 text-center">
        <Trophy className="mx-auto text-gray-300 mb-2" size={24} />
        <p className="text-gray-500 text-sm">Leaderboard generating...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
        <Trophy className="text-yellow-500 fill-yellow-500" size={20} />
        <h3 className="text-lg font-bold text-gray-800 truncate" title={title}>
          Top Rankers: <span className="text-blue-600">{title}</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((student, index) => {
          // --- DYNAMIC STYLES FOR 1st, 2nd, 3rd ---
          let cardStyle = "border-gray-100 bg-gray-50";
          let rankIcon = <span className="text-gray-400 font-bold">#{index + 1}</span>;
          let rankColor = "text-gray-700";

          if (index === 0) {
            cardStyle = "border-yellow-200 bg-yellow-50 ring-1 ring-yellow-300 transform sm:-translate-y-2 shadow-md";
            rankIcon = <Trophy size={20} className="text-yellow-600 fill-yellow-600" />;
            rankColor = "text-yellow-800";
          } else if (index === 1) {
            cardStyle = "border-slate-300 bg-slate-50";
            rankIcon = <Medal size={20} className="text-slate-500 fill-slate-300" />;
            rankColor = "text-slate-700";
          } else if (index === 2) {
            cardStyle = "border-orange-200 bg-orange-50";
            rankIcon = <Medal size={20} className="text-orange-600 fill-orange-300" />;
            rankColor = "text-orange-800";
          }

          return (
            <div 
              key={index} 
              className={`relative flex flex-col items-center p-4 rounded-xl border transition-all ${cardStyle}`}
            >
              {/* Avatar */}
              <div className="relative mb-3">
                <img 
                  src={getAvatar(student.avatar)} 
                  alt={student.name} 
                  className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-sm bg-white"
                />
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                   {rankIcon}
                </div>
              </div>

              {/* Details */}
              <h4 className={`font-bold text-sm text-center line-clamp-1 w-full ${rankColor}`}>
                {student.name}
              </h4>
              
              <div className="mt-2 flex items-center justify-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                <span className="font-bold text-gray-900 text-sm">{student.score}</span>
                <span className="text-xs text-gray-400">/ {student.totalMarks}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GrandTestLeaderboard;