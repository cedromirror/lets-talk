import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  PersonAdd as FollowIcon,
  Message as MessageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import UserStatus from './UserStatus';
import { userService } from '../../services/api';

const UserProfilePreview = ({ user, onClose, onStartConversation, currentUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch user details when component mounts
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        setError('No user data provided');
        setLoading(false);
        return;
      }

      if (!user._id) {
        setError('Invalid user data: missing ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Try to get more detailed user information
        const response = await userService.getUserProfile(user._id);
        setUserDetails(response.data);

        // Check if current user is following this user
        if (response.data.followers && currentUser) {
          const isFollowed = response.data.followers.some(
            follower => follower._id === currentUser._id ||
                       (follower.user && follower.user._id === currentUser._id)
          );
          setIsFollowing(isFollowed);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching user details:', err);
        // If we can't get detailed info, use the basic user info we already have
        setUserDetails(user);
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user, currentUser]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!userDetails || !userDetails._id) return;

    try {
      if (isFollowing) {
        await userService.unfollowUser(userDetails._id);
      } else {
        await userService.followUser(userDetails._id);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Error toggling follow status:', err);
    }
  };

  // Handle start conversation
  const handleStartConversation = () => {
    if (onStartConversation && userDetails) {
      onStartConversation(userDetails);
    }
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, maxWidth: 400, width: '100%', position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error || !userDetails) {
    return (
      <Paper elevation={3} sx={{ p: 3, maxWidth: 400, width: '100%', position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Typography color="error" align="center">
          {error || 'User information not available'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 400, width: '100%', position: 'relative' }}>
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Box sx={{ transform: 'scale(1.5)', mb: 3 }}>
          <UserStatus
            user={userDetails}
            size="large"
            showUsername={false}
            showLastSeen={false}
          />
        </Box>

        <Typography variant="h6" gutterBottom>
          {userDetails.username || 'User'}
        </Typography>

        {userDetails.fullName && userDetails.fullName !== userDetails.username && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {userDetails.fullName}
          </Typography>
        )}

        {userDetails.bio && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 1, mb: 2 }}
          >
            {userDetails.bio}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {userDetails.postsCount || userDetails.posts?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Posts
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {userDetails.followersCount || userDetails.followers?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Followers
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {userDetails.followingCount || userDetails.following?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Following
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant={isFollowing ? "outlined" : "contained"}
          color="primary"
          startIcon={<FollowIcon />}
          onClick={handleFollowToggle}
          sx={{ flex: 1 }}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<MessageIcon />}
          onClick={handleStartConversation}
          sx={{ flex: 1 }}
        >
          Message
        </Button>
      </Box>

      {userDetails.relationship && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={
              userDetails.relationship === 'mutual' ? 'You follow each other' :
              userDetails.relationship === 'follower' ? 'Follows you' :
              'You follow'
            }
            color={userDetails.relationship === 'mutual' ? 'primary' : 'default'}
            variant={userDetails.relationship === 'mutual' ? 'filled' : 'outlined'}
          />
        </Box>
      )}
    </Paper>
  );
};

export default UserProfilePreview;
