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
    <header className="flex flex-col gap-6 mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/10 transition-colors"></div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[2px] rounded-full border border-blue-100">Student Dashboard</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.firstname || "Champ"}</span>! 👋
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-lg">Your progress matters. Let's conquer your goals today.</p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <button
            onClick={() => setHasNotification(false)}
            className="relative p-4 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 rounded-2xl border border-slate-200 transition-all duration-300 group"
          >
            <Bell className={`text-slate-600 group-hover:text-blue-600 ${hasNotification ? 'animate-swing' : ''}`} size={24} />
            {hasNotification && (
              <span className="absolute top-3 right-3 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
            )}
          </button>
        </div>
      </div>

      {/* 🏆 TOP RANKERS SECTION - PREMIUM INTEGRATION */}
      <AnimatePresence>
        {globalLeaderboard.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
          >
            <div className="lg:col-span-3 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Top Hall of Fame</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Rankings</p>
              </div>
            </div>

            <div className="lg:col-span-9">
               <div className="flex flex-wrap items-center gap-3 scroll-hidden">
                  {globalLeaderboard.slice(0, 5).map((ranker, index) => (
                    <motion.div 
                      key={index}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-3 bg-white pl-1 pr-4 py-1 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-default"
                    >
                      <div className="relative">
                        {ranker.avatar ? (
                          <img 
                            src={`${import.meta.env.VITE_SERVER_URL}/${ranker.avatar.replace(/\\/g, "/")}`} 
                            className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" 
                            alt={ranker.name}
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm
                            ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'}
                          `}>
                            {ranker.name?.charAt(0)}
                          </div>
                        )}
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm
                          ${index === 0 ? 'bg-amber-400 text-amber-900' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-blue-600'}
                        `}>
                          #{index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-slate-700 truncate max-w-[100px] leading-tight">{ranker.name}</p>
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{ranker.totalScore.toLocaleString()} Pts</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default StuHeader;