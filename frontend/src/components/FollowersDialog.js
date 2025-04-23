import React, { useState, useEffect } from 'react';
import { getResponsiveImageUrl } from '../utils/cloudinaryHelper';
import ProfilePicture from './common/ProfilePicture';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { userService } from '../services/api';
import FollowButton from './FollowButton';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socketService';

const FollowersDialog = ({
  open,
  onClose,
  userId,
  username,
  initialTab = 'followers'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Listen for follow/unfollow events
  useEffect(() => {
    if (!open) return;

    // Handler for follow status changes
    const handleFollowStatusChange = (data) => {
      console.log('FollowersDialog received follow status change event:', data);

      // Update followers list if the target user is in the list
      setFollowers(prev => {
        // Check if the target user is in the followers list
        const userIndex = prev.findIndex(user => user._id === data.targetUserId);
        if (userIndex === -1) return prev; // User not found in list

        // Create a new array with the updated user
        return prev.map(user =>
          user._id === data.targetUserId
            ? { ...user, isFollowing: data.status === 'following' }
            : user
        );
      });

      // Update following list if the target user is in the list
      setFollowing(prev => {
        // Check if the target user is in the following list
        const userIndex = prev.findIndex(user => user._id === data.targetUserId);
        if (userIndex === -1) return prev; // User not found in list

        // Create a new array with the updated user
        return prev.map(user =>
          user._id === data.targetUserId
            ? { ...user, isFollowing: data.status === 'following' }
            : user
        );
      });
    };

    // Subscribe to follow status change events
    const unsubscribe = socketService.subscribeToEvent('user:follow_status_change', handleFollowStatusChange);

    return () => {
      // Cleanup subscription when component unmounts or dialog closes
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [open]);

  // Fetch followers and following
  useEffect(() => {
    if (!open || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch followers
        const followersResponse = await userService.getFollowers(userId);
        setFollowers(followersResponse.data.followers || []);

        // Fetch following
        const followingResponse = await userService.getFollowing(userId);
        setFollowing(followingResponse.data.following || []);
      } catch (err) {
        console.error('Error fetching followers/following:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, userId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle follow/unfollow
  const handleFollowChange = ({ userId, status }) => {
    // Update followers list
    setFollowers(prev =>
      prev.map(user =>
        user._id === userId
          ? { ...user, isFollowing: status === 'following' }
          : user
      )
    );

    // Update following list
    setFollowing(prev =>
      prev.map(user =>
        user._id === userId
          ? { ...user, isFollowing: status === 'following' }
          : user
      )
    );
  };

  // Render user item
  const renderUserItem = (user) => (
    <ListItem
      key={user._id}
      sx={{
        py: 1.5,
        '&:hover': { bgcolor: 'action.hover' }
      }}
      secondaryAction={
        user._id !== currentUser?._id && (
          <FollowButton
            user={user}
            variant="minimal"
            onFollowChange={handleFollowChange}
          />
        )
      }
    >
      <ListItemAvatar>
        <ProfilePicture
          user={user}
          linkToProfile={true}
          size={{ width: 44, height: 44 }}
          sx={{
            border: '1px solid',
            borderColor: 'divider'
          }}
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            variant="subtitle2"
            component={Link}
            to={`/profile/${user.username}`}
            sx={{
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': { color: 'primary.main' }
            }}
          >
            {user.username}
          </Typography>
        }
        secondary={
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.fullName}
          </Typography>
        }
      />
    </ListItem>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
        p: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {username}'s Connections
        </Typography>
        <IconButton edge="end" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab
            label={`Followers ${followers.length > 0 ? `(${followers.length})` : ''}`}
            value="followers"
          />
          <Tab
            label={`Following ${following.length > 0 ? `(${following.length})` : ''}`}
            value="following"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" paragraph>
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <Box>
            {activeTab === 'followers' && (
              <List disablePadding>
                {followers.length > 0 ? (
                  followers.map((user, index) => (
                    <React.Fragment key={user._id}>
                      {renderUserItem(user)}
                      {index < followers.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No followers yet
                    </Typography>
                  </Box>
                )}
              </List>
            )}

            {activeTab === 'following' && (
              <List disablePadding>
                {following.length > 0 ? (
                  following.map((user, index) => (
                    <React.Fragment key={user._id}>
                      {renderUserItem(user)}
                      {index < following.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Not following anyone yet
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FollowersDialog;
