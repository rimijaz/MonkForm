import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return false;
    }
    
    try {
      // Basic token validation
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (tokenData.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch (error) {
      // If token is invalid, clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  };

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
