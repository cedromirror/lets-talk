import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, IconButton, Avatar, Badge,
  Tooltip, Slide, CircularProgress
} from '@mui/material';
import ProfilePicture from '../common/ProfilePicture';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  MusicNote as MusicIcon,
  MoreVert as MoreVertIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  PlayArrow as PlayArrowIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const ReelCard = ({
  reel,
  isActive,
  isMuted,
  selectedFilter,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMoreOptions,
  onVideoEnd,
  videoRef
}) => {
  const [isVisible, setIsVisible] = useState(isActive);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const progressIntervalRef = useRef(null);

  // Animation effect when switching reels
  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setVideoLoaded(false);
      setVideoError(false);

      // Start progress tracking when reel becomes active
      if (videoRef && videoRef.current) {
        const video = videoRef.current;

        // Set up event listeners for the video
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded, duration:', video.duration);
          setDuration(video.duration);
        };

        const handleTimeUpdate = () => {
          setProgress((video.currentTime / video.duration) * 100);
        };

        const handlePlay = () => {
          console.log('Video started playing');
          setIsPlaying(true);
        };

        const handlePause = () => {
          console.log('Video paused');
          setIsPlaying(false);
        };

        const handleWaiting = () => {
          console.log('Video is waiting/buffering');
        };

        const handleStalled = () => {
          console.log('Video playback stalled');
        };

        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('stalled', handleStalled);

        // Set initial values
        if (video.duration) {
          setDuration(video.duration);
        }

        // Set initial playing state
        setIsPlaying(!video.paused);

        // Try to load the video
        video.load();

        // Clean up event listeners
        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('play', handlePlay);
          video.removeEventListener('pause', handlePause);
          video.removeEventListener('waiting', handleWaiting);
          video.removeEventListener('stalled', handleStalled);
        };
      }
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match this with the animation duration
      return () => clearTimeout(timer);
    }
  }, [isActive, videoRef]);

  // Get filter style based on selected filter
  const getFilterStyle = (filter) => {
    switch (filter) {
      case 'grayscale':
        return { filter: 'grayscale(1)' };
      case 'sepia':
        return { filter: 'sepia(0.7)' };
      case 'blur':
        return { filter: 'blur(2px)' };
      case 'brightness':
        return { filter: 'brightness(1.3)' };
      case 'contrast':
        return { filter: 'contrast(1.5)' };
      case 'hue-rotate':
        return { filter: 'hue-rotate(90deg)' };
      case 'saturate':
        return { filter: 'saturate(2)' };
      case 'invert':
        return { filter: 'invert(0.8)' };
      case 'opacity':
        return { filter: 'opacity(0.7)' };
      case 'drop-shadow':
        return { filter: 'drop-shadow(2px 4px 6px black)' };
      case 'vintage':
        return { filter: 'sepia(0.4) hue-rotate(-20deg) saturate(1.5)' };
      default:
        return {};
    }
  };

  return (
    <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit timeout={300}>
      <Box
        sx={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          display: isActive ? 'block' : 'none'
        }}
      >
        {/* Progress Bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 5,
            bgcolor: 'rgba(255,255,255,0.2)'
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${progress}%`,
              bgcolor: 'primary.main',
              transition: 'width 0.1s linear'
            }}
          />
        </Box>

        {/* Video Player */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            cursor: 'pointer'
          }}
          onClick={() => {
            if (videoRef && videoRef.current) {
              if (videoRef.current.paused) {
                videoRef.current.play();
              } else {
                videoRef.current.pause();
              }
            }
          }}
        >
          <video
            ref={videoRef}
            loop
            playsInline
            muted={isMuted}
            onEnded={onVideoEnd}
            onLoadedData={() => {
              console.log('Video loaded successfully:', reel._id);
              setVideoLoaded(true);
            }}
            onLoadStart={() => {
              console.log('Video load started:', reel._id);
            }}
            onCanPlay={() => {
              console.log('Video can play:', reel._id);
              // If video is active and autoplay is enabled, try to play
              if (isActive && videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch(e => {
                  console.warn('Could not autoplay video:', e);
                });
              }
            }}
            onError={(e) => {
              console.error('Video error for reel', reel._id, ':', e);
              setVideoError(true);
              // If there's a thumbnail, we can at least show that
              if (e.target) {
                e.target.poster = reel.thumbnail || '';
              }

              // Try to load an alternative source if available
              if (reel.optimizedVideo && reel.video !== reel.optimizedVideo) {
                console.log('Trying optimized video source instead');
                e.target.src = reel.optimizedVideo;
                e.target.load();
              } else if (reel.lowQualityVideo) {
                console.log('Trying low quality video source instead');
                e.target.src = reel.lowQualityVideo;
                e.target.load();
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: 'black',
              ...getFilterStyle(selectedFilter)
            }}
            poster={reel.thumbnail || ''}
            preload={isActive ? 'auto' : 'metadata'}
            controlsList="nodownload"
          >
            {/* Support multiple video formats and qualities */}
            {reel.optimizedVideo && (
              <source src={reel.optimizedVideo} type="video/mp4" />
            )}
            {reel.video && reel.video !== reel.optimizedVideo && (
              <source src={reel.video} type="video/mp4" />
            )}
            {reel.lowQualityVideo && (
              <source src={reel.lowQualityVideo} type="video/mp4" data-quality="low" />
            )}
            {reel.videoWebm && (
              <source src={reel.videoWebm} type="video/webm" />
            )}
            {/* Fallback message */}
            Your browser does not support the video tag.
          </video>

          {/* Video Error Overlay */}
          {videoError && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                p: 2,
                textAlign: 'center'
              }}
            >
              <ErrorIcon sx={{ fontSize: 40, mb: 2, color: 'error.main' }} />
              <Typography variant="body1" gutterBottom>
                Unable to play this video
              </Typography>
              <Typography variant="caption" color="gray">
                The video might be unavailable or in an unsupported format
              </Typography>
            </Box>
          )}

          {/* Loading Overlay */}
          {isActive && !videoLoaded && !videoError && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.5)'
              }}
            >
              <CircularProgress color="primary" />
            </Box>
          )}

          {/* Play/Pause Overlay */}
          {!isPlaying && isActive && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.8,
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 1
                }
              }}
            >
              <PlayArrowIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
          )}
        </Box>

        {/* Overlay Content */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            backdropFilter: 'blur(5px)',
            borderRadius: '16px 16px 0 0',
            transition: 'all 0.3s ease'
          }}
        >
          {/* User Info */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <ProfilePicture
                user={reel.user}
                alt={reel.user.username}
                linkToProfile={true}
                size="medium"
                sx={{
                  mr: 1,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant="subtitle1"
                    color="white"
                    component={Link}
                    to={`/profile/${reel.user.username}`}
                    sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    {reel.user.username}
                  </Typography>
                  <Box
                    sx={{
                      ml: 1,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      px: 1,
                      py: 0.2,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      color: 'white'
                    }}
                  >
                    Follow
                  </Box>
                </Box>
                <Typography variant="caption" color="rgba(255,255,255,0.7)">
                  {formatDistanceToNow(new Date(reel.createdAt || new Date()), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => onMoreOptions(reel)}
              sx={{
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.5)'
                }
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          {/* Caption */}
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: 'rgba(0,0,0,0.2)',
              borderRadius: 2,
              maxHeight: '80px',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: '4px'
              }
            }}
          >
            <Typography variant="body2" color="white">
              {reel.caption || 'No caption'}
            </Typography>
          </Box>

          {/* Audio Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              p: 1,
              bgcolor: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              animation: 'pulse 2s infinite ease-in-out',
              '@keyframes pulse': {
                '0%': { opacity: 0.7 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.7 }
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                borderRadius: '50%',
                width: 24,
                height: 24,
                mr: 1,
                animation: 'spin 4s infinite linear',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              <MusicIcon sx={{ color: 'white', fontSize: 14 }} />
            </Box>
            <Typography variant="caption" color="white" noWrap sx={{ maxWidth: '80%' }}>
              {typeof reel.audio === 'object' && reel.audio !== null ?
                `${reel.audio.name || 'Original Audio'} - ${reel.audio.artist || 'Unknown Artist'}` :
                (typeof reel.audio === 'string' ? reel.audio : 'Original Audio')}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            zIndex: 10
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center">
            <IconButton
              onClick={() => {
                // Add a small delay to prevent double-clicks
                if (onLike) {
                  const likeButton = document.activeElement;
                  if (likeButton) likeButton.blur();
                  onLike();
                }
              }}
              disabled={!onLike}
              sx={{
                color: reel.isLiked ? 'error.main' : 'white',
                bgcolor: 'rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: 'rgba(0,0,0,0.5)'
                },
                '&.Mui-disabled': {
                  color: 'rgba(255,255,255,0.5)',
                  bgcolor: 'rgba(0,0,0,0.2)'
                }
              }}
            >
              {reel.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography
              variant="caption"
              color="white"
              sx={{
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {reel.likesCount || 0}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" alignItems="center">
            <IconButton
              onClick={onComment}
              sx={{
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: 'rgba(0,0,0,0.5)'
                }
              }}
            >
              <Badge
                badgeContent={reel.commentsCount || 0}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 'bold',
                    fontSize: '0.7rem'
                  }
                }}
              >
                <CommentIcon />
              </Badge>
            </IconButton>
            <Typography
              variant="caption"
              color="white"
              sx={{
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {reel.commentsCount || 0}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" alignItems="center">
            <IconButton
              onClick={onShare}
              sx={{
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: 'rgba(0,0,0,0.5)'
                }
              }}
            >
              <ShareIcon />
            </IconButton>
            <Typography
              variant="caption"
              color="white"
              sx={{
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {typeof reel.shares === 'number' ? reel.shares : 0}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" alignItems="center">
            <IconButton
              onClick={onBookmark}
              sx={{
                color: reel.isBookmarked ? 'primary.main' : 'white',
                bgcolor: 'rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: 'rgba(0,0,0,0.5)'
                }
              }}
            >
              {reel.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Slide>
  );
};

export default ReelCard;
