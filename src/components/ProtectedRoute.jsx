import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { user } = useAuth();
  
  if (!user) {
    // Redirect unauthenticated users to login page
    return <Navigate to="/login" replace />;
  }

  // Allow them into the nested routes (dashboard)
  return <Outlet />;
};

export default ProtectedRoute;
