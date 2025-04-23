import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Import Settings component
import Settings from './Settings';

// Simple loading fallback
const SettingsFallback = () => (
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
    <Box
      sx={{
        fontSize: '1.2rem',
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
    </Box>
  </Box>
);

const SettingsWrapper = () => {

  return (
    <Suspense fallback={<SettingsFallback />}>
      <Settings />
    </Suspense>
  );
};

export default SettingsWrapper;
