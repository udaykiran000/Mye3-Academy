// frontend/src/components/admin/TestTypeBreakdown.jsx

import React from "react";
import { ClipboardList, Trophy } from "lucide-react";

import MonthlyTestSalesChart from "./MonthlyTestSalesChart";

// Helper to format currency
const formatRevenue = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const TestTypeBreakdown = ({ data = [], monthlyData = [] }) => {
  const safeData = Array.isArray(data) ? data : [];
  const regular = safeData.find(d => d.testType === "Regular Tests") || { salesCount: 0, totalRevenue: 0 };
  const grand = safeData.find(d => d.testType === "Grand Tests") || { salesCount: 0, totalRevenue: 0 };

  return (
    <div className="flex flex-col h-full space-y-8">
        <div className="space-y-4">
            {/* Regular Tests Row */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-none border border-slate-100/50 group hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#6a73fa] flex items-center justify-center transition-transform group-hover:scale-110">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-bold text-[#3e4954]">Mock Tests</h4>
                        <p className="text-[12px] font-medium text-[#7e7e7e]">Fixed Tier Assessments</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[14px] font-black text-[#3e4954]">{regular.salesCount} Sales</p>
                    <p className="text-[12px] font-bold text-emerald-500">{formatRevenue(regular.totalRevenue)}</p>
                </div>
            </div>

            {/* Grand Tests Row */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-none border border-slate-100/50 group hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#b472fb] flex items-center justify-center transition-transform group-hover:scale-110">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-bold text-[#3e4954]">Grand Test Report</h4>
                        <p className="text-[12px] font-medium text-[#7e7e7e]">Institutional Analytics</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[14px] font-black text-[#3e4954]">{grand.salesCount} Sales</p>
                    <p className="text-[12px] font-bold text-amber-500">{formatRevenue(grand.totalRevenue)}</p>
                </div>
            </div>
        </div>

        {/* Monthly Trend Section */}
        <div className="flex-1 mt-auto">
            <h5 className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                Monthly Sales Trend
            </h5>
            <div className="h-[180px]">
                <MonthlyTestSalesChart data={monthlyData} />
            </div>
        </div>
    </div>
  );
};

export default TestTypeBreakdown;