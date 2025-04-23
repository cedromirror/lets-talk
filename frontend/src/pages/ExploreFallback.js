import React from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';

const ExploreFallback = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h5" gutterBottom>
          Loading Explore Page...
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please wait while we fetch the latest content for you.
        </Typography>
      </Box>
    </Container>
  );
};

export default ExploreFallback;
