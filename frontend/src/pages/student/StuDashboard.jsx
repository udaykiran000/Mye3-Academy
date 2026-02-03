// frontend/src/pages/student/StuDashboard.jsx
import React, { useState, useEffect } from "react";
import StuSidebar from "../../components/student/StuSidebar";
import StuHeader from "../../components/student/StuHeader";
import DashboardOverview from "./DashboardOverview";
import ExploreTests from "./ExploreTests";
import PerformanceHistory from "./PerformanceHistory";
import ProfileSettings from "./ProfileSettings";
import MyTests from "./MyTests";
import StudentDoubts from "./StudentDoubts"; 
import { useSelector, useDispatch } from "react-redux";
// ✅ IMPORT UPDATED SOCKET FUNCTIONS
import { initSocket, disconnectSocket } from "../../socket"; 
import { fetchStudentDoubts } from "../../redux/doubtSlice";

export default function StuDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const user = useSelector((state) => state.students.studentProfile);
  const dispatch = useDispatch();

  // ✅ GLOBAL SOCKET CONNECTION LOGIC
  useEffect(() => {
    if (user?._id) {
      // 1. Connect
      const socket = initSocket(user._id);

      // 2. Global Listener for Data Sync
      const handleAnswer = () => {
        console.log("🔔 Notification Received: Doubt Answered");
        dispatch(fetchStudentDoubts());
      };

      socket.on("doubtAnswered", handleAnswer);

      // 3. Cleanup on Logout/Unmount
      return () => {
        socket.off("doubtAnswered", handleAnswer);
        disconnectSocket();
      };
    }
  }, [user?._id, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <StuSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* ✅ FIX: Changed 'md:ml-64' to 'md:ml-80' to match the new sidebar width */}
      <main className="pt-20 md:pt-4 md:ml-80 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen">
        <StuHeader user={user} />
        <div className="mt-6">
          {activeTab === "overview" && <DashboardOverview />}
          {activeTab === "my-tests" && <MyTests />}
          {activeTab === "explore" && <ExploreTests />}
          {activeTab === "performance" && <PerformanceHistory />}
          {activeTab === "settings" && <ProfileSettings />}
          {activeTab === "doubts" && <StudentDoubts />} 
        </div>
      </main>
    </div>
  );
}