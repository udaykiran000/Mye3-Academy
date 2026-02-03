import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";
import toast from "react-hot-toast";

/* ✅ FETCH STUDENTS */
export const fetchStudents = createAsyncThunk(
  "adminStudents/fetchStudents",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/admin/users/students");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* ✅ UPDATE STUDENT */
export const updateStudent = createAsyncThunk(
  "adminStudents/updateStudent",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/api/admin/users/students/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

    
      return data.student;
    } catch (err) {
      toast.error(err.response?.data?.message);
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* ✅ BLOCK / UNBLOCK */
export const blockStudent = createAsyncThunk(
  "adminStudents/blockStudent",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/api/admin/users/students/${id}/toggle-status`
      );

      toast.success(data.message);
      return data.student;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/* ✅ DELETE STUDENT */
export const deleteStudent = createAsyncThunk(
  "adminStudents/deleteStudent",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/admin/users/students/${id}`);
      toast.success("Student deleted.");
      return id;
    } catch (err) {
      toast.error(err.response?.data?.message);
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const adminStudentSlice = createSlice({
  name: "adminStudents",
  initialState: {
    students: [],
    status: "idle",
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.students = action.payload;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.students.findIndex((s) => s._id === updated._id);
        if (index !== -1) state.students[index] = updated;
      })
      .addCase(blockStudent.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.students.findIndex((s) => s._id === updated._id);
        if (index !== -1) state.students[index] = updated;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter(
          (s) => s._id !== action.payload
        );
      });
  },
});

export default adminStudentSlice.reducer;
