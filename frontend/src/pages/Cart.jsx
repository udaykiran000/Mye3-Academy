import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchCart, removeItemFromCart } from "../redux/cartSlice";
import { CgSpinner } from "react-icons/cg";
import { FaTrash, FaTag, FaCheckCircle } from "react-icons/fa";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import api from "../api/axios";

// =======================================================
// CART ITEM COMPONENT
// =======================================================
const CartItem = ({ item, onRemove }) => {

    // FINAL FIX — USE AXIOS BASEURL (NOT import.meta.env)
    const imageSrc = item.imageUrl
        ? (
            item.imageUrl.startsWith("http")
                ? item.imageUrl
                : api.defaults.baseURL + item.imageUrl
        )
        : "https://placehold.co/150x100?text=No+Image";

    const price = item.discountPrice > 0 ? item.discountPrice : item.price;
    const hasDiscount = item.discountPrice > 0;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 border-b border-gray-700 hover:bg-gray-800 transition gap-4">

            {/* IMAGE */}
            <div className="flex items-start gap-4 w-full sm:w-2/3">
                <img
                    src={imageSrc}
                    alt={item.title}
                    className="w-28 h-20 object-cover rounded-lg shadow-md"
                    onError={(e) => { e.target.src = "https://placehold.co/150x100?text=Error"; }}
                />

                <div className="flex flex-col flex-grow">
                    <Link
                        to={`/mocktests/${item._id}`}
                        className="text-lg font-bold text-white hover:text-cyan-400"
                    >
                        {item.title}
                    </Link>

                    <div className="flex items-center text-sm text-gray-400 mt-1">
                        <FaTag className="w-3 h-3 mr-1" />
                        <span>{item.categorySlug} Test</span>
                    </div>
                </div>
            </div>

            {/* PRICE + REMOVE */}
            <div className="flex justify-between items-center w-full sm:w-1/3">
                <div className="flex flex-col items-end">
                    <span className="text-xl font-extrabold text-white">₹{price}</span>

                    {hasDiscount && (
                        <span className="text-sm text-red-400 line-through">₹{item.price}</span>
                    )}
                </div>

                <button
                    onClick={() => onRemove(item._id)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-gray-700"
                >
                    <FaTrash size={18} />
                </button>
            </div>
        </div>
    );
};

// =======================================================
// MAIN CART COMPONENT
// =======================================================
export default function Cart() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const cartItems = useSelector((state) => state.cart.cartItems);
    const status = useSelector((state) => state.cart.status);
    const { userData } = useSelector((state) => state.user);

    useEffect(() => {
        if (userData) dispatch(fetchCart());
    }, [dispatch, userData]);

    // REMOVE & TOAST
    const handleRemove = (id) => {
        dispatch(removeItemFromCart(id));
        toast.info("Removed from cart");
    };

    const subtotal = cartItems.reduce((acc, item) => {
        const price = item.discountPrice > 0 ? item.discountPrice : item.price;
        return acc + price;
    }, 0);

    // Loading
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <CgSpinner className="animate-spin text-5xl text-cyan-400" />
            </div>
        );
    }

    // Not Logged In
    if (!userData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-900">
                <h2 className="text-3xl font-bold">Please Login First</h2>
                <Link to="/login" className="mt-4 bg-cyan-600 px-6 py-3 rounded-lg">
                    Login
                </Link>
            </div>
        );
    }

    // Empty Cart
    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-900">
                <h2 className="text-3xl font-bold">Your Cart Is Empty</h2>
                <Link to="/mocktests" className="mt-4 bg-cyan-600 px-6 py-3 rounded-lg">
                    Browse Tests
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-950 min-h-screen pt-28 pb-16 text-white">
            <div className="max-w-7xl mx-auto px-4">

                <h1 className="text-4xl font-extrabold mb-10 border-b border-gray-800 pb-3">
                    <ShoppingCart size={32} className="inline mr-3 text-cyan-400" />
                    Shopping Cart
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* CART ITEMS LIST */}
                    <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="p-4 bg-gray-800 border-b border-gray-700">
                            <h2 className="text-xl font-semibold text-cyan-400">
                                Tests in Cart ({cartItems.length})
                            </h2>
                        </div>

                        {cartItems.map((item, index) => (
                            <CartItem
                                key={`${item._id}-${index}`}
                                item={item}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>

                    {/* ORDER SUMMARY */}
                    <aside>
                        <div className="sticky top-28 bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-6 text-cyan-400">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-300">
                                    <span>Subtotal</span>
                                    <span className="font-medium">₹{subtotal}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-2xl font-extrabold">
                                <span>Total</span>
                                <span className="text-cyan-400">₹{subtotal}</span>
                            </div>

                            <button
                                onClick={() => navigate("/checkout")}
                                className="w-full mt-6 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold text-white"
                            >
                                <FaCheckCircle className="inline mr-2" /> Proceed to Checkout
                            </button>

                            <Link
                                to="/mocktests"
                                className="block text-center mt-3 text-gray-400 hover:text-cyan-400"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
