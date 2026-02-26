import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const ViewModeToggle = () => {
    const { userData } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();
    const isDragging = useRef(false);

    // Only show for Admins
    if (userData?.role !== 'admin') return null;

    const isAdminView = location.pathname.startsWith('/admin');
    const isStudentView = !isAdminView;

    const dragProps = {
        drag: true,
        dragMomentum: false,
        onDragStart: () => { 
            isDragging.current = true; 
        },
        onDragEnd: () => {
            // Tiny delay to ensure any pending tap event sees the 'true' state
            // and gets blocked, before we reset for the next interaction.
            setTimeout(() => {
                isDragging.current = false;
            }, 100);
        },
        whileDrag: { scale: 1.1, cursor: 'grabbing' },
        whileTap: { scale: 0.95 },
        initial: { x: 0, y: 0 }
    };

    const handleSwitch = (path) => {
        if (isDragging.current) return;
        navigate(path);
    };

    if (isAdminView) {
        return (
            <motion.div
                {...dragProps}
                onTap={() => handleSwitch('/student-dashboard')}
                role="button"
                tabIndex={0}
                className="fixed bottom-6 right-6 z-[9999] flex flex-col items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-colors border border-white/20 cursor-pointer select-none"
                title="Switch to Student View"
            >
                <Eye size={20} strokeWidth={2.5} />
                <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">Student</span>
            </motion.div>
        );
    }

    if (isStudentView) {
        return (
            <motion.div
                {...dragProps}
                onTap={() => handleSwitch('/admin')}
                role="button"
                tabIndex={0}
                className="fixed bottom-6 right-6 z-[9999] flex flex-col items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-black transition-colors border-2 border-indigo-500 cursor-pointer select-none"
                title="Back to Admin Panel"
            >
                <Shield size={20} strokeWidth={2.5} />
                <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">Admin</span>
            </motion.div>
        );
    }

    return null;
};

export default ViewModeToggle;
