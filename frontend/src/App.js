import React, { useEffect, useState, lazy, Suspense, startTransition } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from './context/ThemeContext';
import api from './services/api';
// Removed mock data import
import ErrorBoundary from './components/ErrorBoundary';

// Import preloaders to ensure Material-UI components are loaded early
import IconPreloader from './components/IconPreloader';

// Import LoadingScreen directly to avoid lazy loading the fallback component
import LoadingScreen from './components/LoadingScreen';

// Import non-lazy loaded components
import ExploreWrapper from './pages/ExploreWrapper';
import SettingsContainer from './pages/SettingsContainer';
import NotificationSettings from './pages/NotificationSettings';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ProfileWrapper = lazy(() => import('./pages/ProfileWrapper'));
// Fix lazy loading of Messages component
const Messages = lazy(() => {
  return import('./pages/Messages').then(module => {
    // Ensure the module has a default export
    if (module && module.default) {
      return { default: module.default };
    }
    throw new Error('Messages module does not have a default export');
  });
});
const Notifications = lazy(() => import('./pages/Notifications'));
const Create = lazy(() => import('./pages/Create'));
const Reels = lazy(() => import('./pages/Reels'));
const Live = lazy(() => import('./pages/Live'));
const Shop = lazy(() => import('./pages/Shop'));
// Settings is now imported directly via SettingsWrapper
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ImageOptimizationDemo = lazy(() => import('./pages/ImageOptimizationDemo'));
const MediaTest = lazy(() => import('./pages/MediaTest'));
const Home = lazy(() => import('./pages/Home'));

// Components
const Navbar = lazy(() => import('./components/Navbar'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const ConnectionStatus = lazy(() => import('./components/ConnectionStatus'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  // Removed mock data state and initialization

  useEffect(() => {
    // Check if the backend is running
    const checkBackendConnection = async () => {
      try {
        // Use startTransition to wrap the async operation
        startTransition(() => {
          api.get('/health')
            .then(response => {
              const dbStatus = response.data.database?.status || 'unknown';
              setBackendStatus(`Connected: ${response.data.message} (Database: ${dbStatus})`);
              setError(null);
              setIsReady(true);
            })
            .catch(err => {
              console.error('Error connecting to backend:', err);
              setBackendStatus('Disconnected - Backend Not Available');
              setError('Could not connect to the backend server. Please ensure the backend is running.');
              // Still set ready to true to allow the app to render
              setIsReady(true);
            });
        });
      } catch (err) {
        console.error('Error in startTransition:', err);
        setBackendStatus('Disconnected - Backend Not Available');
        setError('Could not connect to the backend server. Please ensure the backend is running.');
        setIsReady(true);
      }
    };

    checkBackendConnection();
  }, []);

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ mb: 2 }} />
        {backendStatus && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <p>{backendStatus}</p>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CssBaseline />
        <IconPreloader />

        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Suspense fallback={<LoadingScreen />}>
              <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                <ErrorBoundary>
                  <Sidebar />
                </ErrorBoundary>
                <Box sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  ml: { xs: 0, md: '240px' } // Match drawer width
                }}>
                  <ErrorBoundary>
                    <Navbar />
                  </ErrorBoundary>
                  <Box
                    component="main"
                    sx={{
                      flexGrow: 1,
                      p: { xs: 1, sm: 2, md: 3 },
                      overflow: 'auto'
                    }}
                  >
                  <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingScreen />}>
                      <Home />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/profile/:username" element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingScreen />}>
                      <ProfileWrapper />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/explore" element={
                  <ProtectedRoute>
                    <ExploreWrapper />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingScreen />}>
                      <Messages />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/messages/:conversationId" element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingScreen />}>
                      <Messages />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/create" element={
                  <ProtectedRoute>
                    <Create />
                  </ProtectedRoute>
                } />
                <Route path="/reels" element={
                  <ProtectedRoute>
                    <Reels />
                  </ProtectedRoute>
                } />
                <Route path="/reels/:id" element={
                  <ProtectedRoute>
                    <Reels />
                  </ProtectedRoute>
                } />
                <Route path="/live" element={
                  <ProtectedRoute>
                    <Live />
                  </ProtectedRoute>
                } />
                <Route path="/live/:id" element={
                  <ProtectedRoute>
                    <Live />
                  </ProtectedRoute>
                } />
                <Route path="/shop" element={
                  <ProtectedRoute>
                    <Shop />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsContainer />
                  </ProtectedRoute>
                } />
                <Route path="/settings/notifications" element={
                  <ProtectedRoute>
                    <NotificationSettings />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/connection-test" element={
                  <ConnectionStatus />
                } />
                <Route path="/image-optimization" element={
                  <ProtectedRoute>
                    <ImageOptimizationDemo />
                  </ProtectedRoute>
                } />
                <Route path="/media-test" element={
                  <MediaTest />
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
                  </Box>
                </Box>
              </Box>
              </Suspense>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
