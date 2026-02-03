import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInstructors,
  toggleInstructorStatus,
  deleteInstructor,
} from "../../redux/instructorSlice";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { Search, User, Lock, Unlock, Pencil, Trash2, X } from "lucide-react";

// Helper to resolve image URLs
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${api.defaults.baseURL}/${path}`;
};

const ITEMS_PER_PAGE = 6;

const ManageInstructors = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { instructors, status, error } = useSelector(
    (state) => state.instructors
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Initial load
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchInstructors());
    }
  }, [status, dispatch]);

  // 2. Filter by name (first, last, or full) and email
  const filteredInstructors = useMemo(() => {
    if (!searchTerm.trim()) return instructors;

    const term = searchTerm.toLowerCase().trim();

    return instructors.filter((inst) => {
      // Safely get values, defaulting to empty string if null/undefined
      const firstName = inst.firstname?.toLowerCase() || "";
      const lastName = inst.lastname?.toLowerCase() || "";
      const email = inst.email?.toLowerCase() || "";
      
      // Create a full name string for searching "John Doe"
      const fullName = `${firstName} ${lastName}`;

      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        email.includes(term) ||
        fullName.includes(term) // Allows searching combined names
      );
    });
  }, [searchTerm, instructors]);

  // 3. Pagination Logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredInstructors.length / ITEMS_PER_PAGE)
  );

  const paginatedInstructors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInstructors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredInstructors]);

  // Reset page when search changes so user doesn't get stuck on empty page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 4. Handlers
  const handleToggleStatus = (inst) => {
    const actionLabel = inst.isActive ? "Block" : "Unblock";
    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} this instructor?`
      )
    )
      return;

    dispatch(toggleInstructorStatus(inst._id));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this instructor?"))
      return;

    dispatch(deleteInstructor(id));
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
            <User className="text-cyan-600" /> Manage Instructors
          </h1>
          <p className="text-gray-500 mt-1">
            View, manage, and organize your instructors.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Clear Search Button */}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {status === "loading" && (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">Loading instructors...</p>
        </div>
      )}

      {/* Error State */}
      {status === "failed" && (
        <div className="flex justify-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Empty State (Search or No Data) */}
      {status === "succeeded" && filteredInstructors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <User size={48} className="text-gray-300 mb-4" />
          <p>No instructors found matching "{searchTerm}".</p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-2 text-cyan-600 hover:underline text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Instructors Table */}
      {status === "succeeded" && filteredInstructors.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-sm tracking-wider">
                    <th className="p-4 font-semibold">Instructor</th>
                    <th className="p-4 font-semibold">Contact Info</th>
                    <th className="p-4 font-semibold">Joined Date</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedInstructors.map((inst) => {
                    const avatarFallback = `https://ui-avatars.com/api/?background=0bc&color=fff&name=${encodeURIComponent(
                      `${inst.firstname || ""} ${inst.lastname || ""}`.trim() ||
                        "Instructor"
                    )}`;

                    const avatarSrc = inst.avatar
                      ? getImageUrl(inst.avatar)
                      : avatarFallback;

                    return (
                      <tr
                        key={inst._id}
                        className="hover:bg-gray-50 transition duration-150"
                      >
                        {/* Name & Avatar */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarSrc || avatarFallback}
                              alt={inst.firstname}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                              onError={(e) => {
                                e.target.src = avatarFallback;
                              }}
                            />
                            <div>
                              <p className="font-semibold text-gray-800">
                                {inst.firstname} {inst.lastname}
                              </p>
                              <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full font-medium">
                                Instructor
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="p-4">
                          <p className="text-sm text-gray-700">{inst.email}</p>
                          <p className="text-xs text-gray-500">
                            {inst.phoneNumber || "—"}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="p-4 text-sm text-gray-600">
                          {inst.createdAt
                            ? new Date(inst.createdAt).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              inst.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {inst.isActive ? "Active" : "Blocked"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3">
                            {/* EDIT */}
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/users/instructors/edit/${inst._id}`
                                )
                              }
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                              title="Edit Instructor"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* BLOCK / UNBLOCK */}
                            <button
                              onClick={() => handleToggleStatus(inst)}
                              className={`p-2 rounded-lg transition ${
                                inst.isActive
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                              title={
                                inst.isActive ? "Block User" : "Unblock User"
                              }
                            >
                              {inst.isActive ? (
                                <Lock size={16} />
                              ) : (
                                <Unlock size={16} />
                              )}
                            </button>

                            {/* DELETE */}
                            <button
                              onClick={() => handleDelete(inst._id)}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                              title="Delete Instructor"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 rounded transition ${
                    currentPage === index + 1
                      ? "bg-cyan-600 text-white shadow-md"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageInstructors;