// frontend/src/pages/student/StuDashboard.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import StuSidebar from "../../components/student/StuSidebar";
import StuHeader from "../../components/student/StuHeader";
import DashboardOverview from "./DashboardOverview";
import ExploreTests from "./ExploreTests";
import PerformanceHistory from "./PerformanceHistory";
import ProfileSettings from "./ProfileSettings";
import MyTests from "./MyTests";
import StudentDoubts from "./StudentDoubts";

import { initSocket, disconnectSocket } from "../../socket";
import { fetchStudentDoubts } from "../../redux/doubtSlice";
import { fetchStudentProfile } from "../../redux/studentSlice";

export default function StuDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // LOGIC CONNECTIVITY FIX: Get Profile from studentSlice and Auth from userSlice
  const userProfile = useSelector((state) => state.students.studentProfile);
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // 1. DATA HYDRATION: Ensure profile data exists
  useEffect(() => {
    if (!userProfile && userData) {
      console.log("🔄 Hydrating Dashboard: Fetching student profile...");
      dispatch(fetchStudentProfile());
    }
  }, [dispatch, userProfile, userData]);

  // 2. SOCKET & DOUBTS SYNC
  useEffect(() => {
    if (userData?._id) {
      const socket = initSocket(userData._id);
      const handleAnswer = () => {
        dispatch(fetchStudentDoubts());
      };
      socket.on("doubtAnswered", handleAnswer);

      return () => {
        socket.off("doubtAnswered", handleAnswer);
        disconnectSocket();
      };
    }
  }, [userData?._id, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <StuSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 pt-20 md:pt-6 md:ml-80 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Pass userData for header display while profile is loading */}
        <StuHeader user={userProfile || userData} />

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
