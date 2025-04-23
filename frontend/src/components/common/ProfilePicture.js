import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import { Link } from 'react-router-dom';
import { VerifiedUser as VerifiedIcon } from '@mui/icons-material';
import { getCompleteProfilePictureUrl } from '../../utils/profilePictureHelper';

/**
 * Reusable ProfilePicture component that handles loading, errors, and verification badges
 *
 * @param {Object} props - Component props
 * @param {string} props.src - Source URL for the profile picture
 * @param {Object} props.user - User object (alternative to src)
 * @param {string} props.alt - Alt text for the profile picture
 * @param {string} props.username - Username for linking to profile
 * @param {boolean} props.isVerified - Whether the user is verified
 * @param {boolean} props.linkToProfile - Whether to link to the user's profile
 * @param {string} props.size - Size of the avatar ('small', 'medium', 'large', or custom object)
 * @param {Object} props.sx - Additional MUI styling
 */
const ProfilePicture = ({
  src,
  user,
  alt = 'User',
  username,
  isVerified = false,
  linkToProfile = true,
  size = 'medium',
  sx = {},
  ...props
}) => {
  const [error, setError] = useState(false);

  // Get the profile picture URL with cache busting
  let pictureUrl;
  try {
    pictureUrl = user ? getCompleteProfilePictureUrl(user, size) : src;
  } catch (error) {
    console.error('Error getting profile picture URL:', error);
    pictureUrl = '/assets/default-avatar.png';
    setError(true);
  }

  // Get username from user object if not provided directly
  const displayUsername = username || (user && user.username) || '';

  // Get isVerified from user object if not provided directly
  const displayIsVerified = isVerified || (user && user.isVerified) || false;

  // Handle image loading error
  const handleError = () => {
    console.warn(`Profile picture failed to load: ${pictureUrl}`);
    setError(true);

    // If this is a user's profile picture, log the error
    if (user && user._id) {
      console.info(`Profile picture error for user ${user.username || user._id}`);
    }
  };

  // Determine avatar size based on the size prop
  let avatarSize = {};
  switch (size) {
    case 'small':
      avatarSize = { width: 32, height: 32 };
      break;
    case 'medium':
      avatarSize = { width: 40, height: 40 };
      break;
    case 'large':
      avatarSize = { width: 56, height: 56 };
      break;
    case 'xlarge':
      avatarSize = { width: 80, height: 80 };
      break;
    default:
      // If size is an object, use it directly
      if (typeof size === 'object') {
        avatarSize = size;
      } else {
        avatarSize = { width: 40, height: 40 };
      }
  }

  // Create the avatar element
  const avatarElement = (
    <Box sx={{ position: 'relative' }}>
      <Avatar
        src={error ? '/assets/default-avatar.png' : pictureUrl}
        alt={alt || displayUsername}
        onError={handleError}
        sx={{
          ...avatarSize,
          border: '1px solid',
          borderColor: 'divider',
          ...sx
        }}
        {...props}
      />

      {displayIsVerified && (
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Box
              sx={{
                bgcolor: 'primary.main',
                borderRadius: '50%',
                width: avatarSize.width > 40 ? 16 : 14,
                height: avatarSize.width > 40 ? 16 : 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid white'
              }}
            >
              <VerifiedIcon sx={{ fontSize: avatarSize.width > 40 ? 12 : 10, color: 'white' }} />
            </Box>
          }
        >
          <Box /> {/* Empty box needed for badge positioning */}
        </Badge>
      )}
    </Box>
  );

  // If linkToProfile is true and username is provided, wrap in Link
  if (linkToProfile && displayUsername) {
    return (
      <Link to={`/profile/${displayUsername}`} style={{ textDecoration: 'none' }}>
        {avatarElement}
      </Link>
    );
  }

  // Otherwise, return the avatar element directly
  return avatarElement;
};

export default ProfilePicture;
