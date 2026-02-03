import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";
import toast from "react-hot-toast";

// ============================================================
// 1. ADMIN ACTIONS (Manage All Instructors)
// ============================================================

// ⬇ Fetch all instructors (For Admin Table)
export const fetchInstructors = createAsyncThunk(
  "instructors/fetchInstructors",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/admin/users/instructors");
      return data; // array of instructors
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ⬇ Add new instructor
export const addInstructor = createAsyncThunk(
  "instructors/addInstructor",
  async (instructorData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/api/admin/users/add/instructors",
        instructorData
      );

      return data.instructor; // new instructor object
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ⬇ Toggle active/inactive status
export const toggleInstructorStatus = createAsyncThunk(
  "instructors/toggleInstructorStatus",
  async (instructorId, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/api/admin/users/instructors/${instructorId}/toggle-status`
      );

      toast.success(data.message);
      return data.instructor; // updated instructor
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ⬇ Update Instructor (Admin editing someone else)
export const updateInstructor = createAsyncThunk(
  "instructors/updateInstructor",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/api/admin/users/instructors/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return data.instructor;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ⬇ Delete Instructor
export const deleteInstructor = createAsyncThunk(
  "instructors/deleteInstructor",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/admin/users/instructors/${id}`);
      toast.success("Instructor deleted successfully!");
      return id;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ============================================================
// 2. ✅ NEW: PROFILE ACTIONS (For Instructor Dashboard)
// ============================================================

// ⬇ Fetch MY Profile (For Sidebar/Settings)
export const fetchInstructorProfile = createAsyncThunk(
  "instructors/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ Matches the route we added in instructorRouter/adminRouter
      const { data } = await api.get("/api/admin/users/profile"); 
      return data; // Returns user object
    } catch (err) {
      // Don't toast error here to avoid spamming on every page load
      return rejectWithValue(err.response?.data?.message || "Failed to load profile");
    }
  }
);

// ⬇ Update MY Profile (Settings Page)
export const updateInstructorProfile = createAsyncThunk(
  "instructors/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/api/admin/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // toast handled in component or here, doing here ensures feedback
      return data; // { message, user }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      return rejectWithValue(message);
    }
  }
);

// ============================================================
// SLICE
// ============================================================

const initialState = {
  // Admin List State
  instructors: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  // ✅ Profile State (Single User)
  instructorProfile: null,
  profileLoading: false,
  profileStatus: "idle",
  profileSuccessMessage: null,
  profileError: null,
};

const instructorSlice = createSlice({
  name: "instructors",
  initialState,
  reducers: {
    // ✅ Helper to clear profile messages (Success/Error)
    clearInstructorStatus(state) {
      state.profileStatus = "idle";
      state.profileSuccessMessage = null;
      state.profileError = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ---------------------
      // FETCH ALL (Admin)
      // ---------------------
      .addCase(fetchInstructors.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.instructors = action.payload;
      })
      .addCase(fetchInstructors.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ---------------------
      // ADD (Admin)
      // ---------------------
      .addCase(addInstructor.fulfilled, (state, action) => {
        state.instructors.unshift(action.payload);
      })

      // ---------------------
      // TOGGLE STATUS (Admin)
      // ---------------------
      .addCase(toggleInstructorStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.instructors.findIndex(
          (inst) => inst._id === updated._id
        );
        if (index !== -1) {
          state.instructors[index] = updated;
        }
      })

      // ---------------------
      // UPDATE (Admin Editing Others)
      // ---------------------
      .addCase(updateInstructor.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.instructors.findIndex(
          (inst) => inst._id === updated._id
        );
        if (index !== -1) {
          state.instructors[index] = updated;
        }
      })

      // ---------------------
      // DELETE (Admin)
      // ---------------------
      .addCase(deleteInstructor.fulfilled, (state, action) => {
        state.instructors = state.instructors.filter(
          (inst) => inst._id !== action.payload
        );
      })

      // ---------------------
      // ✅ FETCH PROFILE (Sidebar/Settings)
      // ---------------------
      .addCase(fetchInstructorProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchInstructorProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.instructorProfile = action.payload;
      })
      .addCase(fetchInstructorProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      })

      // ---------------------
      // ✅ UPDATE MY PROFILE (Settings)
      // ---------------------
      .addCase(updateInstructorProfile.pending, (state) => {
        state.profileStatus = "loading";
        state.profileError = null;
        state.profileSuccessMessage = null;
      })
      .addCase(updateInstructorProfile.fulfilled, (state, action) => {
        state.profileStatus = "succeeded";
        state.profileSuccessMessage = action.payload.message;
        // Update local profile data immediately
        if (action.payload.user) {
          state.instructorProfile = action.payload.user;
        }
      })
      .addCase(updateInstructorProfile.rejected, (state, action) => {
        state.profileStatus = "failed";
        state.profileError = action.payload;
      });
  },
});

export const { clearInstructorStatus } = instructorSlice.actions;

export default instructorSlice.reducer;