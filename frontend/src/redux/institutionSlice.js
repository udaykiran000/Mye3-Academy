import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";
import toast from "react-hot-toast";

// ⬇ Fetch all institutions
export const fetchInstitutions = createAsyncThunk(
  "institutions/fetchInstitutions",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/admin/users/institutions");
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ⬇ Add new institution
export const addInstitution = createAsyncThunk(
  "institutions/addInstitution",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/api/admin/users/add/institutions",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.institution;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ⬇ Toggle institution status
export const toggleInstitutionStatus = createAsyncThunk(
  "institutions/toggleInstitutionStatus",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/api/admin/users/institutions/${id}/toggle-status`
      );
      toast.success(data.message);
      return data.institution;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ⬇ Update institution
export const updateInstitution = createAsyncThunk(
  "institutions/updateInstitution",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/api/admin/users/institutions/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.institution;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ⬇ Delete institution
export const deleteInstitution = createAsyncThunk(
  "institutions/deleteInstitution",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/admin/users/institutions/${id}`);
      toast.success("Institution deleted successfully!");
      return id;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  institutions: [],
  status: "idle",
  error: null,
};

const institutionSlice = createSlice({
  name: "institutions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstitutions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchInstitutions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.institutions = action.payload;
      })
      .addCase(fetchInstitutions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addInstitution.fulfilled, (state, action) => {
        state.institutions.unshift(action.payload);
      })
      .addCase(toggleInstitutionStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.institutions.findIndex((i) => i._id === updated._id);
        if (index !== -1) {
          state.institutions[index] = updated;
        }
      })
      .addCase(updateInstitution.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.institutions.findIndex((i) => i._id === updated._id);
        if (index !== -1) {
          state.institutions[index] = updated;
        }
      })
      .addCase(deleteInstitution.fulfilled, (state, action) => {
        state.institutions = state.institutions.filter((i) => i._id !== action.payload);
      });
  },
});

export default institutionSlice.reducer;
