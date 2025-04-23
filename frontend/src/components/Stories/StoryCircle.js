import React from 'react';
import { Box, Avatar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const StoryRing = styled(Box)(({ theme, seen }) => ({
  position: 'relative',
  borderRadius: '50%',
  padding: 3,
  background: seen 
    ? 'linear-gradient(to right, #ccc, #ddd)' 
    : 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.05)',
    transition: 'transform 0.2s'
  }
}));

const StoryCircle = ({ story, onClick }) => {
  const user = story?.user || {};
  const seen = story?.seen || false;
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        mx: 1,
        minWidth: 70
      }}
      onClick={() => onClick && onClick(story)}
    >
      <StoryRing seen={seen}>
        <Avatar 
          src={user.profilePicture || '/assets/default-avatar.png'} 
          alt={user.username || 'User'} 
          sx={{ 
            width: 56, 
            height: 56, 
            border: '2px solid white'
          }}
        />
      </StoryRing>
      <Typography 
        variant="caption" 
        sx={{ 
          mt: 1, 
          maxWidth: 70, 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}
      >
        {user.username || 'User'}
      </Typography>
    </Box>
  );
};

export default StoryCircle;
