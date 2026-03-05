// frontend/src/pages/student/StuDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import StuSidebar from "../../components/student/StuSidebar";
import StuHeader from "../../components/student/StuHeader";
import { ArrowLeft } from "lucide-react";
import DashboardOverview from "./DashboardOverview";
import AllMockTests from "../AllMockTests";
import PerformanceHistory from "./PerformanceHistory";
import ProfileSettings from "./ProfileSettings";
import MyTests from "./MyTests";
import StudentDoubts from "./StudentDoubts";

import { initSocket, disconnectSocket } from "../../socket";
import { fetchStudentDoubts } from "../../redux/doubtSlice";
import { fetchStudentProfile } from "../../redux/studentSlice";

export default function StuDashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const mainRef = useRef(null);

  // LOGIC CONNECTIVITY FIX: Get Profile from studentSlice and Auth from userSlice
  const userProfile = useSelector((state) => state.students.studentProfile);
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // React to ?tab= query param on every navigation (most reliable approach)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
      // Clean up URL after reading
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // 1. DATA HYDRATION: Ensure profile data exists
  useEffect(() => {
    if (!userProfile && userData) {
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

  // SCROLL TO TOP ON TAB CHANGE
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* SIDEBAR */}
      <StuSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT AREA */}
      <main ref={mainRef} className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-14 md:pt-2 overflow-y-auto">
        {/* Pass userData for header display while profile is loading */}
        <StuHeader user={userProfile || userData} setActiveTab={setActiveTab} />

        {activeTab !== "overview" && (
          <button 
            onClick={() => setActiveTab("overview")}
            className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors px-2"
          >
            <ArrowLeft size={12} /> Back to Dashboard
          </button>
        )}

        <div className="mt-6">
          {activeTab === "overview" && <DashboardOverview setActiveTab={setActiveTab} />}
          {activeTab === "my-tests" && <MyTests setActiveTab={setActiveTab} />}
          {activeTab === "explore" && <AllMockTests isEmbedded={true} />}
          {(activeTab === "performance" || activeTab === "performance-all") && <PerformanceHistory initialFilter="all" />}
          {activeTab === "performance-mock" && <PerformanceHistory initialFilter="mock" />}
          {activeTab === "performance-grand" && <PerformanceHistory initialFilter="grand" />}
          {activeTab === "settings" && <ProfileSettings />}
          {activeTab === "doubts" && <StudentDoubts />}
        </div>
      </main>
    </div>
  );
}
