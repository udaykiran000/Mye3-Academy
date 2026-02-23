import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

/**
 * Fetch Institution Statistics
 */
export const fetchInstitutionStats = createAsyncThunk(
  "institutionDashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/institution/stats");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load stats");
    }
  }
);

/**
 * Fetch Students managed by the Institution
 */
export const fetchInstitutionStudents = createAsyncThunk(
  "institutionDashboard/fetchStudents",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/institution/students");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load students");
    }
  }
);

const institutionDashboardSlice = createSlice({
  name: "institutionDashboard",
  initialState: {
    stats: null,
    students: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Stats
      .addCase(fetchInstitutionStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstitutionStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchInstitutionStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Students
      .addCase(fetchInstitutionStudents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInstitutionStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload;
      })
      .addCase(fetchInstitutionStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default institutionDashboardSlice.reducer;
