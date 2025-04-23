import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';
import socketService from '../services/socketService';

// Create the context
const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchNotifications();
      
      // Set up a refresh interval (every 5 minutes)
      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, currentUser]);

  // Connect to socket for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    console.log('Setting up socket connection for notifications in context');

    // Get existing socket or initialize a new one
    let socket = socketService.getSocket();
    if (!socket) {
      console.log('No existing socket found, initializing new socket');
      const connected = socketService.connect();
      if (connected) {
        socket = socketService.getSocket();
      } else {
        console.warn('Failed to connect socket in NotificationContext');
      }
    }

    // Only subscribe to events if socket is available
    let unsubscribeNotification = null;
    if (socket) {
      console.log('Subscribing to new-notification events in context');
      unsubscribeNotification = socketService.subscribeToEvent('new-notification', handleNewNotification);
    }

    return () => {
      if (typeof unsubscribeNotification === 'function') {
        console.log('Unsubscribing from new-notification events in context');
        unsubscribeNotification();
      }
    };
  }, [isAuthenticated, currentUser]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!isAuthenticated || !currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationService.getNotifications();
      
      if (response.data && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications);
        
        // Count unread notifications
        const unread = response.data.notifications.filter(notification => !notification.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Handle new notification from socket
  const handleNewNotification = (notification) => {
    console.log('New notification received in context:', notification);
    if (!notification) return;

    // Check for duplicate notifications
    setNotifications(prev => {
      const exists = prev.some(item => item._id === notification._id);
      if (exists) return prev;
      return [notification, ...prev];
    });

    // Increment unread count
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
      
      // Play notification sound
      playNotificationSound();
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Error playing notification sound:', e));
    } catch (error) {
      console.log('Error with notification sound:', error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    if (!type || type === 'all') return notifications;
    if (type === 'unread') return notifications.filter(notification => !notification.read);
    
    // Map notification types from the backend to frontend categories
    const typeMap = {
      'like': ['like_post', 'like_comment', 'like_reel'],
      'comment': ['comment_post', 'comment_reel', 'reply_comment'],
      'follow': ['follow_request', 'follow_accept', 'new_follower'],
      'mention': ['mention_post', 'mention_comment', 'mention_story', 'tag_post'],
      'message': ['new_message'],
      'live': ['live_started', 'live_from_following'],
      'post': ['post_from_following', 'reel_from_following', 'story_from_following']
    };
    
    return notifications.filter(notification => 
      typeMap[type] && typeMap[type].includes(notification.type)
    );
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    // Map backend notification types to frontend icons
    const iconMap = {
      'like_post': '❤️',
      'like_comment': '❤️',
      'like_reel': '❤️',
      'comment_post': '💬',
      'comment_reel': '💬',
      'reply_comment': '💬',
      'follow_request': '👤',
      'follow_accept': '👤',
      'new_follower': '👤',
      'mention_post': '@️',
      'mention_comment': '@️',
      'mention_story': '@️',
      'tag_post': '#️⃣',
      'new_message': '✉️',
      'live_started': '📡',
      'live_from_following': '📡',
      'post_from_following': '📷',
      'reel_from_following': '🎬',
      'story_from_following': '📱',
      'story_view': '👁️',
      'story_reply': '💬',
      'system_announcement': '📢',
      'content_digest': '📋'
    };
    
    return iconMap[type] || '🔔';
  };

  // Get notification link based on type and content
  const getNotificationLink = (notification) => {
    const { type, content, sender, targetId, targetModel } = notification;
    
    // Handle different notification types
    switch (type) {
      case 'like_post':
      case 'comment_post':
      case 'mention_post':
      case 'tag_post':
        return content?.postId ? `/post/${content.postId}` : targetModel === 'Post' ? `/post/${targetId}` : '/';
        
      case 'like_reel':
      case 'comment_reel':
      case 'reel_from_following':
        return content?.reelId ? `/reels/${content.reelId}` : targetModel === 'Reel' ? `/reels/${targetId}` : '/';
        
      case 'follow_request':
      case 'follow_accept':
      case 'new_follower':
        return sender?.username ? `/profile/${sender.username}` : '/';
        
      case 'new_message':
        return content?.conversationId ? `/messages/${content.conversationId}` : '/messages';
        
      case 'live_started':
      case 'live_from_following':
        return content?.livestreamId ? `/live/${content.livestreamId}` : targetModel === 'LiveStream' ? `/live/${targetId}` : '/';
        
      case 'post_from_following':
        return content?.postId ? `/post/${content.postId}` : '/';
        
      case 'story_from_following':
      case 'story_view':
      case 'story_reply':
        return content?.storyId ? `/stories/${content.storyId}` : targetModel === 'Story' ? `/stories/${targetId}` : '/';
        
      default:
        return '/';
    }
  };

  // Format notification text based on type and content
  const formatNotificationText = (notification) => {
    const { type, content, sender } = notification;
    
    // Default sender name
    const senderName = sender?.username || 'Someone';
    
    // Handle different notification types
    switch (type) {
      case 'like_post':
        return `liked your post`;
      case 'like_comment':
        return `liked your comment`;
      case 'like_reel':
        return `liked your reel`;
      case 'comment_post':
        return `commented on your post: "${content?.commentText || ''}"`;
      case 'comment_reel':
        return `commented on your reel: "${content?.commentText || ''}"`;
      case 'reply_comment':
        return `replied to your comment: "${content?.commentText || ''}"`;
      case 'follow_request':
        return `requested to follow you`;
      case 'follow_accept':
        return `accepted your follow request`;
      case 'new_follower':
        return `started following you`;
      case 'mention_post':
        return `mentioned you in a post`;
      case 'mention_comment':
        return `mentioned you in a comment`;
      case 'mention_story':
        return `mentioned you in a story`;
      case 'tag_post':
        return `tagged you in a post`;
      case 'new_message':
        return `sent you a message: "${content?.message || 'New message'}"`;
      case 'live_started':
        return `started a livestream`;
      case 'live_from_following':
        return `is live now`;
      case 'post_from_following':
        return `shared a new post`;
      case 'reel_from_following':
        return `shared a new reel`;
      case 'story_from_following':
        return `added to their story`;
      case 'story_view':
        return `viewed your story`;
      case 'story_reply':
        return `replied to your story: "${content?.replyText || ''}"`;
      case 'system_announcement':
        return content?.message || 'System announcement';
      case 'content_digest':
        return `You have new content in your digest`;
      default:
        return 'sent you a notification';
    }
  };

  // Refresh notifications manually
  const refreshNotifications = () => {
    fetchNotifications();
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    lastRefresh,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getNotificationsByType,
    getNotificationIcon,
    getNotificationLink,
    formatNotificationText
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
