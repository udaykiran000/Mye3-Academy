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
const CartItem = ({ item, onRemove, isSelected, onToggleSelect }) => {

    // FINAL FIX — USE AXIOS BASEURL (NOT import.meta.env)
    const imageSrc = item.imageUrl
        ? (
            item.imageUrl.startsWith("http")
                ? item.imageUrl
                : (api.defaults.baseURL?.replace(/\/api$/, "") || "") + (item.imageUrl.startsWith("/") ? "" : "/") + item.imageUrl
        )
        : "https://placehold.co/150x100?text=No+Image";

    const price = Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price) 
        ? Number(item.discountPrice) 
        : Number(item.price);
    
    const isFree = price <= 0;
    const hasDiscount = Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price);

    return (
        <div className={`flex flex-col sm:flex-row items-start sm:items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition gap-4 ${!isSelected ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
            
            {/* SELECTION CHECKBOX */}
            <div className="flex items-center h-full">
                <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => onToggleSelect(item._id)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
            </div>

            {/* IMAGE */}
            <div className="flex items-start gap-4 w-full sm:w-2/3">
                <img
                    src={imageSrc}
                    alt={item.title}
                    className="w-28 h-20 object-cover rounded-lg shadow-sm"
                    onError={(e) => { e.target.src = "https://placehold.co/150x100?text=Error"; }}
                />

                <div className="flex flex-col flex-grow">
                    <Link
                        to={`/mocktests/${item._id}`}
                        className="text-lg font-bold text-gray-800 hover:text-indigo-600"
                    >
                        {item.title}
                    </Link>

                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FaTag className="w-3 h-3 mr-1" />
                        <span>{item.categorySlug} Test</span>
                    </div>
                </div>
            </div>

            {/* PRICE + REMOVE */}
            <div className="flex justify-between items-center w-full sm:w-1/3">
                <div className="flex flex-col items-end">
                    <span className="text-xl font-extrabold text-gray-900">
                        {isFree ? "FREE" : `₹${price}`}
                    </span>

                    {hasDiscount && !isFree && (
                        <span className="text-sm text-red-500 line-through">₹{item.price}</span>
                    )}
                </div>

                <button
                    onClick={() => onRemove(item._id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition"
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

    const [selectedIds, setSelectedIds] = React.useState([]);

    useEffect(() => {
        if (userData) {
            dispatch(fetchCart());
        }
    }, [dispatch, userData]);

    // Update selectedIds when cartItems change (auto-select all new items)
    useEffect(() => {
        if (cartItems.length > 0 && selectedIds.length === 0) {
            setSelectedIds(cartItems.map(i => i._id));
        }
    }, [cartItems]);

    // REMOVE & TOAST
    const handleRemove = (id) => {
        dispatch(removeItemFromCart(id));
        setSelectedIds(prev => prev.filter(item => item !== id));
        toast.info("Removed from cart");
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectedCartItems = cartItems.filter(item => selectedIds.includes(item._id));

    const subtotal = selectedCartItems.reduce((acc, item) => {
        const itemPrice = Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price) 
            ? Number(item.discountPrice) 
            : Number(item.price);
        return acc + (itemPrice > 0 ? itemPrice : 0);
    }, 0);

    const handleCheckout = () => {
        if (selectedIds.length === 0) {
            return toast.error("Please select at least one item to checkout");
        }
        // Navigate to checkout with selected items passed in state
        navigate("/checkout", { state: { selectedIds } });
    };

    // Loading
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <CgSpinner className="animate-spin text-5xl text-indigo-600" />
            </div>
        );
    }

    // Not Logged In
    if (!userData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-800 bg-gray-50">
                <h2 className="text-3xl font-bold">Please Login First</h2>
                <Link to="/login" className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                    Login
                </Link>
            </div>
        );
    }

    // Empty Cart
    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-800 bg-gray-50">
                <h2 className="text-3xl font-bold">Your Cart Is Empty</h2>
                <Link to="/mocktests" className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                    Browse Tests
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pt-28 pb-16 text-gray-900">
            <div className="max-w-7xl mx-auto px-4">

                <h1 className="text-4xl font-extrabold mb-10 border-b border-gray-200 pb-3 text-gray-900">
                    <ShoppingCart size={32} className="inline mr-3 text-indigo-600" />
                    Shopping Cart
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* CART ITEMS LIST */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-indigo-600">
                                Tests in Cart ({cartItems.length})
                            </h2>
                        </div>

                        {cartItems.map((item, index) => (
                            <CartItem
                                key={`${item._id}-${index}`}
                                item={item}
                                isSelected={selectedIds.includes(item._id)}
                                onToggleSelect={toggleSelect}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>

                    {/* ORDER SUMMARY */}
                    <aside>
                        <div className="sticky top-28 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-2xl font-bold mb-6 text-indigo-600">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">₹{subtotal}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-2xl font-extrabold text-gray-900">
                                <span>Total</span>
                                <span className="text-indigo-600">₹{subtotal}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full mt-6 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold text-white shadow-md transition"
                            >
                                <FaCheckCircle className="inline mr-2" /> Proceed to Checkout
                            </button>

                            <Link
                                to="/mocktests"
                                className="block text-center mt-3 text-gray-500 hover:text-indigo-600"
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
