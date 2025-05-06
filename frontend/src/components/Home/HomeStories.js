import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, AutoStories as StoryIcon } from '@mui/icons-material';
import StoryCircle from '../../components/Stories/StoryCircle';

const HomeStories = ({ stories, onStoryClick, onCreateStory }) => {
  return (
    <Box
      sx={{
        mb: 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -16,
          left: -16,
          right: -16,
          bottom: -16,
          background: 'linear-gradient(135deg, rgba(255,107,107,0.03) 0%, rgba(168,65,255,0.03) 100%)',
          borderRadius: 4,
          zIndex: -1
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        mt: 1
      }}>
        <Typography
          variant="h6"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #FF6B6B 0%, #A841FF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textFillColor: 'transparent'
          }}
        >
          <StoryIcon sx={{ color: '#FF6B6B' }} />
          Stories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateStory}
          size="small"
          sx={{
            background: 'linear-gradient(90deg, #FF6B6B 0%, #A841FF 100%)',
            boxShadow: '0 4px 10px rgba(168,65,255,0.2)',
            '&:hover': {
              background: 'linear-gradient(90deg, #FF5757 0%, #9B32F0 100%)',
              boxShadow: '0 6px 15px rgba(168,65,255,0.3)'
            }
          }}
        >
          Create Story
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          pb: 1,
          pt: 1,
          px: 1,
          mx: -1,
          '&::-webkit-scrollbar': {
            height: 6
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(168,65,255,0.3)',
            borderRadius: 3
          },
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {stories.length > 0 ? (
          stories.map((story) => (
            <Box
              key={story._id}
              sx={{
                scrollSnapAlign: 'start',
                transform: story.isNew ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.3s ease',
                zIndex: story.isNew ? 2 : 1
              }}
            >
              <StoryCircle
                story={story}
                onClick={onStoryClick}
                isNew={story.isNew}
              />
            </Box>
          ))
        ) : (
          <Box sx={{
            p: 3,
            textAlign: 'center',
            width: '100%',
            borderRadius: 2,
            border: '1px dashed rgba(168,65,255,0.3)',
            bgcolor: 'rgba(255,255,255,0.5)'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No stories available. Create one or follow users to see their stories.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click the "Create Story" button above to get started.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomeStories;
