import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// Fetch public categories
export const fetchCategories = createAsyncThunk(
  "category/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/public/categories");
      return res.data.categories; // assuming your backend returns { categories: [...] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch categories");
    }
  }
);

// Add Category
export const addCategory = createAsyncThunk(
  "category/add",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/admin/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.category;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add category");
    }
  }
);

// Update Category
export const updateCategory = createAsyncThunk(
  "category/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/admin/categories/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.category;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update category");
    }
  }
);

// Delete Category
export const deleteCategory = createAsyncThunk(
  "category/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/admin/categories/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete category");
    }
  }
);

const categorySlice = createSlice({
  name: "category",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add
      .addCase(addCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure state.items is a new array reference
        state.items = [action.payload, ...state.items];
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload);
      });
  },
});

export default categorySlice.reducer;

