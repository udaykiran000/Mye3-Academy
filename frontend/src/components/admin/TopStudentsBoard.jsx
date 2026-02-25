import React from "react";
import { Trophy, Medal, Crown, Star, User } from "lucide-react";
import { motion } from "framer-motion";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";

const TopStudentsBoard = ({ students = [] }) => {
    // Medal colors and icons
    const getRankStyles = (index) => {
        switch (index) {
            case 0:
                return { 
                    bg: "bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200", 
                    text: "text-amber-600", 
                    icon: (
                        <div className="relative group/rank cursor-pointer">
                            <div className="absolute -inset-2 bg-amber-400/40 rounded-full blur-[8px] animate-pulse"></div>
                            <div className="relative w-12 h-12 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center border-2 border-amber-200 shadow-[0_8px_20px_rgba(180,120,0,0.4)] transition-transform duration-500 group-hover/rank:scale-110">
                                <Crown className="animate-bounce text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" size={22} />
                            </div>
                        </div>
                    ),
                    border: "border-amber-400/60"
                };
            case 1:
                return { 
                    bg: "bg-gradient-to-br from-orange-50 to-orange-100", 
                    text: "text-orange-600", 
                    icon: (
                        <div className="relative group/rank cursor-pointer">
                            <div className="absolute -inset-1 bg-orange-300/30 rounded-full blur-[2px] group-hover/rank:blur-[4px] transition-all"></div>
                            <div className="relative w-9 h-9 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center border-2 border-orange-200 shadow-[0_4px_8px_rgba(200,100,0,0.2)]">
                                <Medal className="text-white drop-shadow-sm" size={16} />
                            </div>
                        </div>
                    ),
                    border: "border-orange-400/50"
                };
            case 2:
                return { 
                    bg: "bg-gradient-to-br from-slate-50 to-slate-100", 
                    text: "text-slate-600", 
                    icon: (
                        <div className="relative group/rank cursor-pointer">
                            <div className="absolute -inset-1 bg-slate-300/30 rounded-full blur-[2px] group-hover/rank:blur-[4px] transition-all"></div>
                            <div className="relative w-9 h-9 rounded-full bg-gradient-to-b from-slate-300 to-slate-500 flex items-center justify-center border-2 border-slate-200 shadow-[0_4px_8px_rgba(70,70,70,0.2)]">
                                <Medal className="text-white drop-shadow-sm" size={16} />
                            </div>
                        </div>
                    ),
                    border: "border-slate-400/50"
                };
            default:
                return { 
                    bg: "bg-slate-50", 
                    text: "text-slate-400", 
                    icon: (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black">{index + 1}</span>
                        </div>
                    ),
                    border: "border-slate-100"
                };
        }
    };

    return (
        <div className="relative group/board bg-white p-6 rounded-none border border-slate-100 shadow-[0_30px_70px_rgba(0,0,0,0.15)] flex flex-col h-full overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_rgba(245,158,11,0.15)]">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            
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
                        top: -12px;
                        left: -12px;
                        right: -12px;
                        bottom: -12px;
                        background: conic-gradient(from 0deg, #f59e0b, #fbbf24, #f59e0b);
                        border-radius: 100%;
                        animation: rotate-halo 4s linear infinite;
                        opacity: 0.3;
                        filter: blur(4px);
                    }
                    .profile-frame {
                        position: absolute;
                        top: -4px;
                        left: -4px;
                        right: -4px;
                        bottom: -4px;
                        border: 3px solid #f59e0b;
                        border-radius: 100%;
                        box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
                        z-index: 5;
                    }
                `}
            </style>
            
            <div className="relative z-10 flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 flex items-center justify-center rounded-none shadow-[0_5px_15px_rgba(245,158,11,0.3)]">
                        <Trophy size={24} className="text-white drop-shadow-sm" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-[#3e4954] tracking-tight flex items-center gap-2">
                            Top Rankers
                        </h3>
                        <p className="text-[12px] font-bold text-[#7e7e7e] uppercase tracking-[0.2em] mt-0.5">Performance Elite Board</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="px-4 py-1.5 bg-emerald-500 text-white rounded-none text-[11px] font-black uppercase tracking-widest shadow-sm">
                        Live updates
                    </div>
                    <div className="text-[10px] font-bold text-slate-300 italic">2026 Season</div>
                </div>
            </div>

            <div className="relative z-10 flex-1 space-y-6 px-1">
                {students.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                        <Star size={32} className="opacity-20 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-tighter">No data available</p>
                    </div>
                ) : (
                    students.map((student, index) => {
                        const style = getRankStyles(index);
                        const isFirst = index === 0;
                        const isTopThree = index < 3;
                        return (
                            <motion.div
                                key={student.studentId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                                className={`
                                    flex items-center gap-5 p-4 bg-white/80 backdrop-blur-sm
                                    border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                                    group relative overflow-hidden transition-all duration-400
                                    hover:translate-y--1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]
                                    ${isFirst ? 'scale-[1.04] shadow-[0_25px_50px_rgba(245,158,11,0.2)] z-10 floating-card shimmer-effect !bg-gradient-to-br from-amber-50/90 via-amber-100/90 to-amber-200/90' : ''}
                                    ${isTopThree && !isFirst ? 'border-amber-200/50' : ''}
                                `}
                            >
                                {/* Rank Background Accent */}
                                {isTopThree && (
                                    <div className={`absolute top-0 left-0 w-1 h-full ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-orange-400' : 'bg-slate-400'}`}></div>
                                )}

                                {/* Champion Badge for #1 */}
                                {isFirst && (
                                    <div className="absolute top-0 right-0 z-20 overflow-hidden w-32 h-32 pointer-events-none">
                                        <div className="absolute top-6 -right-12 w-44 bg-gradient-to-r from-amber-600 via-amber-200 to-amber-600 text-amber-950 text-[11px] font-black py-1.5 transform rotate-45 text-center shadow-xl border-y border-amber-400/50 uppercase tracking-[0.2em] drop-shadow-md">
                                            TOP 1
                                        </div>
                                    </div>
                                )}

                                {/* Rank Icon */}
                                <div className={`flex items-center justify-center flex-shrink-0 ${style.text} scale-110`}>
                                    {style.icon}
                                </div>

                                {/* Avatar wrapper with halo/frame */}
                                <div className="relative flex-shrink-0 mx-2">
                                    {isFirst && (
                                        <>
                                            <div className="profile-halo"></div>
                                            <div className="profile-frame"></div>
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-amber-500 drop-shadow-sm">
                                                <Crown size={16} fill="currentColor" strokeWidth={3} />
                                            </div>
                                        </>
                                    )}
                                    <div className={`w-14 h-14 rounded-full border-2 shadow-lg overflow-hidden bg-white relative transition-transform duration-500 group-hover:scale-105 ${isFirst ? 'border-amber-400' : 'border-white'}`}>
                                        {student.avatar ? (
                                            <img 
                                                src={getImageUrl(student.avatar)} 
                                                alt={student.fullName}
                                                onError={handleImageError}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                <User size={24} />
                                            </div>
                                        )}
                                        {isFirst && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none"></div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-[16px] font-black text-[#3e4954] truncate transition-colors duration-300 group-hover:text-amber-600 ${isFirst ? 'text-amber-950 drop-shadow-sm' : ''}`}>
                                        {student.fullName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className={`h-1 w-1 rounded-full ${isFirst ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                        <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${isFirst ? 'text-amber-700/80 font-black' : 'text-slate-400'}`}>
                                            {student.totalAttempts} Assessments
                                        </span>
                                    </div>
                                </div>

                                {/* Score */}
                                <div className={`text-right transition-all duration-500 ${isFirst ? 'pr-16 transform -translate-x-2' : 'pr-4'}`}>
                                    <div className={`text-[20px] font-black leading-none tracking-tight ${isFirst ? 'text-amber-600 drop-shadow-sm scale-125 origin-right' : 'text-[#3e4954]'}`}>
                                        {student.totalScore}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isFirst ? 'text-amber-700/60' : 'text-slate-400'}`}>
                                        Points
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Footer Tip */}
            {students.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-[11px] text-slate-400 font-bold italic justify-center">
                    <Trophy size={12} className="text-amber-400" />
                    Real-time rankings based on all completed assessments
                </div>
            )}
        </div>
    );
};

export default TopStudentsBoard;
