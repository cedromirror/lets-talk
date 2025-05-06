import React from 'react';
import { Box, Avatar, Typography, Badge, Tooltip, keyframes, useTheme, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  VideocamRounded as VideocamIcon,
  ImageRounded as ImageIcon,
  AutoAwesomeRounded as SparkleIcon
} from '@mui/icons-material';

// Define animations
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
`;

// Styled components
const StoryRing = styled(Box)(({ theme, seen, type, isNew }) => ({
  position: 'relative',
  borderRadius: '50%',
  padding: 4,
  background: seen
    ? theme.palette.mode === 'dark'
      ? 'linear-gradient(to right, #333, #444)'
      : 'linear-gradient(to right, #ddd, #eee)'
    : type === 'video'
      ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` // Modern gradient for videos
      : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.tertiary.main})`, // Modern gradient for images
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  animation: isNew ? `${pulse} 2s infinite` : 'none',
  '&:hover': {
    transform: 'scale(1.08) rotate(3deg)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 16px rgba(0, 0, 0, 0.3)'
      : '0 8px 16px rgba(99, 102, 241, 0.3)'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: '50%',
    background: 'transparent',
    border: '2px solid transparent',
    opacity: isNew ? 1 : 0,
    animation: isNew ? `${rotate} 10s linear infinite` : 'none',
  }
}));

const StoryCircle = ({ story, onClick, isNew }) => {
  const theme = useTheme();

  // Handle missing story data
  if (!story) {
    return null;
  }

  const user = story?.user || {};
  const seen = story?.isViewed || story?.seen || false;
  const storyType = story?.type || 'image';

  // Handle invalid or missing date
  let createdAt;
  try {
    createdAt = story?.createdAt ? new Date(story.createdAt) : new Date();
    // Check if date is valid
    if (isNaN(createdAt.getTime())) {
      createdAt = new Date(); // Fallback to current date if invalid
    }
  } catch (error) {
    console.error('Error parsing story date:', error);
    createdAt = new Date();
  }

  const timeAgo = getTimeAgo(createdAt);

  // Calculate if the story is new (less than 10 minutes old)
  const isRecentlyCreated = isNew || (Date.now() - createdAt.getTime() < 10 * 60 * 1000);

  return (
    <Tooltip
      title={`${user.username}'s ${storyType} story - ${timeAgo}`}
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
            color: theme.palette.text.primary,
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(99, 102, 241, 0.2)',
            borderRadius: 2,
            p: 1.5,
            backdropFilter: 'blur(8px)',
            '& .MuiTooltip-arrow': {
              color: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
            }
          }
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mx: 1.5,
          minWidth: 80,
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            transform: isRecentlyCreated ? 'translateY(-5px)' : 'translateY(-3px)',
          },
          animation: isRecentlyCreated ? `${bounce} 2s ease-in-out infinite` : 'none',
        }}
        onClick={() => onClick && onClick(story)}
      >
        <StoryRing seen={seen} type={storyType} isNew={isRecentlyCreated}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  background: storyType === 'video'
                    ? `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`
                    : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  color: 'white',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 8px rgba(0, 0, 0, 0.3)'
                    : '0 4px 8px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  }
                }}
              >
                {storyType === 'video' ? (
                  <VideocamIcon sx={{ fontSize: 12 }} />
                ) : (
                  <ImageIcon sx={{ fontSize: 12 }} />
                )}
              </Box>
            }
          >
            <Avatar
              src={user.profilePicture || user.avatar || '/assets/default-avatar.png'}
              alt={user.username || 'User'}
              sx={{
                width: 64,
                height: 64,
                border: '3px solid white',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                  : '0 4px 12px rgba(99, 102, 241, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            />
          </Badge>
        </StoryRing>

        {isRecentlyCreated && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '3px 8px',
              borderRadius: '12px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 8px rgba(0, 0, 0, 0.3)'
                : '0 4px 8px rgba(16, 185, 129, 0.3)',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <SparkleIcon sx={{ fontSize: 12 }} />
            NEW
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            mt: 1.5,
            maxWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            fontWeight: isRecentlyCreated ? 700 : 500,
            fontSize: '0.75rem',
            color: theme => isRecentlyCreated
              ? theme.palette.primary.main
              : theme.palette.text.primary,
            transition: 'all 0.2s ease',
            '&:hover': {
              color: theme.palette.primary.main,
            }
          }}
        >
          {user.username || 'User'}
        </Typography>
      </Box>
    </Tooltip>
  );
};

// Helper function to format time ago
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return date.toLocaleDateString();
};

export default StoryCircle;
