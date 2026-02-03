import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    updateStudentProfile, 
    fetchStudentProfile, // 1. We need this action to get data
    clearProfileStatus ,
    
} from '../../redux/studentSlice'; 
import { Camera, Save, Loader, Lock, User, Phone, Mail } from 'lucide-react'; 

const ProfileSettings = () => { 
    const dispatch = useDispatch();
    
    // Get data from Redux store
    const { 
        studentProfile,       // This holds the existing data (name, phone, avatar)
        profileLoading,
        profileUpdateStatus, 
        profileUpdateError, 
        profileSuccessMessage 
    } = useSelector((state) => state.students);

    // Local State for Form
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
    });

    // Avatar Preview State
    const [avatarPreview, setAvatarPreview] = useState("https://via.placeholder.com/150?text=User");
    const [avatarFile, setAvatarFile] = useState(null);

    // ✅ STEP 1: Fetch the existing profile data when page opens
    useEffect(() => {
        dispatch(fetchStudentProfile());
    }, [dispatch]);

    // ✅ STEP 2: Watch 'studentProfile'. When it arrives, FILL the form fields.
    useEffect(() => {
        if (studentProfile) {
            setFormData(prev => ({
                ...prev,
                // Use existing data OR empty string if missing
                firstName: studentProfile.firstname || '',
                lastName: studentProfile.lastname || '',
                phoneNumber: studentProfile.phoneNumber || '',
                password: '',       // Always keep password blank for security
                confirmPassword: ''
            }));

            // If they have a photo, show it. Else show placeholder.
            if (studentProfile.avatar) {
                // ⚠️ MAKE SURE THIS URL MATCHES YOUR SERVER (e.g., http://localhost:8000/)
                setAvatarPreview(`http://localhost:8000/${studentProfile.avatar.replace(/\\/g, "/")}`);
            }
        }
    }, [studentProfile]);

    // Handle Text Input Change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle Image Selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file)); // Show immediate preview of new image
        }
    };

    // Handle Submit
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (formData.password && formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Prepare FormData
        const submitData = new FormData();
        submitData.append("firstName", formData.firstName);
        submitData.append("lastName", formData.lastName);
        submitData.append("phoneNumber", formData.phoneNumber);
        
        // Only send password if user typed it
        if (formData.password) {
            submitData.append("password", formData.password);
        }
        
        // Only send avatar if user selected a new file
        if (avatarFile) {
            submitData.append("avatar", avatarFile);
        }

        dispatch(updateStudentProfile(submitData));
    };

    // Auto-clear messages
    useEffect(() => {
        if (profileUpdateStatus === 'succeeded' || profileUpdateStatus === 'failed') {
            const timer = setTimeout(() => dispatch(clearProfileStatus()), 3000);
            return () => clearTimeout(timer);
        }
    }, [profileUpdateStatus, dispatch]);

    // Show loading spinner while initially fetching data
    if (profileLoading && !studentProfile) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto mt-6 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Profile Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Messages */}
                {profileUpdateStatus === 'failed' && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                        <span className="font-bold">Error:</span> {profileUpdateError}
                    </div>
                )}
                {profileUpdateStatus === 'succeeded' && (
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
                            <label htmlFor="avatar-upload" className="absolute bottom-2 right-2 bg-blue-600 p-2.5 rounded-full text-white cursor-pointer hover:bg-blue-700 transition shadow-md hover:scale-105">
                                <Camera size={20} />
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                    </div>

                    {/* --- INPUT FIELDS (Pre-filled) --- */}
                    <div className="w-full md:w-2/3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                                <input 
                                    type="text" 
                                    name="firstName" 
                                    value={formData.firstName} 
                                    onChange={handleChange} 
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    value={formData.lastName} 
                                    onChange={handleChange} 
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <input 
                                type="email" 
                                value={studentProfile?.email || ''} 
                                disabled 
                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                            <input 
                                type="tel" 
                                name="phoneNumber" 
                                value={formData.phoneNumber} 
                                onChange={handleChange} 
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                        </div>

                        <hr className="my-6 border-gray-200" />

                        <div>
                            <h3 className="text-md font-semibold text-gray-800 mb-4">Change Password</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="New Password (Optional)" 
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                                <input 
                                    type="password" 
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    placeholder="Confirm Password" 
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={profileUpdateStatus === 'loading'} 
                                className="bg-blue-600 text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300 shadow-md"
                            >
                                {profileUpdateStatus === 'loading' ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProfileSettings;