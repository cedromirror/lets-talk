import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';
import ErrorBoundary from './ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const [checkingLoginSuccess, setCheckingLoginSuccess] = useState(true);
  const [hasLoginSuccess, setHasLoginSuccess] = useState(false);
  const [isFreshLogin, setIsFreshLogin] = useState(false);
  const location = useLocation();

  // Check for login success flag in localStorage and fresh login in sessionStorage
  useEffect(() => {
    const loginSuccess = localStorage.getItem('loginSuccess');
    const freshLogin = sessionStorage.getItem('freshLogin');

    if (loginSuccess === 'true') {
      setHasLoginSuccess(true);
      console.log('ProtectedRoute: Login success flag detected');
      // Don't clear the flag immediately to ensure other components can use it
      setTimeout(() => {
        localStorage.removeItem('loginSuccess');
      }, 1000);
    }

    if (freshLogin === 'true') {
      setIsFreshLogin(true);
      // Don't clear the flag here - let the Sidebar component handle it
      // This ensures the sidebar can detect the fresh login state

      // Log that we detected a fresh login
      console.log('ProtectedRoute: Detected fresh login, ensuring sidebar is visible');
    }

    setCheckingLoginSuccess(false);
  }, []);

  // Show loading screen while authentication is being checked
  if (loading || checkingLoginSuccess) {
    return <LoadingScreen message={isFreshLogin ? "Preparing your dashboard..." : "Loading..."} />;
  }

  // If we have a login success flag or the user is authenticated, render the children
  if (hasLoginSuccess || isAuthenticated) {
    console.log('ProtectedRoute: User is authenticated or has login success flag');

    // If this is the home route and a fresh login, we want to ensure the sidebar is visible
    if (location.pathname === '/' && isFreshLogin) {
      console.log('ProtectedRoute: Fresh login to home page, ensuring sidebar is visible');

      // Keep the fresh login flag longer to ensure sidebar visibility
      if (isFreshLogin) {
        // Refresh the fresh login flag to ensure it stays active longer
        sessionStorage.setItem('freshLogin', 'true');

        // Also ensure the login success flag is set
        localStorage.setItem('loginSuccess', 'true');
      }
    }

    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  // Otherwise, redirect to login
  console.log('ProtectedRoute: User is not authenticated, redirecting to login');
  return <Navigate to="/login" />;
};

export default ProtectedRoute;
