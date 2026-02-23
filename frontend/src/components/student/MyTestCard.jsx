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
        // Prioritize START/RESUME/RE-ATTEMPT over View Report
        if (isReadyForNewAttempt || test.status === 'not_started' || test.status === 'in-progress' || isCompleted) {
            navigate(`/student/instructions/${test._id}`);
        }
    };
    
    // Determine the text for the button and the banner status
    let buttonText = "Start Exam";
    let bannerStatus = "READY";
    
    if (isCompleted && !isReadyForNewAttempt) {
        buttonText = "Re-attempt Exam";
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
                group flex flex-col bg-gray-900 rounded-2xl shadow-xl border border-gray-800
                transition duration-300 w-full 
                hover:scale-[1.03] hover:shadow-2xl ${hoverGlow}
            `}
        >

            <div className="relative w-full h-44 sm:h-52 rounded-t-2xl overflow-hidden">
                    <img
                        src={imgSrc}
                        alt={test.title}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                    />

                <span
                    className={`
                        absolute bottom-0 right-0 px-4 py-2 text-lg sm:text-xl font-extrabold text-white 
                        bg-gradient-to-r ${accent.bg} rounded-tl-xl shadow-inner
                    `}
                >
                    {bannerStatus}
                </span>

                <span className={`absolute top-4 left-4 text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow ${badgeColor}`}>
                    {testTypeBadge}
                </span>
            </div>

            <div className="p-5 pb-3 flex-grow">
                <p className="text-xs text-gray-400 uppercase mb-1">
                    {test.category?.name || "Category"}
                </p>

                <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition">
                    {test.title}
                </h3>

                <div className="grid grid-cols-3 gap-x-2 py-4 mt-4 border-t border-b border-gray-700/40">
                    <StatItem icon={Clock} value={Number(test.durationMinutes) || (Number(test.totalQuestions) * 2) || 30} label="Min" accentColorClass={accent.text} />
                    <StatItem icon={BookOpen} value={test.totalQuestions || 0} label="Questions" accentColorClass={accent.text} />
                    <StatItem icon={BarChart2} value={test.attemptsMade || 0} label="Attempts" accentColorClass={accent.text} />
                </div>
            </div>

            <div className="px-5">
                <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${isCompleted && !isReadyForNewAttempt ? "bg-green-500" : (isGrandTest ? "bg-indigo-500" : "bg-cyan-500")}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="p-5 pt-4">
                <button
                    onClick={handleStart}
                    className={`
                        w-full flex items-center justify-center py-3 rounded-xl 
                        font-bold text-white transition
                        ${isCompleted && !isReadyForNewAttempt ? "bg-green-600 hover:bg-green-500" : (isGrandTest ? "bg-indigo-600 hover:bg-indigo-500" : "bg-cyan-600 hover:bg-cyan-500")}
                    `}
                >
                    <Play size={18} className="mr-2" />
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default MyTestCard;