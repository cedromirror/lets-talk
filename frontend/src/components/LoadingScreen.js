import React from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';

const LoadingScreen = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        bgcolor: 'background.default'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 3,
          maxWidth: '90%',
          textAlign: 'center'
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ mb: 3, color: theme.palette.primary.main }}
        />
        <Typography variant="h5" gutterBottom>
          Loading...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we prepare everything for you
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
