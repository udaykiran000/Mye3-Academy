// frontend/src/components/admin/CreateMocktestPage.jsx
import React from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { createMockTest } from "../../redux/mockTestSlice";
import FormMocktest from "./FormMocktest";
import { toast } from "react-hot-toast";

export default function CreateMocktestPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { category: categorySlug } = useParams();

    const handleCreateTest = async (formData, publish) => {
        try {
            toast.loading("Creating mock test...");
            const resultAction = await dispatch(
                createMockTest({ ...formData, isPublished: publish })
                

            );
            console.log("🔥 FULL RESPONSE PAYLOAD:", resultAction.payload);
            toast.dismiss();

            if (createMockTest.fulfilled.match(resultAction)) {
                toast.success("Mock test created! Questions automatically generated.");

                // FIX: Do NOT name this payload again
                const resp = resultAction.payload || {};

                const newId =
                    resp.mocktest?._id ||
                    resp._id ||
                    resp.id ||
                    resp.data?._id;

                if (!newId) {
                    console.warn(
                        "CreateMockTest: created but ID not found in payload:",
                        resp
                    );
                    return navigate(`/admin/mocktests/${categorySlug}`);
                }

                // Navigate to admin question page
                navigate(`/admin/mocktests/${newId}/questions`);
                return;
            }

            const errorMsg =
                resultAction.payload?.message || "Failed to create mock test";
            toast.error(errorMsg);
        } catch (err) {
            console.error("Creation Error:", err);
            toast.dismiss();
        }
    };

    if (!categorySlug)
        return <div className="text-center mt-10 text-white">Loading category...</div>;

    return (
        <FormMocktest
            formTitle="Create Mock Test"
            onSubmitHandler={handleCreateTest}
            initialData={{ category: categorySlug }}
        />
    );
}
