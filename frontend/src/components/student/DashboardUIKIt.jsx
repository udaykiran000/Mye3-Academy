import React from 'react';

// Classy, Vibrant StatCard for a premium dashboard feel
export const StatCard = ({ icon, title, value, subValue, color, onClick }) => {
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
    <div 
      onClick={onClick}
      className={`relative group ${theme.bg} p-5 rounded-[24px] shadow-lg border border-transparent hover:scale-105 transition-all duration-500 overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Subtle Background Shape */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
      
      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-white/20 text-white shadow-sm border border-white/30 group-hover:bg-white group-hover:text-slate-900 transition-all duration-500">
            {React.cloneElement(icon, { size: 20, strokeWidth: 2.5 })}
          </div>
          <div className="w-8 h-1 bg-white/30 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
        </div>
        
        <div>
          <p className="text-[10px] font-black text-white/70 uppercase tracking-[2px] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
            {subValue && (
              <span className="text-[9px] font-extrabold text-white/60 uppercase tracking-[1px]">{subValue}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Interactive Bottom Accent */}
      <div className="absolute bottom-0 left-0 w-0 h-1 bg-white/50 group-hover:w-full transition-all duration-700"></div>
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