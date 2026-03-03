
import  {configureStore} from '@reduxjs/toolkit'
import userSlice from './userSlice.js'
import mockTestSlice from './mockTestSlice.js'
import categoryReducer from './categorySlice';
import dashboardReducer from "./dashboardSlice.js";
import instructorReducer from "./instructorSlice";
import instructorDashboardReducer from "./instructorDashboardSlice";

// --- 👇 ADD THIS IMPORT ---
import studentReducer from "./studentSlice";
import paymentReducer from "./paymentSlice";
import adminStudentReducer from "./adminStudentSlice";
import attemptsReducer from "./attemptSlice";
import adminReducer from "./adminSlice";
import doubtsReducer from "./doubtSlice";
import institutionReducer from "./institutionSlice";
import institutionDashboardReducer from "./institutionDashboardSlice";


export const store=configureStore({
    reducer:{
        user:userSlice,
        mocktest: mockTestSlice,
        category: categoryReducer,
        dashboard: dashboardReducer,
        instructors: instructorReducer,
        students: studentReducer,
        payment: paymentReducer,
        adminStudents: adminStudentReducer, 
        attempts: attemptsReducer,
        admin: adminReducer,
        instructorDashboard: instructorDashboardReducer,

         doubts: doubtsReducer,
         institutions: institutionReducer,
         institutionDashboard: institutionDashboardReducer,
         
    }
})
