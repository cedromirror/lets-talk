import React, { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import Profile from './Profile';

function ProfileWrapper() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
      <Profile />
    </Suspense>
  );
}

export default ProfileWrapper;
