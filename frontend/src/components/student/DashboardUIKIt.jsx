import React from 'react';

// Classy, Vibrant StatCard for a premium dashboard feel
export const StatCard = ({ icon, title, value, subValue, color }) => {
  // Map color names to Tailwind decorative tokens
  const colorMap = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-100' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-100' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-100' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-100' },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className={`relative group bg-white p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border-2 border-transparent hover:border-${color}-500/20 transition-all duration-500 overflow-hidden`}>
      {/* Subtle Background Shape */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 ${theme.light} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
      
      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className={`p-4 rounded-2xl ${theme.light} ${theme.text} shadow-sm border ${theme.border} group-hover:scale-110 group-hover:bg-${color}-500 group-hover:text-white transition-all duration-500`}>
            {React.cloneElement(icon, { size: 26, strokeWidth: 2.5 })}
          </div>
          <div className={`w-12 h-1 ${theme.bg} rounded-full opacity-20 group-hover:opacity-100 transition-opacity`}></div>
        </div>
        
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h3>
            {subValue && (
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[2px]">{subValue}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Interactive Bottom Accent */}
      <div className={`absolute bottom-0 left-0 w-0 h-1.5 ${theme.bg} group-hover:w-full transition-all duration-700`}></div>
    </div>
  );
};

export const ChartCard = ({ title, children, icon: Icon }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50">
    <div className="flex items-center gap-4 mb-8 pb-5 border-b border-slate-50">
       {Icon && (
         <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
           <Icon size={20} strokeWidth={2.5} />
         </div>
       )}
       <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">{title}</h3>
    </div>
    {children}
  </div>
);

export const Th = ({ children }) => (
  <th
    scope="col"
    className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[3px]"
  >
    {children}
  </th>
);

export const Td = ({ children, className = '' }) => (
  <td className={`px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-600 ${className}`}>
    {children}
  </td>
);