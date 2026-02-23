import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { setUserData } from "../../redux/userSlice";

import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Camera,
  Save,
  ShieldCheck,
} from "lucide-react";

const InstitutionProfileSettings = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstname: userData?.firstname || "",
    lastname: userData?.lastname || "",
    phoneNumber: userData?.phoneNumber || "",
    currentPassword: "",
    newPassword: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    userData?.avatar
      ? `${import.meta.env.VITE_SERVER_URL}/${userData.avatar}`
      : `https://ui-avatars.com/api/?name=${userData?.firstname}&background=6366f1&color=fff`
  );

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstname", profileData.firstname);
      formData.append("lastname", profileData.lastname);
      formData.append("phoneNumber", profileData.phoneNumber);
      if (avatar) formData.append("photo", avatar);
      if (profileData.newPassword) {
        formData.append("currentPassword", profileData.currentPassword);
        formData.append("newPassword", profileData.newPassword);
      }

      const { data } = await api.put("/api/auth/profile/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      dispatch(setUserData(data.user));
      toast.success("Profile updated successfully!");
      setProfileData({ ...profileData, currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Portal Settings</h1>
          <p className="text-slate-500 font-medium">Manage your institution profile and security credentials.</p>
        </header>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
              <div className="relative group">
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-40 h-40 rounded-[2rem] object-cover ring-8 ring-indigo-50 shadow-2xl transition group-hover:brightness-90"
                />
                <label className="absolute bottom-2 right-2 bg-indigo-600 text-white p-3 rounded-2xl cursor-pointer shadow-lg hover:bg-indigo-700 transition active:scale-90">
                  <Camera size={20} />
                  <input type="file" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <h3 className="mt-6 font-black text-slate-800 text-lg">Profile Identity</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Institutional Logo / Avatar</p>
            </div>

            <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
               <ShieldCheck className="absolute -bottom-4 -right-4 text-white/10" size={120} />
               <h4 className="font-black text-lg mb-2 relative z-10">Data Integrity</h4>
               <p className="text-xs text-indigo-100 leading-relaxed relative z-10 opacity-80">
                 Changes to your profile are audited and synchronized across all campus modules instantly.
               </p>
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2 text-indigo-600">Institution Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="text"
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800"
                        value={profileData.firstname}
                        onChange={(e) => setProfileData({ ...profileData, firstname: e.target.value })}
                        placeholder="Mye3 Academy"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2 text-indigo-600">Campus Location</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800"
                      value={profileData.lastname}
                      onChange={(e) => setProfileData({ ...profileData, lastname: e.target.value })}
                      placeholder="Main Campus"
                    />
                  </div>
               </div>

               <div className="space-y-2 mb-8">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2 text-indigo-600">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="tel"
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
               </div>

               <hr className="my-10 border-slate-100" />

               <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Lock size={20} className="text-indigo-600" /> Security Threshold
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Current Auth</label>
                    <input
                      type="password"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-indigo-600 transition"
                      placeholder="••••••••"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">New Auth Token</label>
                    <input
                      type="password"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-indigo-600 transition"
                      placeholder="New Password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                    />
                  </div>
               </div>

               <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50"
               >
                  {isLoading ? "Synchronizing..." : <><Save size={20} /> Propagate Changes</>}
               </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstitutionProfileSettings;
