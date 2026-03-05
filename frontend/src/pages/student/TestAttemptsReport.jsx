import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  Clock, 
  ChevronRight, 
  FileText,
  AlertCircle,
  BarChart2,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

const SimpleSpinner = ({ size = 24, color = "#06b6d4", className = "" }) => (
  <svg
    className={`animate-spin ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill={color}
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    ></path>
  </svg>
);

const TestAttemptsReport = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAttempts = async () => {
            try {
                const res = await api.get(`/api/student/test-attempts/${testId}`);
                if (res.data.success) {
                    setData(res.data);
                }
            } catch (err) {
                console.error("Error fetching attempts:", err);
                toast.error("Failed to load attempt history");
            } finally {
                setLoading(false);
            }
        };
        fetchAttempts();
    }, [testId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <SimpleSpinner size={40} />
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading attempts report...</p>
            </div>
        );
    }

    if (!data || !data.test) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
                <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Test Not Found</h2>
                <p className="text-slate-500 mt-2 max-w-xs">We couldn't find the test data you're looking for.</p>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-all"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { test, attempts } = data;
    const bestScore = attempts.length > 0 
        ? Math.max(...attempts.map(a => a.score || 0)) 
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(`/student/instructions/${testId}`)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-widest text-slate-800 line-clamp-1">
                                {test.title}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Detailed Attempt History
                            </p>
                        </div>
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                        <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                            Best: {bestScore.toFixed(1)}/{test.totalMarks}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Attempts</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">{attempts.length}</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <BarChart2 className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Score</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                            {attempts.length > 0 
                                ? (attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length).toFixed(1) 
                                : "0.0"}
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marking Scheme</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                            +{test.marksPerQuestion || 1} Correct / -{test.negativeMarking || 0} Wrong
                        </p>
                    </div>
                </div>

                {/* Attempts Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             All Attempts
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {attempts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                            No attempts found for this test yet.
                                        </td>
                                    </tr>
                                ) : (
                                    attempts.map((attempt, idx) => {
                                        const date = new Date(attempt.createdAt);
                                        const isCompleted = attempt.status === 'completed' || attempt.status === 'finished';
                                        const scorePercent = ((attempt.score / test.totalMarks) * 100).toFixed(1);

                                        return (
                                            <tr key={attempt._id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                    {attempts.length - idx}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        isCompleted 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {isCompleted ? 'Completed' : 'Started'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-800">
                                                            {attempt.score.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ {test.totalMarks}</span>
                                                        </span>
                                                        <div className="w-20 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                            <div 
                                                                className={`h-full ${parseFloat(scorePercent) > 70 ? 'bg-emerald-500' : parseFloat(scorePercent) > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                style={{ width: `${Math.min(100, Math.max(0, scorePercent))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {isCompleted ? (
                                                        <Link 
                                                            to={`/student/review/${attempt._id}`}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition shadow-sm active:scale-95"
                                                        >
                                                            Review <ChevronRight className="w-3 h-3" />
                                                        </Link>
                                                    ) : (
                                                        <Link 
                                                            to={`/student/write-test/${attempt._id}`}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-sm active:scale-95"
                                                        >
                                                            Resume <ChevronRight className="w-3 h-3" />
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => navigate(`/student/instructions/${testId}`)}
                        className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Instructions
                    </button>
                </div>
            </main>
        </div>
    );
};

export default TestAttemptsReport;
