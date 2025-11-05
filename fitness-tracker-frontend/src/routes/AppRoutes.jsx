import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardPage from "../features/dashboard/DashboardPage";
import GoalsPage from "../features/goals/GoalsPage";
import ActivityPage from "../features/activity/ActivityPage";
import ProfilePage from "../features/profile/ProfilePage";
import ProtectedRoute from "./ProtectedRoute"; // optional wrapper for auth
import ProgressPage from "../features/progress/ProgressPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected layout with nested routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/progress" element ={<ProgressPage/>}/>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
