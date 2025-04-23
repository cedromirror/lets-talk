import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  Divider,
  Button,
  CircularProgress,
  Tooltip,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    refreshNotifications,
    getNotificationsByType
  } = useNotifications();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  // Handle notification icon click
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle view all click
  const handleViewAll = () => {
    navigate('/notifications');
    handleClose();
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Get filtered notifications
  const filteredNotifications = getNotificationsByType(activeTab);

  // Check if dropdown is open
  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  // Play animation when new notification arrives
  useEffect(() => {
    if (unreadCount > 0 && notificationRef.current) {
      notificationRef.current.classList.add('pulse');
      setTimeout(() => {
        if (notificationRef.current) {
          notificationRef.current.classList.remove('pulse');
        }
      }, 1000);
    }
  }, [unreadCount]);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          ref={notificationRef}
          aria-describedby={id}
          onClick={handleClick}
          size="large"
          color="inherit"
          sx={{
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' }
            }
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? (
              <NotificationsActiveIcon />
            ) : (
              <NotificationsIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            borderRadius: 2,
            boxShadow: 4,
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Notifications
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <CircularProgress size={20} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notification settings">
              <IconButton
                size="small"
                component={Link}
                to="/settings/notifications"
                onClick={handleClose}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper square elevation={0}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                py: 0
              }
            }}
          >
            <Tab label="All" value="all" />
            <Tab 
              label={
                <Badge badgeContent={getNotificationsByType('unread').length} color="error" max={99}>
                  <Box sx={{ pr: 1 }}>Unread</Box>
                </Badge>
              } 
              value="unread" 
              disabled={getNotificationsByType('unread').length === 0}
            />
            <Tab label="Likes" value="like" disabled={getNotificationsByType('like').length === 0} />
            <Tab label="Comments" value="comment" disabled={getNotificationsByType('comment').length === 0} />
            <Tab label="Follows" value="follow" disabled={getNotificationsByType('follow').length === 0} />
          </Tabs>
        </Paper>

        <Divider />

        {/* Notification List */}
        <List sx={{ p: 1, overflowY: 'auto', maxHeight: 320 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.slice(0, 5).map((notification) => (
              <ListItem key={notification._id} sx={{ p: 0.5 }}>
                <NotificationItem
                  notification={notification}
                  onClick={handleClose}
                />
              </ListItem>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                {activeTab === 'all'
                  ? 'No notifications yet'
                  : activeTab === 'unread'
                  ? 'No unread notifications'
                  : `No ${activeTab} notifications`}
              </Typography>
            </Box>
          )}
        </List>

        <Divider />

        {/* Footer */}
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleViewAll}
            sx={{ borderRadius: 2 }}
          >
            View All Notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationDropdown;
