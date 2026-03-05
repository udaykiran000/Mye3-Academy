import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    Clock,
    BarChart2,
    Play
} from 'lucide-react';
import api from "../../api/axios";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";

const StatItem = ({ icon: Icon, value, label, accentColorClass }) => (
    <div className="text-center">
        <Icon size={20} className={`${accentColorClass} mx-auto mb-1`} />
        <p className="text-lg sm:text-xl font-extrabold text-white leading-tight">{value}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
);

const MyTestCard = ({ test }) => {
    const navigate = useNavigate();

  /* Image logic replaced with helper */
  const imgSrc = getImageUrl(test.thumbnail);

    /* ⭐ FIX: Include 'ready_to_retry' status */
    const isCompleted =
        test.status === "completed" ||
        test.status === "finished";
    
    // ⭐ NEW STATUS: Flag for when the test is completed but a new purchase allows a retry
    const isReadyForNewAttempt = test.status === "ready_to_retry";
    const isInProgress = test.progress > 0 || test.status === "in-progress";

    const isGrandTest = test.isGrandTest === true;
    const testTypeBadge = isGrandTest ? "GRAND TEST" : "MOCK TEST";
    const badgeColor = isGrandTest ? "bg-indigo-600" : "bg-purple-600";
    const hoverGlow = isGrandTest ? "hover:shadow-indigo-500/30" : "hover:shadow-cyan-500/30";

    const progress = isCompleted ? 100 : test.progress || 0;

    // Adjust accent logic for the new status
    const accent = isCompleted && !isReadyForNewAttempt
        ? { bg: "from-green-500 to-emerald-400", text: "text-green-400" }
        : isInProgress
            ? { bg: "from-orange-500 to-amber-400", text: "text-orange-400" }
            : { bg: isGrandTest ? "from-indigo-500 to-purple-400" : "from-cyan-500 to-teal-400", text: isGrandTest ? "text-indigo-400" : "text-cyan-400" };

    const handleStart = () => {
        // If completed and no re-attempt is ready, go straight to report
        if (isCompleted && !isReadyForNewAttempt) {
            navigate(`/student/report/${test.latestAttemptId}`);
            return;
        }
        // Prioritize START/RESUME/RE-ATTEMPT
        if (isReadyForNewAttempt || test.status === 'not_started' || test.status === 'in-progress') {
            navigate(`/student/instructions/${test._id}`);
        }
    };
    
    // Determine the text for the button and the banner status
    let buttonText = "Start Exam";
    let bannerStatus = "READY";
    
    if (isCompleted && !isReadyForNewAttempt) {
        buttonText = "View Report";
        bannerStatus = "COMPLETED";
    } else if (isInProgress) {
        buttonText = "Resume Exam";
        bannerStatus = "IN PROGRESS";
    } else if (isReadyForNewAttempt) {
        // Completed before, but new purchase allows restart
        buttonText = "Start New Attempt";
        bannerStatus = "RETRY READY"; 
    }

    return (
        <div
            className={`
                group flex flex-col bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)]
                transition-all duration-500 w-full overflow-hidden
                hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.06)] hover:border-blue-400/30 hover:-translate-y-1
            `}
        >
            {/* ── MINI THUMBNAIL AREA ── */}
            <div className="relative w-full h-36 overflow-hidden bg-slate-50">
                <img
                    src={imgSrc}
                    alt={test.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-40" />
                
                {/* Micro Badges */}
                <div className="absolute top-2.5 left-2.5">
                    <span className={`px-2 py-0.5 text-[8px] font-black text-white rounded-[4px] shadow-sm uppercase tracking-widest backdrop-blur-md border border-white/5 ${badgeColor}`}>
                        {testTypeBadge?.split(" ")[0]}
                    </span>
                </div>

                <div className="absolute bottom-2.5 left-2.5">
                    <span className={`px-2 py-0.5 text-[9px] font-black text-white rounded-md shadow-sm uppercase tracking-tighter flex items-center gap-1 bg-slate-900/70 border border-white/10`}>
                        <div className={`w-1 h-1 rounded-full animate-pulse bg-current ${accent.text}`}></div>
                        {bannerStatus}
                    </span>
                </div>
            </div>

            {/* ── ULTRA-LEAN CONTENT AREA ── */}
            <div className="p-4 flex flex-grow flex-col">
                <h3 className="text-[14px] font-black text-slate-800 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors mb-3 min-h-[36px]">
                    {test.title}
                </h3>

                {/* Single-Line Micro Meta */}
                <div className="flex items-center justify-between py-2 border-y border-slate-50/50 mb-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex items-center gap-1 min-w-fit">
                            <Clock size={12} className="text-slate-300" />
                            <span className="text-[10px] font-black text-slate-500">{test.durationMinutes || 30}m</span>
                        </div>
                        <div className="w-px h-3 bg-slate-100"></div>
                        <div className="flex items-center gap-1 min-w-fit">
                            <BookOpen size={12} className="text-slate-300" />
                            <span className="text-[10px] font-black text-slate-500">{test.totalQuestions || 0}Q</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                        {test.attemptsMade || 0} Attempts
                    </div>
                </div>

                {/* Progress Mini-Bar */}
                <div className="mt-auto">
                    <div className="w-full bg-slate-50 rounded-full h-0.5 overflow-hidden mb-2">
                        <div
                            className={`h-full transition-all duration-1000 ease-out ${isCompleted && !isReadyForNewAttempt ? "bg-emerald-500" : (isGrandTest ? "bg-indigo-600" : "bg-blue-600")}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Elite Action Button */}
                    <button
                        onClick={handleStart}
                        className={`
                            w-full py-2.5 rounded-lg font-black text-[10px] uppercase tracking-[1.5px] text-white transition-all transform active:scale-95 shadow-sm flex items-center justify-center gap-1.5
                            ${isCompleted && !isReadyForNewAttempt 
                                ? "bg-slate-800 hover:bg-slate-700" 
                                : (isGrandTest ? "bg-indigo-600 hover:bg-indigo-500" : "bg-blue-600 hover:bg-blue-500")
                            }
                        `}
                    >
                        <Play size={10} fill="currentColor" />
                        {buttonText?.split(" ")[0]} EXAM
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyTestCard;