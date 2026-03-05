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
  Trophy,
  Crown,
  Medal
} from 'lucide-react';

import { StatCard } from '../../components/student/DashboardUIKIt';
import { getImageUrl } from '../../utils/imageHelper';

const DashboardOverview = ({ setActiveTab }) => {
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
    // Always re-fetch so stats are fresh when returning to dashboard
    dispatch(fetchPerformanceHistory());
    if (globalLeaderboardStatus === 'idle') dispatch(fetchGlobalLeaderboard());
    if (myStatus === 'idle') dispatch(fetchStudentDoubts());
  }, [dispatch, globalLeaderboardStatus, myStatus]);

  const myTests = userData?.purchasedTests || [];
  // Use attemptsHistory as single source of truth (always re-fetched on mount)
  const myAttempts = attemptsHistory || [];

  const { grandAttempts } = useMemo(() => {
    return myAttempts.reduce((acc, curr) => {
      // Use backend-supplied isGrandTest flag; fallback to title check for legacy data
      if (curr.mocktestId?.isGrandTest === true || curr.mocktestId?.title?.toLowerCase().includes("grand")) {
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

  // Avg score as a percentage (0–100 scale), only counting completed attempts with valid totalMarks
  const avgScore = useMemo(() => {
    const completed = myAttempts.filter(a => (a.mocktestId?.totalMarks || 0) > 0);
    if (completed.length === 0) return "0.0";
    const totalPct = completed.reduce((acc, a) => {
      const pct = (a.score / a.mocktestId.totalMarks) * 100;
      return acc + pct;
    }, 0);
    return (totalPct / completed.length).toFixed(1);
  }, [myAttempts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      
      {/* 🚀 PRIMARY METRICS GRID - HIGH IMPACT */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            icon={<BookOpen />}
            title="Tests Enrolled"
            value={myTests.length}
            color="blue"
            onClick={() => setActiveTab('my-tests')}
          />
          <StatCard
            icon={<Zap />}
            title="Grand Tests"
            value={grandAttempts.length}
            color="amber"
            subValue="ATTEMPTS"
            onClick={() => setActiveTab('performance-all')}
          />
          <StatCard
            icon={<CheckCircle />}
            title="Total Attempts"
            value={myAttempts.length}
            color="emerald"
            onClick={() => setActiveTab('performance-all')}
          />
          <StatCard
            icon={<Target />}
            title="Avg. Score"
            value={avgScore} 
            color="indigo"
            subValue="/ 100"
            onClick={() => setActiveTab('performance-all')}
          />
          <StatCard
            icon={<MessageSquare />}
            title="My Doubts"
            value={pendingDoubts} 
            color="rose"
            subValue="PENDING"
            onClick={() => setActiveTab('doubts')}
          />
        </div>
      </section>

      {/* ⚡ ANALYTICS & LEADERBOARD GRID - SIDE BY SIDE LIKE ADMIN */}
      <style>
        {`
            @keyframes shimmer {
                0% { transform: translateX(-100%); opacity: 0; }
                50% { opacity: 0.5; }
                100% { transform: translateX(100%); opacity: 0; }
            }
            .shimmer-effect {
                position: relative;
                overflow: hidden;
            }
            .shimmer-effect::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                animation: shimmer 3s infinite;
            }
            @keyframes floating {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0px); }
            }
            .floating-card {
                animation: floating 4s ease-in-out infinite;
            }
            @keyframes rotate-halo {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .profile-halo {
                position: absolute;
                top: -8px;
                left: -8px;
                right: -8px;
                bottom: -8px;
                background: conic-gradient(from 0deg, #f59e0b, #fbbf24, #f59e0b);
                border-radius: 100%;
                animation: rotate-halo 4s linear infinite;
                opacity: 0.3;
                filter: blur(4px);
            }
            .profile-frame {
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                border: 2px solid #f59e0b;
                border-radius: 100%;
                box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
                z-index: 5;
            }
        `}
      </style>
      
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* LEFT: GLOBAL LEADERBOARD */}
        <div className="flex flex-col">
           <div className="bg-white p-6 rounded-none border border-slate-100 shadow-[0_30px_70px_rgba(0,0,0,0.15)] h-full overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="relative z-10 flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 flex items-center justify-center rounded-none shadow-[0_5px_15px_rgba(245,158,11,0.3)]">
                       <Trophy size={24} className="text-white drop-shadow-sm" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-[#3e4954] tracking-tight">Top Rankers</h3>
                       <p className="text-[11px] font-bold text-[#7e7e7e] uppercase tracking-[0.2em] mt-0.5">Performance Elite Board</p>
                    </div>
                 </div>
                 <div className="px-3 py-1 bg-emerald-500 text-white rounded-none text-[10px] font-black uppercase tracking-widest shadow-sm">
                    Live
                 </div>
              </div>

              <div className="relative z-10 space-y-6">
                 {globalLeaderboard && globalLeaderboard.length > 0 ? (
                    globalLeaderboard.slice(0, 4).map((ranker, index) => {
                       const isFirst = index === 0;
                       const isTopThree = index < 3;
                       
                       let rankStyles = {
                          bg: "bg-white", border: "border-slate-100", text: "text-slate-700", 
                          icon: <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm"><span className="text-[10px] font-black">{index + 1}</span></div>
                       };

                       if (index === 0) {
                          rankStyles = {
                             bg: "scale-[1.02] shadow-[0_20px_40px_rgba(245,158,11,0.2)] z-10 floating-card shimmer-effect !bg-gradient-to-br from-amber-50/90 via-amber-100/90 to-amber-200/90",
                             border: "border-amber-400",
                             text: "text-amber-800",
                             icon: <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 flex items-center justify-center border-2 border-amber-200 shadow-md"><Crown className="text-white animate-pulse" size={18} /></div>
                          };
                       } else if (index === 1) {
                          rankStyles = {
                             bg: "bg-gradient-to-br from-orange-50 to-orange-100/50", border: "border-orange-200/50", text: "text-orange-700",
                             icon: <div className="w-8 h-8 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center border-2 border-orange-200 shadow-sm"><Medal className="text-white" size={12} /></div>
                          };
                       } else if (index === 2) {
                          rankStyles = {
                             bg: "bg-gradient-to-br from-slate-50 to-slate-100/50", border: "border-slate-200/50", text: "text-slate-700",
                             icon: <div className="w-8 h-8 rounded-full bg-gradient-to-b from-slate-300 to-slate-500 flex items-center justify-center border-2 border-slate-200 shadow-sm"><Medal className="text-white" size={12} /></div>
                          };
                       }

                       return (
                          <div 
                             key={ranker._id}
                             className={`flex items-center gap-4 p-4 rounded-none border ${rankStyles.border} ${rankStyles.bg} transition-all duration-400 hover:shadow-xl group relative overflow-hidden`}
                          >
                             {isTopThree && (
                                <div className={`absolute top-0 left-0 w-1 h-full ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-orange-400' : 'bg-slate-400'}`}></div>
                             )}

                             {isFirst && (
                                <div className="absolute top-0 right-0 z-20 overflow-hidden w-24 h-24 pointer-events-none">
                                    <div className="absolute top-4 -right-8 w-32 bg-gradient-to-r from-amber-600 via-amber-200 to-amber-600 text-amber-950 text-[9px] font-black py-1 transform rotate-45 text-center shadow-md uppercase tracking-widest drop-shadow-md">
                                        TOP 1
                                    </div>
                                </div>
                             )}

                             <div className="flex-shrink-0">
                                {rankStyles.icon}
                             </div>

                             <div className="relative flex-shrink-0 mx-1">
                                {isFirst && (
                                   <>
                                      <div className="profile-halo"></div>
                                      <div className="profile-frame"></div>
                                   </>
                                )}
                                <div className={`w-12 h-12 rounded-full border-2 overflow-hidden bg-white shadow-md relative ${isFirst ? 'border-amber-400' : 'border-white'}`}>
                                   {ranker.avatar ? (
                                      <img src={getImageUrl(ranker.avatar)} alt={ranker.name} className="w-full h-full object-cover" />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 font-bold text-xs uppercase">
                                         {ranker.name.charAt(0)}
                                      </div>
                                   )}
                                </div>
                             </div>

                             <div className="flex-1 min-w-0 pr-2">
                                <h4 className={`text-sm font-black truncate transition-colors duration-300 ${isFirst ? 'text-amber-950' : 'text-[#3e4954] group-hover:text-blue-600'}`}>{ranker.name}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                   <span className={`text-[10px] font-bold uppercase tracking-tighter ${isFirst ? 'text-amber-700/80' : 'text-slate-400'}`}>{ranker.attemptsCount} Assessments</span>
                                </div>
                             </div>

                              <div className="text-right whitespace-nowrap min-w-[80px] pr-10 relative z-20">
                                 <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isFirst ? 'text-amber-700/70' : 'text-slate-400'}`}>Points</div>
                                 <div className={`text-xl font-black tracking-tight leading-none ${isFirst ? 'text-amber-600' : 'text-[#3e4954]'}`}>
                                    {ranker.totalScore}
                                 </div>
                              </div>

                          </div>
                       );
                    })
                 ) : (
                    <div className="py-12 bg-slate-50/50 rounded-none border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                       <Trophy className="text-slate-200 mb-2" size={40} />
                       <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest italic">
                         {globalLeaderboardStatus === 'loading' ? 'Calculating rankings...' : 'No ranking data available yet'}
                       </p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* RIGHT: ACTION CARD (CHALLENGE) */}
        <div className="flex flex-col">
           <div className="bg-gradient-to-br from-[#122b5e] to-[#1e4db7] rounded-none p-8 md:p-10 text-white relative overflow-hidden group shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/10 h-full flex flex-col justify-center">
              {/* Dynamic Accents */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-400 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32 animate-pulse"></div>
              
              <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-white/10 rounded-none border border-white/10 backdrop-blur-md">
                     <ShieldCheck className="text-blue-300" size={16} />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Unlock Your Potential</span>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-[1.1]">Challenge Your <br/><span className="text-blue-300">Knowledge</span></h3>
                  <p className="text-blue-100/80 font-medium text-lg leading-relaxed mb-10 max-w-sm">
                     You have <span className="text-white font-black underline decoration-blue-400 underline-offset-4">{myTests.length}</span> active test series waiting for you. Start testing your skills today!
                  </p>

                  <button 
                     onClick={() => setActiveTab('explore')}
                     className="group/btn inline-flex items-center gap-3 bg-white text-[#122b5e] px-8 py-5 rounded-none font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all transform active:scale-95 shadow-xl shadow-blue-950/20 whitespace-nowrap"
                  >
                     Go to Mock Tests 
                     <div className="w-6 h-6 rounded-none bg-blue-100 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                        <ArrowRight size={14} className="text-[#122b5e]" />
                     </div>
                  </button>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardOverview;