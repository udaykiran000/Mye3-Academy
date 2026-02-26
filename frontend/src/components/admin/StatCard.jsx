import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, bgColor, progress, link }) => {
  const navigate = useNavigate();

  return (
    <motion.div 
        whileHover={link ? { y: -8, scale: 1.02, transition: { duration: 0.2 } } : { y: -5, transition: { duration: 0.2 } }}
        whileTap={link ? { scale: 0.98 } : {}}
        onClick={() => link && navigate(link)}
        className={`relative p-6 rounded-[10px] border-none shadow-[0_15px_45px_rgba(0,0,0,0.15)] overflow-hidden group text-white ${link ? 'cursor-pointer' : ''}`}
        style={{ backgroundColor: bgColor }}
    >
        <div className="flex items-center gap-4">
            {/* WHITE ICON CIRCLE */}
            <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-white text-[#3e4954] shadow-md">
                {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
            </div>

            <div className="flex-grow">
                <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1 font-poppins">
                    {title}
                </p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none font-poppins">
                        {value}
                    </h3>
                </div>
            </div>
        </div>

        {/* PROGRESS BAR SECTION */}
        <div className="mt-5 flex flex-col gap-2">
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-white"
                />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest font-poppins">
                    {progress}% Increase in 20 Days
                </span>
            </div>
        </div>
    </motion.div>
  );
};

export default StatCard;