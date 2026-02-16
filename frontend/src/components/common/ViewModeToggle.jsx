import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, Shield } from 'lucide-react';

const ViewModeToggle = () => {
    const { userData } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();

    // Only show for Admins
    if (userData?.role !== 'admin') return null;

    const isAdminView = location.pathname.startsWith('/admin');
    // If not in admin view, we are in student view (Home, Dashboard, Tests, etc.)
    const isStudentView = !isAdminView;

    if (isAdminView) {
        return (
            <button
                onClick={() => navigate('/student-dashboard')}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all font-bold"
                title="Switch to Student View"
            >
                <Eye size={20} /> View as Student
            </button>
        );
    }

    if (isStudentView) {
        return (
            <button
                onClick={() => navigate('/admin')}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-black transition-all font-bold border-2 border-indigo-500"
                title="Back to Admin Panel"
            >
                <Shield size={20} /> Back to Admin
            </button>
        );
    }

    return null;
};

export default ViewModeToggle;
