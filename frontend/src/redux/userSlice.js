import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import api from "../api/axios";

const serverUrl = import.meta.env.VITE_SERVER_URL;

// ... (existing fetchUserData async thunk) ...
export const fetchUserData = createAsyncThunk(
    "user/fetchUserData",
    async (userId, thunkAPI) => {
        try {
            const response = await api.get(`/api/user/${userId}`,

                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data || "Failed to fetch user data"
            );
        }
    }
);

// --- ADDED: New asyncThunk to fetch student's paid tests ---
export const fetchMyMockTests = createAsyncThunk(
    "user/fetchMyMockTests",
    async (_, { rejectWithValue }) => {
        try {
            // Use 'api' to ensure cookies/headers are sent
            const response = await api.get("/api/student/my-mocktests");

            // Check standard response format { success: true, tests: [...] }
            if (response.data.success) {
                return response.data.tests;
            }
            // Fallback if backend sends just array
            else if (Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to load your tests."
            );
        }
    }
);

// -------------------------------------------------------------

// Helper function to safely parse user data from localStorage
const getInitialUser = () => {
    try {
        const storedUser = localStorage.getItem("userData");
        if (storedUser && storedUser !== "undefined") {
            return JSON.parse(storedUser);
        }
        return null;
    } catch (error) {
        return null;
    }
};

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: getInitialUser(),
        loading: false,
        error: null,
        // New State for My Tests
        myMockTests: [],
        myMockTestsStatus: "idle", // idle | loading | succeeded | failed
        myMockTestsError: null,
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload;
            if (action.payload) {
                localStorage.setItem("userData", JSON.stringify(action.payload));
            } else {
                localStorage.removeItem("userData");
            }
        },
        logoutUser: (state) => {
            state.userData = null;
            // Clear test data on logout
            state.myMockTests = [];
            state.myMockTestsStatus = "idle";
            state.myMockTestsError = null;
            localStorage.removeItem("userData");
        },
        // ✅ ADDED: Reducer to reset the status for a manual refresh
        clearMyMockTestsStatus: (state) => {
            state.myMockTestsStatus = "idle";
        }
    },
    extraReducers: (builder) => {
        // ... (keep fetchUserData cases) ...

        // FETCH MY MOCK TESTS HANDLERS
        builder
            .addCase(fetchMyMockTests.pending, (state) => {
                state.myMockTestsStatus = "loading";
                state.myMockTestsError = null;
            })
            .addCase(fetchMyMockTests.fulfilled, (state, action) => {
                state.myMockTestsStatus = "succeeded";
                state.myMockTests = action.payload; // Array of populated objects
            })
            .addCase(fetchMyMockTests.rejected, (state, action) => {
                state.myMockTestsStatus = "failed";
                state.myMockTestsError = action.payload;
            });
    },
});

// ✅ EXPORT the new action
export const { setUserData, logoutUser, clearMyMockTestsStatus } = userSlice.actions;
export default userSlice.reducer;