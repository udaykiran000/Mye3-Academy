import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchStudents,
  blockStudent,
  deleteStudent,
} from "../../redux/adminStudentSlice";

import {
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";

import { Search, GraduationCap } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const ManageStudents = () => {
  const dispatch = useDispatch();

  const { students, status, error } = useSelector(
    (state) => state.adminStudents
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === "idle") dispatch(fetchStudents());
  }, [status, dispatch]);

  const handleBlock = (id) => {
    dispatch(blockStudent(id));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      dispatch(deleteStudent(id));
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;

    const term = searchTerm.toLowerCase();

    return students.filter((s) => {
      const fullName = `${s.firstname || ""} ${s.lastname || ""}`.toLowerCase();
      return (
        fullName.includes(term) || s.email?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, students]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  );

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [currentPage, filteredStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans text-gray-800">
      <Link
        to="/admin"
        className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800 mb-4 transition font-medium"
      >
        <FaArrowLeft /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="text-cyan-600" size={32} />
            Manage Students
          </h1>
          <p className="text-gray-500 mt-1">
            Track student registrations and activity.
          </p>
        </div>

        <Link
          to="/admin/users/students/add"
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow-md transition"
        >
          + Add Student
        </Link>
      </div>

      <div className="relative w-full md:w-96 mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search students..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-xl rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          {status === "loading" && (
            <div className="flex justify-center items-center p-10">
              <FaSpinner className="animate-spin text-4xl text-cyan-600" />
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center justify-center p-10 text-red-600">
              <FaExclamationTriangle className="text-4xl mb-2" />
              <p>Error: {error}</p>
            </div>
          )}

          {status === "succeeded" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-sm tracking-wider">
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Joined Date</th>
                  <th className="p-4 font-semibold text-center">
                    Purchased Tests
                  </th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((s) => {
                    const fullName = `${s.firstname || ""} ${
                      s.lastname || ""
                    }`.trim();

                    return (
                      <tr key={s._id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?background=0bc&color=fff&name=${encodeURIComponent(
                                fullName
                              )}`}
                              className="w-10 h-10 rounded-full object-cover border shadow-sm"
                            />
                            <span className="font-semibold text-gray-800 capitalize">
                              {fullName || "Unnamed"}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">{s.email}</td>

                        <td className="p-4 text-sm text-gray-500">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>

                        <td className="p-4 text-center">
                          <span className="bg-gray-100 px-3 py-1 rounded-lg border text-gray-700 font-semibold">
                            {s.purchasedTestCount || 0}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          {s.isActive ? (
                            <span className="text-green-600 font-semibold inline-flex items-center gap-2 justify-center">
                              <FaCheckCircle /> Active
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold inline-flex items-center gap-2 justify-center">
                              <FaBan /> Blocked
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => handleBlock(s._id)}
                              className={`px-3 py-1 rounded-lg text-white text-xs font-semibold transition ${
                                s.isActive
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {s.isActive ? "Block" : "Unblock"}
                            </button>

                            <Link
                              to={`/admin/users/students/edit/${s._id}`}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-white text-xs font-semibold transition flex items-center gap-1"
                            >
                              <FaEdit /> Edit
                            </Link>

                            <button
                              onClick={() => handleDelete(s._id)}
                              className="bg-gray-700 hover:bg-black px-3 py-1 rounded-lg text-white text-xs font-semibold transition flex items-center gap-1"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {status === "succeeded" && totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            onClick={() =>
              setCurrentPage((p) => Math.max(1, p - 1))
            }
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === index + 1
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
