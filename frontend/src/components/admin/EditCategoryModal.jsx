import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateCategory } from "../../redux/categorySlice";
import { toast } from "react-hot-toast";
import { FaTimes, FaCloudUploadAlt } from "react-icons/fa";

const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    let cleaned = imagePath.trim();
    if (!cleaned.startsWith("/")) {
        cleaned = "/" + cleaned;
    }
    // Use the environment variable or default
    const baseUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";
    return `${baseUrl}${cleaned}`;
};

const EditCategoryModal = ({ category, onClose }) => {
    const dispatch = useDispatch();
    const [name, setName] = useState(category.name);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(getImageUrl(category.image));
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("name", name);
        if (image) formData.append("image", image);

        try {
            await dispatch(updateCategory({ id: category._id, formData })).unwrap();
            toast.success("Category updated successfully");
            onClose();
        } catch (err) {
            toast.error(err || "Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Edit Category</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer relative group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {preview ? (
                                <div className="relative">
                                    <img src={preview} alt="Preview" className="h-32 mx-auto object-cover rounded shadow-sm" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded flex items-center justify-center">
                                        <p className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm drop-shadow-md">Change Image</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-400 py-4">
                                    <FaCloudUploadAlt size={32} className="mx-auto mb-2 text-gray-300 group-hover:text-blue-400 transition" />
                                    <span className="text-sm">Click to upload new image</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium shadow-sm"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCategoryModal;
