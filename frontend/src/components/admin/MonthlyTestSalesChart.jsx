// frontend/src/components/admin/MonthlyTestSalesChart.jsx

import React from "react";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    Cell
} from "recharts";

const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MonthlyTestSalesChart = ({ data = [] }) => {
    // Process raw mongo aggregation data into chart format
    const chartData = [];
    const monthsMap = {};

    data.forEach(item => {
        const monthKey = `${item._id.year}-${item._id.month}`;
        if (!monthsMap[monthKey]) {
            monthsMap[monthKey] = {
                name: monthNames[item._id.month],
                Mock: 0,
                Grand: 0,
                monthIndex: item._id.month,
                year: item._id.year
            };
        }
        
        if (item._id.isGrandTest) {
            monthsMap[monthKey].Grand += item.salesCount;
        } else {
            monthsMap[monthKey].Mock += item.salesCount;
        }
    });

    // Convert map to sorted array
    Object.keys(monthsMap).sort((a, b) => {
        const [y1, m1] = a.split('-').map(Number);
        const [y2, m2] = b.split('-').map(Number);
        return y1 !== y2 ? y1 - y2 : m1 - m2;
    }).forEach(key => {
        chartData.push(monthsMap[key]);
    });

    if (chartData.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 bg-slate-50/30">
                <p className="text-xs font-bold uppercase tracking-widest">No monthly trend data</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    barGap={8}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, fontFamily: 'Poppins' }}
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, fontFamily: 'Poppins' }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '0px', 
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            fontFamily: 'Poppins'
                        }}
                        cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px', fontFamily: 'Poppins' }}
                    />
                    <Bar 
                        dataKey="Mock" 
                        fill="#6a73fa" 
                        radius={[4, 4, 0, 0]} 
                        barSize={12}
                    />
                    <Bar 
                        dataKey="Grand" 
                        fill="#b472fb" 
                        radius={[4, 4, 0, 0]} 
                        barSize={12}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlyTestSalesChart;
