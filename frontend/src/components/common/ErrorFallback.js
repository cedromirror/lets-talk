import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * Error fallback component for error boundaries
 * @param {Object} props - Component props
 * @param {Object} props.error - Error object
 * @param {Function} props.resetErrorBoundary - Function to reset the error boundary
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        p: 4,
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: 'error.main', mb: 2, fontSize: 60 }}>😕</Box>
      <Typography variant="h5" color="error.main" gutterBottom fontWeight="medium">
        Oops! Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mb: 3 }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </Typography>
      <Button
        variant="contained"
        onClick={resetErrorBoundary}
        startIcon={<RefreshIcon />}
        size="large"
        sx={{
          px: 4,
          py: 1,
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[8],
          }
        }}
      >
        Try Again
      </Button>
    </Box>
  );
};

export default ErrorFallback;
