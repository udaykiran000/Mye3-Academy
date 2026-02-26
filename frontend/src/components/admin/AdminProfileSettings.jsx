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
                setAvatarPreview(`import.meta.env.VITE_SERVER_URL/${adminProfile.avatar.replace(/\\/g, "/")}`);
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
    <div className="min-h-screen bg-[#EDF0FF] font-poppins">
      {/* WHITE HEADER STRIP */}
      <div className="bg-white border-b border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-8 animate-in fade-in slide-in-from-top-1 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
              <div>
                <h1 className="text-2xl font-black text-[#3e4954] tracking-tight uppercase flex items-center gap-3">
                  <Camera className="text-indigo-600" size={24} />
                  Profile Settings
                </h1>
                <p className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-[0.1em] opacity-60 mt-1">
                  Manage your personal account details, avatar and security settings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
               {/* No specific actions needed in header for profile yet */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-12">
        <div className="bg-white p-8 md:p-12 rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-xl font-black mb-8 text-[#3e4954] border-b border-slate-100 pb-6 uppercase tracking-widest">Account Details</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {status === 'failed' && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-none border border-red-200 text-xs font-bold font-poppins">
                        <span className="font-black uppercase tracking-widest mr-2">Error:</span> {error}
                    </div>
                )}
                {status === 'succeeded' && (
                    <div className="p-4 bg-green-50 text-green-700 rounded-none border border-green-200 text-xs font-bold font-poppins">
                         <span className="font-black uppercase tracking-widest mr-2">Success:</span> {successMessage}
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-12 items-start">
                    {/* Image Section */}
                    <div className="flex flex-col items-center space-y-6 w-full md:w-1/3 pt-2">
                        <div className="relative group">
                            <div className="w-48 h-48 rounded-full overflow-hidden border-8 border-slate-50 shadow-2xl relative">
                                <img 
                                    src={avatarPreview} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <Camera size={40} className="text-white opacity-60" />
                                </div>
                            </div>
                            <label 
                                htmlFor="avatar-upload" 
                                className="absolute bottom-4 right-4 bg-indigo-600 p-3.5 rounded-full text-white cursor-pointer hover:bg-indigo-700 transition shadow-xl hover:scale-110 active:scale-95 z-10"
                            >
                                <Camera size={20} />
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                        <p className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-[0.2em] opacity-40">Click icon to change avatar</p>
                    </div>

                    {/* Inputs Section */}
                    <div className="w-full md:w-2/3 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest">First Name</label>
                                <input 
                                    type="text" 
                                    name="firstName" 
                                    value={formData.firstName} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-none p-3.5 text-xs font-bold text-[#3e4954] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-poppins" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest">Last Name</label>
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    value={formData.lastName} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-none p-3.5 text-xs font-bold text-[#3e4954] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-poppins" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest">Email Address</label>
                            <input 
                                type="email" 
                                value={adminProfile?.email || ''} 
                                disabled 
                                className="w-full bg-slate-100 border border-slate-200 rounded-none p-3.5 text-xs font-bold text-slate-400 cursor-not-allowed font-poppins italic" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest">Phone Number</label>
                            <input 
                                type="tel" 
                                name="phoneNumber" 
                                value={formData.phoneNumber} 
                                onChange={handleChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-none p-3.5 text-xs font-bold text-[#3e4954] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-poppins" 
                            />
                        </div>

                        <div className="py-4 border-t border-slate-100 mt-6">
                            <h3 className="text-xs font-black text-[#3e4954] mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                Security Settings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest">New Password</label>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        placeholder="Enter new password" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-none p-3.5 text-xs font-bold text text-[#3e4954] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-poppins" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        placeholder="Repeat new password" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-none p-3.5 text-xs font-bold text text-[#3e4954] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-poppins" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={status === 'loading'} 
                                className="bg-indigo-600 text-white py-3.5 px-10 rounded-none font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all disabled:bg-indigo-300 shadow-xl shadow-indigo-100 hover:-translate-y-1 active:translate-y-0"
                            >
                                {status === 'loading' ? 'Saving Changes...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileSettings;