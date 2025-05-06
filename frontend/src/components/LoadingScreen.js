import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, useTheme, Fade } from '@mui/material';

const LoadingScreen = ({ message = "Loading..." }) => {
  const theme = useTheme();
  const [showTips, setShowTips] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  // Tips to show during loading
  const tips = [
    "Explore trending reels to discover new content",
    "Create stories to share moments with your followers",
    "Check your notifications to stay connected",
    "Use the search feature to find friends and content",
    "Save posts to view them later in your profile"
  ];

  // Show tips after 2 seconds of loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTips(true);
    }, 2000);

    // Rotate tips every 4 seconds
    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(tipTimer);
    };
  }, []);

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
          {message}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we prepare everything for you
        </Typography>

        {/* Tips section */}
        <Fade in={showTips} timeout={1000}>
          <Box sx={{ mt: 3, maxWidth: 300 }}>
            <Typography
              variant="caption"
              color="primary"
              sx={{
                display: 'block',
                fontStyle: 'italic',
                minHeight: 40,
                transition: 'all 0.5s ease'
              }}
            >
              Tip: {tips[tipIndex]}
            </Typography>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
