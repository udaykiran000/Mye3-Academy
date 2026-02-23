import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux'; 
import { fetchPerformanceHistory, fetchPublicMockTests } from '../../redux/studentSlice'; 
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
  } = useSelector((state) => state.students);
  const { myDoubts, myStatus } = useSelector((state) => state.doubts);
  
  useEffect(() => {
    dispatch(fetchPublicMockTests());
    if (attemptsHistoryStatus === 'idle') dispatch(fetchPerformanceHistory());
    if (myStatus === 'idle') dispatch(fetchStudentDoubts());
  }, [dispatch, attemptsHistoryStatus, myStatus]);

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
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 🚀 PRIMARY METRICS GRID - HIGH IMPACT */}
      <section>
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-sm font-black text-slate-400 uppercase tracking-[4px]">Performance Matrix</h2>
           <div className="h-px flex-1 bg-slate-100 ml-6"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
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

      {/* ⚡ CLEAN PROGRESS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                  <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
                     <ShieldCheck className="text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[3px] text-indigo-300">Next Recommended Action</span>
               </div>
               <h3 className="text-3xl font-black mb-4 tracking-tight">Challenge Your Knowledge</h3>
               <p className="text-slate-400 font-medium text-lg leading-relaxed mb-8">You have <span className="text-white font-bold">{myTests.length}</span> active test series. Take a mock test now to keep your performance trajectory ascending.</p>
               <button className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 hover:text-white transition-all transform active:scale-95">
                  Go to Mock Tests <ArrowRight size={18} />
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
               <div className="bg-amber-50 w-14 h-14 rounded-2xl flex items-center justify-center text-amber-500 mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-500">
                  <Trophy size={28} />
               </div>
               <h4 className="text-xl font-black text-slate-800 mb-2">Grand Rankings</h4>
               <p className="text-slate-400 font-medium text-sm">Check your standing in recent state-level events.</p>
               <div className="mt-6 flex items-center gap-2 text-amber-600 font-black uppercase tracking-widest text-[10px]">
                  View Leaderboard <ArrowRight size={14} />
               </div>
            </div>
            
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
               <div className="bg-rose-50 w-14 h-14 rounded-2xl flex items-center justify-center text-rose-500 mb-6 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-500">
                  <TrendingUp size={28} />
               </div>
               <h4 className="text-xl font-black text-slate-800 mb-2">History Matrix</h4>
               <p className="text-slate-400 font-medium text-sm">Analyze every attempt and fix weak areas.</p>
               <div className="mt-6 flex items-center gap-2 text-rose-600 font-black uppercase tracking-widest text-[10px]">
                  Analyze History <ArrowRight size={14} />
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default DashboardOverview;