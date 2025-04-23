import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    // Check if it's a chunk loading error
    const isChunkError = this.state.error?.message && (
      this.state.error.message.includes('Loading chunk') ||
      this.state.error.message.includes('ChunkLoadError') ||
      this.state.error.message.includes('Loading CSS chunk')
    );

    if (isChunkError) {
      // Clear localStorage cache for webpack chunks
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('webpack') || key.startsWith('chunk')) {
            localStorage.removeItem(key);
          }
        });
        console.log('Cleared localStorage cache for webpack chunks');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }

      // Force reload without cache
      window.location.reload(true);
    } else {
      // Normal reload for other errors
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a chunk loading error
      const isChunkError = this.state.error?.message && (
        this.state.error.message.includes('Loading chunk') ||
        this.state.error.message.includes('ChunkLoadError') ||
        this.state.error.message.includes('Loading CSS chunk')
      );

      // Render fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              m: 2,
              maxWidth: 600,
              borderRadius: 2,
              backgroundColor: '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              {isChunkError ? 'Failed to load resources' : 'Something went wrong'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
              {isChunkError
                ? 'The application failed to load some required resources. This could be due to network issues or a temporary problem.'
                : this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleReset}
              >
                {isChunkError ? 'Clear Cache & Reload' : 'Reload Application'}
              </Button>

              {isChunkError && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Hard reload to home page
                    window.location.href = '/';
                  }}
                >
                  Go to Home Page
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
