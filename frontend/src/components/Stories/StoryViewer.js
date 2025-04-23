import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Dialog, 
  IconButton, 
  Typography, 
  Avatar, 
  LinearProgress,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Favorite as FavoriteIcon,
  Send as SendIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { storyService } from '../../services/api';

const StoryViewer = ({ open, onClose, stories, initialStoryIndex = 0 }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const progressInterval = useRef(null);
  const storyDuration = 5000; // 5 seconds per story
  
  const currentStory = stories && stories.length > 0 ? stories[currentStoryIndex] : null;
  
  // Handle story navigation
  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else {
      onClose();
    }
  };
  
  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };
  
  // Handle story progress
  useEffect(() => {
    if (!open || !currentStory || paused) return;
    
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    // Mark story as viewed
    const markAsViewed = async () => {
      try {
        if (currentStory._id) {
          await storyService.viewStory(currentStory._id);
        }
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    };
    
    markAsViewed();
    
    // Set up progress interval
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (storyDuration / 100));
        
        if (newProgress >= 100) {
          clearInterval(interval);
          // Move to next story after a small delay
          setTimeout(() => {
            handleNextStory();
          }, 300);
          return 100;
        }
        
        return newProgress;
      });
    }, 100);
    
    progressInterval.current = interval;
    
    return () => {
      clearInterval(progressInterval.current);
    };
  }, [open, currentStory, currentStoryIndex, paused]);
  
  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex]);
  
  // Handle reply submission
  const handleReplySubmit = async () => {
    if (!replyText.trim() || !currentStory?._id) return;
    
    try {
      setLoading(true);
      await storyService.replyToStory(currentStory._id, { text: replyText });
      setReplyText('');
      // Show success feedback here if needed
    } catch (error) {
      console.error('Error replying to story:', error);
      // Show error feedback here if needed
    } finally {
      setLoading(false);
    }
  };
  
  // Pause progress when typing a reply
  const handleReplyFocus = () => {
    setPaused(true);
  };
  
  const handleReplyBlur = () => {
    setPaused(false);
  };
  
  if (!currentStory) return null;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'transparent',
          boxShadow: 'none',
          overflow: 'hidden',
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          bgcolor: 'black',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* Progress Bar */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 2, 
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white'
              }
            }} 
          />
        </Box>
        
        {/* Story Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={currentStory.user?.profilePicture || '/assets/default-avatar.png'} 
              alt={currentStory.user?.username || 'User'} 
              sx={{ width: 40, height: 40, mr: 1, border: '2px solid white' }}
            />
            <Box>
              <Typography variant="subtitle1" color="white" fontWeight="bold">
                {currentStory.user?.username || 'User'}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                {formatDistanceToNow(new Date(currentStory.createdAt || new Date()), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <IconButton size="small" sx={{ color: 'white' }}>
              <MoreIcon />
            </IconButton>
            <IconButton size="small" sx={{ color: 'white' }} onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Story Content */}
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {currentStory.type === 'image' ? (
            <Box
              component="img"
              src={currentStory.media || '/assets/default-story.jpg'}
              alt={currentStory.caption || 'Story'}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <Box
              component="video"
              src={currentStory.media || '/assets/default-video.mp4'}
              autoPlay
              muted
              loop
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          )}
          
          {/* Caption */}
          {currentStory.caption && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 80,
                left: 0,
                right: 0,
                p: 2,
                bgcolor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Typography variant="body1" color="white">
                {currentStory.caption}
              </Typography>
            </Box>
          )}
          
          {/* Navigation Controls */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '30%',
              height: '100%',
              cursor: 'pointer'
            }}
            onClick={handlePrevStory}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '70%',
              height: '100%',
              cursor: 'pointer'
            }}
            onClick={handleNextStory}
          />
        </Box>
        
        {/* Reply Input */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <TextField
            fullWidth
            placeholder="Reply to story..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onFocus={handleReplyFocus}
            onBlur={handleReplyBlur}
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <IconButton 
                      edge="end" 
                      color="primary" 
                      onClick={handleReplySubmit}
                      disabled={!replyText.trim()}
                    >
                      <SendIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
              sx: {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />
        </Box>
      </Box>
    </Dialog>
  );
};

export default StoryViewer;
