import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// Simple loading fallback
const SettingsLoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, rgba(0,149,246,0.05), rgba(46,204,113,0.05))'
    }}
  >
    <CircularProgress size={60} sx={{ mb: 2, color: '#0095f6' }} />
    <Typography
      variant="h6"
      sx={{
        fontWeight: 500,
        background: 'linear-gradient(90deg, #0095f6, #2ecc71, #3498db, #9b59b6)',
        backgroundClip: 'text',
        textFillColor: 'transparent',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: 1
      }}
    >
      Loading settings...
    </Typography>
  </Box>
);

// Dynamically import Settings to avoid circular dependencies
const Settings = React.lazy(() => import('./Settings'));

const SettingsContainer = () => {
  return (
    <Suspense fallback={<SettingsLoadingFallback />}>
      <Settings />
    </Suspense>
  );
};

export default SettingsContainer;
