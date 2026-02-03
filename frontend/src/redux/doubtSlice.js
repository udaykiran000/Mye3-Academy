// frontend/src/redux/doubtSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";
import toast from "react-hot-toast";

/* ============================================================
   1️⃣ STUDENT: CREATE DOUBT
   - Used from ReviewSolutions (mocktest doubt)
   - Used from general "Ask Doubt" page
============================================================ */
export const createStudentDoubt = createAsyncThunk(
  "doubts/createStudentDoubt",
  async (payload, { rejectWithValue }) => {
    try {
      // payload: { text, subject, type?, mocktestId?, attemptId?, questionId? }
      const { data } = await api.post("/api/student/doubts", payload);
      toast.success("Doubt submitted successfully");
      return data.doubt;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to submit doubt";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/* ============================================================
   2️⃣ STUDENT: FETCH MY DOUBTS
============================================================ */
export const fetchStudentDoubts = createAsyncThunk(
  "doubts/fetchStudentDoubts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/student/doubts");
      return data.doubts || [];
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load doubts";
      return rejectWithValue(message);
    }
  }
);

/* ============================================================
   3️⃣ ADMIN: FETCH ALL DOUBTS (optional filters)
   - query: { status?, subject? }
============================================================ */
export const fetchAdminDoubts = createAsyncThunk(
  "doubts/fetchAdminDoubts",
  async (query = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (query.status) params.append("status", query.status);
      if (query.subject) params.append("subject", query.subject);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const { data } = await api.get(`/api/admin/doubts${qs}`);
      return data.doubts || [];
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load doubts";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/* ============================================================
   4️⃣ ADMIN: ASSIGN INSTRUCTOR / UPDATE STATUS
   - payload: { id, instructorId?, status? }
============================================================ */
export const assignDoubtToInstructor = createAsyncThunk(
  "doubts/assignDoubtToInstructor",
  async ({ id, instructorId, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/admin/doubts/${id}/assign`, {
        instructorId,
        status,
      });
      toast.success("Doubt updated");
      return data.doubt;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update doubt";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/* ============================================================
   5️⃣ INSTRUCTOR: FETCH ASSIGNED DOUBTS
============================================================ */
export const fetchInstructorDoubts = createAsyncThunk(
  "doubts/fetchInstructorDoubts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/instructor/doubts");
      return data.doubts || [];
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load doubts";
      return rejectWithValue(message);
    }
  }
);

/* ============================================================
   6️⃣ INSTRUCTOR: ANSWER DOUBT
   - payload: { id, answer }
============================================================ */
export const answerInstructorDoubt = createAsyncThunk(
  "doubts/answerInstructorDoubt",
  async ({ id, answer }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/instructor/doubts/${id}/answer`, {
        answer,
      });
      toast.success("Answer submitted");
      return data.doubt;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to submit answer";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/* ============================================================
   INITIAL STATE
============================================================ */
const initialState = {
  // STUDENT
  myDoubts: [],
  myStatus: "idle",
  myError: null,

  // ADMIN
  adminDoubts: [],
  adminStatus: "idle",
  adminError: null,

  // INSTRUCTOR
  instructorDoubts: [],
  instructorStatus: "idle",
  instructorError: null,

  // Generic action state (assign / answer / create)
  actionStatus: "idle",
  actionError: null,
};

/* ============================================================
   SLICE
============================================================ */
const doubtSlice = createSlice({
  name: "doubts",
  initialState,
  reducers: {
    clearDoubtErrors(state) {
      state.myError = null;
      state.adminError = null;
      state.instructorError = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // STUDENT: create
    builder
      .addCase(createStudentDoubt.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(createStudentDoubt.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        // Prepend new doubt into student's list
        state.myDoubts.unshift(action.payload);
      })
      .addCase(createStudentDoubt.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // STUDENT: fetch my doubts
    builder
      .addCase(fetchStudentDoubts.pending, (state) => {
        state.myStatus = "loading";
        state.myError = null;
      })
      .addCase(fetchStudentDoubts.fulfilled, (state, action) => {
        state.myStatus = "succeeded";
        state.myDoubts = action.payload;
      })
      .addCase(fetchStudentDoubts.rejected, (state, action) => {
        state.myStatus = "failed";
        state.myError = action.payload;
      });

    // ADMIN: fetch all doubts
    builder
      .addCase(fetchAdminDoubts.pending, (state) => {
        state.adminStatus = "loading";
        state.adminError = null;
      })
      .addCase(fetchAdminDoubts.fulfilled, (state, action) => {
        state.adminStatus = "succeeded";
        state.adminDoubts = action.payload;
      })
      .addCase(fetchAdminDoubts.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.adminError = action.payload;
      });

    // ADMIN: assign / update doubt
    builder
      .addCase(assignDoubtToInstructor.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(assignDoubtToInstructor.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const updated = action.payload;

        // Update inside admin list
        const idx = state.adminDoubts.findIndex((d) => d._id === updated._id);
        if (idx !== -1) state.adminDoubts[idx] = updated;

        // If this is also in student's list, sync it there too
        const sIdx = state.myDoubts.findIndex((d) => d._id === updated._id);
        if (sIdx !== -1) state.myDoubts[sIdx] = updated;
      })
      .addCase(assignDoubtToInstructor.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // INSTRUCTOR: fetch assigned doubts
    builder
      .addCase(fetchInstructorDoubts.pending, (state) => {
        state.instructorStatus = "loading";
        state.instructorError = null;
      })
      .addCase(fetchInstructorDoubts.fulfilled, (state, action) => {
        state.instructorStatus = "succeeded";
        state.instructorDoubts = action.payload;
      })
      .addCase(fetchInstructorDoubts.rejected, (state, action) => {
        state.instructorStatus = "failed";
        state.instructorError = action.payload;
      });

    // INSTRUCTOR: answer doubt
    builder
      .addCase(answerInstructorDoubt.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(answerInstructorDoubt.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const updated = action.payload;

        // Update in instructor list
        const idx = state.instructorDoubts.findIndex(
          (d) => d._id === updated._id
        );
        if (idx !== -1) state.instructorDoubts[idx] = updated;

        // Also update in admin list if loaded
        const aIdx = state.adminDoubts.findIndex((d) => d._id === updated._id);
        if (aIdx !== -1) state.adminDoubts[aIdx] = updated;

        // And in student's list if loaded
        const sIdx = state.myDoubts.findIndex((d) => d._id === updated._id);
        if (sIdx !== -1) state.myDoubts[sIdx] = updated;
      })
      .addCase(answerInstructorDoubt.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });
  },
});

export const { clearDoubtErrors } = doubtSlice.actions;
export default doubtSlice.reducer;
