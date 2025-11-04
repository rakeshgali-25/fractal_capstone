import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage'; // placeholder

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

/* ProtectedRoute: simple placeholder to redirect if not authenticated */
function ProtectedRoute({ children }){
  const user = true; // we'll connect real auth later (AuthContext)
  return user ? children : <Navigate to="/login" />;
}
