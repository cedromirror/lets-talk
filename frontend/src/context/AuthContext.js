import React, { createContext, useState, useContext, useEffect, startTransition } from 'react';
import { authService } from '../services/api';
import socketService from '../services/socketService';
import { handleApiError } from '../utils/errorUtils';

// Create the context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenRefreshTimer, setTokenRefreshTimer] = useState(null);

  // Function to validate token
  const validateToken = (token) => {
    if (!token) {
      console.warn('No token provided for validation');
      return false;
    }

    try {
      // Handle Bearer prefix if present
      const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

      // Simple validation - in a real app, you'd use a JWT library
      const tokenParts = tokenValue.split('.');
      if (tokenParts.length !== 3) {
        console.warn('Invalid token format (not a valid JWT)');
        return false;
      }

      // Check if token is expired
      let payload;
      try {
        payload = JSON.parse(atob(tokenParts[1]));
      } catch (decodeError) {
        console.error('Error decoding token payload:', decodeError);
        return false;
      }

      if (!payload.exp) {
        console.log('Token has no expiration time, assuming valid');
        return true; // No expiration, assume valid
      }

      const isValid = payload.exp * 1000 > Date.now();
      if (!isValid) {
        console.warn('Token is expired');
      } else {
        const expiresIn = Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60);
        console.log(`Token is valid and expires in ${expiresIn} minutes`);
      }

      return isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Function to refresh token
  const refreshToken = async () => {
    try {
      // Get current token
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.error('No token available for refresh');
        return null;
      }

      console.log('Refreshing token from AuthContext');
      // Make sure token doesn't already have Bearer prefix
      const tokenValue = currentToken.startsWith('Bearer ') ? currentToken.split(' ')[1] : currentToken;
      const response = await authService.refreshToken(tokenValue);

      if (response && response.data && response.data.token) {
        const { token } = response.data;
        localStorage.setItem('token', token);
        console.log('Token refreshed successfully in AuthContext');

        // Reinitialize socket with new token
        try {
          console.log('Reinitializing socket with refreshed token');
          socketService.initializeSocket(token);
        } catch (socketError) {
          console.warn('Could not reinitialize socket with refreshed token:', socketError.message);
        }

        return token;
      }

      console.warn('No token in refresh response');
      return null;
    } catch (error) {
      console.error('Token refresh error in AuthContext:', error);
      return null;
    }
  };

  // Setup token refresh timer
  const setupTokenRefresh = (token) => {
    // Clear any existing timer
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }

    try {
      // Handle Bearer prefix if present
      const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

      // Decode token to get expiration time
      const tokenParts = tokenValue.split('.');
      if (tokenParts.length !== 3) {
        console.warn('Invalid token format for refresh setup');
        return;
      }

      let payload;
      try {
        payload = JSON.parse(atob(tokenParts[1]));
      } catch (decodeError) {
        console.error('Error decoding token payload:', decodeError);
        return;
      }

      if (!payload.exp) {
        console.log('Token has no expiration time, skipping refresh setup');
        return; // No expiration, no need to refresh
      }

      const expiresIn = payload.exp * 1000 - Date.now();
      console.log(`Token expires in ${Math.floor(expiresIn / 1000 / 60)} minutes`);

      // Refresh 5 minutes before expiration or halfway through the token's lifetime, whichever is shorter
      const tokenLifetime = payload.exp * 1000 - (payload.iat ? payload.iat * 1000 : Date.now());
      const halfLifetime = tokenLifetime / 2;
      const fiveMinutes = 5 * 60 * 1000;
      const refreshTime = expiresIn - Math.min(fiveMinutes, halfLifetime);

      if (refreshTime <= 0) {
        // Token is about to expire, refresh now
        console.log('Token is about to expire, refreshing now');
        refreshToken();
        return;
      }

      console.log(`Setting up token refresh in ${Math.floor(refreshTime / 1000 / 60)} minutes`);

      // Set timer to refresh token
      const timerId = setTimeout(async () => {
        console.log('Token refresh timer triggered');
        const newToken = await refreshToken();
        if (newToken) {
          console.log('Token refreshed successfully, setting up next refresh');
          setupTokenRefresh(newToken);
        } else {
          // If refresh fails, log out
          console.warn('Token refresh failed, logging out');
          logout();
        }
      }, refreshTime);

      setTokenRefreshTimer(timerId);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token && validateToken(token)) {
          const user = JSON.parse(storedUser);

          // Set isAuthenticated first, then currentUser to ensure proper state update
          setIsAuthenticated(true);
          startTransition(() => {
            setCurrentUser(user);
          });

          console.log('Authentication state initialized from localStorage: isAuthenticated =', true);

          // Initialize socket connection with token
          try {
            console.log('Attempting to initialize socket in AuthContext');
            const connected = socketService.connect();
            if (!connected) {
              console.warn('Failed to initialize socket in AuthContext, but continuing with authentication');
              // Continue with authentication even if socket fails
            } else {
              console.log('Socket connection successful in AuthContext');
            }
          } catch (socketError) {
            console.error('Error initializing socket in AuthContext:', socketError);
            // Continue with authentication even if socket fails
            console.log('Continuing with authentication despite socket error');
          }

          // Setup token refresh
          setupTokenRefresh(token);

          // Verify with backend that session is still valid
          try {
            await authService.getCurrentUser();
          } catch (error) {
            // If verification fails, log the error but don't log out in development mode
            console.error('Session verification failed:', error);

            // Log out if verification fails
            logout();
            return;
          }
        } else if (token && !validateToken(token)) {
          // Token is invalid or expired, try to refresh
          const newToken = await refreshToken();
          if (newToken && storedUser) {
            const user = JSON.parse(storedUser);

            // Set isAuthenticated first, then currentUser to ensure proper state update
            setIsAuthenticated(true);
            startTransition(() => {
              setCurrentUser(user);
            });

            console.log('Authentication state initialized after token refresh: isAuthenticated =', true);

            // Initialize socket connection with new token
            try {
              const connected = socketService.connect();
              if (!connected) {
                console.warn('Failed to initialize socket with new token in AuthContext');
              }
            } catch (socketError) {
              console.error('Error initializing socket with new token in AuthContext:', socketError);
            }

            // Setup token refresh
            setupTokenRefresh(newToken);
          } else {
            // Clear invalid data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          // No valid token or user, redirect to login
          console.log('No valid token or user found, user needs to log in');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);

        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup token refresh timer on unmount
    return () => {
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
      }
    };
  }, []);

  // Login function with enhanced security and error handling
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Throttle login attempts (simple implementation)
      const lastAttempt = localStorage.getItem('lastLoginAttempt');
      const now = Date.now();
      if (lastAttempt && now - parseInt(lastAttempt) < 2000) { // 2 seconds between attempts
        throw new Error('Please wait before trying again');
      }
      localStorage.setItem('lastLoginAttempt', now.toString());

      console.log('Attempting login with email:', email);
      console.log('Login credentials:', { email, password: '********' });

      // Validate inputs before sending to server
      if (!email || !email.trim()) {
        throw new Error('Email or username is required');
      }

      if (!password || !password.trim()) {
        throw new Error('Password is required');
      }

      // Make the login request
      let response;
      try {
        response = await authService.login({ email: email.trim(), password });
      } catch (loginError) {
        console.error('Login API error:', loginError);
        console.error('Login error response:', loginError.response?.data);

        // Provide more specific error messages based on the error
        if (loginError.response?.status === 401) {
          throw new Error('Invalid email/username or password');
        } else if (loginError.response?.status === 400) {
          throw new Error(loginError.response.data.message || 'Missing required fields');
        } else if (loginError.isNetworkError || !loginError.response) {
          // Provide a more specific message for network errors
          if (loginError.message.includes('backend server is running')) {
            throw loginError; // Use the specific message about backend server
          }
          throw new Error('Network error. Please check if the backend server is running on port 60000.');
        }

        throw loginError;
      }

      if (!response.data) {
        console.error('Invalid response format: missing data');
        throw new Error('Invalid response format: missing data');
      }

      const { user, token } = response.data;

      if (!user || !token) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format: missing user or token');
      }

      console.log('Login successful, user:', user);

      // Save to localStorage securely
      try {
        localStorage.setItem('user', JSON.stringify(user));

        // Make sure token doesn't already have Bearer prefix
        const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        localStorage.setItem('token', tokenValue);

        console.log('User data saved to localStorage');
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
        // Continue even if storage fails - session will work until page refresh
      }

      // Update state with startTransition to avoid suspense errors
      // Set isAuthenticated first, then currentUser to ensure proper state update
      setIsAuthenticated(true);
      startTransition(() => {
        setCurrentUser(user);
      });

      // Log authentication state for debugging
      console.log('Authentication state updated: isAuthenticated =', true);

      // Initialize socket connection with token
      console.log('Initializing socket connection after login');
      try {
        const connected = socketService.connect();
        if (!connected) {
          console.warn('Failed to initialize socket after login, but continuing with login process');
          // Continue with login process even if socket initialization fails
        } else {
          console.log('Socket connection successful after login');
        }
      } catch (socketError) {
        console.error('Error initializing socket after login:', socketError);
        // Continue with login process even if socket initialization fails
        console.log('Continuing with login process despite socket error');
      }

      // Setup token refresh
      setupTokenRefresh(token);

      // Clear failed attempts counter on successful login
      localStorage.removeItem('failedLoginAttempts');

      return user;
    } catch (error) {
      // Track failed attempts
      const failedAttempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0') + 1;
      localStorage.setItem('failedLoginAttempts', failedAttempts.toString());

      // Add exponential backoff for multiple failed attempts
      if (failedAttempts > 3) {
        const backoffTime = Math.min(Math.pow(2, failedAttempts - 3) * 1000, 30000); // Max 30 seconds
        localStorage.setItem('loginBackoffUntil', (Date.now() + backoffTime).toString());
      }

      // Use our error utility to handle the error
      const userFriendlyMessage = handleApiError(error, 'AuthContext.login');

      // Set the error message
      setError(userFriendlyMessage);

      // Add specific guidance for authentication errors
      if (error.response?.status === 401) {
        setError('Login failed. Please check your credentials and try again.');
      }

      // Add context information to the error
      error.authContext = 'login';
      error.timestamp = new Date().toISOString();

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function with enhanced validation and security
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      const requiredFields = ['username', 'email', 'password', 'fullName'];

      // Check if userData is FormData
      const isFormData = userData instanceof FormData;

      for (const field of requiredFields) {
        let fieldValue = isFormData ? userData.get(field) : userData[field];
        console.log(`Validating ${field}: ${fieldValue}`);

        if (!fieldValue) {
          throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
      }

      // Validate password strength
      const password = isFormData ? userData.get('password') : userData.password;
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Validate email format
      const email = isFormData ? userData.get('email') : userData.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Create a standardized registration object
      let registrationData;

      if (isFormData) {
        // If it's FormData, convert to a plain object for consistent handling
        registrationData = {
          username: userData.get('username'),
          email: userData.get('email'),
          password: userData.get('password'),
          fullName: userData.get('fullName'),
          bio: userData.get('bio') || ''
        };

        // Handle profile picture separately if it exists
        const profilePicture = userData.get('profilePicture');
        if (profilePicture && profilePicture.size > 0) {
          // Create a new FormData object with just the standardized fields
          const formDataObj = new FormData();
          formDataObj.append('username', registrationData.username);
          formDataObj.append('email', registrationData.email);
          formDataObj.append('password', registrationData.password);
          formDataObj.append('fullName', registrationData.fullName);
          formDataObj.append('bio', registrationData.bio);
          formDataObj.append('profilePicture', profilePicture);

          console.log('Registering with FormData (contains file)');
          const response = await authService.register(formDataObj);
          const { user, token } = response.data;
          return { user, token };
        }
      } else {
        registrationData = {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName,
          bio: userData.bio || ''
        };
      }

      // Log the final registration data (without password)
      console.log('Registering with data:', {
        ...registrationData,
        password: '********'
      });

      const response = await authService.register(registrationData);
      const { user, token } = response.data;

      if (!user || !token) {
        throw new Error('Invalid response from server');
      }

      // Save to localStorage securely
      try {
        localStorage.setItem('user', JSON.stringify(user));

        // Make sure token doesn't already have Bearer prefix
        const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        localStorage.setItem('token', tokenValue);

        console.log('User data saved to localStorage after registration');
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
        // Continue even if storage fails
      }

      // Update state with startTransition to avoid suspense errors
      // Set isAuthenticated first, then currentUser to ensure proper state update
      setIsAuthenticated(true);
      startTransition(() => {
        setCurrentUser(user);
      });

      // Set flags to ensure sidebar is visible after registration
      localStorage.setItem('loginSuccess', 'true');
      sessionStorage.setItem('freshLogin', 'true');
      console.log('AuthContext: Set flags for successful registration and fresh login');

      // Log authentication state for debugging
      console.log('Authentication state updated after registration: isAuthenticated =', true);

      // Initialize socket connection with token
      console.log('Initializing socket connection after registration');
      try {
        const connected = socketService.connect();
        if (!connected) {
          console.warn('Failed to initialize socket after registration, but continuing with registration process');
          // Continue with registration process even if socket initialization fails
        } else {
          console.log('Socket connection successful after registration');
        }
      } catch (socketError) {
        console.error('Error initializing socket after registration:', socketError);
        // Continue with registration process even if socket initialization fails
        console.log('Continuing with registration process despite socket error');
      }

      // Setup token refresh
      setupTokenRefresh(token);

      return user;
    } catch (error) {
      console.error('Registration error:', error);

      // Provide more specific error messages
      if (error.response?.status === 409) {
        setError('This username or email is already taken. Please try another.');
      } else {
        setError(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function with enhanced cleanup
  const logout = async () => {
    setLoading(true);

    try {
      // Call logout API
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with client-side logout even if server logout fails
    } finally {
      // Clear any token refresh timer
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
        setTokenRefreshTimer(null);
      }

      // Disconnect socket
      socketService.disconnectSocket();

      // Clear localStorage and session data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('lastLoginAttempt');
      localStorage.removeItem('failedLoginAttempts');
      localStorage.removeItem('loginBackoffUntil');

      // Update state with startTransition to avoid suspense errors
      startTransition(() => {
        setCurrentUser(null);
        setIsAuthenticated(false);
      });

      setLoading(false);
    }
  };

  // Update user profile with enhanced validation and security
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const isFormData = userData instanceof FormData;

      // Validate data
      if (!isFormData && !userData.fullName) {
        throw new Error('Full name is required');
      }

      // Use authService.updateProfile which already has retry and fallback mechanisms
      const response = await authService.updateProfile(userData);
      const updatedUser = response.data.user;

      // Update local user state
      setCurrentUser(prev => ({
        ...prev,
        ...updatedUser
      }));

      // Update localStorage with the updated user
      try {
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...updatedUser
        }));
        console.log('Updated user data saved to localStorage');
      } catch (storageError) {
        console.error('Error saving updated user to localStorage:', storageError);
      }

      // If profile picture was updated, trigger a UI refresh
      if (isFormData && (userData.has('avatar') || userData.has('profilePicture'))) {
        console.log('Profile picture updated, triggering UI refresh');
        // Add a timestamp to force components to re-render with the new image
        const timestamp = Date.now();
        updatedUser.avatarTimestamp = timestamp;
      }

      return updatedUser;
    } catch (error) {
      // Create user-friendly error message
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    if (error.response?.status === 409) return 'Username or email already taken';
    if (error.response?.status === 413) return 'File size too large';
    if (error.response?.status === 400) return error.response.data?.message || 'Invalid data';
    return 'Failed to update profile';
  };

  // Function to update current user data
  const updateCurrentUser = (updaterFn) => {
    if (typeof updaterFn === 'function') {
      const updatedUser = updaterFn(currentUser);
      setCurrentUser(updatedUser);

      // Update localStorage
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error updating user in localStorage:', error);
      }

      return updatedUser;
    } else {
      // If updaterFn is not a function, assume it's the new user object
      setCurrentUser(updaterFn);

      // Update localStorage
      try {
        localStorage.setItem('user', JSON.stringify(updaterFn));
      } catch (error) {
        console.error('Error updating user in localStorage:', error);
      }

      return updaterFn;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    updateCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

