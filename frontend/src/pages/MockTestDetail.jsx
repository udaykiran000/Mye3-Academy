import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicTestById } from "../redux/mockTestSlice";
import { addItemToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import { CgSpinner } from "react-icons/cg";
import {
    FaClock,
    FaQuestionCircle,
    FaCheck,
    FaBook,
    FaMinusCircle,
    FaArrowLeft,
} from "react-icons/fa";

const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-start p-4 bg-gray-900 rounded-xl border border-gray-800 shadow-md">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-800 text-cyan-400 rounded-full">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-400">{label}</p>
            <p className="text-lg font-semibold text-white">{value}</p>
        </div>
    </div>
);

export default function MockTestDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userData = useSelector((state) => state.user.userData);
    const cartItems = useSelector((state) => state.cart.cartItems || []);
    const isAlreadyInCart = cartItems.some((item) => item._id === id);

    const test = useSelector((state) => state.mocktest.selectedMocktest);
    const status = useSelector((state) => state.mocktest.selectedStatus);
    const error = useSelector((state) => state.mocktest.selectedError);

    useEffect(() => {
        if (id) dispatch(fetchPublicTestById(id));
    }, [dispatch, id]);

    const handleAddToCart = () => {
        if (!userData) {
            toast.error("Please login first");
            return navigate("/login");
        }
        if (isAlreadyInCart) return navigate("/cart");
        dispatch(addItemToCart(id));
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-950">
                <CgSpinner className="animate-spin text-5xl text-cyan-400" />
            </div>
        );
    }

    if (status === "failed") {
        return (
            <div className="max-w-4xl mx-auto pt-40 text-center text-white">
                <h2 className="text-2xl font-bold text-red-500">Unable to load test</h2>
                <p className="text-red-400 mt-2">{error}</p>
                <Link
                    to="/mocktests"
                    className="mt-6 inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition"
                >
                    <FaArrowLeft className="mr-2" />
                    Back to Tests
                </Link>
            </div>
        );
    }

    if (!test) return null;

    // FINAL FIXED IMAGE URL
    const imageURL =
        test.thumbnail?.startsWith("http")
            ? test.thumbnail
            : import.meta.env.VITE_SERVER_URL + test.thumbnail;

    return (
        <div className="bg-gray-950 min-h-screen pt-24 pb-16 text-white">
            <div className="max-w-7xl mx-auto px-4">

                {/* Breadcrumb */}
                <div className="mb-6 text-sm text-gray-400">
                    <Link to="/mocktests" className="hover:text-cyan-400">
                        All Tests
                    </Link>{" "}
                    / <span className="text-white">{test.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT SIDE */}
                    <div className="lg:col-span-2 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
                        
                        <span className="inline-block bg-cyan-900/40 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                            {test.category?.name}
                        </span>

                        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
                            {test.title}
                        </h1>

                        {/* FIXED IMAGE */}
                        <div className="w-full h-64 sm:h-80 bg-gray-800 rounded-xl mt-6 mb-8 overflow-hidden flex items-center justify-center border border-gray-700">
                            <img
                                src={imageURL}
                                alt={test.title}
                                className="w-full h-full object-cover"
                                onError={(e) =>
                                    (e.target.src =
                                        "https://placehold.co/600x400?text=Image+Not+Found")
                                }
                            />
                        </div>

                        {/* DETAILS */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            <DetailItem icon={<FaQuestionCircle />} label="Questions" value={test.totalQuestions} />
                            <DetailItem icon={<FaClock />} label="Duration" value={`${test.durationMinutes} min`} />
                            <DetailItem icon={<FaCheck />} label="Marks" value={test.totalMarks} />
                            <DetailItem icon={<FaMinusCircle />} label="Negative Marking" value={test.negativeMarking} />
                            <DetailItem icon={<FaBook />} label="Subjects" value={test.subjects?.map((s) => s.name).join(", ")} />
                        </div>

                        <h2 className="text-2xl font-bold mb-3">Description</h2>
                        <p className="text-gray-300">{test.description}</p>
                    </div>

                    {/* RIGHT SIDE */}
                    <aside className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl sticky top-24 h-fit text-center">

                        {/* FINAL PRICE FIX - CORRECTED LOGIC */}
                        {test.price > 0 ? (
                            // Check for a valid discount price
                            test.discountPrice > 0 && test.discountPrice < test.price ? (
                                <>
                                    <span className="text-lg text-gray-400 line-through block">
                                        ₹{test.price}
                                    </span>
                                    <span className="text-4xl font-extrabold text-cyan-400">
                                        ₹{test.discountPrice}
                                    </span>
                                </>
                            ) : (
                                // No discount, display original price
                                <span className="text-4xl font-extrabold text-cyan-400">
                                    ₹{test.price}
                                </span>
                            )
                        ) : (
                            // Price is 0 or less, display FREE
                            <span className="text-4xl font-extrabold text-green-400">FREE</span>
                        )}

                        <button
                            onClick={handleAddToCart}
                            className={`w-full mt-6 py-3 rounded-xl text-lg font-bold transition ${
                                isAlreadyInCart
                                    ? "bg-green-600 hover:bg-green-500"
                                    : "bg-cyan-600 hover:bg-cyan-500"
                            }`}
                        >
                            {isAlreadyInCart ? "Go to Cart" : "Add to Cart"}
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
}