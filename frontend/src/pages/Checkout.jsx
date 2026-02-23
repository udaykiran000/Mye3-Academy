import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { clearCart } from "../redux/cartSlice";
import { setUserData, fetchMyMockTests } from "../redux/userSlice";
import { ShoppingCart, User, Mail, Phone, Loader } from "lucide-react";

export default function Checkout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const allCartItems = useSelector((state) => state.cart.cartItems || []);
    const user = useSelector((state) => state.user.userData);

    // Filter to selected items if state exists
    const selectedIds = location.state?.selectedIds || [];
    const cartItems = selectedIds.length > 0
        ? allCartItems.filter(item => selectedIds.includes(item._id))
        : allCartItems;
    
    // STATE FOR DYNAMIC CONFIG
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    // FETCH CONFIG ON MOUNT
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get("/api/payment/config");
                setPaymentConfig(data);
            } catch (error) {
                console.error("Failed to load payment config");
                // Don't toast error here to avoid annoyance if it's just a free course
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    // ---------- PRICE LOGIC ----------
    const subtotal = cartItems.reduce((acc, item) => {
        const itemPrice = Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price) 
            ? Number(item.discountPrice) 
            : Number(item.price);
        return acc + (itemPrice > 0 ? itemPrice : 0);
    }, 0);

    const discount = cartItems.reduce((acc, item) => {
        const fullPrice = Number(item.price) || 0;
        const finalPrice = (Number(item.discountPrice) > 0 && Number(item.discountPrice) < fullPrice) 
            ? Number(item.discountPrice) 
            : fullPrice;
        return acc + (fullPrice - finalPrice);
    }, 0);

    const totalAmount = subtotal;
    const amountInPaisa = Math.round(totalAmount * 100);
    const isFreePurchase = amountInPaisa === 0;

    // ---------- DYNAMIC SCRIPT LOADER ----------
    const loadScript = (src) => {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(true); // Already loaded
                return;
            }
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // ---------- MOCK PAYMENT MODAL ----------
    const [showMockModal, setShowMockModal] = useState(false);
    const [mockProcessing, setMockProcessing] = useState(false);

    const handleMockPayment = async () => {
        setMockProcessing(true);
        try {
             // 1. Create Mock Order
             const { data: order } = await api.post("/api/payment/create-order", {
                amount: amountInPaisa,
                cartItems: cartItems.map((i) => i._id),
            });

            if (!order.success) throw new Error("Mock order creation failed");

            // 2. Simulate Delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 3. Verify Mock Payment
            const verify = await api.post("/api/payment/verify-payment", {
                razorpay_payment_id: `mock_pay_${Date.now()}`,
                razorpay_order_id: order.orderId,
                razorpay_signature: "mock_signature",
                cartItems: cartItems.map((i) => i._id),
                amount: amountInPaisa,
            });

            if (verify.data.success) {
                toast.success("Mock Payment Successful!");
                dispatch(setUserData(verify.data.user));
                dispatch(clearCart());
                // 🔄 REFRESH Enrolled Tests immediately
                await dispatch(fetchMyMockTests()); 
                navigate("/student-dashboard");
            } else {
                toast.error("Mock Verification failed");
            }

        } catch (error) {
            console.error("Mock Payment Error:", error);
            toast.error("Mock Payment Failed");
        } finally {
            setMockProcessing(false);
            setShowMockModal(false);
        }
    };

    // ---------- PAYMENT HANDLER ----------
    const handlePayment = async () => {
        const toastId = toast.loading(isFreePurchase ? "Processing enrollment..." : "Initializing payment...");

        // 1. FREE PURCHASE
        if (isFreePurchase) {
            try {
                const res = await api.post("/api/payment/enroll-free", { cartItems: cartItems.map((i) => i._id) });
                if (res.data.success) {
                    toast.success("Enrolled Successfully!", { id: toastId });
                    dispatch(setUserData(res.data.user));
                    dispatch(clearCart());
                    // 🔄 REFRESH
                    await dispatch(fetchMyMockTests());
                    navigate("/student-dashboard");
                } else {
                    toast.error("Enrollment failed", { id: toastId });
                }
            } catch (err) {
                toast.error("Enrollment failed", { id: toastId });
            }
            return;
        }

        // 2. CHECK IF CONFIG EXISTS
        if (!paymentConfig) {
            toast.error("Payment system unavailable. Contact Admin.", { id: toastId });
            return;
        }

        // 3. MOCK MODE CHECK
        if (paymentConfig.keyId === "test" || paymentConfig.provider === "Mock") {
            toast.dismiss(toastId);
            setShowMockModal(true);
            return;
        }

        // 4. RAZORPAY FLOW
        if (paymentConfig.provider === "Razorpay") {
            const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
            if (!loaded) {
                toast.error("Failed to load Razorpay SDK", { id: toastId });
                return;
            }

            try {
                // Create Order
                const { data: order } = await api.post("/api/payment/create-order", {
                    amount: amountInPaisa,
                    cartItems: cartItems.map((i) => i._id),
                });
                


                const options = {
                    key: paymentConfig.keyId,
                    amount: order.amount,
                    currency: paymentConfig.currency || "INR",
                    name: "MYE 3 Academy",
                    description: "Test Purchase",
                    order_id: order.id, // Now matches backend "id"
                    handler: async function (response) {
                        try {
                            const verify = await api.post("/api/payment/verify-payment", {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                cartItems: cartItems.map((i) => i._id),
                                amount: amountInPaisa,
                            });

                            if (verify.data.success) {
                                toast.success("Payment Successful!", { id: toastId });
                                dispatch(setUserData(verify.data.user));
                                dispatch(clearCart());
                                // 🔄 REFRESH
                                await dispatch(fetchMyMockTests());
                                navigate("/student-dashboard");
                            } else {
                                toast.error("Verification failed", { id: toastId });
                            }
                        } catch (err) {
                            toast.error("Verification error", { id: toastId });
                        }
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email,
                        contact: user?.phone,
                    },
                    theme: { color: paymentConfig.themeColor || "#4F46E5" }, // <--- DYNAMIC COLOR
                };

                toast.dismiss(toastId);
                const rp = new window.Razorpay(options);
                rp.open();
            } catch (err) {
                console.error("Payment Init Error:", err);
                const msg = err.response?.data?.message || "Payment initialization failed";
                toast.error(msg, { id: toastId });
            }
        } 
        
        // 4. FUTURE STRIPE/PAYPAL LOGIC HERE
        else {
             toast.error(`Provider ${paymentConfig.provider} not fully implemented in frontend yet.`, { id: toastId });
        }
    };

    // UI RENDER (Same as before but safely handles loading)
    if (cartItems.length === 0) return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center px-4 text-center">
            <ShoppingCart size={64} className="text-gray-400 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800">Your Cart is Empty</h2>
            <button onClick={() => navigate("/mocktests")} className="mt-6 bg-indigo-600 px-8 py-3 rounded-lg text-white font-semibold hover:bg-indigo-700 shadow-lg">Browse Mock Tests</button>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen pt-24 pb-16 px-3 sm:px-4 text-gray-900 font-sans relative">
            {/* MOCK PAYMENT MODAL */}
            {showMockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                        <div className="mb-6 flex justify-center">
                             <div className="bg-yellow-100 p-4 rounded-full">
                                 <ShoppingCart size={40} className="text-yellow-600" />
                             </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Test Payment Mode</h3>
                        <p className="text-gray-600 mb-6">You are using 'Test' credentials. This is a simulation. No real money will be deducted.</p>
                        
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={() => setShowMockModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                disabled={mockProcessing}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleMockPayment}
                                disabled={mockProcessing}
                                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-bold shadow-md flex items-center"
                            >
                                {mockProcessing ? <Loader className="animate-spin mr-2" size={18}/> : null}
                                Confirm Success
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-10 leading-tight">
                    <ShoppingCart size={28} className="inline mr-2 text-indigo-600" /> Secure Checkout
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* LEFT COLUMN: USER INFO */}
                    <div className="md:col-span-1 space-y-4 hidden md:block">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center"><User size={20} className="mr-2" /> Your Details</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p className="flex items-center capitalize"><User size={16} className="mr-2 text-indigo-400" /> {user?.firstname} {user?.lastname}</p>
                                <p className="flex items-center"><Mail size={16} className="mr-2 text-indigo-400" /> {user?.email}</p>
                                <p className="flex items-center"><Phone size={16} className="mr-2 text-indigo-400" /> {user?.phoneNumber}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                            <p className="text-sm font-semibold text-green-700">🔒 Transactions secured by {paymentConfig?.provider || "Gateway"}</p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="md:col-span-2 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 border-b border-gray-100 pb-2">Items ({cartItems.length})</h2>
                        <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                            {cartItems.map((item) => {
                                const itemPrice = Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price) 
                                    ? Number(item.discountPrice) 
                                    : Number(item.price);
                                const isItemFree = itemPrice <= 0;

                                return (
                                    <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm sm:text-base text-gray-700">{item.title}</span>
                                        <span className="font-bold text-sm text-indigo-600">
                                            {isItemFree ? "FREE" : `₹${itemPrice}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-sm sm:text-base">
                            <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-red-500 font-semibold"><span>Discount:</span><span>- ₹{discount.toFixed(2)}</span></div>
                            <div className="flex justify-between pt-4 border-t border-gray-100 text-2xl sm:text-3xl font-extrabold">
                                <span>Total:</span>
                                <span className={isFreePurchase ? "text-green-600" : "text-indigo-600"}>{isFreePurchase ? "FREE" : `₹${totalAmount.toFixed(2)}`}</span>
                            </div>
                        </div>

                        {/* BUTTON */}
                        <button
                            onClick={handlePayment}
                            disabled={!isFreePurchase && loadingConfig}
                            className={`mt-8 w-full py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-xl transition flex justify-center items-center gap-2 text-white shadow-md ${
                                isFreePurchase ? "bg-green-600 hover:bg-green-500" : "bg-indigo-600 hover:bg-indigo-500"
                            } ${(!isFreePurchase && loadingConfig) ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {loadingConfig && !isFreePurchase && <Loader className="animate-spin" size={20}/>}
                            {isFreePurchase ? "Enroll Now (FREE)" : `Pay ₹${totalAmount.toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}