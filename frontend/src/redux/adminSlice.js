import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// 1. Fetch Admin Profile
export const fetchAdminProfile = createAsyncThunk(
  "admin/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      // Reuse the same route as Instructors (it identifies user by Token)
      const { data } = await api.get("/api/admin/users/profile");
      return data; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load profile");
    }
  }
);

// 2. Update Admin Profile
export const updateAdminProfile = createAsyncThunk(
  "admin/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/api/admin/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update profile");
    }
  }
);

const initialState = {
  adminProfile: null,
  loading: false,
  status: "idle",
  error: null,
  successMessage: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminStatus(state) {
      state.status = "idle";
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchAdminProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.adminProfile = action.payload;
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateAdminProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.successMessage = action.payload.message;
        if (action.payload.user) {
          state.adminProfile = action.payload.user;
        }
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearAdminStatus } = adminSlice.actions;
export default adminSlice.reducer;