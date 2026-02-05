import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

/* ----------------------------------
 FETCH INSTRUCTOR DASHBOARD STATS
----------------------------------- */

export const fetchInstructorStats = createAsyncThunk(
  "instructorDashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/instructor/dashboard-stats");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Stats fetch failed");
    }
  }
);

/* ----------------------------------
 SLICE
----------------------------------- */

const instructorDashboardSlice = createSlice({
  name: "instructorDashboard",
  initialState: {
    stats: null,
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructorStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructorStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchInstructorStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default instructorDashboardSlice.reducer;
