import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell, Search, X, User, BookOpen, GraduationCap,
  LogOut, ChevronRight, Star, Medal, TrendingUp, Trophy
} from 'lucide-react';
import { getSocket } from '../../socket';
import toast from 'react-hot-toast';
import { fetchGlobalLeaderboard, fetchPublicMockTests } from '../../redux/studentSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/imageHelper';

const StuHeader = ({ user, setActiveTab }) => {
  const dispatch = useDispatch();

  // ─── NOTIFICATIONS ────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // ─── SEARCH ───────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef(null);

  // ─── AUTH DATA ───────────────────────────────────────────────
  const { userData } = useSelector((state) => state.user);
  const { studentProfile } = useSelector((state) => state.students);

  // Resolved avatar — prefer fresh studentProfile over login snapshot
  const resolvedAvatar = studentProfile?.avatar || userData?.avatar || null;

  // ─── LEADERBOARD / RANK ───────────────────────────────────────
  const { globalLeaderboard, globalLeaderboardStatus, publicMocktests } = useSelector(
    (state) => state.students
  );

  // ─── COMPUTE CURRENT USER RANK ───────────────────────────────
  const myRank = useMemo(() => {
    if (!globalLeaderboard?.length) return null;
    const userId = user?._id || userData?._id;
    if (!userId) return null;
    const idx = globalLeaderboard.findIndex(
      (r) => r._id === userId || r.name?.toLowerCase() === `${user?.firstname || ''} ${user?.lastname || ''}`.trim().toLowerCase()
    );
    return idx !== -1 ? idx + 1 : null;
  }, [globalLeaderboard, user, userData]);

  // ─── SEARCH RESULTS ──────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || !publicMocktests?.length) return [];
    const q = searchTerm.toLowerCase();
    return publicMocktests.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.category?.name?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchTerm, publicMocktests]);

  // ─── EFFECTS ─────────────────────────────────────────────────
  useEffect(() => {
    if (globalLeaderboardStatus === 'idle') dispatch(fetchGlobalLeaderboard());
    dispatch(fetchPublicMockTests());

    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (data) => {
      const msg = data?.message || 'New Reply Received!';
      setNotifications((prev) => [
        { id: Date.now(), text: msg, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
      toast.success(msg, { icon: '📩' });
    };

    socket.on('doubtAnswered', handleNotification);
    return () => socket.off('doubtAnswered', handleNotification);
  }, [dispatch, globalLeaderboardStatus]);

  // Close search on outside click
  useEffect(() => {
    if (!showSearch) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSearch]);

  // Close notifications on outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  // Focus input when search opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => {
        document.getElementById('header-search-input')?.focus();
      }, 150);
    }
  }, [showSearch]);

  const unreadCount = notifications.length;
  const hasNotification = unreadCount > 0;

  const displayName = user?.firstname
    ? `${user.firstname} ${user.lastname || ''}`.trim()
    : 'Student';

  const avatarUrl = user?.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'}/${user.avatar.replace(/\\/g, '/')}`
    : null;

  const handleProfileClick = () => {
    if (setActiveTab) setActiveTab('settings');
  };

  const handleEnrollClick = () => {
    if (setActiveTab) setActiveTab('explore');
  };

  const handleExploreTest = (test) => {
    setShowSearch(false);
    setSearchTerm('');
    if (setActiveTab) setActiveTab('explore');
  };

  const rankLabel = myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : myRank ? `#${myRank}` : null;

  return (
    <header className="mb-4 relative">
      {/* ── ELITE RIBBON ── */}
      <div className="relative bg-gradient-to-r from-[#1a3a6b] via-[#1e4db7] to-[#1a3a9e] rounded-2xl px-3 py-2.5 shadow-xl border border-blue-400/20 flex items-center gap-3 flex-wrap xl:flex-nowrap">
        {/* Glows — clipped separately so they don't overflow */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-[90px] opacity-20 -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-indigo-500 rounded-full blur-[70px] opacity-15" />
        </div>



        <div className="flex flex-col min-w-fit pl-2 flex-1">
          <h1 className="text-base font-black text-white tracking-tight leading-none">
            Hi,{' '}
            <button
              onClick={handleProfileClick}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {user?.firstname || 'Champ'}
            </button>
            !
          </h1>
        </div>

        {/* ── ACTIONS (SEARCH, ENROLL, NOTIFICATIONS, PROFILE) ── */}
        <div className="flex items-center gap-6 ml-auto h-10">
          {/* SEARCH BAR */}
          <div className="relative flex items-center group w-full max-w-[180px]">
            <Search className="absolute left-3 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Search tests..."
              className="bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm font-bold text-white placeholder-white/30 outline-none w-full transition-all focus:ring-2 focus:ring-blue-500/50"
              onFocus={() => setShowSearch(true)}
            />
          </div>

          <button
            onClick={() => setActiveTab('my-tests')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <BookOpen size={14} />
            My Enrolls
          </button>

          {/* 🔔 NOTIFICATIONS WITH TEXT */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications((p) => !p);
                setShowSearch(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all backdrop-blur-md 
                ${hasNotification ? 'bg-rose-500/20 border-rose-400/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              title="Notifications"
            >
              <Bell
                className={`transition-colors drop-shadow ${hasNotification ? 'text-rose-300 animate-pulse' : 'text-slate-300'}`}
                size={16}
              />
              <span className={`text-xs font-black uppercase tracking-wider ${hasNotification ? 'text-rose-300' : 'text-slate-300'}`}>
                Notifications
              </span>
              {hasNotification && (
                <span className="w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl z-[200] rounded-2xl overflow-hidden text-left"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                       <Bell size={12} className="text-rose-500" />
                       <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Inbox</p>
                    </div>
                    <button
                      onClick={() => { setNotifications([]); setShowNotifications(false); }}
                      className="text-blue-600 hover:text-blue-700 text-[11px] font-black uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <Bell size={32} className="text-slate-200 mb-2" />
                        <p className="text-xs font-bold text-slate-400">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start gap-4 px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                            <Bell size={14} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 leading-snug group-hover:text-blue-600 transition-colors">{n.text}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">{n.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 👤 PROFILE ICON BUTTON integrated */}
          <button
            onClick={handleProfileClick}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 shadow-lg hover:scale-105 active:scale-95 transition-all ml-4"
          >
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-blue-400 text-xs overflow-hidden">
              {resolvedAvatar ? (
                 <img src={getImageUrl(resolvedAvatar)} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (userData?.firstname || studentProfile?.firstname)?.charAt(0).toUpperCase()
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ── GLOBAL SEARCH MODAL ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 px-4"
            onClick={() => { setShowSearch(false); setSearchTerm(''); }}
          >
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <Search size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  id="header-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search any test, exam, category..."
                  className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm font-medium outline-none"
                />
                <button
                  onClick={() => { setShowSearch(false); setSearchTerm(''); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {!searchTerm.trim() ? (
                  <div className="p-10 text-center">
                    <TrendingUp size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-bold">Start typing to search tests</p>
                    <p className="text-slate-400 text-[11px] mt-1">Search mock tests, grand tests, categories and more</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-10 text-center">
                    <Search size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-bold">No results found</p>
                    <p className="text-slate-400 text-[11px] mt-1">Try searching with different keywords</p>
                  </div>
                ) : (
                  <div className="p-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">
                      {searchResults.length} Results Found
                    </p>
                    {searchResults.map((test) => (
                      <button
                        key={test._id}
                        onClick={() => handleExploreTest(test)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-all group text-left"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow-sm
                            ${test.isGrandTest ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}
                        >
                          {test.isGrandTest ? <Trophy size={16} /> : <Star size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                            {test.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded
                                ${test.isGrandTest ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}
                            >
                              {test.isGrandTest ? 'Grand Test' : 'Mock Test'}
                            </span>
                            {test.category?.name && (
                              <span className="text-[9px] text-slate-400 font-bold">{test.category.name}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-[9px] text-slate-400 font-bold">Press Esc to close</p>
                <button
                  onClick={() => { setShowSearch(false); if (setActiveTab) setActiveTab('explore'); }}
                  className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider hover:underline"
                >
                  Browse All Tests →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default StuHeader;