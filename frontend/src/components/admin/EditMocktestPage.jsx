// frontend/src/components/admin/EditMocktestPage.jsx - FULL UPDATED CODE
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-hot-toast"; // Changed from 'react-toastify' to 'react-hot-toast' for consistency
import { FaUpload, FaSave, FaArrowLeft } from "react-icons/fa";

// NOTE: This component is largely redundant if FormMocktest is used for editing,
// but kept here for completeness with minor updates.

const EditMocktestPage = () => {
    const { id } = useParams();
    const [mocktest, setMocktest] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        const fetchMocktest = async () => {
            try {
                // Assuming this hits the same /api/admin/mocktests/:id endpoint
                const res = await api.get(`/api/admin/mocktests/${id}`);
                setMocktest(res.data);
            } catch (err) {
                toast.error("Failed to load mocktest details");
            }
        };
        fetchMocktest();
    }, [id]);

    const handleChange = (e) => {
        setMocktest({ ...mocktest, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // NOTE: This save will only update the metadata. It does NOT regenerate questions 
            // unless the subjects array is explicitly passed and changed. 
            // The FormMocktest component handles subject changes more completely.
            await api.put(`/api/admin/mocktests/${id}`, mocktest);
            toast.success("Mocktest metadata updated successfully!");
            navigate(-1);
        } catch (err) {
            toast.error("Failed to update mocktest");
        } finally {
            setLoading(false);
        }
    };

    if (!mocktest) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-4 transition font-medium"
            >
                <FaArrowLeft />
                Back
            </button>

            <h1 className="text-2xl font-semibold mb-6 text-gray-800">
                Edit Mocktest: {mocktest.title}
            </h1>

            {/* Editable Form (simplified) */}
            <div className="space-y-4 bg-white shadow rounded-lg p-5">
                <input
                    type="text"
                    name="title"
                    value={mocktest.title || ""}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="Title"
                />
                <input
                    type="text"
                    name="subcategory"
                    value={mocktest.subcategory || ""}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="Subcategory"
                />
                <input
                    type="number"
                    name="durationMinutes"
                    value={mocktest.durationMinutes || ""}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="Duration"
                />
                <input
                    type="number"
                    name="totalMarks"
                    value={mocktest.totalMarks || ""}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="Total Marks"
                />
                <input
                    type="number"
                    name="negativeMarking"
                    step="0.01"
                    value={mocktest.negativeMarking || ""}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="Negative Marks"
                />

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                        <FaSave />
                        {loading ? "Saving..." : "Save Metadata Changes"}
                    </button>
                </div>
            </div>

            {/* Question Section - Updated to reflect auto-generation/global pool */}
            <div className="mt-10 bg-white shadow rounded-lg p-5">
                <h2 className="text-xl font-semibold mb-4">
                    Manage Questions (Generated: {mocktest.totalQuestions || 0})
                </h2>
                <div className="text-sm text-gray-600 mb-4">
                    Question list is determined by the Subject & Difficulty settings in the main edit form.
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <button
                        // Navigate to a dedicated page to view the generated list
                        onClick={() => navigate(`/admin/mocktests/${id}/questions/view`)}
                        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-blue-500 p-6 rounded-xl cursor-pointer transition"
                    >
                        {/* FaPlusCircle is generic, but the action is now 'View/Review' */}
                        <span className="text-blue-600 font-bold text-3xl">👁️</span>
                        <span className="text-gray-700 font-medium">Review Generated Questions</span>
                    </button>

                    <button
                        onClick={() => toast.info("Bulk Upload to Global Question Pool!")}
                        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-green-500 p-6 rounded-xl cursor-pointer transition"
                    >
                        <FaUpload size={30} className="text-green-600" />
                        <span className="text-gray-700 font-medium">Bulk Upload to Pool</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditMocktestPage;