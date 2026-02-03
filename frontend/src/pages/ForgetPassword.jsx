// frontend/src/pages/ForgetPassword.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios"; // Using your axios instance

const ForgetPassword = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    /* ----------------------------------------------------
       STEP 1 : SEND OTP
    ----------------------------------------------------- */
    const handleSendOtp = async () => {
        if (!email) return toast.error("Please enter your email");

        try {
            setLoading(true);

            // ⭐ MUST include /api since baseURL does NOT have it
            await api.post("/api/auth/forgot-password", { email });

            setLoading(false);
            setStep(2);
            toast.success("OTP sent to your email");
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || "Error sending OTP");
        }
    };

    /* ----------------------------------------------------
       STEP 2 : RESET PASSWORD
    ----------------------------------------------------- */
    const handleReset = async () => {
        if (!otp || !newPassword) {
            return toast.error("All fields are required");
        }

        try {
            setLoading(true);

            await api.post("/api/auth/reset-password", {
                email,
                otp: otp.trim(),
                newPassword
            });

            setLoading(false);
            toast.success("Password reset successfully! Please Login.");
            navigate("/login");
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || "Reset failed");
        }
    };

    /* ----------------------------------------------------
       SIMPLE SPINNER
    ----------------------------------------------------- */
    const Spinner = () => (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    );

    return (
        <div className="bg-[#dddbdb] w-[100vw] h-[100vh] flex justify-center items-center">
            <div className="w-[90%] md:w-[400px] bg-white shadow-lg rounded-xl p-6">

                <h2 className="text-2xl font-bold mb-4 text-center">
                    {step === 1 ? "Forgot Password" : "Reset Password"}
                </h2>

                {/* ------------------------- STEP 1 ------------------------- */}
                {step === 1 ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-gray-500 text-sm text-center">
                            Enter your registered email to receive an OTP.
                        </p>

                        <input
                            type="email"
                            placeholder="Enter Email"
                            className="border p-2 rounded w-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />

                        <button
                            className="bg-black text-white py-2 rounded w-full hover:opacity-90 flex justify-center items-center gap-2"
                            onClick={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? <Spinner /> : "Send OTP"}
                        </button>
                    </div>
                ) : (
                    /* ------------------------- STEP 2 ------------------------- */
                    <div className="flex flex-col gap-4">
                        <p className="text-gray-500 text-sm text-center">
                            Check your email: <strong>{email}</strong>
                        </p>

                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            className="border p-2 rounded w-full text-center tracking-widest text-lg"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            autoComplete="off"
                        />

                        <input
                            type="password"
                            placeholder="New Password"
                            className="border p-2 rounded w-full"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                        />

                        <button
                            className="bg-black text-white py-2 rounded w-full hover:opacity-90 flex justify-center items-center gap-2"
                            onClick={handleReset}
                            disabled={loading}
                        >
                            {loading ? <Spinner /> : "Reset Password"}
                        </button>

                        <div className="text-center mt-2">
                            <span
                                className="text-blue-600 text-sm cursor-pointer"
                                onClick={handleSendOtp}
                            >
                                Resend OTP?
                            </span>
                        </div>
                    </div>
                )}

                <div className="mt-4 text-center">
                    <span
                        className="underline cursor-pointer text-sm"
                        onClick={() => navigate("/login")}
                    >
                        Back to Login
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ForgetPassword;
