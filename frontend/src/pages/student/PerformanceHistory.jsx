import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchPerformanceHistory } from "../../redux/studentSlice";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Zap,
  ChevronRight,
  BarChart2,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  Target,
} from "lucide-react";
import { ClipLoader } from "react-spinners";

/* ─── Filter Tabs ─────────────────────────────────────── */
const FILTER_TABS = [
  { key: "all",   label: "All Tests",   icon: BarChart2 },
  { key: "mock",  label: "Mock Tests",  icon: BookOpen  },
  { key: "grand", label: "Grand Tests", icon: Zap       },
];

const TYPE_COLORS = {
  grand: { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-200", label: "GRAND" },
  mock:  { bg: "bg-blue-500",  text: "text-blue-700",  light: "bg-blue-50",  border: "border-blue-200",  label: "MOCK" },
};

/* ─── Bar chart tooltip ───────────────────────────────── */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const pct = payload[0].value;
  return (
    <div className="bg-white border border-slate-100 shadow-xl rounded-xl px-4 py-3 min-w-[140px]">
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 truncate max-w-[160px]">{label}</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-black text-slate-800 text-xl">{pct}%</span>
        <span className="text-[9px] font-bold text-slate-400">score</span>
      </div>
      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${pct >= 50 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
        {pct >= 50 ? "✓ Passed" : "✗ Failed"}
      </span>
    </div>
  );
};

/* ─── Donut center ─────────────────────────────────────── */
const DonutCenterLabel = ({ viewBox, total, mock, grand }) => {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 16} textAnchor="middle" style={{ fontSize: "24px", fontWeight: 900, fill: "#1e293b" }}>
        {total}
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" style={{ fontSize: "9px", fontWeight: 800, fill: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase" }}>
        Total
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" style={{ fontSize: "9px", fontWeight: 800, fill: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase" }}>
        Attempts
      </text>
    </g>
  );
};

/* ─── Main ─────────────────────────────────────────────── */
const PerformanceHistory = ({ initialFilter = "all" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { attemptsHistory, attemptsHistoryStatus } = useSelector((s) => s.students);
  const loading = attemptsHistoryStatus === "loading";
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  
  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);


  useEffect(() => { dispatch(fetchPerformanceHistory()); }, [dispatch]);

  /* ── Analytics ── */
  const { totalAttempts, mockCount, grandCount, avgPct, barData, donutData } = useMemo(() => {
    const attempts = attemptsHistory || [];

    const grand = attempts.filter(
      (a) => a.mocktestId?.isGrandTest === true || a.mocktestId?.title?.toLowerCase().includes("grand")
    );
    const mock = attempts.filter(
      (a) => !(a.mocktestId?.isGrandTest === true || a.mocktestId?.title?.toLowerCase().includes("grand"))
    );

    /* Avg score % */
    const completed = attempts.filter((a) => (a.mocktestId?.totalMarks || 0) > 0);
    const percentages = completed.map((a) => (a.score / a.mocktestId.totalMarks) * 100);
    const avg = percentages.length
      ? (percentages.reduce((s, v) => s + v, 0) / percentages.length).toFixed(1)
      : null;

    /* Donut: Mock vs Grand */
    const donut =
      attempts.length > 0
        ? [
            { name: `Mock Tests`, value: mock.length, color: "#6366f1" },
            { name: `Grand Tests`, value: grand.length, color: "#f59e0b" },
          ].filter((d) => d.value > 0)
        : [{ name: "No Data", value: 1, color: "#e2e8f0" }];

    /* Bar: last 10, oldest → newest */
    const bar = [...attempts]
      .filter((a) => (a.mocktestId?.totalMarks || 0) > 0)
      .reverse()
      .slice(0, 10)
      .map((a) => {
        const pct = +((a.score / a.mocktestId.totalMarks) * 100).toFixed(1);
        const title = a.mocktestId?.title || "Test";
        return { name: title.length > 14 ? title.slice(0, 14) + "…" : title, score: pct };
      });

    return {
      totalAttempts: attempts.length,
      mockCount: mock.length,
      grandCount: grand.length,
      avgPct: avg,
      barData: bar,
      donutData: donut,
    };
  }, [attemptsHistory]);

  /* ── Filtered table ── */
  const filteredAttempts = useMemo(() => {
    const all = attemptsHistory || [];
    if (activeFilter === "all") return all;
    if (activeFilter === "grand")
      return all.filter((a) => a.mocktestId?.isGrandTest === true || a.mocktestId?.title?.toLowerCase().includes("grand"));
    return all.filter((a) => !(a.mocktestId?.isGrandTest === true || a.mocktestId?.title?.toLowerCase().includes("grand")));
  }, [attemptsHistory, activeFilter]);

  const noData = totalAttempts === 0;
  const avgNum = avgPct !== null ? Number(avgPct) : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-200">
          <TrendingUp size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">My Performance</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[2px]">Your complete exam analytics</p>
        </div>
      </div>

      {/* ── Charts ── */}
      {loading ? (
        <div className="flex justify-center py-16"><ClipLoader size={40} color="#6366f1" /></div>
      ) : noData ? (
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <BarChart2 size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest">No attempts yet</p>
          <p className="text-slate-300 text-xs mt-1">Take a test to see your analytics here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Donut — Mock vs Grand attempts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-slate-900 rounded-lg">
                <Target size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Attempts Breakdown</p>
                <p className="text-[9px] text-slate-400 font-bold">Mock vs Grand tests</p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={donutData.length > 1 ? 4 : 0}
                    dataKey="value"
                    strokeWidth={0}
                    label={false}
                    labelLine={false}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* SVG center text overlay */}
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: "22px", fontWeight: 900, fill: "#1e293b" }}>
                    {totalAttempts}
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: "9px", fontWeight: 800, fill: "#94a3b8", letterSpacing: "2px" }}>
                    TOTAL
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Mock Tests</span>
                </div>
                <span className="text-sm font-black text-indigo-800">{mockCount}</span>
              </div>
              <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Grand Tests</span>
                </div>
                <span className="text-sm font-black text-amber-800">{grandCount}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Bar Chart with Avg Score reference line */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-900 rounded-lg">
                  <BarChart2 size={14} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Score Per Attempt</p>
                  <p className="text-[9px] text-slate-400 font-bold">Last {barData.length} scored attempts</p>
                </div>
              </div>

              {/* Avg score badge — prominent */}
              {avgNum !== null && (
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Avg Score</span>
                  <div className={`px-3 py-1 rounded-xl text-sm font-black border ${
                    avgNum >= 50 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                    {avgNum}%
                  </div>
                </div>
              )}
            </div>

            <ResponsiveContainer width="100%" height={206}>
              <BarChart data={barData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                {/* 50% pass threshold line */}
                <ReferenceLine
                  y={50}
                  stroke="#fb923c"
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  label={{ value: "Pass 50%", position: "insideTopRight", fontSize: 9, fontWeight: 700, fill: "#fb923c" }}
                />
                {/* Avg score line */}
                {avgNum !== null && (
                  <ReferenceLine
                    y={avgNum}
                    stroke="#6366f1"
                    strokeDasharray="5 4"
                    strokeWidth={2}
                    label={{ value: `Avg ${avgNum}%`, position: "insideTopLeft", fontSize: 9, fontWeight: 800, fill: "#6366f1" }}
                  />
                )}
                <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)", radius: 6 }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.score >= 50 ? "#6366f1" : "#f43f5e"} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend row */}
            <div className="flex gap-5 mt-3 border-t border-slate-50 pt-3 justify-between items-center">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-500 opacity-85" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">≥50% Pass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-rose-500 opacity-85" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">&lt;50% Fail</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0 border-t-2 border-dashed border-orange-400" />
                  <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Pass line</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0 border-t-2 border-dashed border-indigo-500" />
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Your avg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Attempt History Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl">
              <BarChart2 size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Attempt History</h3>
          </div>
          <div className="hidden items-center gap-2 flex-wrap">
            <Filter size={13} className="text-slate-400" />
            {FILTER_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                  activeFilter === key
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <Icon size={10} strokeWidth={3} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20"><ClipLoader size={36} color="#6366f1" /></div>
        ) : filteredAttempts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <BarChart2 size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest">No attempts found</p>
            <p className="text-slate-300 text-xs mt-1">
              {activeFilter === "all" ? "Take a test to see your history here." : `No ${activeFilter} test attempts yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  {["Test", "Type", "Date", "Score", "%", "Action"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[3px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAttempts.map((att) => {
                  const totalMarks = att.mocktestId?.totalMarks || 0;
                  const score = att.score || 0;
                  const pct = totalMarks > 0 ? ((score / totalMarks) * 100).toFixed(2) : "0.00";
                  const passed = Number(pct) >= 50;
                  const isGrand = att.mocktestId?.isGrandTest === true || att.mocktestId?.title?.toLowerCase().includes("grand");
                  const typeStyle = isGrand ? TYPE_COLORS.grand : TYPE_COLORS.mock;
                  const dateStr = new Date(att.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  });
                  return (
                    <tr key={att._id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-8 rounded-full ${typeStyle.bg} flex-shrink-0`} />
                          <span className="font-black text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {att.mocktestId?.title || "Untitled Test"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${typeStyle.light} ${typeStyle.text} border ${typeStyle.border}`}>
                          {isGrand ? <Zap size={8} /> : <BookOpen size={8} />}
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <Clock size={11} className="text-slate-400" />
                          {dateStr}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-black text-sm ${score < 0 ? "text-rose-600" : "text-indigo-600"}`}>{score}</span>
                        <span className="text-xs text-slate-400 font-bold"> / {totalMarks}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                          passed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {pct}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/student/review/${att._id}`)}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all"
                        >
                          Review
                          <ChevronRight size={12} strokeWidth={3} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {filteredAttempts.length} of {(attemptsHistory || []).length} attempts
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceHistory;
