import React, { useState, useEffect } from "react";
import InstructorSidebar from "../../components/instractor/InstructorSidebar";
import InstructorProfileSettings from "./InstructorProfileSettings";
import InstructorDoubts from "./InstructorDoubts";

// ✅ Redux
import { useSelector, useDispatch } from "react-redux";
import { fetchInstructorDoubts } from "../../redux/doubtSlice";

// ✅ Socket
import { initSocket } from "../../socket";

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // ✅ Get logged in user
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // ✅ SOCKET INIT + REAL-TIME UPDATE
  useEffect(() => {
    if (user?._id) {
      const socket = initSocket(user._id);

      socket.on("doubtAssigned", () => {
        dispatch(fetchInstructorDoubts());
      });

      return () => {
        socket.off("doubtAssigned");
      };
    }
  }, [user?._id, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <InstructorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT */}
      <main
        className="
          pt-20 md:pt-4
          md:ml-64       /* SPACE FOR FIXED SIDEBAR */
          p-4 sm:p-6 lg:p-8
          overflow-y-auto
          min-h-screen
        "
      >
        {/* Simple Header */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">
                {activeTab.replace("-", " ")}
            </h2>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "dashboard" && (
            <div className="p-6 bg-white rounded-lg shadow-sm border text-center text-gray-500">
              Dashboard Overview Content Coming Soon...
            </div>
          )}

          {activeTab === "doubts" && <InstructorDoubts />}

          {activeTab === "settings" && <InstructorProfileSettings />}
        </div>

      </main>
    </div>
  );
}
