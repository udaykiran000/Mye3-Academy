import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux'; 
import { fetchGlobalLeaderboard, fetchPerformanceHistory, fetchPublicMockTests } from '../../redux/studentSlice'; 
import { fetchStudentDoubts } from '../../redux/doubtSlice';
import {
  BookOpen,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Zap,
  ArrowRight,
  ShieldCheck,
  Target,
  Trophy
} from 'lucide-react';

import { StatCard } from '../../components/student/DashboardUIKIt';

const DashboardOverview = () => {
  const dispatch = useDispatch();
  
  const { userData } = useSelector((state) => state.user);
  const { 
    attemptsHistory, 
    attemptsHistoryStatus,
    globalLeaderboard,
    globalLeaderboardStatus
  } = useSelector((state) => state.students);
  const { myDoubts, myStatus } = useSelector((state) => state.doubts);
  
  useEffect(() => {
    dispatch(fetchPublicMockTests());
    if (attemptsHistoryStatus === 'idle') dispatch(fetchPerformanceHistory());
    if (globalLeaderboardStatus === 'idle') dispatch(fetchGlobalLeaderboard());
    if (myStatus === 'idle') dispatch(fetchStudentDoubts());
  }, [dispatch, attemptsHistoryStatus, globalLeaderboardStatus, myStatus]);

  const myTests = userData?.purchasedTests || [];
  const myAttempts = attemptsHistory.length > 0 ? attemptsHistory : (userData?.attempts || []);

  const { grandAttempts } = useMemo(() => {
    return myAttempts.reduce((acc, curr) => {
      if (curr.mocktestId?.isGrandTest || curr.mocktestId?.title?.toLowerCase().includes("grand")) {
        acc.grandAttempts.push(curr);
      }
      return acc;
    }, { grandAttempts: [] });
  }, [myAttempts]);

  const { pendingDoubts } = useMemo(() => {
    return myDoubts.reduce((acc, curr) => {
      if (curr.status !== 'answered' && curr.status !== 'resolved') acc.pendingDoubts++;
      return acc;
    }, { pendingDoubts: 0 });
  }, [myDoubts]);

  const avgScore = myAttempts.length > 0
    ? (myAttempts.reduce((acc, attempt) => acc + (attempt.score || 0), 0) / myAttempts.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      
      {/* 🚀 PRIMARY METRICS GRID - HIGH IMPACT */}
      <section>
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Performance Matrix</h2>
           <div className="h-px flex-1 bg-slate-100 ml-4"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            icon={<BookOpen />}
            title="Tests Enrolled"
            value={myTests.length}
            color="blue"
          />
          <StatCard
            icon={<Zap />}
            title="Grand Tests"
            value={grandAttempts.length}
            color="amber"
            subValue="ATTEMPTS"
          />
          <StatCard
            icon={<CheckCircle />}
            title="Total Attempts"
            value={myAttempts.length}
            color="emerald"
          />
          <StatCard
            icon={<Target />}
            title="Avg. Score"
            value={avgScore} 
            color="indigo"
            subValue="/ 100"
          />
          <StatCard
            icon={<MessageSquare />}
            title="My Doubts"
            value={pendingDoubts} 
            color="rose"
            subValue="PENDING"
          />
        </div>
      </section>

      {/* 🏆 TOP RANKERS SECTION - ELEVATED PREMIUM UI */}
      <section>
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Global Leaderboard</h2>
            <div className="h-px flex-1 bg-slate-100 ml-4"></div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {globalLeaderboard && globalLeaderboard.length > 0 ? (
               globalLeaderboard.slice(0, 3).map((ranker, index) => {
                  const styles = [
                     { bg: "bg-gradient-to-br from-amber-50 to-amber-100/50", border: "border-amber-200", text: "text-amber-700", medal: "🥇", ring: "ring-amber-400" },
                     { bg: "bg-gradient-to-br from-slate-50 to-slate-100/50", border: "border-slate-200", text: "text-slate-700", medal: "🥈", ring: "ring-slate-300" },
                     { bg: "bg-gradient-to-br from-orange-50 to-orange-100/50", border: "border-orange-200", text: "text-orange-700", medal: "🥉", ring: "ring-orange-300" }
                  ];
                  const style = styles[index] || styles[2];

                  return (
                     <div 
                        key={ranker._id}
                        className={`relative flex flex-col items-center p-6 ${style.bg} border ${style.border} rounded-[32px] transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group`}
                     >
                        <div className="absolute top-3 right-4 text-2xl">{style.medal}</div>
                        <div className={`w-16 h-16 rounded-[24px] overflow-hidden ring-4 ${style.ring} ring-offset-2 bg-white mb-4 transform group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                           {ranker.avatar ? (
                              <img src={ranker.avatar} alt={ranker.name} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-black text-xl">
                                 {ranker.name.charAt(0)}
                              </div>
                           )}
                        </div>
                        <h4 className={`text-lg font-black ${style.text} mb-1 text-center truncate w-full px-2`}>{ranker.name}</h4>
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{ranker.attemptsCount} Attempts</p>
                        <div className="mt-auto pt-3 border-t border-slate-200/50 w-full flex items-center justify-center gap-1">
                           <span className={`text-2xl font-black ${style.text} tracking-tight`}>{ranker.totalScore}</span>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Points</span>
                        </div>
                     </div>
                  );
               })
            ) : (
               <div className="col-span-full py-12 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                  <Trophy className="text-slate-200 mb-2" size={40} />
                  <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">
                    {globalLeaderboardStatus === 'loading' ? 'Leaderboard loading...' : 'No ranking data available'}
                  </p>
               </div>
            )}
         </div>
      </section>

      {/* ⚡ CLEAN PROGRESS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4">
                  <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
                     <ShieldCheck className="text-indigo-400" size={18} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[2px] text-indigo-300">Next Action</span>
               </div>
               <h3 className="text-xl font-black mb-2 tracking-tight">Challenge Your Knowledge</h3>
               <p className="text-slate-400 font-medium text-[13px] leading-relaxed mb-6">You have <span className="text-white font-bold">{myTests.length}</span> active test series. Take a mock test now.</p>
               <button className="flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500 hover:text-white transition-all transform active:scale-95">
                  Go to Mock Tests <ArrowRight size={14} />
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
               <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center text-amber-500 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-500">
                  <Trophy size={20} />
               </div>
               <h4 className="text-base font-black text-slate-800 mb-1">Grand Rankings</h4>
               <p className="text-slate-400 font-medium text-[11px]">Check your state-level standing.</p>
               <div className="mt-4 flex items-center gap-2 text-amber-600 font-black uppercase tracking-widest text-[9px]">
                  View Leaderboard <ArrowRight size={12} />
               </div>
            </div>
            
            <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
               <div className="bg-rose-50 w-10 h-10 rounded-xl flex items-center justify-center text-rose-500 mb-4 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-500">
                  <TrendingUp size={20} />
               </div>
               <h4 className="text-base font-black text-slate-800 mb-1">History Matrix</h4>
               <p className="text-slate-400 font-medium text-[11px]">Analyze and fix weak areas.</p>
               <div className="mt-4 flex items-center gap-2 text-rose-600 font-black uppercase tracking-widest text-[9px]">
                  Analyze History <ArrowRight size={12} />
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default DashboardOverview;