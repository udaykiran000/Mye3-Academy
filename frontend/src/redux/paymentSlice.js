// frontend/src/redux/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// Async thunk to fetch payments
export const fetchPayments = createAsyncThunk(
  "payment/fetchPayments",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/admin/payments"); 
      return data;
    } catch (error) {
      // Extract error message reliably
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    payments: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Synchronous actions can be defined here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
        state.error = null;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default paymentSlice.reducer;