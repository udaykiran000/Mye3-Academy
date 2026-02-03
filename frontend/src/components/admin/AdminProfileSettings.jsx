import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    updateAdminProfile, 
    fetchAdminProfile, 
    clearAdminStatus 
} from '../../redux/adminSlice'; 
import { Camera, Save, Loader } from 'lucide-react'; 

const AdminProfileSettings = () => { 
    const dispatch = useDispatch();
    
    // ✅ Get data from ADMIN store
    const { 
        adminProfile, 
        loading,
        status, 
        error, 
        successMessage 
    } = useSelector((state) => state.admin);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
    });

    const [avatarPreview, setAvatarPreview] = useState("https://via.placeholder.com/150?text=Admin");
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (!adminProfile) {
            dispatch(fetchAdminProfile());
        }
    }, [dispatch, adminProfile]);

    useEffect(() => {
        if (adminProfile) {
            setFormData(prev => ({
                ...prev,
                firstName: adminProfile.firstname || '',
                lastName: adminProfile.lastname || '',
                phoneNumber: adminProfile.phoneNumber || '',
                password: '',
                confirmPassword: ''
            }));

            if (adminProfile.avatar) {
                setAvatarPreview(`http://localhost:8000/${adminProfile.avatar.replace(/\\/g, "/")}`);
            }
        }
    }, [adminProfile]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

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

        dispatch(updateAdminProfile(submitData));
    };

    useEffect(() => {
        if (status === 'succeeded' || status === 'failed') {
            const timer = setTimeout(() => dispatch(clearAdminStatus()), 3000);
            return () => clearTimeout(timer);
        }
    }, [status, dispatch]);

    if (loading && !adminProfile) {
        return <div className="flex justify-center p-10"><Loader className="animate-spin text-blue-600" size={32} /></div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Admin Profile Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {status === 'failed' && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}
                {status === 'succeeded' && (
                    <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                         <span className="font-bold">Success:</span> {successMessage}
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-10 items-start">
                    {/* Image */}
                    <div className="flex flex-col items-center space-y-4 w-full md:w-1/3 pt-2">
                        <div className="relative group">
                            <img src={avatarPreview} alt="Profile" className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl" />
                            <label htmlFor="avatar-upload" className="absolute bottom-2 right-2 bg-blue-600 p-2.5 rounded-full text-white cursor-pointer hover:bg-blue-700 transition shadow-md hover:scale-105">
                                <Camera size={20} />
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="w-full md:w-2/3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <input type="email" value={adminProfile?.email || ''} disabled className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>

                        <hr className="my-6 border-gray-200" />

                        <div>
                            <h3 className="text-md font-semibold text-gray-800 mb-4">Change Password</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="New Password" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={status === 'loading'} className="bg-blue-600 text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300 shadow-md">
                                {status === 'loading' ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminProfileSettings;