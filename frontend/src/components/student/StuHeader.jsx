import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell, Trophy, Search, ShoppingCart, X, User,
  LogOut, ChevronRight, Star, Medal, TrendingUp
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

  // ─── CART (purchased tests count) ────────────────────────────
  const { userData } = useSelector((state) => state.user);
  const purchasedCount = userData?.purchasedTests?.length || 0;

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

  const handleCartClick = () => {
    if (setActiveTab) setActiveTab('my-tests');
  };

  const handleExploreTest = (test) => {
    setShowSearch(false);
    setSearchTerm('');
    if (setActiveTab) setActiveTab('explore');
  };

  const rankLabel = myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : myRank ? `#${myRank}` : null;

  return (
    <header className="mb-6 relative">
      {/* ── ELITE RIBBON ── */}
      <div className="relative bg-gradient-to-r from-[#1a3a6b] via-[#1e4db7] to-[#1a3a9e] rounded-2xl px-3 py-2.5 shadow-xl border border-blue-400/20 flex items-center gap-3 flex-wrap xl:flex-nowrap">
        {/* Glows — clipped separately so they don't overflow */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-[90px] opacity-20 -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-indigo-500 rounded-full blur-[70px] opacity-15" />
        </div>

        {/* ── PROFILE AVATAR (clickable → settings) ── */}
        <button
          onClick={handleProfileClick}
          className="relative group flex-shrink-0 focus:outline-none"
          title="View Profile"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-300 to-indigo-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#1a3a6b] rounded-[10px] overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-sm font-black text-white uppercase">
                  {user?.firstname?.charAt(0) || 'S'}
                </span>
              )}
            </div>
          </div>
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-blue-900 rounded-full" />
        </button>

        {/* ── GREETING + RANK ── */}
        <div className="flex flex-col min-w-fit">
          <h1 className="text-sm font-black text-white tracking-tight leading-none mb-0.5">
            Hi,{' '}
            <button
              onClick={handleProfileClick}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {user?.firstname || 'Champ'}
            </button>
            !
          </h1>
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] text-blue-200/70 font-bold uppercase tracking-widest hidden sm:block">
              Control Center
            </p>
            {rankLabel && (
              <span className="hidden sm:flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                <Medal size={9} className="flex-shrink-0" />
                {rankLabel}
              </span>
            )}
          </div>
        </div>

        {/* SEPARATOR */}
        <div className="hidden xl:block w-px h-8 bg-white/10 flex-shrink-0" />

        {/* ── HALL OF FAME STRIP ── */}
        <AnimatePresence>
          {globalLeaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10 flex-1 flex items-center gap-3 overflow-hidden min-w-0"
            >
              <div className="flex items-center gap-1.5 min-w-fit">
                <div className="w-7 h-7 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30 flex-shrink-0">
                  <Trophy size={13} />
                </div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest hidden lg:block">
                  Hall of Fame
                </p>
              </div>

              <div className="flex-1 overflow-x-auto scroll-hidden">
                <div className="flex items-center gap-2 py-0.5">
                  {globalLeaderboard.slice(0, 4).map((ranker, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05, y: -1 }}
                      className="flex items-center gap-1.5 bg-white/5 pl-1 pr-2.5 py-1 rounded-xl border border-white/5 hover:border-blue-500/40 hover:bg-white/10 transition-all cursor-default min-w-fit group backdrop-blur-sm"
                    >
                      <div className="relative">
                        <div
                          className={`w-6 h-6 rounded-[6px] flex items-center justify-center text-white font-black text-[10px] shadow-inner
                            ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'}`}
                        >
                          {ranker.name?.charAt(0)}
                        </div>
                        <div
                          className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-black border border-slate-900
                            ${index === 0 ? 'bg-amber-400 text-amber-900' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-blue-600'}`}
                        >
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-200 truncate max-w-[70px] leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tighter">
                          {ranker.name}
                        </p>
                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">
                          {ranker.totalScore?.toLocaleString()} pts
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RIGHT ACTIONS ── */}
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0 relative z-10">

          {/* 🔍 GLOBAL SEARCH */}
          <button
            onClick={() => setShowSearch(true)}
            className="relative p-2 bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition-all group backdrop-blur-md"
            title="Search Tests"
          >
            <Search className="text-white group-hover:text-yellow-300 transition-colors drop-shadow" size={15} />
          </button>

          {/* 🛒 CART (My Tests) */}
          <button
            onClick={handleCartClick}
            className="relative p-2 bg-emerald-500/20 hover:bg-emerald-500/35 rounded-lg border border-emerald-400/30 transition-all group backdrop-blur-md"
            title="My Enrolled Tests"
          >
            <ShoppingCart className="text-emerald-300 group-hover:text-emerald-200 transition-colors drop-shadow" size={15} />
            {purchasedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-emerald-400 rounded-full border-2 border-blue-900 text-[8px] font-black text-blue-900 flex items-center justify-center px-0.5 shadow-lg">
                {purchasedCount > 9 ? '9+' : purchasedCount}
              </span>
            )}
          </button>

          {/* 🔔 NOTIFICATIONS */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications((p) => !p);
                setShowSearch(false);
              }}
              className="relative p-2 bg-rose-500/20 hover:bg-rose-500/35 rounded-lg border border-rose-400/30 transition-all group backdrop-blur-md"
              title="Notifications"
            >
              <Bell
                className={`transition-colors drop-shadow ${hasNotification ? 'text-rose-300 animate-pulse' : 'text-rose-300 group-hover:text-rose-200'}`}
                size={15}
              />
              {hasNotification && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-400 rounded-full border-2 border-blue-900 text-[8px] font-black text-white flex items-center justify-center px-0.5 shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
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
                  className="absolute top-full right-0 mt-2 w-72 bg-gradient-to-b from-[#1e3a7a] to-[#162d62] border border-blue-400/30 rounded-2xl shadow-2xl z-[200] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-blue-400/20 bg-white/5">
                    <div className="flex items-center gap-2">
                      <Bell size={12} className="text-rose-300" />
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Notifications</p>
                    </div>
                    <button
                      onClick={() => { setNotifications([]); setShowNotifications(false); }}
                      className="text-blue-300 hover:text-white text-[9px] font-bold uppercase tracking-wider hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 flex flex-col items-center justify-center text-center">
                        <Bell size={28} className="text-blue-400/40 mb-2" />
                        <p className="text-blue-200/70 text-[11px] font-bold">No new notifications</p>
                        <p className="text-blue-300/40 text-[10px] mt-1">We'll notify you when doubts are answered</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start gap-3 px-4 py-3 border-b border-blue-400/10 hover:bg-white/5 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bell size={11} className="text-rose-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-white leading-snug">{n.text}</p>
                            <p className="text-[9px] text-blue-300/50 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 👤 PROFILE ICON BUTTON */}
          <button
            onClick={handleProfileClick}
            className="p-2 bg-indigo-500/25 hover:bg-indigo-500/40 rounded-lg border border-indigo-400/40 transition-all group backdrop-blur-md"
            title="My Profile"
          >
            <User className="text-indigo-200 group-hover:text-white transition-colors drop-shadow" size={15} />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 px-4"
            onClick={() => { setShowSearch(false); setSearchTerm(''); }}
          >
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Search size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  id="header-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search any test, exam, category..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm font-medium outline-none"
                />
                <button
                  onClick={() => { setShowSearch(false); setSearchTerm(''); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {!searchTerm.trim() ? (
                  <div className="p-6 text-center">
                    <TrendingUp size={32} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-bold">Start typing to search tests</p>
                    <p className="text-slate-600 text-[11px] mt-1">Search mock tests, grand tests, categories and more</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center">
                    <Search size={32} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-bold">No results found</p>
                    <p className="text-slate-600 text-[11px] mt-1">Try searching with different keywords</p>
                  </div>
                ) : (
                  <div className="p-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-3 py-2">
                      {searchResults.length} Results Found
                    </p>
                    {searchResults.map((test) => (
                      <button
                        key={test._id}
                        onClick={() => handleExploreTest(test)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow-inner
                            ${test.isGrandTest ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}
                        >
                          {test.isGrandTest ? <Trophy size={16} /> : <Star size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                            {test.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded
                                ${test.isGrandTest ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}
                            >
                              {test.isGrandTest ? 'Grand Test' : 'Mock Test'}
                            </span>
                            {test.category?.name && (
                              <span className="text-[9px] text-slate-500 font-bold">{test.category.name}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <p className="text-[9px] text-slate-600 font-bold">Press Esc to close</p>
                <button
                  onClick={() => { setShowSearch(false); if (setActiveTab) setActiveTab('explore'); }}
                  className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider hover:underline"
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