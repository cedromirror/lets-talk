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
  MoreVert as MoreIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { storyService } from '../../services/api';
import { getCloudinaryVideoUrl, getAdaptiveVideoUrls, extractCloudinaryId } from '../../utils/cloudinaryVideoHelper';

// Helper function to get the proper video URL from a story object
const getProperVideoUrl = (story) => {
  if (!story) return '/assets/default-video.mp4';

  // Check if we have a valid media URL
  if (story.media) {
    // If it's a Cloudinary URL, ensure it's properly formatted
    if (story.media.includes('cloudinary.com') ||
        story.media.includes('res.cloudinary.com')) {
      // Extract the video ID from the URL
      try {
        // Get adaptive URLs for better quality and fallbacks
        const adaptiveUrls = getAdaptiveVideoUrls(story.media);
        // Use the medium quality version as the default
        return adaptiveUrls.medium || getCloudinaryVideoUrl(story.media, { quality: 'auto', format: 'mp4' });
      } catch (error) {
        console.error('Error formatting Cloudinary URL:', error);
        // Try a more direct approach with minimal transformations
        try {
          const cleanId = extractCloudinaryId(story.media);
          return `https://res.cloudinary.com/droja6ntk/video/upload/q_auto,f_auto/${cleanId}`;
        } catch (innerError) {
          console.error('Fallback extraction failed:', innerError);
          return story.media; // Fall back to the original URL as last resort
        }
      }
    }
    return story.media; // Return the original URL if not Cloudinary
  }

  // Check for alternative media sources
  if (story.optimizedMedia) return story.optimizedMedia;
  if (story.lowQualityMedia) return story.lowQualityMedia;

  // Default fallback
  return '/assets/default-video.mp4';
};

// Helper function to try alternative video sources when the primary source fails
const tryAlternativeVideoSources = (story, videoElement) => {
  if (!story || !videoElement) return false;

  console.log('Trying alternative video sources for:', story.media);

  // Get adaptive video URLs with multiple formats and resolutions
  let adaptiveUrls = {};
  try {
    if (story.media && story.media.includes('cloudinary')) {
      adaptiveUrls = getAdaptiveVideoUrls(story.media);
      console.log('Generated adaptive URLs:', adaptiveUrls);
    }
  } catch (error) {
    console.error('Error generating adaptive URLs:', error);
  }

  // Try sources in order of preference
  const sources = [
    // First try optimized media if available
    story.optimizedMedia,
    // Then try low quality media
    story.lowQualityMedia,
    // Try adaptive URLs in different formats and resolutions
    adaptiveUrls.medium,
    adaptiveUrls.low,
    adaptiveUrls.mediumWebm,
    adaptiveUrls.lowWebm,
    // Try direct Cloudinary URLs with different formats
    story.media && story.media.includes('cloudinary') ?
      getCloudinaryVideoUrl(story.media, { quality: 'auto', format: 'mp4' }) :
      null,
    story.media && story.media.includes('cloudinary') ?
      getCloudinaryVideoUrl(story.media, { quality: 'auto', format: 'webm' }) :
      null,
    // Try with minimal transformations as a last resort
    story.media && story.media.includes('cloudinary') ?
      `https://res.cloudinary.com/droja6ntk/video/upload/q_auto,f_auto/${extractCloudinaryId(story.media)}` :
      null
  ].filter(Boolean); // Remove null/undefined values

  console.log('Alternative sources:', sources);

  // Try each source
  for (const source of sources) {
    if (source && source !== videoElement.src) {
      console.log('Trying alternative video source:', source);
      videoElement.src = source;
      return true;
    }
  }

  return false; // No alternative sources found or all have been tried
};

const StoryViewer = ({ open, onClose, stories, initialStoryIndex = 0 }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const progressInterval = useRef(null);
  const videoRef = useRef(null);
  const storyDuration = 5000; // 5 seconds per story for images

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

    // For video stories, use the video duration instead of the fixed duration
    if (currentStory.type === 'video' && videoRef.current) {
      // Don't start the progress timer until the video is loaded
      if (!videoLoaded) return;

      // Use the actual video duration or fall back to default
      const videoDuration = videoRef.current.duration * 1000 || storyDuration;
      console.log('Video duration:', videoDuration);

      // Set up progress interval based on video duration
      const interval = setInterval(() => {
        if (videoRef.current) {
          const videoProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          setProgress(videoProgress);

          // If video ended, move to next story
          if (videoRef.current.ended) {
            clearInterval(interval);
            setTimeout(() => {
              handleNextStory();
            }, 300);
          }
        }
      }, 100);

      progressInterval.current = interval;
    } else {
      // For image stories, use the fixed duration
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
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [open, currentStory, currentStoryIndex, paused, videoLoaded]);

  // Reset progress and loading states when story changes
  useEffect(() => {
    setProgress(0);
    setVideoLoaded(false);
    setVideoError(false);
    setImageLoaded(false);
    setImageError(false);
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

  // Handle missing story data gracefully
  if (!currentStory) {
    console.warn('No current story available');
    return null;
  }

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
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Progress Bar */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          px: 1,
          pt: 1
        }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 3,
              borderRadius: 1.5,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: currentStory?.type === 'video' ?
                  'linear-gradient(90deg, #8a2be2, #4b0082)' :
                  'linear-gradient(90deg, #f09433, #e6683c, #dc2743)'
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
            <>
              <Box
                component="img"
                src={currentStory.media || '/assets/default-image.svg'}
                alt={currentStory.caption || 'Story'}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: 1,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s ease, opacity 0.3s ease',
                  opacity: imageLoaded ? 1 : 0,
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
                loading="eager"
                onLoad={() => {
                  console.log('Image loaded successfully');
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  console.error('Error loading image');
                  setImageError(true);
                }}
              />

              {/* Loading indicator for images */}
              {!imageLoaded && !imageError && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <CircularProgress color="primary" />
                </Box>
              )}

              {/* Error message if image fails to load */}
              {imageError && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    textAlign: 'center',
                    p: 2,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body1">
                    Unable to load this image. Try again later.
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <>
              <Box
                component="video"
                ref={videoRef}
                src={getProperVideoUrl(currentStory)}
                poster={currentStory.thumbnail || '/assets/default-image.svg'}
                autoPlay
                muted
                controls
                playsInline
                onLoadedData={() => {
                  console.log('Video loaded successfully');
                  setVideoLoaded(true);
                  setVideoError(false);
                  // Start playing the video
                  if (videoRef.current) {
                    videoRef.current.play().catch(err => {
                      console.error('Error playing video:', err);
                    });
                  }
                }}
                onError={(e) => {
                  console.error('Error loading video:', e);
                  setVideoError(true);

                  // Try to recover by using a different source format
                  const recovered = tryAlternativeVideoSources(currentStory, videoRef.current);

                  // If recovery failed, try a more direct approach
                  if (!recovered && currentStory && currentStory.media) {
                    try {
                      // Try a direct approach with minimal transformations
                      const videoUrl = currentStory.media;
                      const parts = videoUrl.split('/');
                      const filename = parts[parts.length - 1].split('.')[0].split('?')[0];

                      // Try with minimal transformations
                      const directUrl = `https://res.cloudinary.com/droja6ntk/video/upload/q_auto/${filename}`;
                      console.log('Trying direct URL with minimal transformations:', directUrl);

                      if (videoRef.current) {
                        videoRef.current.src = directUrl;
                        videoRef.current.load();
                      }
                    } catch (fallbackError) {
                      console.error('Error in direct fallback approach:', fallbackError);
                    }
                  }
                }}
                onEnded={() => {
                  // Move to the next story when video ends
                  setTimeout(() => {
                    handleNextStory();
                  }, 300);
                }}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: 1,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  '&::-webkit-media-controls-panel': {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                  },
                  '&::-webkit-media-controls-play-button': {
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '50%',
                    color: 'white'
                  },
                  '&::-webkit-media-controls-timeline': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 10,
                    height: 4
                  }
                }}
              />

              {/* Show error message if video fails to load */}
              {videoError && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    textAlign: 'center',
                    p: 2,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body1">
                    Unable to play this video. Try again later.
                  </Typography>
                </Box>
              )}
            </>
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
                backdropFilter: 'blur(4px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                transform: 'translateY(0)',
                animation: 'fadeInUp 0.5s ease',
                '@keyframes fadeInUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(20px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            >
              <Typography
                variant="body1"
                color="white"
                sx={{
                  fontWeight: 'medium',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  lineHeight: 1.5
                }}
              >
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
