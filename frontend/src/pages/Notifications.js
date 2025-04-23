import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Badge,
  Chip,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from '../components/Notifications/NotificationItem';
import { notificationService } from '../services/api';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getNotificationsByType
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setSnackbar({ open: true, message: 'Notifications refreshed', severity: 'success' });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setSnackbar({ open: true, message: 'All notifications marked as read', severity: 'success' });
  };

  // Handle delete notification
  const handleDeleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setSnackbar({ open: true, message: 'Notification deleted', severity: 'success' });
      // Refresh notifications after deletion
      refreshNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
      setSnackbar({ open: true, message: 'Failed to delete notification', severity: 'error' });
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get filtered notifications based on active tab
  const filteredNotifications = getNotificationsByType(activeTab);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        {/* Header */}
        <Box sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>

          <Box>
            <Tooltip title="Refresh notifications">
              <IconButton onClick={handleRefresh} disabled={isRefreshing || loading}>
                {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>

            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton onClick={handleMarkAllAsRead} disabled={loading}>
                  <CheckCircleIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Notification settings">
              <IconButton component={Link} to="/settings/notifications">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
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
            <Tab label="Mentions" value="mention" disabled={getNotificationsByType('mention').length === 0} />
            <Tab label="Messages" value="message" disabled={getNotificationsByType('message').length === 0} />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2 }}>
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length > 0 ? (
            <Box>
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onDelete={handleDeleteNotification}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No {activeTab === 'all' ? '' : activeTab} notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeTab === 'all'
                  ? 'When you get notifications, they\'ll appear here'
                  : activeTab === 'unread'
                  ? 'You have read all your notifications'
                  : `You don't have any ${activeTab} notifications yet`}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Notifications;
