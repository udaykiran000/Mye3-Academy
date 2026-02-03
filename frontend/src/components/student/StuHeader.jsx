// frontend/src/components/student/StuHeader.jsx
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getSocket } from '../../socket'; // Use getSocket since Dashboard already initialized it
import toast from 'react-hot-toast';

const StuHeader = ({ user }) => {
  const [hasNotification, setHasNotification] = useState(false);

  const displayName = user?.firstname ? `${user.firstname} ${user.lastname || ""}` : "Student";

  useEffect(() => {
    // We assume Dashboard has already called initSocket()
    const socket = getSocket(); 

    if (!socket) return;

    const handleNotification = () => {
      console.log("🔔 Header detected notification!");
      setHasNotification(true);
      toast.success("New Reply Received!", { icon: "📩" });
    };

    socket.on("doubtAnswered", handleNotification);

    return () => {
      socket.off("doubtAnswered", handleNotification);
    };
  }, []);

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">
          Welcome back, <span className="text-blue-600">{displayName}</span>! 👋
        </h1>
        <p className="text-gray-500 mt-1 font-medium">Let's get started on your next goal.</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setHasNotification(false)}
          className="relative p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200 group"
        >
          <Bell className={`text-gray-600 group-hover:text-blue-600 ${hasNotification ? 'animate-swing' : ''}`} size={24} />
          {hasNotification && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
          )}
        </button>
      </div>
    </header>
  );
};

export default StuHeader;