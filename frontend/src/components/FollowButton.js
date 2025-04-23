import React, { useState, useEffect } from 'react';
import { getResponsiveImageUrl } from '../utils/cloudinaryHelper';
import { keyframes } from '@emotion/react';
import {
  Button,
  CircularProgress,
  Tooltip,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Snackbar,
  Alert,
  Badge
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  HourglassEmpty as PendingIcon,
  Check as CheckIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { userService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';

// Define animations
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const glowAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

// Initialize socket service if token exists
const initSocket = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      if (typeof socketService.connect === 'function') {
        console.log('Initializing socket connection...');
        socketService.connect();
      } else {
        console.warn('Socket connect function not available');
      }
    } catch (error) {
      console.error('Error initializing socket:', error);
      // Don't let socket errors prevent the component from working
    }
  } else {
    console.warn('No token available for socket initialization');
  }
};

/**
 * A reusable follow button component with modern UI and animations
 */
const FollowButton = ({
  user,
  size = 'small',
  fullWidth = false,
  showIcon = true,
  variant = 'default',
  onFollowChange = () => {},
  hideText = false,
  sx = {}
}) => {
  // Initialize all hooks at the top level
  const [loading, setLoading] = useState(false);
  // Use optional chaining and nullish coalescing to safely handle user being null/undefined
  const [followStatus, setFollowStatus] = useState((user && user.isFollowing === true) ? 'following' : 'not_following');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  // Initialize socket when component mounts
  useEffect(() => {
    initSocket();
  }, []);

  // Check if user is null or undefined
  if (!user) {
    console.error('FollowButton: user prop is null or undefined');
    // Return a placeholder or empty component instead of null
    return <span style={{ display: 'none' }}></span>;
  }

  // Handle follow/unfollow action
  const handleFollowAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // If already following, show confirmation dialog
    if (followStatus === 'following') {
      setConfirmDialogOpen(true);
      return;
    }

    // Otherwise proceed with follow
    await toggleFollow();
  };

  // Handle unfollow confirmation
  const handleConfirmUnfollow = async () => {
    setConfirmDialogOpen(false);
    await toggleFollow();
  };

  // Toggle follow status
  const toggleFollow = async () => {
    if (loading) return;

    setLoading(true);

    // Determine the new status before making any changes
    const newFollowStatus = followStatus === 'following' ? 'not_following' : 'following';

    // Variable to store the API response
    let apiResponse = null;

    try {
      // Optimistic update
      setFollowStatus(newFollowStatus);

      // Call API
      if (followStatus === 'following') {
        // Check if user._id or username exists
        if (!user._id && !user.username) {
          throw new Error('User ID and username are missing');
        }

        try {
          // Try with ID first
          if (user._id) {
            apiResponse = await userService.unfollowUser(user._id);
            console.log('Unfollow response:', apiResponse.data);

            // Show success message
            setSnackbarMessage(`You unfollowed ${user.username || 'this user'}`);
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
          } else {
            // Fall back to username
            apiResponse = await userService.unfollowUser(user.username);
            console.log('Unfollow response (using username):', apiResponse.data);

            // Show success message
            setSnackbarMessage(`You unfollowed ${user.username || 'this user'}`);
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
          }
        } catch (unfollowError) {
          console.error('Error in primary unfollow method:', unfollowError);

          // If ID fails, try username as fallback
          if (user._id && user.username) {
            console.log('Trying unfollow with username instead of ID');
            apiResponse = await userService.unfollowUser(user.username);
            console.log('Unfollow response (fallback to username):', apiResponse.data);

            // Show success message
            setSnackbarMessage(`You unfollowed ${user.username || 'this user'}`);
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
          } else {
            // Re-throw if we can't try an alternative
            throw unfollowError;
          }
        }
      } else {
        // Check if user._id or username exists
        if (!user._id && !user.username) {
          throw new Error('User ID and username are missing');
        }

        try {
          // Try with ID first
          if (user._id) {
            const response = await userService.followUser(user._id);
            console.log('Follow response:', response.data);

            // Update status based on response
            if (response.data && response.data.status === 'pending') {
              setFollowStatus('pending');
              setSnackbarMessage(`Follow request sent to ${user.username || 'this user'}`);
            } else {
              setSnackbarMessage(`You are now following ${user.username || 'this user'}. Their posts and reels will appear in your home feed.`);
            }

            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } else {
            // Fall back to username
            const response = await userService.followUser(user.username);
            console.log('Follow response (using username):', response.data);

            // Update status based on response
            if (response.data && response.data.status === 'pending') {
              setFollowStatus('pending');
              setSnackbarMessage(`Follow request sent to ${user.username || 'this user'}`);
            } else {
              setSnackbarMessage(`You are now following ${user.username || 'this user'}. Their posts and reels will appear in your home feed.`);
            }

            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          }
        } catch (followError) {
          console.error('Error in primary follow method:', followError);

          // If ID fails, try username as fallback
          if (user._id && user.username) {
            console.log('Trying follow with username instead of ID');
            const response = await userService.followUser(user.username);
            console.log('Follow response (fallback to username):', response.data);

            // Update status based on response
            if (response.data && response.data.status === 'pending') {
              setFollowStatus('pending');
              setSnackbarMessage(`Follow request sent to ${user.username || 'this user'}`);
            } else {
              setSnackbarMessage(`You are now following ${user.username || 'this user'}. Their posts and reels will appear in your home feed.`);
            }

            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } else {
            // Re-throw if we can't try an alternative
            throw followError;
          }
        }
      }

      // Notify parent component with updated counts if available
      onFollowChange({
        userId: user._id,
        status: newFollowStatus,
        followerCount: apiResponse?.data?.data?.followerCount,
        followingCount: apiResponse?.data?.data?.followingCount
      });

      // Emit socket event for real-time updates if socket service is available
      try {
        if (socketService && typeof socketService.emitEvent === 'function') {
          socketService.emitEvent('user:follow_status_change', {
            targetUserId: user._id,
            status: newFollowStatus,
            followerCount: newFollowStatus === 'following' ? 1 : -1
          });
        }
      } catch (socketError) {
        console.error('Socket error:', socketError);
        // Don't fail the whole operation if socket fails
      }

    } catch (error) {
      console.error('Error toggling follow status:', error);

      // Revert optimistic update
      setFollowStatus(followStatus);

      // Show detailed error message
      let errorMessage = 'Failed to update follow status. Please try again.';

      // Extract more specific error message if available
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = `API Error: ${error.response.data.message}`;
        console.error('API Error Details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.response.config?.url
        });
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      // Check for specific error types
      if (error.response && error.response.status === 404) {
        errorMessage = 'API endpoint not found. Please check your connection.';
      } else if (error.response && error.response.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
        // Attempt to refresh the token or redirect to login
        const token = localStorage.getItem('token');
        if (!token) {
          errorMessage += ' (No token found)';
        }
      } else if (error.message && error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // View profile handler
  const handleViewProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if username exists before navigating
    if (user && user.username) {
      navigate(`/profile/${user.username}`);
    } else {
      console.error('Cannot navigate to profile: username is undefined');
    }
  };

  // Determine button appearance based on follow status
  const getButtonProps = () => {
    switch (followStatus) {
      case 'following':
        return {
          variant: "outlined",
          color: "primary",
          startIcon: showIcon ? <CheckIcon fontSize="small" /> : null,
          label: hideText ? '' : 'Following',
          hoverLabel: hideText ? '' : 'Unfollow',
          hoverColor: 'error',
          animation: 'none',
          badgeContent: <FavoriteIcon fontSize="small" sx={{ fontSize: '0.6rem', color: '#ff4081' }} />,
          badgeColor: 'transparent'
        };
      case 'pending':
        return {
          variant: "outlined",
          color: "secondary",
          startIcon: showIcon ? <PendingIcon fontSize="small" /> : null,
          label: hideText ? '' : 'Requested',
          hoverLabel: hideText ? '' : 'Cancel Request',
          hoverColor: 'error',
          animation: 'none',
          badgeContent: null,
          badgeColor: 'transparent'
        };
      default:
        return {
          variant: "contained",
          color: "primary",
          startIcon: showIcon ? <PersonAddIcon fontSize="small" /> : null,
          label: hideText ? '' : 'Follow',
          hoverLabel: hideText ? '' : 'Follow',
          hoverColor: 'primary',
          animation: `${pulseAnimation} 2s infinite ease-in-out`,
          badgeContent: null,
          badgeColor: 'transparent'
        };
    }
  };

  const buttonProps = getButtonProps();

  // Custom styling based on variant
  const getCustomSx = () => {
    switch (variant) {
      case 'minimal':
        return {
          minWidth: hideText ? '36px' : '80px',
          borderRadius: '50px',
          ...sx
        };
      case 'profile':
        return {
          minWidth: hideText ? '40px' : '100px',
          borderRadius: '8px',
          fontWeight: 600,
          ...sx
        };
      default:
        return {
          minWidth: hideText ? '36px' : '80px',
          ...sx
        };
    }
  };

  return (
    <>
      <Tooltip title={buttonProps.label}>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Badge
            badgeContent={buttonProps.badgeContent}
            color={buttonProps.badgeColor}
            overlap="circular"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiBadge-badge': {
                border: '2px solid white',
                padding: 0,
                minWidth: 16,
                height: 16,
                borderRadius: '50%',
              }
            }}
          >
            <Button
              variant={buttonProps.variant}
              color={buttonProps.color}
              size={size}
              fullWidth={fullWidth}
              startIcon={buttonProps.startIcon}
              onClick={handleFollowAction}
              disabled={loading}
              sx={{
                ...getCustomSx(),
                animation: buttonProps.animation,
                transition: 'all 0.3s ease',
                boxShadow: followStatus === 'not_following' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                '&:hover': {
                  backgroundColor: followStatus === 'following' ? 'error.main' : undefined,
                  color: followStatus === 'following' ? 'white' : undefined,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  '& .MuiButton-startIcon': {
                    color: followStatus === 'following' ? 'white' : undefined
                  }
                }
              }}
            >
              {loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Box sx={{
                  position: 'relative',
                  display: 'inline-block',
                  '& .hover-text': {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  },
                  '&:hover .default-text': {
                    opacity: 0
                  },
                  '&:hover .hover-text': {
                    opacity: 1
                  }
                }}>
                  {!hideText && (
                    <>
                      <span className="default-text">{buttonProps.label}</span>
                      <span className="hover-text">{buttonProps.hoverLabel}</span>
                    </>
                  )}
                </Box>
              )}
            </Button>
          </Badge>
        </Box>
      </Tooltip>

      {/* Unfollow Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>Unfollow {user.username || 'this user'}?</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            src={user.avatar ? getResponsiveImageUrl(user.avatar, 'thumbnail') : '/assets/default-avatar.png'}
            alt={user.username || 'User'}
            sx={{ width: 80, height: 80, mb: 2 }}
          />
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Their posts will no longer appear in your home feed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            variant="outlined"
            fullWidth
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUnfollow}
            variant="contained"
            color="error"
            fullWidth
            sx={{ ml: 1 }}
          >
            Unfollow
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FollowButton;
