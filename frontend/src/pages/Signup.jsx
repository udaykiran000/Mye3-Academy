import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Loader2,
  Smartphone,
  Trophy,
} from "lucide-react";
import googleImg from "../assets/google.png";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { setUserData } from "../redux/userSlice";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";
import signupIllustration from "../assets/Gemini_Generated_Image_6fv81j6fv81j6fv8 (1).png";
import toast from "react-hot-toast";

const InputField = ({
  id,
  type,
  placeholder,
  value,
  onChange,
  isPass,
  showPass,
  togglePass,
}) => (
  <div className="relative w-full mb-2.5 group">
    <div className="relative">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl
                   text-slate-800 placeholder-slate-400 font-medium
                   focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 
                   outline-none transition-all duration-300 text-xs shadow-sm"
      />
      {isPass && (
        <button
          type="button"
          onClick={togglePass}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center z-10 text-slate-300 hover:text-indigo-600 transition-colors"
        >
          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  </div>
);

const Signup = () => {
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const googleData = {
        firstname: user.displayName?.split(" ")[0] || "User",
        lastname: user.displayName?.split(" ")[1] || "",
        email: user.email,
        avatar: user.photoURL,
        role,
      };
      const res = await api.post("/api/auth/google", googleData);
      dispatch(setUserData(res.data));
      toast.success(`Welcome!`);
      navigate("/");
    } catch (error) {
      toast.error("Google Sign Up Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!formData.email || !formData.password)
      return toast.error("Details missing");
    if (formData.password !== formData.confirmPassword)
      return toast.error("Passwords don't match");

    try {
      setLoading(true);
      toast.loading("Sending OTP...", { id: "otp-loading" }); 
      await api.post("/api/auth/signup", { ...formData, role });
      toast.dismiss("otp-loading");
      toast.success("OTP sent to your email!");
      setStep(2);
    } catch (error) {
      toast.dismiss("otp-loading");
      toast.error(error.response?.data?.message || "Signup Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter 6-digit OTP");
    try {
      setLoading(true);
      const result = await api.post("/api/auth/verify-otp", {
        email: formData.email,
        otp,
      });
      dispatch(setUserData(result.data.user));
      toast.success("Verification Successful!");
      navigate("/");
    } catch (error) {
      toast.error("Verification Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post("/api/auth/resend-otp", { email: formData.email });
      toast.success("New OTP sent!");
    } catch (error) {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#96D0F3FF] flex items-center justify-center p-4 md:p-8 lg:p-12">
      <motion.div 
        layout
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ 
          layout: { duration: 8, ease: [0.25, 1, 0.5, 1] }
        }}
        className="w-full max-w-[1240px] h-full max-h-[900px] bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row-reverse overflow-hidden"
      >
        
        <motion.div 
          layoutId="auth-form-column"
          className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center p-6 lg:p-8 bg-white overflow-hidden relative z-20"
        >
          <div className="w-full max-w-[400px] flex flex-col">
            {/* Logo */}
            <div className="mb-4 flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
               <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Trophy size={22} className="text-white" />
               </div>
               <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-800 tracking-tight leading-none">Mye3</span>
                  <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Academy</span>
               </div>
            </div>

            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              {step === 1 ? (
                <>
                  <div className="mb-3 text-center lg:text-left">
                  <h2 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight mb-1">
                    Create Account
                  </h2>
                  <p className="text-slate-400 text-[10px] font-medium tracking-tight">
                    Join thousands of students and start practicing.
                  </p>
                </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-1">
                    <div className="grid grid-cols-2 gap-3">
                      <InputField id="firstname" placeholder="First Name" value={formData.firstname} onChange={handleChange} />
                      <InputField id="lastname" placeholder="Last Name" value={formData.lastname} onChange={handleChange} />
                    </div>

                    <InputField
                      id="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                    />

                    <InputField
                      id="phoneNumber"
                      placeholder="Phone Number"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        id="password"
                        type={showPass ? "text" : "password"}
                        placeholder="Password"
                        isPass
                        showPass={showPass}
                        togglePass={() => setShowPass(!showPass)}
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <InputField
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>

                    <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center mt-3"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Create Account"}
                  </button>

                  <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center px-2">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest text-slate-300">
                      <span className="px-3 bg-white">or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors shadow-sm font-bold text-slate-700 active:scale-[0.98]"
                  >
                    <img src={googleImg} className="w-4 h-4" alt="Google" />
                    <span className="text-[11px] font-black tracking-tight text-slate-600">Sign up with Google</span>
                  </button>

                  <p className="text-center mt-4 text-slate-400 font-bold text-[10px] tracking-tight">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-indigo-600 font-black hover:underline underline-offset-4"
                    >
                      Log in
                    </button>
                  </p>
                </form>
                </>
              ) : (
                /* OTP VERIFICATION VIEW */
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
                      Verify Your <br />
                      <span className="text-emerald-600">Email</span>
                    </h2>
                    <p className="text-slate-400 font-medium tracking-tight">
                      Check your inbox code sent to {formData.email}
                    </p>
                  </div>

                  <form onSubmit={handleVerify} className="space-y-6">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full py-4 text-center text-2xl font-black tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl text-emerald-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                      placeholder="000000"
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-slate-900 text-white rounded-xl font-black transition-all active:scale-[0.98] flex justify-center items-center shadow-lg"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Started"}
                    </button>

                    <div className="flex justify-between items-center px-1">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN - HERO */}
        <motion.div 
          layoutId="auth-hero-column"
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#5959E0FF]"
        >
          <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 lg:p-12">
            <div className="relative w-full flex-1 flex items-center justify-center animate-float">
               <img
                 src={signupIllustration}
                 alt="Signup Illustration"
                 className="max-w-full max-h-[85%] object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.15)]"
               />
            </div>
            
            <div className="-mt-6 text-center">
               <h3 className="text-xl lg:text-2xl font-black tracking-[0.05em] uppercase text-white drop-shadow-lg">
                 Excellence <span className="text-indigo-200">Awaits</span>
               </h3>
               <div className="w-8 h-1 bg-white/20 mx-auto my-2 rounded-full"></div>
               <p className="text-indigo-100/80 text-[10px] font-bold max-w-xs mx-auto tracking-wide">
                 Personalize your learning experience and track your evolution.
               </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
        </motion.div>

      </motion.div>
    </div>
  );
};


export default Signup;
