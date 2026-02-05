import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// ✅ Import Instructor Actions
import {
  updateInstructorProfile,
  fetchInstructorProfile,
  clearInstructorStatus,
} from "../../redux/instructorSlice";
import { Camera, Save, Loader, Lock, User, Phone, Mail } from "lucide-react";

const InstructorProfileSettings = () => {
  const dispatch = useDispatch();

  // ✅ Get data from INSTRUCTOR store
  const {
    instructorProfile,
    profileLoading, // Make sure your slice has this or 'loading'
    profileStatus, // Make sure your slice uses this or 'status'
    profileError,
    profileSuccessMessage,
  } = useSelector((state) => state.instructors);

  // Local State for Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(
    "https://via.placeholder.com/150?text=User",
  );
  const [avatarFile, setAvatarFile] = useState(null);

  // 1. Fetch Profile on Mount
  useEffect(() => {
    dispatch(fetchInstructorProfile());
  }, [dispatch]);

  // 2. Populate Form when data arrives
  useEffect(() => {
    if (instructorProfile) {
      setFormData((prev) => ({
        ...prev,
        firstName: instructorProfile.firstname || "",
        lastName: instructorProfile.lastname || "",
        phoneNumber: instructorProfile.phoneNumber || "",
        password: "",
        confirmPassword: "",
      }));

      if (instructorProfile.avatar) {
        // Ensure URL matches your backend
        setAvatarPreview(
          `import.meta.env.VITE_SERVER_URL/${instructorProfile.avatar.replace(/\\/g, "/")}`,
        );
      }
    }
  }, [instructorProfile]);

  // Handle Text Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Image Change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const submitData = new FormData();
    submitData.append("firstName", formData.firstName);
    submitData.append("lastName", formData.lastName);
    submitData.append("phoneNumber", formData.phoneNumber);

    if (formData.password) submitData.append("password", formData.password);
    if (avatarFile) submitData.append("avatar", avatarFile);

    dispatch(updateInstructorProfile(submitData));
  };

  // Auto-clear messages
  useEffect(() => {
    if (profileStatus === "succeeded" || profileStatus === "failed") {
      const timer = setTimeout(() => dispatch(clearInstructorStatus()), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileStatus, dispatch]);

  // Show Loading Spinner
  if (profileLoading && !instructorProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto mt-6 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
        Instructor Profile Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Messages */}
        {profileStatus === "failed" && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <span className="font-bold">Error:</span> {profileError}
          </div>
        )}
        {profileStatus === "succeeded" && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <span className="font-bold">Success:</span> {profileSuccessMessage}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* --- IMAGE UPLOAD --- */}
          <div className="flex flex-col items-center space-y-4 w-full md:w-1/3 pt-2">
            <div className="relative group">
              <img
                src={avatarPreview}
                alt="Profile"
                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-2 right-2 bg-purple-600 p-2.5 rounded-full text-white cursor-pointer hover:bg-purple-700 transition shadow-md hover:scale-105"
              >
                <Camera size={20} />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* --- INPUT FIELDS --- */}
          <div className="w-full md:w-2/3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={instructorProfile?.email || ""}
                disabled
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <hr className="my-6 border-gray-200" />

            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Change Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New Password"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={profileStatus === "loading"}
                className="bg-purple-600 text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-300 shadow-md"
              >
                {profileStatus === "loading" ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InstructorProfileSettings;
