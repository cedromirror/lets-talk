import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { testBackendConnection, testSocketConnection } from '../utils/connectionTest';
import socketService from '../services/socketService';

const ConnectionStatus = () => {
  const [apiStatus, setApiStatus] = useState({ loading: true });
  const [socketStatus, setSocketStatus] = useState({ loading: true });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const checkConnections = async () => {
    setApiStatus({ loading: true });
    setSocketStatus({ loading: true });

    try {
      // Test API connection
      const apiResult = await testBackendConnection();
      setApiStatus({
        loading: false,
        success: apiResult.success,
        message: apiResult.message,
        details: apiResult.data
      });

      // Test socket connection
      const socketResult = await testSocketConnection(socketService);
      setSocketStatus({
        loading: false,
        success: socketResult.success,
        message: socketResult.message,
        socketId: socketResult.socketId
      });

      // Show success or error message
      if (apiResult.success && socketResult.success) {
        setSnackbar({
          open: true,
          message: 'Successfully connected to backend services',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Connection issues detected. Check details below.',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error checking connections:', error);
      setSnackbar({
        open: true,
        message: 'Error checking connections: ' + error.message,
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    checkConnections();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Connection Status
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          API Connection
        </Typography>

        {apiStatus.loading ? (
          <Box display="flex" alignItems="center">
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Checking API connection...</Typography>
          </Box>
        ) : (
          <Box>
            <Chip
              icon={apiStatus.success ? <CheckCircleIcon /> : <ErrorIcon />}
              label={apiStatus.success ? 'Connected' : 'Disconnected'}
              color={apiStatus.success ? 'success' : 'error'}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2">{apiStatus.message}</Typography>
            {apiStatus.details && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(apiStatus.details, null, 2)}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Socket Connection
        </Typography>

        {socketStatus.loading ? (
          <Box display="flex" alignItems="center">
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Checking socket connection...</Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip
                icon={socketStatus.success ? <CheckCircleIcon /> : <ErrorIcon />}
                label={socketStatus.success ? 'Connected' : 'Disconnected'}
                color={socketStatus.success ? 'success' : 'error'}
              />
              {socketStatus.publicStatus && (
                <Chip
                  size="small"
                  label={`Public: ${socketStatus.publicStatus}`}
                  color={socketStatus.publicStatus === 'Connected' ? 'success' : 'warning'}
                />
              )}
              {socketStatus.authStatus && (
                <Chip
                  size="small"
                  label={`Auth: ${socketStatus.authStatus}`}
                  color={socketStatus.authStatus === 'Connected' ? 'success' :
                         socketStatus.authStatus === 'Auth Required' ? 'info' : 'warning'}
                />
              )}
            </Box>
            <Typography variant="body2">{socketStatus.message}</Typography>
            {socketStatus.socketId && (
              <Typography variant="caption" display="block">
                Socket ID: {socketStatus.socketId}
              </Typography>
            )}
            {socketStatus.error && (
              <Typography variant="caption" display="block" color="error">
                Error: {socketStatus.error}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        startIcon={<RefreshIcon />}
        onClick={checkConnections}
        disabled={apiStatus.loading || socketStatus.loading}
      >
        Refresh Connection Status
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConnectionStatus;
