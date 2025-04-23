import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Chip
} from '@mui/material';
import {
  Favorite as LikeIcon,
  ChatBubbleOutline as CommentIcon,
  Person as FollowIcon,
  Notifications as NotificationIcon,
  AlternateEmail as MentionIcon,
  Tag as TagIcon,
  Email as MessageIcon,
  Videocam as LiveIcon,
  Photo as PostIcon,
  Movie as ReelIcon,
  PhotoLibrary as StoryIcon,
  Visibility as ViewIcon,
  Campaign as AnnouncementIcon,
  MarkChatRead as ReadIcon,
  MarkChatUnread as UnreadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';

const NotificationItem = ({ notification, onDelete }) => {
  const { markAsRead, getNotificationLink, formatNotificationText } = useNotifications();

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like_post':
      case 'like_comment':
      case 'like_reel':
        return <LikeIcon color="error" />;
      case 'comment_post':
      case 'comment_reel':
      case 'reply_comment':
      case 'story_reply':
        return <CommentIcon color="primary" />;
      case 'follow_request':
      case 'follow_accept':
      case 'new_follower':
        return <FollowIcon color="secondary" />;
      case 'mention_post':
      case 'mention_comment':
      case 'mention_story':
        return <MentionIcon color="info" />;
      case 'tag_post':
        return <TagIcon color="info" />;
      case 'new_message':
        return <MessageIcon color="primary" />;
      case 'live_started':
      case 'live_from_following':
        return <LiveIcon color="error" />;
      case 'post_from_following':
        return <PostIcon color="primary" />;
      case 'reel_from_following':
        return <ReelIcon color="secondary" />;
      case 'story_from_following':
        return <StoryIcon color="info" />;
      case 'story_view':
        return <ViewIcon color="action" />;
      case 'system_announcement':
        return <AnnouncementIcon color="warning" />;
      case 'content_digest':
        return <NotificationIcon color="info" />;
      default:
        return <NotificationIcon color="action" />;
    }
  };

  // Format time
  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notification.read) {
      markAsRead(notification._id);
    }
  };

  // Handle delete
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification._id);
    }
  };

  return (
    <Paper
      component={Link}
      to={getNotificationLink(notification)}
      onClick={() => !notification.read && markAsRead(notification._id)}
      elevation={notification.read ? 0 : 1}
      sx={{
        display: 'flex',
        p: 2,
        mb: 1,
        borderRadius: 2,
        textDecoration: 'none',
        color: 'text.primary',
        position: 'relative',
        transition: 'all 0.2s ease',
        bgcolor: notification.read ? 'background.paper' : 'action.hover',
        '&:hover': {
          bgcolor: 'action.hover',
          transform: 'translateY(-2px)',
          boxShadow: 2
        }
      }}
    >
      {/* Notification Icon */}
      <Box
        sx={{
          mr: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: notification.read ? 'action.selected' : 'primary.light',
          color: 'white'
        }}
      >
        {getNotificationIcon(notification.type)}
      </Box>

      {/* Notification Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          {/* Sender Avatar */}
          {notification.sender && (
            <Avatar
              src={notification.sender.avatar || notification.sender.profilePicture}
              alt={notification.sender.username}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
          )}

          {/* Notification Text */}
          <Typography variant="body2" noWrap sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              {notification.sender?.username || 'System'}
            </Box>{' '}
            {formatNotificationText(notification)}
          </Typography>
        </Box>

        {/* Timestamp */}
        <Typography variant="caption" color="text.secondary">
          {formatTime(notification.createdAt)}
        </Typography>

        {/* Content Preview (if available) */}
        {notification.content?.postImage && (
          <Box sx={{ mt: 1 }}>
            <img
              src={notification.content.postImage}
              alt="Content"
              style={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 4
              }}
            />
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {!notification.read ? (
          <Tooltip title="Mark as read">
            <IconButton size="small" onClick={handleMarkAsRead} sx={{ mr: 1 }}>
              <ReadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Mark as unread">
            <IconButton size="small" onClick={handleMarkAsRead} sx={{ mr: 1 }}>
              <UnreadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Delete">
          <IconButton size="small" onClick={handleDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Unread Indicator */}
      {!notification.read && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: -4,
            transform: 'translateY(-50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.main'
          }}
        />
      )}
    </Paper>
  );
};

export default NotificationItem;
