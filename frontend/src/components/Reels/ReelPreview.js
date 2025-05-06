import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  Badge,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  FavoriteRounded as FavoriteIcon,
  FavoriteBorderRounded as FavoriteBorderIcon,
  ChatBubbleOutlineRounded as CommentIcon,
  PlayArrowRounded as PlayArrowIcon,
  BookmarkRounded as BookmarkIcon,
  BookmarkBorderRounded as BookmarkBorderIcon,
  LocalFireDepartmentRounded as FireIcon,
  VisibilityRounded as VisibilityIcon,
  EmojiEmotionsRounded as EmojiIcon,
  ShareRounded as ShareIcon,
  VerifiedRounded as VerifiedIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { reelService } from '../../services/api';

const ReelPreview = memo(({
  reel,
  showSavedBadge = false,
  showTrendingBadge = false,
  trendingRank = null,
  onLike,
  onSave,
  onComment,
  onShare
}) => {
  const { currentUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(reel.isLiked || false);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(showSavedBadge || reel.isBookmarked || false);
  const navigate = useNavigate();
  const theme = useTheme();
  const cardRef = useRef(null);

  // Format view count with K, M suffix
  const formatViewCount = useCallback((count) => {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }, []);

  // Add hover effect with mouse position tracking
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) - 0.5;
    const y = ((e.clientY - rect.top) / rect.height) - 0.5;

    setMousePosition({ x, y });
  }, []);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // Handle like/unlike
  const handleLike = useCallback(async (e) => {
    e.stopPropagation(); // Prevent navigation to reel detail

    if (!currentUser) {
      console.log('User must be logged in to like reels');
      return;
    }

    try {
      // Optimistic update
      setLiked(prevLiked => !prevLiked);
      setLikesCount(prevCount => liked ? prevCount - 1 : prevCount + 1);

      // Call API
      if (liked) {
        await reelService.unlikeReel(reel._id);
        console.log(`Reel ${reel._id} unliked successfully`);
      } else {
        await reelService.likeReel(reel._id);
        console.log(`Reel ${reel._id} liked successfully`);
      }

      // Call parent handler if provided
      if (onLike) {
        onLike(reel._id, !liked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setLiked(prevLiked => prevLiked);
      setLikesCount(prevCount => liked ? prevCount : prevCount - 1);
    }
  }, [currentUser, liked, likesCount, reel._id, onLike]);

  // Handle bookmark/unbookmark
  const handleBookmark = useCallback(async (e) => {
    e.stopPropagation(); // Prevent navigation to reel detail

    if (!currentUser) {
      console.log('User must be logged in to save reels');
      return;
    }

    try {
      // Optimistic update
      setBookmarked(prevBookmarked => !prevBookmarked);

      // Call API
      if (bookmarked) {
        await reelService.unsaveReel(reel._id);
        console.log(`Reel ${reel._id} unsaved successfully`);
      } else {
        await reelService.saveReel(reel._id);
        console.log(`Reel ${reel._id} saved successfully`);
      }

      // Call parent handler if provided
      if (onSave) {
        onSave(reel._id, !bookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert on error
      setBookmarked(prevBookmarked => prevBookmarked);
    }
  }, [currentUser, bookmarked, reel._id, onSave]);

  // Handle comment
  const handleComment = useCallback((e) => {
    e.stopPropagation(); // Prevent navigation to reel detail
    if (onComment) {
      onComment(reel);
    } else {
      navigate(`/reels/${reel._id}?openComments=true`);
    }
  }, [onComment, reel, navigate]);

  // Handle share
  const handleShare = useCallback((e) => {
    e.stopPropagation(); // Prevent navigation to reel detail
    if (onShare) {
      onShare(reel);
    } else {
      // Fallback share functionality
      if (navigator.share) {
        navigator.share({
          title: reel.caption || 'Check out this reel!',
          text: reel.caption || 'Check out this reel!',
          url: `${window.location.origin}/reels/${reel._id}`,
        }).catch(err => console.error('Error sharing:', err));
      } else {
        // Copy link to clipboard
        const url = `${window.location.origin}/reels/${reel._id}`;
        navigator.clipboard.writeText(url)
          .then(() => console.log('Link copied to clipboard'))
          .catch(err => console.error('Failed to copy link:', err));
      }
    }
  }, [onShare, reel]);

  // Handle image error
  const handleImageError = (e) => {
    console.error('Error loading thumbnail for reel:', reel._id);
    setImageError(true);
    e.target.src = '/assets/default-image.svg';

    // Try to get a thumbnail from Cloudinary if we have a video URL
    if (reel.video && reel.video.includes('cloudinary')) {
      try {
        // Try a direct approach first
        const videoUrl = reel.video;
        const parts = videoUrl.split('/');
        const filename = parts[parts.length - 1].split('.')[0].split('?')[0];
        const directThumbnailUrl = `https://res.cloudinary.com/droja6ntk/video/upload/f_jpg,q_auto,w_720/${filename}.jpg`;

        console.log('Trying direct thumbnail URL:', directThumbnailUrl);
        e.target.src = directThumbnailUrl;

        // If that fails, try the helper function as a fallback
        e.target.onerror = () => {
          try {
            const { getVideoThumbnailUrl, extractCloudinaryId } = require('../../utils/cloudinaryVideoHelper');
            const videoId = extractCloudinaryId(reel.video);
            if (videoId) {
              const thumbnailUrl = getVideoThumbnailUrl(videoId);
              console.log('Trying helper thumbnail URL:', thumbnailUrl);
              e.target.src = thumbnailUrl;
            }
          } catch (err) {
            console.error('Failed to generate thumbnail URL:', err);
            e.target.src = '/assets/default-image.svg';
          }
        };
      } catch (err) {
        console.error('Failed to generate thumbnail URL:', err);
        e.target.src = '/assets/default-image.svg';
      }
    }
  };

  return (
    <Card
      ref={cardRef}
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        height: { xs: 300, sm: 340 },
        width: '100%',
        boxShadow: isHovered
          ? theme.palette.mode === 'dark'
            ? `0 16px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`
            : `0 16px 40px rgba(0, 0, 0, 0.15), 0 0 20px ${alpha(theme.palette.primary.main, 0.2)}`
          : theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0, 0, 0, 0.3)'
            : '0 8px 24px rgba(99, 102, 241, 0.15)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered
          ? `translateY(-12px) scale(1.03) perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * -5}deg)`
          : 'translateY(0) scale(1) perspective(1000px) rotateX(0) rotateY(0)',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? `0 24px 50px rgba(0, 0, 0, 0.5), 0 0 30px ${alpha(theme.palette.primary.main, 0.4)}`
            : `0 24px 50px rgba(0, 0, 0, 0.2), 0 0 30px ${alpha(theme.palette.primary.main, 0.3)}`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: isHovered
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`
            : 'transparent',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
          zIndex: 1,
          pointerEvents: 'none',
        }
      }}
      onClick={() => navigate(`/reels/${reel._id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Loading Placeholder */}
      {!imageLoaded && !imageError && (
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
            bgcolor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.4),
            zIndex: 0,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid',
              borderColor: theme.palette.primary.main,
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': {
                  transform: 'rotate(0deg)',
                },
                '100%': {
                  transform: 'rotate(360deg)',
                },
              },
            }}
          />
        </Box>
      )}

      {/* Reel Thumbnail with Blur Effect on Hover */}
      <CardMedia
        component="img"
        image={reel.thumbnail || '/assets/default-image.svg'}
        alt={reel.caption || 'Reel'}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        sx={{
          height: '100%',
          objectFit: 'cover',
          transition: 'all 0.5s ease',
          filter: isHovered
            ? 'brightness(0.85) saturate(1.2)'
            : imageLoaded ? 'none' : 'blur(8px)',
          transform: isHovered
            ? 'scale(1.05)'
            : imageLoaded ? 'scale(1)' : 'scale(1.1)',
          opacity: imageLoaded ? 1 : 0.7,
        }}
      />

      {/* Saved Badge */}
      {bookmarked && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <Chip
            icon={<BookmarkIcon fontSize="small" sx={{ color: 'white' }} />}
            label="Saved"
            size="small"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              backdropFilter: 'blur(4px)',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '12px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(99, 102, 241, 0.3)',
              '& .MuiChip-icon': {
                color: 'white'
              },
              animation: 'fadeIn 0.5s ease-in-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(-10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          />
        </Box>
      )}

      {/* Trending Badge */}
      {showTrendingBadge && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <Chip
            icon={<FireIcon fontSize="small" sx={{ color: 'white' }} />}
            label={trendingRank
              ? `#${trendingRank} Trending`
              : (reel.likesCount > 10
                ? `${reel.likesCount} Likes`
                : (reel.viewsCount > 100
                  ? `${formatViewCount(reel.viewsCount)} Views`
                  : 'Trending'))}
            size="small"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
              backdropFilter: 'blur(4px)',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '12px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(239, 68, 68, 0.3)',
              '& .MuiChip-icon': {
                color: 'white'
              },
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.4)}` },
                '70%': { boxShadow: `0 0 0 10px ${alpha(theme.palette.error.main, 0)}` },
                '100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}` }
              }
            }}
          />
        </Box>
      )}

      {/* Overlay with Gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isHovered
            ? `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.1)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`
            : `linear-gradient(to bottom, transparent 50%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2.5,
          transition: 'all 0.4s ease',
          zIndex: 2
        }}
      >
        {/* Duration Badge */}
        {reel.duration && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 70,
              right: 10,
              bgcolor: alpha(theme.palette.background.default, 0.7),
              color: theme.palette.text.primary,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '10px',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              zIndex: 3,
              display: isHovered ? 'block' : 'none',
              animation: 'fadeIn 0.3s ease-in-out',
            }}
          >
            {Math.floor(reel.duration / 60)}:{(reel.duration % 60).toString().padStart(2, '0')}
          </Box>
        )}

        {/* Play Button with Animation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'scale(1.1)' : 'scale(0.8)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <IconButton
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white',
              p: 2.5,
              boxShadow: isHovered
                ? theme.palette.mode === 'dark'
                  ? `0 0 30px ${alpha(theme.palette.primary.main, 0.6)}`
                  : `0 0 30px ${alpha(theme.palette.primary.main, 0.4)}`
                : 'none',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                transform: 'scale(1.1) rotate(10deg)'
              },
              animation: isHovered ? 'pulse 2s infinite' : 'none',
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 36 }} />
          </IconButton>
        </Box>

        {/* Action Buttons (only visible on hover) */}
        <Box
          sx={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 5
          }}
        >
          <Tooltip title={liked ? "Unlike" : "Like"} placement="left">
            <IconButton
              onClick={handleLike}
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(4px)',
                color: liked ? theme.palette.error.main : theme.palette.text.primary,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'scale(1.15)',
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                },
                animation: liked ? 'heartBeat 0.3s' : 'none',
                '@keyframes heartBeat': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.3)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Comment" placement="left">
            <IconButton
              onClick={handleComment}
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  color: theme.palette.primary.main,
                },
              }}
            >
              <CommentIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Share" placement="left">
            <IconButton
              onClick={handleShare}
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(15deg)',
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  color: theme.palette.info.main,
                },
              }}
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={bookmarked ? "Unsave" : "Save"} placement="left">
            <IconButton
              onClick={handleBookmark}
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(4px)',
                color: bookmarked ? theme.palette.primary.main : theme.palette.text.primary,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'scale(1.15)',
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                },
                animation: bookmarked ? 'pop 0.3s' : 'none',
                '@keyframes pop': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.3)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Info and Stats */}
        <Box sx={{ zIndex: 2 }}>
          {/* Caption Preview (only visible on hover) */}
          {isHovered && reel.caption && (
            <Typography
              variant="body2"
              sx={{
                mb: 1.5,
                opacity: 0.95,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: theme.palette.text.primary,
                fontWeight: 500,
                fontSize: '0.85rem',
                lineHeight: 1.4,
                animation: 'fadeIn 0.3s ease-in-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 0.95, transform: 'translateY(0)' }
                }
              }}
            >
              {reel.caption}
            </Typography>
          )}

          {/* User */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1.5,
            background: alpha(theme.palette.background.paper, 0.4),
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            p: 0.8,
            pl: 0.5,
            pr: 1.5,
            width: 'fit-content',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            transform: isHovered ? 'translateY(0)' : 'translateY(5px)',
            opacity: isHovered ? 1 : 0.9,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={reel.user?.profilePicture || reel.user?.avatar || '/assets/default-avatar.png'}
                alt={reel.user?.username || 'User'}
                sx={{
                  width: 36,
                  height: 36,
                  mr: 1,
                  border: '2px solid',
                  borderColor: theme.palette.background.paper,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(99, 102, 241, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  }
                }}
              />
              {reel.user?.isVerified && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 6,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    borderRadius: '50%',
                    width: 14,
                    height: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <VerifiedIcon sx={{ fontSize: 8, color: 'white' }} />
                </Box>
              )}
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.text.primary,
                  fontSize: '0.85rem',
                  lineHeight: 1.2,
                }}
              >
                {reel.user?.username || 'User'}
              </Typography>
              {reel.createdAt && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                    display: 'block',
                    mt: 0.2,
                  }}
                >
                  {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Stats with Tooltips */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              opacity: isHovered ? 1 : 0.9,
              transition: 'all 0.3s ease',
              background: alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              p: 1,
              px: 1.5,
              width: 'fit-content',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transform: isHovered ? 'translateX(0)' : 'translateX(-5px)',
            }}
          >
            <Tooltip
              title="Likes"
              placement="top"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
                    color: theme.palette.text.primary,
                    boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(99, 102, 241, 0.2)',
                    borderRadius: 2,
                    p: 1,
                    backdropFilter: 'blur(8px)',
                    '& .MuiTooltip-arrow': {
                      color: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
                    }
                  }
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    mr: 0.5,
                  }}
                >
                  <FavoriteIcon
                    fontSize="small"
                    sx={{
                      color: theme.palette.error.main,
                      fontSize: '0.9rem',
                      animation: isHovered ? 'heartBeat 1.5s infinite' : 'none',
                      '@keyframes heartBeat': {
                        '0%': { transform: 'scale(1)' },
                        '14%': { transform: 'scale(1.3)' },
                        '28%': { transform: 'scale(1)' },
                        '42%': { transform: 'scale(1.3)' },
                        '70%': { transform: 'scale(1)' },
                      }
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.text.primary,
                    fontSize: '0.75rem',
                  }}
                >
                  {reel.likesCount || 0}
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip
              title="Comments"
              placement="top"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
                    color: theme.palette.text.primary,
                    boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(99, 102, 241, 0.2)',
                    borderRadius: 2,
                    p: 1,
                    backdropFilter: 'blur(8px)',
                    '& .MuiTooltip-arrow': {
                      color: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
                    }
                  }
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    mr: 0.5,
                  }}
                >
                  <CommentIcon
                    fontSize="small"
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '0.9rem',
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.text.primary,
                    fontSize: '0.75rem',
                  }}
                >
                  {reel.commentsCount || 0}
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip
              title="Views"
              placement="top"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
                    color: theme.palette.text.primary,
                    boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(99, 102, 241, 0.2)',
                    borderRadius: 2,
                    p: 1,
                    backdropFilter: 'blur(8px)',
                    '& .MuiTooltip-arrow': {
                      color: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
                    }
                  }
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    mr: 0.5,
                  }}
                >
                  <VisibilityIcon
                    fontSize="small"
                    sx={{
                      color: theme.palette.info.main,
                      fontSize: '0.9rem',
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.text.primary,
                    fontSize: '0.75rem',
                  }}
                >
                  {formatViewCount(reel.viewsCount || 0)}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Card>
  );
});

export default ReelPreview;
