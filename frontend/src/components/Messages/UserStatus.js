import React, { useState, useEffect } from 'react';
import { Box, Typography, Badge, Avatar, Skeleton, Tooltip } from '@mui/material';
import { keyframes } from '@mui/system';
import ProfilePicture from '../common/ProfilePicture';

// Define pulse animation
const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

const UserStatus = ({ user, size = 'medium', showUsername = false, showLastSeen = false, showFullInfo = false }) => {
  // Initialize all hooks at the top level
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image states when user changes
  useEffect(() => {
    if (user) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [user?._id]);

  // If no user is provided, return a placeholder
  if (!user) {
    // Determine avatar size based on prop
    let avatarSize = {};
    switch (size) {
      case 'small':
        avatarSize = { width: 32, height: 32 };
        break;
      case 'large':
        avatarSize = { width: 56, height: 56 };
        break;
      case 'medium':
      default:
        avatarSize = { width: 40, height: 40 };
        break;
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={avatarSize} />
        {showUsername && (
          <Box sx={{ ml: 1.5 }}>
            <Typography variant="subtitle2">User</Typography>
          </Box>
        )}
      </Box>
    );
  }

  // We'll use the ProfilePicture component directly, which handles all fallbacks

  // Format last seen time
  const formatLastSeen = (lastSeenTime) => {
    if (!lastSeenTime) return 'Offline';

    const lastSeen = new Date(lastSeenTime);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
      return lastSeen.toLocaleDateString();
    }
  };

  // Determine avatar size based on prop
  const getAvatarSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32 };
      case 'large':
        return { width: 56, height: 56 };
      case 'medium':
      default:
        return { width: 40, height: 40 };
    }
  };

  // Determine badge size based on avatar size
  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 8, height: 8 };
      case 'large':
        return { width: 14, height: 14 };
      case 'medium':
      default:
        return { width: 10, height: 10 };
    }
  };

  // Get display name with fallbacks
  const getDisplayName = () => {
    if (!user) return 'User';
    return user.username || user.fullName || user.name || user.email?.split('@')[0] || 'User';
  };

  // Get user info for tooltip
  const getUserInfo = () => {
    if (!user) return 'User';

    let info = [];
    if (user.fullName && user.fullName !== user.username) info.push(user.fullName);
    if (user.email) info.push(user.email);
    if (user.bio) info.push(user.bio);
    if (user.isOnline) info.push('Online');
    else if (user.lastSeen) info.push(`Last seen: ${formatLastSeen(user.lastSeen)}`);

    return info.join(' • ');
  };

  return (
    <Tooltip title={getUserInfo()} arrow placement="top">
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color={user?.isOnline ? 'success' : 'default'}
          invisible={!user?.isOnline}
          sx={{
            '& .MuiBadge-dot': {
              ...getBadgeSize(),
              border: '2px solid white',
              animation: user?.isOnline ? `${pulseAnimation} 2s infinite` : 'none'
            }
          }}
        >
          <ProfilePicture
            user={user}
            alt={getDisplayName()}
            linkToProfile={false}
            size={getAvatarSize()}
            sx={{
              border: user?.isOnline ? '2px solid #4caf50' : 'none',
              transition: 'all 0.3s ease'
            }}
          />
        </Badge>

        {(showUsername || showLastSeen || showFullInfo) && (
          <Box sx={{ ml: 1.5 }}>
            {(showUsername || showFullInfo) && (
              <Typography
                variant="subtitle2"
                sx={{
                  lineHeight: 1.2,
                  fontWeight: user?.isOnline ? 600 : 400,
                  color: user?.isOnline ? 'text.primary' : 'text.secondary'
                }}
              >
                {getDisplayName()}
              </Typography>
            )}

            {showFullInfo && user?.fullName && user?.fullName !== getDisplayName() && (
              <Typography variant="caption" color="text.secondary">
                {user.fullName}
              </Typography>
            )}

            {(showLastSeen || showFullInfo) && (
              <Typography
                variant="caption"
                color={user?.isOnline ? 'success.main' : 'text.secondary'}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {user?.isOnline ? (
                  <>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        mr: 0.5,
                        animation: `${pulseAnimation} 1.5s infinite ease-in-out`
                      }}
                    />
                    Active now
                  </>
                ) : (
                  formatLastSeen(user?.lastSeen)
                )}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default UserStatus;
