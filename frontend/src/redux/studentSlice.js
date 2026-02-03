import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

/* ============================================================
   1. FETCH PUBLIC MOCKTEST LIST (with ?q=&category=)
============================================================ */
export const fetchPublicMockTests = createAsyncThunk(
  "students/fetchPublicMockTests",
  async (queryString = "", { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/public/mocktests${queryString}`);
      if (Array.isArray(res.data)) return res.data;
      return res.data.mocktests || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load mock tests");
    }
  }
);

export const startMockTestAttempt = createAsyncThunk(
  "students/startTest",
  async (mockTestId, { rejectWithValue }) => {
    try {
      // Calls the randomizer endpoint
      const res = await api.post("/api/student/start-test", { mockTestId });
      return res.data; // Returns { attemptId: "..." }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to start test");
    }
  }
);

export const fetchAttemptResult = createAsyncThunk(
  "students/fetchAttemptResult",
  async (attemptId, { rejectWithValue }) => {
    try {
      // We reuse the same endpoint, but the backend now intelligently returns full data if status is 'completed'
      const res = await api.get(`/api/student/attempt/${attemptId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load results");
    }
  }
);
export const fetchLeaderboard = createAsyncThunk(
  "students/fetchLeaderboard",
  async (mockTestId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/student/grandtest-leaderboard/${mockTestId}`);
      // We return an object with the ID so we can map it in the state
      return { mockTestId, leaderboard: data.leaderboard };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load leaderboard");
    }
  }
);

/* ============================================================
   2. FETCH PUBLIC TEST BY ID
============================================================ */
export const fetchPublicTestById = createAsyncThunk(
  "students/fetchPublicTestById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/public/mocktests/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load mock test");
    }
  }
);

/* ============================================================
   3. PUBLIC LEADERBOARD
============================================================ */
export const fetchGrandTestLeaderboard = createAsyncThunk(
  "students/fetchGrandTestLeaderboard",
  async (mockTestId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/student/grandtest-leaderboard/${mockTestId}`);
      return { mockTestId, leaderboard: data.leaderboard };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load leaderboard");
    }
  }
);

/* ============================================================
   4. PERFORMANCE HISTORY
============================================================ */
export const fetchPerformanceHistory = createAsyncThunk(
  "user/fetchPerformanceHistory",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ FIXED ROUTE: Matches studentRoute.js ('/my-attempts')
      const response = await api.get(`/api/student/my-attempts`); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchStudentProfile = createAsyncThunk(
  "students/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/student/profile");
      return res.data; // This data goes to state.studentProfile
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load profile");
    }
  }
);

/* ============================================================
   5. UPDATE STUDENT PROFILE (New)
============================================================ */
export const updateStudentProfile = createAsyncThunk(
  "students/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.put("/api/student/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update profile");
    }
  }
);

/* ============================================================
   INITIAL STATE
============================================================ */
const initialState = {

  studentProfile: null, // Stores name, email, phone, avatar
  profileLoading: false,
  publicMocktests: [],
  publicStatus: "idle",
  publicError: null,

  selectedMocktest: null,
  selectedStatus: "idle",
  selectedError: null,

  attemptsHistory: [], 
  attemptsHistoryStatus: "idle",
  attemptsHistoryError: null,
  testStartStatus: "idle",
    testStartError: null,
  leaderboards: {}, 
  leaderboardStatus: "idle",
  leaderboardError: null,

  // ✅ Profile Update State
  profileUpdateStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  profileUpdateError: null,
  profileSuccessMessage: null,

  reviewData: null,
  reviewStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  reviewError: null,

  filters: {
    q: "",
    category: "",
    limit: 0,
  },
};

/* ============================================================
   SLICE
============================================================ */
const studentSlice = createSlice({
  name: "students",
  initialState,

  reducers: {
    setPublicSearch(state, action) {
      state.filters.q = action.payload;
    },
    setPublicCategoryFilter(state, action) {
      state.filters.category = action.payload;
    },
    resetPublicFilters(state) {
      state.filters = { q: "", category: "", limit: 0 };
      state.publicMocktests = [];
    },
    // ✅ Clear profile status (call this after showing success toast/message)
    clearProfileStatus(state) {
        state.profileUpdateStatus = "idle";
        state.profileSuccessMessage = null;
        state.profileUpdateError = null;
    }
  },

  extraReducers: (builder) => {
    /* PUBLIC LIST */
    builder
      .addCase(fetchPublicMockTests.pending, (state) => {
        state.publicStatus = "loading";
        state.publicError = null;
      })
      .addCase(fetchPublicMockTests.fulfilled, (state, action) => {
        state.publicStatus = "succeeded";
        state.publicMocktests = action.payload;
      })
      .addCase(fetchPublicMockTests.rejected, (state, action) => {
        state.publicStatus = "failed";
        state.publicError = action.payload;
        state.publicMocktests = [];
      });

    /* SINGLE TEST */
    builder
      .addCase(fetchPublicTestById.pending, (state) => {
        state.selectedStatus = "loading";
        state.selectedMocktest = null;
      })
      .addCase(fetchPublicTestById.fulfilled, (state, action) => {
        state.selectedStatus = "succeeded";
        state.selectedMocktest = action.payload;
      })
      .addCase(fetchPublicTestById.rejected, (state, action) => {
        state.selectedStatus = "failed";
        state.selectedError = action.payload;
      });

    /* ATTEMPTS HISTORY */
    builder
      .addCase(fetchPerformanceHistory.pending, (state) => {
        state.attemptsHistoryStatus = "loading";
        state.attemptsHistoryError = null;
      })
      .addCase(fetchPerformanceHistory.fulfilled, (state, action) => {
        state.attemptsHistoryStatus = "succeeded";
        state.attemptsHistory = action.payload;
      })
      .addCase(fetchPerformanceHistory.rejected, (state, action) => {
        state.attemptsHistoryStatus = "failed";
        state.attemptsHistoryError = action.payload;
        state.attemptsHistory = [];
      });

    /* LEADERBOARD */
    builder.addCase(fetchGrandTestLeaderboard.fulfilled, (state, action) => {
      state.leaderboards[action.payload.mockTestId] = action.payload.leaderboard;
    });

    /* ✅ PROFILE UPDATE */
    builder
      .addCase(updateStudentProfile.pending, (state) => {
        state.profileUpdateStatus = "loading";
        state.profileUpdateError = null;
        state.profileSuccessMessage = null;
      })
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        state.profileUpdateStatus = "succeeded";
        state.profileSuccessMessage = action.payload.message;
        // Update the local data immediately
        if (action.payload.user) {
            state.studentProfile = action.payload.user;
        }
      })
      .addCase(updateStudentProfile.rejected, (state, action) => {
        state.profileUpdateStatus = "failed";
        state.profileUpdateError = action.payload;
      });
      /* ✅ FETCH PROFILE REDUCERS */
    builder
      .addCase(fetchStudentProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.studentProfile = action.payload; // DATA IS SAVED HERE
      })
      .addCase(fetchStudentProfile.rejected, (state) => {
        state.profileLoading = false;
      });

      builder
      .addCase(startMockTestAttempt.pending, (state) => {
        state.testStartStatus = "loading";
      })
      .addCase(startMockTestAttempt.fulfilled, (state) => {
        state.testStartStatus = "succeeded";
      })
      .addCase(startMockTestAttempt.rejected, (state, action) => {
        state.testStartStatus = "failed";
        state.testStartError = action.payload;
      });

      builder
      .addCase(fetchAttemptResult.pending, (state) => {
        state.reviewStatus = "loading";
        state.reviewError = null;
      })
      .addCase(fetchAttemptResult.fulfilled, (state, action) => {
        state.reviewStatus = "succeeded";
        state.reviewData = action.payload;
      })
      .addCase(fetchAttemptResult.rejected, (state, action) => {
        state.reviewStatus = "failed";
        state.reviewError = action.payload;
      });

      builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.leaderboardStatus = "loading";
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboardStatus = "succeeded";
        // Store the leaderboard data under the specific Mock Test ID
        // This prevents different leaderboards from overwriting each other
        state.leaderboards[action.payload.mockTestId] = action.payload.leaderboard;
      })
      .addCase(fetchLeaderboard.rejected, (state) => {
        state.leaderboardStatus = "failed";
      });


  },
});

export const { 
  setPublicCategoryFilter, 
  setPublicSearch, 
  resetPublicFilters, 
  clearProfileStatus 
} = studentSlice.actions;

export default studentSlice.reducer;