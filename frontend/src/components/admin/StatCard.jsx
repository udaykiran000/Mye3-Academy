import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, gradient, progress, trend, trendValue }) => {
  return (
    <motion.div 
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className={`relative p-7 rounded-none border-none shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden group bg-gradient-to-r ${gradient} text-white`}
    >
        <div className="flex items-center gap-5">
            {/* WHITE ICON CIRCLE */}
            <div className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center bg-white text-[#3e4954] shadow-md">
                {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
            </div>

            <div className="flex-grow">
                <p className="text-[13px] font-bold text-white/80 uppercase tracking-widest mb-1">
                    {title}
                </p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-white tracking-tight leading-none">
                        {value}
                    </h3>
                </div>
            </div>
        </div>

        {/* PROGRESS BAR & TREND */}
        <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden flex-grow mr-4">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-white"
                    />
                </div>
                <span className="text-[11px] font-black text-white/90 whitespace-nowrap">
                    {progress}% Increase in 20 Days
                </span>
            </div>

            {trend && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold bg-white/20 text-white">
                        {trend === 'down' ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                        {trendValue}
                    </div>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Increase in 20 Days</span>
                </div>
            )}
        </div>
    </motion.div>
  );
};

export default StatCard;