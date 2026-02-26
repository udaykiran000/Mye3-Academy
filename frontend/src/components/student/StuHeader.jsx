import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Trophy, Crown, Star } from 'lucide-react';
import { getSocket } from '../../socket';
import toast from 'react-hot-toast';
import { fetchGlobalLeaderboard } from '../../redux/studentSlice';
import { motion, AnimatePresence } from 'framer-motion';

const StuHeader = ({ user }) => {
  const dispatch = useDispatch();
  const [hasNotification, setHasNotification] = useState(false);
  
  const { globalLeaderboard, globalLeaderboardStatus } = useSelector((state) => state.students);

  const displayName = user?.firstname ? `${user.firstname} ${user.lastname || ""}` : "Student";

  useEffect(() => {
    if (globalLeaderboardStatus === 'idle') {
      dispatch(fetchGlobalLeaderboard());
    }

    const socket = getSocket(); 
    if (!socket) return;

    const handleNotification = () => {
      setHasNotification(true);
      toast.success("New Reply Received!", { icon: "📩" });
    };

    socket.on("doubtAnswered", handleNotification);
    return () => {
      socket.off("doubtAnswered", handleNotification);
    };
  }, [dispatch, globalLeaderboardStatus]);

  return (
    <header className="mb-6">
      {/* ── ULTRA-COMPACT ELITE RIBBON ── */}
      <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-2 md:p-2.5 shadow-lg border border-white/5 flex flex-col xl:flex-row items-center gap-4 xl:gap-6">
        {/* Abstract Glow Background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 rounded-full blur-[80px] opacity-10 -mr-24 -mt-24 pointer-events-none"></div>
        
        {/* Left: Integrated User Hero */}
        <div className="relative z-10 flex items-center gap-3 pl-2 min-w-fit border-b xl:border-b-0 xl:border-r border-white/10 pb-3 xl:pb-0 xl:pr-6 w-full xl:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-lg">
             <div className="w-full h-full bg-slate-900 rounded-[8px] flex items-center justify-center text-sm font-black text-white border border-white/5 uppercase">
                {user?.firstname?.charAt(0) || "S"}
             </div>
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight leading-none mb-1">
              Hi, <span className="text-blue-400">{user?.firstname || "Champ"}</span>!
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest hidden sm:block">Control Center</p>
          </div>
          <div className="ml-auto xl:ml-3 flex items-center gap-2">
            <button
              onClick={() => setHasNotification(false)}
              className="relative p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all group backdrop-blur-md"
            >
              <Bell className={`text-slate-400 group-hover:text-blue-400 ${hasNotification ? 'animate-pulse' : ''}`} size={14} />
              {hasNotification && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-slate-900"></span>
              )}
            </button>
          </div>
        </div>

        {/* Center/Right: Consolidated Hall of Fame */}
        <AnimatePresence>
          {globalLeaderboard.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10 flex-1 flex items-center gap-4 w-full overflow-hidden"
            >
              <div className="flex items-center gap-2 min-w-fit">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                  <Trophy size={14} />
                </div>
                <div className="hidden lg:block">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Hall of Fame</p>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto scroll-hidden">
                 <div className="flex items-center gap-2.5 py-1">
                    {globalLeaderboard.slice(0, 4).map((ranker, index) => (
                      <motion.div 
                        key={index}
                        whileHover={{ scale: 1.05, y: -1 }}
                        className="flex items-center gap-2 bg-white/5 pl-1 pr-3 py-1 rounded-xl border border-white/5 hover:border-blue-500/40 hover:bg-white/10 transition-all cursor-default min-w-fit group backdrop-blur-sm"
                      >
                         <div className="relative">
                            <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-white font-black text-[10px] shadow-inner
                              ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'}
                            `}>
                               {ranker.name?.charAt(0)}
                            </div>
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black border border-slate-900 shadow-sm
                              ${index === 0 ? 'bg-amber-400 text-amber-900' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-blue-600'}
                            `}>
                              {index + 1}
                            </div>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-200 truncate max-w-[80px] leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tighter">{ranker.name}</p>
                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">{ranker.totalScore.toLocaleString()} pts</p>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default StuHeader;