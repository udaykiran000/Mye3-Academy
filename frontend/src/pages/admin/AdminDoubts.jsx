// frontend/src/pages/admin/AdminDoubts.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminDoubts, assignDoubtToInstructor } from "../../redux/doubtSlice";
import { fetchInstructors } from "../../redux/instructorSlice"; 
import { getSocket } from "../../socket"; // Socket import
import toast from "react-hot-toast";
import { User, BookOpen, Clock, CheckCircle } from "lucide-react";

const AdminDoubts = () => {
  const dispatch = useDispatch();
  const { adminDoubts, adminStatus } = useSelector((state) => state.doubts);
  const { instructors } = useSelector((state) => state.instructors);

  useEffect(() => {
    dispatch(fetchAdminDoubts());
    dispatch(fetchInstructors());

    // Listen for new doubts live!
    const socket = getSocket();
    if (socket) {
        socket.on("newDoubtReceived", (data) => {
            toast(data.message, { icon: '🔔' });
            dispatch(fetchAdminDoubts());
        });
        return () => socket.off("newDoubtReceived");
    }
  }, [dispatch]);

  const handleAssign = (id, instructorId) => {
    if (!instructorId || instructorId === "Select") return;
    dispatch(assignDoubtToInstructor({ id, instructorId, status: "assigned" }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Doubt Management</h2>
        <span className="bg-white px-3 py-1 rounded-full border text-sm font-semibold shadow-sm">
          Total: {adminDoubts.length}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs border-b">
              <tr>
                <th className="p-4">Student & Subject</th>
                <th className="p-4 w-1/3">Doubt Query</th>
                <th className="p-4">Status</th>
                <th className="p-4">Instructor</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminDoubts.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                       <User size={16} className="text-gray-400"/> 
                       {d.student?.firstname} {d.student?.lastname}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize bg-gray-100 inline-block px-2 py-0.5 rounded">
                        {d.subject}
                    </div>
                  </td>
                  
                  <td className="p-4">
                     <p className="line-clamp-2 font-medium text-gray-800" title={d.text}>{d.text}</p>
                     {d.mocktestId && <span className="text-xs text-blue-500 font-semibold">Test Related</span>}
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${d.status === 'pending' ? 'bg-red-100 text-red-700' : ''}
                      ${d.status === 'assigned' ? 'bg-blue-100 text-blue-700' : ''}
                      ${d.status === 'answered' ? 'bg-green-100 text-green-700' : ''}
                    `}>
                      {d.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <select
                      className="border border-gray-300 p-2 rounded-lg w-full bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={d.assignedInstructor?._id || ""}
                      onChange={(e) => handleAssign(d._id, e.target.value)}
                      disabled={d.status === 'answered'}
                    >
                      <option value="">Select Instructor</option>
                      {instructors?.map((i) => (
                        <option key={i._id} value={i._id}>
                          {i.firstname} {i.lastname}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-4">
                     {d.status === 'pending' && (
                        <button className="text-red-500 hover:text-red-700 text-xs font-bold underline">Reject</button>
                     )}
                     {d.status === 'answered' && (
                        <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={14}/> Done</span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDoubts;