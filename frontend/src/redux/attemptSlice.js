import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchMyAttempts = createAsyncThunk(
  "attempts/fetchMyAttempts",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("/api/student/my-attempts");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to load attempts"
      );
    }
  }
);

const attemptSlice = createSlice({
  name: "attempts",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAttempts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyAttempts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchMyAttempts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default attemptSlice.reducer;
