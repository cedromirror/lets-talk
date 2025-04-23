import React, { useState } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  ChatBubbleOutline as CommentIcon,
  PlayArrow as PlayArrowIcon,
  Bookmark as BookmarkIcon,
  LocalFireDepartment as FireIcon,
  Visibility as VisibilityIcon,
  EmojiEmotions as EmojiIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const ReelPreview = ({ reel, showSavedBadge = false, showTrendingBadge = false, trendingRank = null }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Format view count with K, M suffix
  const formatViewCount = (count) => {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <Card
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        height: { xs: 280, sm: 320 },
        width: '100%',
        boxShadow: isHovered
          ? '0 10px 30px rgba(0,0,0,0.2), 0 0 20px rgba(168,65,255,0.2)'
          : '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 15px 35px rgba(0,0,0,0.2), 0 0 25px rgba(168,65,255,0.3)'
        }
      }}
      onClick={() => navigate(`/reels/${reel._id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Reel Thumbnail with Blur Effect on Hover */}
      <CardMedia
        component="img"
        image={reel.thumbnail || '/assets/default-reel-thumbnail.jpg'}
        alt={reel.caption || 'Reel'}
        sx={{
          height: '100%',
          objectFit: 'cover',
          transition: 'all 0.5s ease',
          filter: isHovered ? 'brightness(0.85) saturate(1.2)' : 'none',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      />

      {/* Saved Badge */}
      {showSavedBadge && (
        <Chip
          icon={<BookmarkIcon fontSize="small" />}
          label="Saved"
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            backgroundColor: 'rgba(25, 118, 210, 0.9)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            '& .MuiChip-icon': {
              color: 'white'
            }
          }}
        />
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
            icon={<FireIcon fontSize="small" sx={{ color: '#FF6B6B !important' }} />}
            label={trendingRank ? `#${trendingRank} Trending` : (reel.likesCount > 10 ? `${reel.likesCount} Likes` : (reel.viewsCount > 100 ? `${formatViewCount(reel.viewsCount)} Views` : 'Trending'))}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 107, 107, 0.9)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              '& .MuiChip-icon': {
                color: 'white'
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
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)'
            : 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Play Button with Animation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            opacity: isHovered ? 1 : 0.7,
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}
        >
          <IconButton
            sx={{
              bgcolor: 'rgba(168, 65, 255, 0.7)',
              color: 'white',
              p: 2,
              boxShadow: isHovered ? '0 0 20px rgba(168, 65, 255, 0.5)' : 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: 'rgba(168, 65, 255, 0.9)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <PlayArrowIcon fontSize="large" />
          </IconButton>
        </Box>

        {/* User Info and Stats */}
        <Box sx={{ zIndex: 2 }}>
          {/* Caption Preview (only visible on hover) */}
          {isHovered && reel.caption && (
            <Typography
              variant="body2"
              color="white"
              sx={{
                mb: 1,
                opacity: 0.9,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textShadow: '0 1px 3px rgba(0,0,0,0.7)'
              }}
            >
              {reel.caption}
            </Typography>
          )}

          {/* User */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={reel.user?.profilePicture || reel.user?.avatar || '/assets/default-avatar.png'}
              alt={reel.user?.username || 'User'}
              sx={{
                width: 32,
                height: 32,
                mr: 1,
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            />
            <Typography
              variant="subtitle2"
              color="white"
              sx={{
                fontWeight: 'bold',
                textShadow: '0 1px 3px rgba(0,0,0,0.7)'
              }}
            >
              {reel.user?.username || 'User'}
            </Typography>
          </Box>

          {/* Stats with Tooltips */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              opacity: isHovered ? 1 : 0.9,
              transition: 'opacity 0.3s ease'
            }}
          >
            <Tooltip title="Likes">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FavoriteIcon
                  fontSize="small"
                  sx={{
                    color: '#FF6B6B',
                    mr: 0.5,
                    animation: isHovered ? 'pulse 1.5s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.2)' },
                      '100%': { transform: 'scale(1)' }
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  color="white"
                  sx={{ fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                >
                  {reel.likesCount || 0}
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip title="Comments">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CommentIcon fontSize="small" sx={{ color: 'white', mr: 0.5 }} />
                <Typography
                  variant="caption"
                  color="white"
                  sx={{ fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                >
                  {reel.commentsCount || 0}
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip title="Views">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VisibilityIcon fontSize="small" sx={{ color: 'white', mr: 0.5 }} />
                <Typography
                  variant="caption"
                  color="white"
                  sx={{ fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
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
};

export default ReelPreview;
