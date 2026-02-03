// frontend/src/redux/dashboardSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios"; 

// Async thunk to fetch stats
export const fetchAdminStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/v1/dashboard/stats");
      if (data.success) {
        return data.stats;
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  stats: {
    students: 0,
    instructors: 0,
    mockTests: 0,
    attempts: 0,
    revenue: 0,
    orders: 0,
    categorySales: [], // Included in initial state
    testTypeSales: [],
  },
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
       state.stats = { ...initialState.stats, ...action.payload };
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;