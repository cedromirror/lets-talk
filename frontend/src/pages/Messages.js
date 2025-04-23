import React, { useState, useEffect, useRef, forwardRef, lazy, Suspense } from 'react';
import { keyframes } from '@mui/system';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageService, userService, exploreService } from '../services/api';
import socketService from '../services/socketService';
import ProfilePicture from '../components/common/ProfilePicture';
import { getProfilePictureUrl } from '../utils/profilePictureHelper';
import {
  Box, Typography, Avatar, TextField, IconButton, Badge,
  Drawer, List, ListItem, ListItemAvatar, ListItemText, Divider,
  Paper, InputAdornment, CircularProgress, Tooltip, AvatarGroup,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Chip, Grid, Skeleton, useTheme, useMediaQuery, Checkbox,
  Snackbar, Alert, Menu, MenuItem, Slide, Switch, FormControlLabel
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
  Add as AddIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  InsertEmoticon as EmojiIcon,
  Mic as MicIcon,
  Image as ImageIcon,
  CheckCircle as ReadIcon,
  CheckCircleOutline as DeliveredIcon,
  Schedule as PendingIcon,
  ArrowBack as BackIcon,
  Phone as CallIcon,
  Videocam as VideoCallIcon,
  ReplyOutlined as ReplyIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  ForwardOutlined as ForwardIcon,
  AddReaction as AddReactionIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  MarkChatRead as MarkChatReadIcon,
  MarkChatUnread as MarkChatUnreadIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';

// Import custom components
import MessageActions from '../components/Messages/MessageActions';
import MessageReply from '../components/Messages/MessageReply';
import UserStatus from '../components/Messages/UserStatus';
import UserProfilePreview from '../components/Messages/UserProfilePreview';

// Define pulse animation for badges and highlights
const pulseAnimation = keyframes`
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

const typingAnimation = keyframes`
  0% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
`;

// Slide transition for dialogs
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Message Status Icon Component
const MessageStatusIcon = forwardRef(function MessageStatusIcon({ status, ...props }, ref) {
  // Determine which icon to show based on status
  switch (status) {
    case 'read':
      return <ReadIcon {...props} ref={ref} />;
    case 'delivered':
      return <DeliveredIcon {...props} ref={ref} />;
    case 'pending':
      return <PendingIcon {...props} ref={ref} />;
    default:
      return <DeliveredIcon {...props} ref={ref} />;
  }
});

const Messages = () => {
  const { conversationId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Conversations state
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});  // Map of conversation ID to unread count

  // Message input state
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // New conversation state
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // New state variables for enhanced features
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardTargets, setForwardTargets] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userLastSeen, setUserLastSeen] = useState({});

  // State for available users
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAvailableUsers, setShowAvailableUsers] = useState(false);
  const [showOnlyConnections, setShowOnlyConnections] = useState(true); // Default to showing only connections
  const [selectedUser, setSelectedUser] = useState(null); // For user profile preview
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await messageService.getConversations();
        setConversations(response.data);

        // If conversationId is provided, set it as active
        if (conversationId) {
          const conversation = response.data.find(c => c._id === conversationId);
          if (conversation) {
            setActiveConversation(conversation);
            fetchMessages(conversationId);
          } else {
            setError('Conversation not found');
          }
        } else if (response.data.length > 0) {
          // Set first conversation as active if no conversationId is provided
          setActiveConversation(response.data[0]);
          fetchMessages(response.data[0]._id);
          // Update URL
          navigate(`/messages/${response.data[0]._id}`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
        setLoading(false);
      }
    };

    fetchConversations();
  }, [conversationId, navigate]);

  // Fetch messages for active conversation
  const fetchMessages = async (convId) => {
    try {
      const response = await messageService.getMessages(convId);
      setMessages(response.data);

      // Mark conversation as read
      await messageService.markAsRead(convId);

      // Update unread count in conversations list
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv._id === convId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Connect to socket for real-time messaging
  useEffect(() => {
    // Socket should already be initialized by AuthContext
    // If not, initialize it using the safe connect method
    if (!socketService.getSocket()) {
      console.log('Socket not initialized, connecting now...');
      const connected = socketService.connect();
      console.log('Socket connection result:', connected ? 'Connected' : 'Failed to connect');
    } else {
      console.log('Socket already initialized');
    }

    // Listen for new messages
    const unsubscribeNewMessage = socketService.subscribeToEvent('new-message', handleNewMessage);

    // Listen for typing indicators
    const unsubscribeUserTyping = socketService.subscribeToEvent('user-typing', handleUserTyping);
    const unsubscribeUserStoppedTyping = socketService.subscribeToEvent('user-stopped-typing', handleUserStoppedTyping);

    // Listen for read receipts
    const unsubscribeMessageRead = socketService.subscribeToEvent('message-read', handleMessageRead);

    // Listen for message delivery status
    const unsubscribeMessageDelivered = socketService.subscribeToEvent('message-delivered', handleMessageDelivered);

    // Listen for user status updates
    const unsubscribeUserStatus = socketService.subscribeToEvent('user:status', handleUserStatusUpdate);
    const unsubscribeUserStatusList = socketService.subscribeToEvent('user:status_list', handleUserStatusListUpdate);

    // Listen for message reactions
    const unsubscribeMessageReaction = socketService.subscribeToEvent('message-reaction-updated', (data) => {
      console.log('Received message reaction update:', data);
      if (data.message && activeConversation && data.message.conversation === activeConversation._id) {
        setMessages(prevMessages =>
          prevMessages.map(msg => msg._id === data.message._id ? data.message : msg)
        );
      }
    });

    return () => {
      // Clean up subscriptions
      unsubscribeNewMessage();
      unsubscribeUserTyping();
      unsubscribeUserStoppedTyping();
      unsubscribeMessageRead();
      unsubscribeMessageDelivered();
      unsubscribeUserStatus();
      unsubscribeUserStatusList();
      unsubscribeMessageReaction();
    };
  }, [activeConversation]);

  // Join conversation room when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      socketService.emitEvent('join-conversation', { conversationId: activeConversation._id });
    }
  }, [activeConversation]);

  // Fetch available users and followers
  useEffect(() => {
    const fetchAvailableUsersAndFollowers = async () => {
      try {
        setLoadingUsers(true);
        console.log('Fetching available users and followers for messaging...');

        // Fetch user's followers - people who follow you
        const followersResponse = await userService.getFollowers(currentUser._id);
        const followers = followersResponse.data.followers || [];
        console.log(`Fetched ${followers.length} followers`);

        // Fetch user's following - people you follow
        const followingResponse = await userService.getFollowing(currentUser._id);
        const following = followingResponse.data.following || [];
        console.log(`Fetched ${following.length} following users`);

        // Fetch suggested users (lower priority)
        const suggestedResponse = await exploreService.getSuggestedUsers();
        const suggestedUsers = suggestedResponse.data.users || [];
        console.log(`Fetched ${suggestedUsers.length} suggested users`);

        // If we didn't get any users from the API, try a direct search
        if (followers.length === 0 && following.length === 0 && suggestedUsers.length === 0) {
          console.log('No users found from primary sources, trying direct user search...');
          const searchResponse = await userService.searchUsers('');
          const searchUsers = searchResponse.data.users || [];
          console.log(`Fetched ${searchUsers.length} users from direct search`);

          if (searchUsers.length > 0) {
            // Filter out current user
            const filteredUsers = searchUsers.filter(user => user._id !== currentUser._id);
            setAvailableUsers(filteredUsers);
            setLoadingUsers(false);
            return;
          }
        }

        // Process followers - people who follow you
        const processedFollowers = [];
        if (Array.isArray(followers)) {
          followers.forEach(follower => {
            // Handle different API response formats
            let userData;
            if (follower._id) {
              userData = { ...follower, relationship: 'follower' };
            } else if (follower.user) {
              userData = { ...follower.user, relationship: 'follower' };
            } else {
              userData = { ...follower, relationship: 'follower' };
            }

            // Only add valid users and exclude current user
            if (userData._id && userData._id !== currentUser._id) {
              processedFollowers.push(userData);
            }
          });
        }

        // Process following - people you follow
        const processedFollowing = [];
        if (Array.isArray(following)) {
          following.forEach(followed => {
            // Handle different API response formats
            let userData;
            if (followed._id) {
              userData = { ...followed, relationship: 'following' };
            } else if (followed.user) {
              userData = { ...followed.user, relationship: 'following' };
            } else {
              userData = { ...followed, relationship: 'following' };
            }

            // Only add valid users and exclude current user
            if (userData._id && userData._id !== currentUser._id) {
              processedFollowing.push(userData);
            }
          });
        }

        // Identify mutual connections (users who follow each other)
        const mutualUsers = [];
        const followersOnly = [];
        const followingOnly = [];

        // Process followers first
        processedFollowers.forEach(follower => {
          // Check if this user is also in following
          const isAlsoFollowing = processedFollowing.some(f => f._id === follower._id);
          if (isAlsoFollowing) {
            // This is a mutual connection
            mutualUsers.push({ ...follower, relationship: 'mutual' });
          } else {
            // This is a follower only
            followersOnly.push(follower);
          }
        });

        // Process following that aren't already in mutual
        processedFollowing.forEach(following => {
          // Skip if already added to mutual
          if (!mutualUsers.some(m => m._id === following._id)) {
            followingOnly.push(following);
          }
        });

        // Process suggested users (exclude users already in other categories)
        const processedSuggested = [];
        if (Array.isArray(suggestedUsers)) {
          suggestedUsers.forEach(user => {
            // Skip if user is already in another category or is current user
            if (user._id === currentUser._id ||
                mutualUsers.some(u => u._id === user._id) ||
                followersOnly.some(u => u._id === user._id) ||
                followingOnly.some(u => u._id === user._id)) {
              return;
            }

            processedSuggested.push({ ...user, relationship: 'suggested' });
          });
        }

        // Combine all users with priority order: mutual > followers > following > suggested
        const combinedUsers = [
          ...mutualUsers,
          ...followersOnly,
          ...followingOnly,
          ...processedSuggested
        ];

        console.log(`Combined ${combinedUsers.length} unique users for messaging:`);
        console.log(`- ${mutualUsers.length} mutual connections`);
        console.log(`- ${followersOnly.length} followers`);
        console.log(`- ${followingOnly.length} following`);
        console.log(`- ${processedSuggested.length} suggested users`);

        setAvailableUsers(combinedUsers);
        setLoadingUsers(false);

        // Get online status for all users
        if (combinedUsers.length > 0) {
          // First prioritize getting status for mutual connections, followers and following
          const relationshipUserIds = [
            ...mutualUsers.map(u => u._id),
            ...followersOnly.map(u => u._id),
            ...followingOnly.map(u => u._id)
          ];

          // Get status for all relationship users
          if (relationshipUserIds.length > 0) {
            socketService.emitEvent('user:get_status', { userIds: relationshipUserIds });

            // Subscribe to status updates for followers and following
            relationshipUserIds.forEach(userId => {
              socketService.emitEvent('user:subscribe_status', { userId });
            });
          }

          // Then get status for suggested users (lower priority)
          const suggestedUserIds = processedSuggested.map(u => u._id);
          if (suggestedUserIds.length > 0) {
            socketService.emitEvent('user:get_status', { userIds: suggestedUserIds });
          }
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setLoadingUsers(false);

        // Show error message
        setSnackbar({
          open: true,
          message: 'Failed to load users. Please try again.',
          severity: 'error'
        });
      }
    };

    fetchAvailableUsersAndFollowers();

    // Cleanup: unsubscribe from status updates
    return () => {
      // Unsubscribe from all user statuses when component unmounts
      availableUsers.forEach(user => {
        if ((user.relationship === 'mutual' ||
             user.relationship === 'follower' ||
             user.relationship === 'following') &&
            user._id) {
          socketService.emitEvent('user:unsubscribe_status', { userId: user._id });
        }
      });
    };
  }, [currentUser._id]);

  // Helper function to format last seen time
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle new message from socket
  const handleNewMessage = (message) => {
    console.log('Received new message:', message);

    // Validate message data
    if (!message || !message.conversation) {
      console.error('Invalid message received:', message);
      return;
    }

    // Play notification sound for new messages (except own messages)
    if (message.sender && message.sender._id !== currentUser._id) {
      try {
        const audio = new Audio('/sounds/message.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Error playing message sound:', e));
      } catch (error) {
        console.log('Error with message sound:', error);
      }
    }

    // If message belongs to active conversation, add it to messages
    if (message.conversation === activeConversation?._id) {
      // Check for duplicate messages
      setMessages(prevMessages => {
        // Skip if message already exists
        if (prevMessages.some(msg => msg._id === message._id)) {
          return prevMessages;
        }

        const newMessages = [...prevMessages, message];

        // Scroll to bottom after adding message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        return newMessages;
      });

      // Mark as read if we're in the conversation
      messageService.markAsRead(activeConversation._id);

      // Emit read receipt via socket
      socketService.emitEvent('message-read', {
        messageId: message._id,
        conversationId: activeConversation._id
      });
    } else {
      // Show notification for messages in other conversations
      if (message.sender && message.sender._id !== currentUser._id) {
        setSnackbar({
          open: true,
          message: `New message from ${message.sender.username || 'Someone'}`,
          severity: 'info',
          action: (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                // Find the conversation
                const conversation = conversations.find(c => c._id === message.conversation);
                if (conversation) {
                  setConversationActive(conversation);
                }
                setSnackbar(prev => ({ ...prev, open: false }));
              }}
            >
              View
            </Button>
          )
        });
      }
    }

    // Update conversations list
    setConversations(prevConversations => {
      // Check if conversation exists in the list
      const conversationExists = prevConversations.some(conv => conv._id === message.conversation);

      let updatedConversations;

      if (conversationExists) {
        // Update existing conversation
        updatedConversations = prevConversations.map(conv => {
          if (conv._id === message.conversation) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount: conv._id === activeConversation?._id ? 0 : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });
      } else {
        // If conversation doesn't exist in the list, fetch it
        // This is a fallback and should rarely happen
        console.log('Conversation not found in list, will fetch it:', message.conversation);
        messageService.getConversationById(message.conversation)
          .then(response => {
            if (response.data) {
              setConversations(prev => [
                {
                  ...response.data,
                  lastMessage: message,
                  updatedAt: message.createdAt,
                  unreadCount: 1
                },
                ...prev
              ]);
            }
          })
          .catch(err => console.error('Error fetching new conversation:', err));

        updatedConversations = prevConversations;
      }

      // Sort conversations by updatedAt
      return updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  // Handle typing indicator
  const handleUserTyping = (data) => {
    if (data.conversation === activeConversation?._id && data.user._id !== currentUser._id) {
      setTypingUsers(prev => {
        if (!prev.some(user => user._id === data.user._id)) {
          return [...prev, data.user];
        }
        return prev;
      });
    }
  };

  // Handle user stopped typing
  const handleUserStoppedTyping = (data) => {
    if (data.conversation === activeConversation?._id) {
      setTypingUsers(prev => prev.filter(user => user._id !== data.user._id));
    }
  };

  // Handle message read receipt
  const handleMessageRead = (data) => {
    if (data.conversation === activeConversation?._id) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === data.messageId ? {
            ...msg,
            readBy: [...(msg.readBy || []), data.userId],
            deliveryStatus: 'read'
          } : msg
        )
      );
    }
  };

  // Handle message delivery status
  const handleMessageDelivered = (data) => {
    console.log('Received message delivery status:', data);
    const { conversationId, messageId } = data;

    // Update message delivery status
    if (conversationId === activeConversation?._id) {
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg._id === messageId || (msg._id && msg._id.toString().startsWith('temp-') && msg.tempId === messageId)) {
            return {
              ...msg,
              deliveryStatus: 'delivered',
              deliveredAt: new Date().toISOString(),
              // If this was a temporary message, replace the temp ID with the real one
              _id: msg._id.toString().startsWith('temp-') ? messageId : msg._id
            };
          }
          return msg;
        })
      );

      // Play subtle delivery sound for sender's messages
      if (data.senderId === currentUser._id) {
        try {
          const audio = new Audio('/sounds/message-delivered.mp3');
          audio.volume = 0.2;
          audio.play().catch(e => console.log('Error playing delivery sound:', e));
        } catch (error) {
          console.log('Error with delivery sound:', error);
        }
      }
    }
  };

  // Mark message as read
  const handleMarkMessageAsRead = async (message) => {
    try {
      console.log('Marking message as read:', message._id);
      await messageService.markMessageAsRead(message._id);

      // Update message in state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === message._id ? { ...msg, readBy: [...(msg.readBy || []), currentUser._id] } : msg
        )
      );

      // Show success message
      setSnackbar({
        open: true,
        message: 'Message marked as read',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error marking message as read:', err);
      setSnackbar({
        open: true,
        message: 'Failed to mark message as read',
        severity: 'error'
      });
    }
  };

  // Mark message as unread
  const handleMarkMessageAsUnread = async (message) => {
    try {
      console.log('Marking message as unread:', message._id);
      await messageService.markMessageAsUnread(message._id);

      // Update message in state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === message._id ? { ...msg, readBy: (msg.readBy || []).filter(id => id !== currentUser._id) } : msg
        )
      );

      // Update unread count for the conversation
      const convId = message.conversation;
      setUnreadMessages(prev => ({
        ...prev,
        [convId]: (prev[convId] || 0) + 1
      }));

      // Show success message
      setSnackbar({
        open: true,
        message: 'Message marked as unread',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error marking message as unread:', err);
      setSnackbar({
        open: true,
        message: 'Failed to mark message as unread',
        severity: 'error'
      });
    }
  };

  // Mark all messages in conversation as read
  const handleMarkAllAsRead = async () => {
    if (!activeConversation) return;

    try {
      console.log('Marking all messages as read in conversation:', activeConversation._id);
      await messageService.markAllAsRead(activeConversation._id);

      // Update all messages in state
      setMessages(prevMessages =>
        prevMessages.map(msg => ({
          ...msg,
          readBy: [...new Set([...(msg.readBy || []), currentUser._id])]
        }))
      );

      // Reset unread count for this conversation
      setUnreadMessages(prev => ({
        ...prev,
        [activeConversation._id]: 0
      }));

      // Update conversations list
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv._id === activeConversation._id ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Show success message
      setSnackbar({
        open: true,
        message: 'All messages marked as read',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error marking all messages as read:', err);
      setSnackbar({
        open: true,
        message: 'Failed to mark all messages as read',
        severity: 'error'
      });
    }
  };

  // Handle user status update
  const handleUserStatusUpdate = (data) => {
    const { userId, isOnline, lastActive } = data;

    // Update online users state
    if (isOnline) {
      setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
    } else {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
      setUserLastSeen(prev => ({ ...prev, [userId]: lastActive }));
    }

    // Update available users list
    setAvailableUsers(prev =>
      prev.map(user =>
        user._id === userId ? { ...user, isOnline, lastSeen: lastActive } : user
      )
    );

    // Update conversations list to reflect online status
    setConversations(prev =>
      prev.map(conv => ({
        ...conv,
        participants: conv.participants.map(participant =>
          participant._id === userId ? { ...participant, isOnline, lastSeen: lastActive } : participant
        )
      }))
    );
  };

  // Handle user status list update
  const handleUserStatusListUpdate = (statusMap) => {
    // Update online users and last seen times
    const newOnlineUsers = [];
    const newLastSeen = { ...userLastSeen };

    Object.entries(statusMap).forEach(([userId, status]) => {
      if (status.isOnline) {
        newOnlineUsers.push(userId);
      } else {
        newLastSeen[userId] = status.lastActive;
      }
    });

    setOnlineUsers(newOnlineUsers);
    setUserLastSeen(newLastSeen);

    // Update available users list
    setAvailableUsers(prev =>
      prev.map(user => {
        const status = statusMap[user._id];
        if (status) {
          return { ...user, isOnline: status.isOnline, lastSeen: status.lastActive };
        }
        return user;
      })
    );

    // Update conversations list
    setConversations(prev =>
      prev.map(conv => ({
        ...conv,
        participants: conv.participants.map(participant => {
          const status = statusMap[participant._id];
          if (status) {
            return { ...participant, isOnline: status.isOnline, lastSeen: status.lastActive };
          }
          return participant;
        })
      }))
    );
  };

  // Send typing indicator
  const handleTyping = () => {
    if (activeConversation) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing indicator if not already typing
      if (!isTyping) {
        setIsTyping(true);
        socketService.emitEvent('typing', { conversationId: activeConversation._id });
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.emitEvent('stop-typing', { conversationId: activeConversation._id });
      }, 3000);
    }
  };

  // Send message
  const sendMessage = async () => {
    // Validate message content
    const hasText = messageText.trim().length > 0;
    const hasAttachments = attachments.length > 0;

    // Ensure message has either text or attachments
    if (!hasText && !hasAttachments) {
      setSnackbar({
        open: true,
        message: 'Message must have either text or media',
        severity: 'warning'
      });
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData object
      const formData = new FormData();

      // Only append text if it's not empty
      if (hasText) {
        formData.append('text', messageText.trim());
      } else {
        // Explicitly set text to empty string when sending only attachments
        formData.append('text', '');
      }

      formData.append('conversationId', activeConversation._id);

      // Add reply reference if replying to a message
      if (replyingTo) {
        formData.append('replyTo', replyingTo._id);
      }

      // Add edit reference if editing a message
      if (editingMessage) {
        formData.append('editMessageId', editingMessage._id);
      }

      // Process and optimize attachments before uploading
      if (hasAttachments) {
        console.log(`Processing ${attachments.length} attachments`);

        // Process each attachment
        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];
          console.log(`Processing attachment ${i+1}/${attachments.length}: ${file.name} (${file.type})`);

          try {
            // Check file type
            if (file.type.startsWith('image/')) {
              // For images, we could compress them, but for now just append
              formData.append('attachments', file, file.name);
              console.log(`Added image attachment: ${file.name}`);
            } else if (file.type.startsWith('video/')) {
              // For videos, just append for now
              formData.append('attachments', file, file.name);
              console.log(`Added video attachment: ${file.name}`);
            } else {
              // For other files, just append
              formData.append('attachments', file, file.name);
              console.log(`Added file attachment: ${file.name}`);
            }
          } catch (attachError) {
            console.error(`Error processing attachment ${file.name}:`, attachError);
            // Continue with other attachments even if one fails
          }
        }
      }

      // Create a temporary message ID
      const tempId = `temp-${Date.now()}`;

      // Create a temporary message for optimistic UI update
      const tempMessage = {
        _id: tempId,
        tempId: tempId, // Store the temp ID for later reference
        text: hasText ? messageText.trim() : '',
        sender: currentUser,
        conversation: activeConversation._id,
        createdAt: new Date().toISOString(),
        media: hasAttachments ? {
          type: attachments[0].type.split('/')[0],
          url: URL.createObjectURL(attachments[0]),
          fileName: attachments[0].name,
          fileSize: attachments[0].size
        } : null,
        replyTo: replyingTo,
        deliveryStatus: 'pending',
        isOptimistic: true
      };

      // Add the temporary message to the UI immediately
      setMessages(prevMessages => [...prevMessages, tempMessage]);

      // Scroll to the new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Update the conversation's last message optimistically
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv._id === activeConversation._id) {
            return {
              ...conv,
              lastMessage: tempMessage,
              updatedAt: tempMessage.createdAt
            };
          }
          return conv;
        });
      });

      console.log('Sending message with FormData:', formData);
      const response = await messageService.sendMessage(formData);
      console.log('Message sent successfully:', response.data);

      // If successful, update the temporary message with the real one
      if (response && response.data) {
        // Replace the temporary message with the real one
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === tempId ? response.data : msg
          )
        );

        // Update the conversation's last message
        setConversations(prevConversations => {
          return prevConversations.map(conv => {
            if (conv._id === activeConversation._id) {
              return {
                ...conv,
                lastMessage: response.data,
                updatedAt: response.data.createdAt
              };
            }
            return conv;
          });
        });

        // Emit delivery status via socket
        socketService.emitEvent('message-delivered', {
          messageId: response.data._id,
          conversationId: activeConversation._id,
          senderId: currentUser._id
        });
      }

      // Clear input and states
      setMessageText('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setReplyingTo(null);
      setEditingMessage(null);
      setIsUploading(false);

      // Focus input
      messageInputRef.current?.focus();

      // Stop typing indicator
      setIsTyping(false);
      socketService.emitEvent('stop-typing', { conversationId: activeConversation._id });

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setIsUploading(false);

      // Extract detailed error message
      let errorMessage = 'Failed to send message';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Check for specific error messages
      if (errorMessage.includes('must have either text or media')) {
        errorMessage = 'Message must have either text or media. Please add text or attach a file.';
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });

      // Remove the temporary message from the UI
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isOptimistic));

      // Revert the conversation's last message
      setConversations(prevConversations => {
        // Find the previous last message for this conversation
        const prevLastMessage = prevConversations.find(c => c._id === activeConversation._id)?.lastMessage;

        return prevConversations.map(conv => {
          if (conv._id === activeConversation._id && prevLastMessage && prevLastMessage.isOptimistic) {
            // Find a non-optimistic last message
            return {
              ...conv,
              lastMessage: messages.filter(m => !m.isOptimistic).pop() || prevLastMessage
            };
          }
          return conv;
        });
      });

      // If the error is related to missing content, focus the input field
      if (errorMessage.includes('must have either text or media')) {
        messageInputRef.current?.focus();
      }

      // Try to reconnect socket if it might be a connection issue
      if (errorMessage.includes('socket') || errorMessage.includes('connection')) {
        console.log('Attempting to reconnect socket after message error...');
        try {
          // Reinitialize socket connection
          socketService.connect();
        } catch (reconnectError) {
          console.error('Failed to reconnect socket after message error:', reconnectError);
        }
      }
    }
  };

  // Handle file attachment
  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);

    // Clear input value to allow selecting the same file again
    e.target.value = '';
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  // Set active conversation
  const setConversationActive = (conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation._id);
    navigate(`/messages/${conversation._id}`);
  };

  // Search people for new conversation
  const searchPeople = async (query) => {
    try {
      // Set searching state to show loading indicator
      setIsSearching(true);

      // Debounce search to avoid too many API calls
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // If query is empty or too short, show suggested users
      if (!query || !query.trim() || query.trim().length < 2) {
        // If query is empty, show suggested users instead of empty results
        const suggestedResponse = await exploreService.getSuggestedUsers(1, 15);
        const suggestedUsers = suggestedResponse.data.users || [];

        // Filter out current user from results
        const filteredUsers = suggestedUsers.filter(user => user._id !== currentUser._id);

        // Ensure each user has an avatar property and add online status
        const enhancedUsers = filteredUsers.map(user => ({
          ...user,
          avatar: user.avatar || user.profilePicture || user.profile_picture || user.image || '/assets/default-avatar.png',
          isOnline: onlineUsers.includes(user._id)
        }));

        // Sort users: online first, then by relationship (mutual > followers > following > others)
        const sortedUsers = enhancedUsers.sort((a, b) => {
          // First sort by online status
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;

          // Then sort by relationship
          const relationshipOrder = { mutual: 1, follower: 2, following: 3, undefined: 4 };
          return (relationshipOrder[a.relationship] || 4) - (relationshipOrder[b.relationship] || 4);
        });

        setSearchResults(sortedUsers);
        setIsSearching(false);
        return;
      }

      // Search for users matching the query
      const response = await userService.searchUsers(query.trim());
      let users = response.data.users || [];

      // Filter out current user from results
      users = users.filter(user => user._id !== currentUser._id);

      // Ensure each user has an avatar property
      users = users.map(user => ({
        ...user,
        avatar: user.avatar || user.profilePicture || user.profile_picture || user.image || '/assets/default-avatar.png'
      }));

      // If no results from search, try a more general search
      if (users.length === 0 && query.length > 2) {
        const generalResponse = await userService.searchUsers(query.substring(0, 2));
        let generalUsers = generalResponse.data.users || [];

        // Filter out current user from results
        generalUsers = generalUsers.filter(user => user._id !== currentUser._id);

        // Add online status and ensure avatar property
        const enhancedUsers = generalUsers.map(user => ({
          ...user,
          avatar: user.avatar || user.profilePicture || user.profile_picture || user.image || '/assets/default-avatar.png',
          isOnline: onlineUsers.includes(user._id)
        }));

        setSearchResults(enhancedUsers);
      } else {
        // Add online status and ensure avatar property
        const enhancedUsers = users.map(user => ({
          ...user,
          avatar: user.avatar || user.profilePicture || user.profile_picture || user.image || '/assets/default-avatar.png',
          isOnline: onlineUsers.includes(user._id)
        }));

        // Sort users: online first, then by relationship (mutual > followers > following > others)
        const sortedUsers = enhancedUsers.sort((a, b) => {
          // First sort by online status
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;

          // Then sort by relationship
          const relationshipOrder = { mutual: 1, follower: 2, following: 3, undefined: 4 };
          return (relationshipOrder[a.relationship] || 4) - (relationshipOrder[b.relationship] || 4);
        });

        setSearchResults(sortedUsers);
      }

      setIsSearching(false);
    } catch (err) {
      console.error('Error searching users:', err);
      setIsSearching(false);

      // Show error message
      setSnackbar({
        open: true,
        message: 'Failed to search people. Please try again.',
        severity: 'error'
      });

      // Show suggested users as fallback
      try {
        const suggestedResponse = await exploreService.getSuggestedUsers(1, 10);
        const suggestedUsers = suggestedResponse.data.users || [];
        setSearchResults(suggestedUsers.filter(user => user._id !== currentUser._id));
      } catch (fallbackErr) {
        console.error('Error fetching fallback suggested users:', fallbackErr);
        setSearchResults([]);
      }
    }
  };

  // Handle user selection for new conversation
  const toggleUserSelection = (user) => {
    if (selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  // Handle starting a conversation with a user
  const handleStartConversation = async (user) => {
    if (!user || !user._id) {
      setSnackbar({
        open: true,
        message: 'Invalid user data. Please try again.',
        severity: 'error'
      });
      return;
    }

    try {
      // Show loading feedback
      setSnackbar({
        open: true,
        message: 'Opening conversation...',
        severity: 'info'
      });

      // Close user profile preview if open
      setShowUserProfile(false);

      // Check if conversation with this user already exists
      const existingConversation = conversations.find(conv =>
        !conv.isGroup && conv.participants.some(p => p._id === user._id)
      );

      if (existingConversation) {
        // Open existing conversation
        setConversationActive(existingConversation);

        // Show success message
        setSnackbar({
          open: true,
          message: `Opened conversation with ${user.username || 'user'}`,
          severity: 'success'
        });

        // If on mobile, switch to messages view
        if (isMobile) setMobileView('messages');
      } else {
        // Create new conversation
        setSelectedUsers([user]);
        await createConversation();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setSnackbar({
        open: true,
        message: 'Failed to start conversation. Please try again.',
        severity: 'error'
      });
    }
  };

  // Handle message reaction
  const handleReaction = async (message, emoji) => {
    try {
      await messageService.reactToMessage(message._id, { emoji });

      // Optimistically update UI
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg._id === message._id) {
            // Check if user already reacted with this emoji
            const existingReactionIndex = msg.reactions?.findIndex(
              r => r.user._id === currentUser._id && r.emoji === emoji
            );

            let updatedReactions = [...(msg.reactions || [])];

            if (existingReactionIndex >= 0) {
              // Remove existing reaction
              updatedReactions.splice(existingReactionIndex, 1);
            } else {
              // Add new reaction
              updatedReactions.push({
                emoji,
                user: currentUser,
                createdAt: new Date().toISOString()
              });
            }

            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );
    } catch (err) {
      console.error('Error reacting to message:', err);
      setSnackbar({
        open: true,
        message: 'Failed to react to message',
        severity: 'error'
      });
    }
  };

  // Handle message reply
  const handleReply = (message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Handle message edit
  const handleEdit = (message) => {
    if (message.sender._id !== currentUser._id) return;

    setEditingMessage(message);
    setMessageText(message.text || '');
    messageInputRef.current?.focus();
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingMessage(null);
    setMessageText('');
  };

  // Handle message delete
  const handleDelete = async (message) => {
    if (message.sender._id !== currentUser._id) return;

    try {
      await messageService.deleteMessage(message._id);

      // Optimistically update UI
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== message._id));

      setSnackbar({
        open: true,
        message: 'Message deleted',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting message:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete message',
        severity: 'error'
      });
    }
  };

  // Handle message forward
  const handleForward = (message) => {
    setForwardingMessage(message);
    setShowForwardDialog(true);
  };

  // Forward message to selected conversations
  const forwardMessage = async () => {
    if (!forwardingMessage || forwardTargets.length === 0) return;

    try {
      setSnackbar({
        open: true,
        message: `Forwarding message to ${forwardTargets.length} ${forwardTargets.length === 1 ? 'conversation' : 'conversations'}...`,
        severity: 'info'
      });

      // Process each target conversation sequentially to avoid overwhelming the server
      const results = [];
      for (const targetId of forwardTargets) {
        try {
          console.log(`Forwarding message ${forwardingMessage._id} to conversation ${targetId}`);
          const result = await messageService.forwardMessage({
            messageId: forwardingMessage._id,
            conversationId: targetId
          });
          results.push({ success: true, conversationId: targetId, data: result.data });

          // Update the conversation's last message if it's in our list
          setConversations(prevConversations => {
            return prevConversations.map(conv => {
              if (conv._id === targetId && result.data) {
                return {
                  ...conv,
                  lastMessage: result.data,
                  updatedAt: result.data.createdAt
                };
              }
              return conv;
            });
          });

          // If we're forwarding to the active conversation, add the message to the messages list
          if (activeConversation && targetId === activeConversation._id && result.data) {
            setMessages(prevMessages => [...prevMessages, result.data]);
          }

        } catch (error) {
          console.error(`Error forwarding message to conversation ${targetId}:`, error);
          results.push({ success: false, conversationId: targetId, error });
        }
      }

      // Count successful forwards
      const successCount = results.filter(r => r.success).length;

      setSnackbar({
        open: true,
        message: successCount > 0
          ? `Message forwarded to ${successCount} ${successCount === 1 ? 'conversation' : 'conversations'} successfully`
          : 'Failed to forward message to any conversations',
        severity: successCount > 0 ? 'success' : 'error'
      });

      // Reset state
      setForwardingMessage(null);
      setForwardTargets([]);
      setShowForwardDialog(false);
    } catch (err) {
      console.error('Error in forward message process:', err);
      setSnackbar({
        open: true,
        message: 'Failed to forward message: ' + (err.message || 'Unknown error'),
        severity: 'error'
      });
    }
  };

  // Create new conversation
  const createConversation = async (usersToAdd) => {
    // Use provided users or selected users from the UI
    const usersToCreate = usersToAdd || selectedUsers;

    if (usersToCreate.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one user to start a conversation',
        severity: 'warning'
      });
      return;
    }

    try {
      // Show loading feedback
      setSnackbar({
        open: true,
        message: 'Creating conversation...',
        severity: 'info'
      });

      // Validate selected users
      const validUsers = usersToCreate.filter(user => user && user._id);

      if (validUsers.length === 0) {
        setSnackbar({
          open: true,
          message: 'No valid users selected',
          severity: 'error'
        });
        return;
      }

      // Check if a non-group conversation already exists with this user
      if (validUsers.length === 1) {
        const existingConversation = conversations.find(conv =>
          !conv.isGroup && conv.participants.some(p => p._id === validUsers[0]._id)
        );

        if (existingConversation) {
          // Use existing conversation instead of creating a new one
          setActiveConversation(existingConversation);
          navigate(`/messages/${existingConversation._id}`);

          // Clear selected users and close dialog
          setSelectedUsers([]);
          setShowNewConversation(false);
          setShowUserProfile(false);
          setSearchQuery('');
          setSearchResults([]);

          // Show success message
          setSnackbar({
            open: true,
            message: `Opened existing conversation with ${validUsers[0].username || 'user'}`,
            severity: 'success'
          });

          // If on mobile, switch to messages view
          if (isMobile) setMobileView('messages');

          return;
        }
      }

      // Prepare data for API call
      const data = {
        participants: validUsers.map(user => user._id),
        isGroup: validUsers.length > 1
      };

      if (data.isGroup) {
        data.name = `Group with ${validUsers.map(user => user.username || 'User').join(', ')}`;
      }

      const response = await messageService.createConversation(data);
      const newConversation = response.data;

      // Add the new conversation to the list
      setConversations(prev => [newConversation, ...prev]);

      // Set it as active
      setActiveConversation(newConversation);
      navigate(`/messages/${newConversation._id}`);

      // Show success message
      setSnackbar({
        open: true,
        message: data.isGroup
          ? `Created group conversation with ${validUsers.length} users`
          : `Started conversation with ${validUsers[0].username || 'user'}`,
        severity: 'success'
      });

      // Close all dialogs
      setShowNewConversation(false);
      setShowUserProfile(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);

      // If on mobile, switch to messages view
      if (isMobile) setMobileView('messages');
    } catch (err) {
      console.error('Error creating conversation:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to create conversation',
        severity: 'error'
      });
    }
  };

  // Theme and responsive layout
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileView, setMobileView] = useState('conversations'); // 'conversations' or 'messages'

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100%',
          bgcolor: 'background.paper'
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading messages...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      {/* Conversations Sidebar */}
      <Box
        sx={{
          width: isMobile ? '100%' : 320,
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: isMobile && mobileView === 'messages' ? 'none' : 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Messages
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Available Users">
              <IconButton color="primary" onClick={() => setShowAvailableUsers(!showAvailableUsers)}>
                <Badge
                  badgeContent={onlineUsers.length}
                  color="success"
                  max={99}
                  overlap="circular"
                >
                  <PersonIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="New Message">
              <IconButton color="primary" onClick={() => setShowNewConversation(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Search Box */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search people"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);

              // Clear previous timeout
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }

              // Set new timeout for debounce
              searchTimeoutRef.current = setTimeout(() => {
                if (e.target.value.trim()) {
                  searchPeople(e.target.value);
                  setShowNewConversation(true);
                } else {
                  // If search is cleared, show suggested users
                  searchPeople('');
                }
              }, 300); // 300ms debounce
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                searchPeople(searchQuery);
                setShowNewConversation(true);
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&.Mui-focused': {
                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.2)'
                }
              }
            }}
          />
        </Box>

        {/* Available Users Drawer */}
        {showAvailableUsers && (
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Available Users
              </Typography>
              <Tooltip title="Only followers and following">
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={showOnlyConnections}
                      onChange={(e) => setShowOnlyConnections(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={<Typography variant="caption">Connections only</Typography>}
                  sx={{ ml: 0 }}
                />
              </Tooltip>
            </Box>

            {loadingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : availableUsers.length > 0 ? (
              <Box>
                {/* Filter users based on the switch state */}
                {(() => {
                  // Filter users based on connection status if needed
                  const filteredUsers = showOnlyConnections
                    ? availableUsers.filter(user =>
                        user.relationship === 'mutual' ||
                        user.relationship === 'follower' ||
                        user.relationship === 'following')
                    : availableUsers;

                  // Check if we have any users after filtering
                  if (filteredUsers.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                        No connections available
                      </Typography>
                    );
                  }

                  // Split users into online and offline
                  const onlineUsers = filteredUsers.filter(user => user.isOnline);
                  const offlineUsers = filteredUsers.filter(user => !user.isOnline);

                  return (
                    <>
                      {/* Online users section */}
                      {onlineUsers.length > 0 && (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" color="success.main" sx={{ mt: 2, mb: 1 }}>
                              Online
                            </Typography>
                            <Badge
                              badgeContent={onlineUsers.length}
                              color="success"
                              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                            />
                          </Box>
                          <List sx={{ maxHeight: 200, overflow: 'auto', p: 0, bgcolor: 'background.default', borderRadius: 1 }}>
                            {onlineUsers
                              .sort((a, b) => {
                                // Sort by relationship: mutual > followers > following > suggested
                                const relationshipOrder = { mutual: 1, follower: 2, following: 3, suggested: 4 };
                                return (relationshipOrder[a.relationship] || 4) - (relationshipOrder[b.relationship] || 4);
                              })
                              .map(user => (
                                <ListItem
                                  key={user._id}
                                  button
                                  onClick={() => {
                                    // Show user profile preview
                                    setSelectedUser(user);
                                    setShowUserProfile(true);
                                  }}
                                  sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    bgcolor:
                                      user.relationship === 'mutual' ? 'rgba(0, 200, 83, 0.08)' :
                                      user.relationship === 'follower' ? 'rgba(3, 169, 244, 0.05)' :
                                      user.relationship === 'following' ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                    }
                                  }}
                                >
                                  <ListItemAvatar>
                                    <UserStatus
                                      user={user}
                                      size="medium"
                                      showLastSeen={false}
                                    />
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {user.username}
                                        </Typography>
                                        {user.relationship && (
                                          <Chip
                                            size="small"
                                            label={
                                              user.relationship === 'mutual' ? 'Mutual' :
                                              user.relationship === 'follower' ? 'Follows you' :
                                              user.relationship === 'following' ? 'Following' : 'Suggested'
                                            }
                                            sx={{
                                              ml: 1,
                                              height: 20,
                                              fontSize: '0.6rem',
                                              bgcolor:
                                                user.relationship === 'mutual' ? 'success.light' :
                                                user.relationship === 'follower' ? 'info.light' :
                                                user.relationship === 'following' ? 'primary.light' : 'action.selected',
                                              color: user.relationship === 'suggested' ? 'text.secondary' : '#fff'
                                            }}
                                          />
                                        )}
                                      </Box>
                                    }
                                    secondary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box
                                          sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            bgcolor: 'success.main',
                                            display: 'inline-block'
                                          }}
                                        />
                                        <Typography variant="caption" color="success.main">
                                          Active now
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                  <Tooltip title="Start conversation">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartConversation(user);
                                      }}
                                    >
                                      <SendIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </ListItem>
                              ))}
                          </List>
                        </Box>
                      )}

                      {/* Offline users section */}
                      {offlineUsers.length > 0 && (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                              Offline
                            </Typography>
                            <Badge
                              badgeContent={offlineUsers.length}
                              color="default"
                              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', bgcolor: 'text.disabled', color: 'white' } }}
                            />
                          </Box>
                          <List sx={{ maxHeight: 200, overflow: 'auto', p: 0, bgcolor: 'background.default', borderRadius: 1 }}>
                            {offlineUsers
                              .sort((a, b) => {
                                // Sort by relationship and then by last seen time (most recent first)
                                const relationshipOrder = { mutual: 1, follower: 2, following: 3, suggested: 4 };
                                const relationshipDiff = (relationshipOrder[a.relationship] || 4) - (relationshipOrder[b.relationship] || 4);
                                if (relationshipDiff !== 0) return relationshipDiff;

                                // If same relationship, sort by last seen (most recent first)
                                const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
                                const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
                                return bTime - aTime;
                              })
                              .map(user => (
                                <ListItem
                                  key={user._id}
                                  button
                                  onClick={() => {
                                    // Show user profile preview
                                    setSelectedUser(user);
                                    setShowUserProfile(true);
                                  }}
                                  sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    bgcolor:
                                      user.relationship === 'mutual' ? 'rgba(0, 0, 0, 0.04)' :
                                      user.relationship === 'follower' ? 'rgba(0, 0, 0, 0.02)' :
                                      user.relationship === 'following' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                    }
                                  }}
                                >
                                  <ListItemAvatar>
                                    <UserStatus
                                      user={user}
                                      size="medium"
                                      showLastSeen={true}
                                    />
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {user.username}
                                        </Typography>
                                        {user.relationship && (
                                          <Chip
                                            size="small"
                                            label={
                                              user.relationship === 'mutual' ? 'Mutual' :
                                              user.relationship === 'follower' ? 'Follows you' :
                                              user.relationship === 'following' ? 'Following' : 'Suggested'
                                            }
                                            sx={{
                                              ml: 1,
                                              height: 20,
                                              fontSize: '0.6rem',
                                              bgcolor: 'action.selected',
                                              color: 'text.secondary'
                                            }}
                                          />
                                        )}
                                      </Box>
                                    }
                                    secondary={
                                      <Typography variant="caption" color="text.secondary">
                                        {user.lastSeen ? `Last seen ${formatLastSeen(user.lastSeen)}` : 'Offline'}
                                      </Typography>
                                    }
                                  />
                                  <Tooltip title="Start conversation">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartConversation(user);
                                      }}
                                    >
                                      <SendIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </ListItem>
                              ))}
                          </List>
                        </Box>
                      )}
                    </>
                  );
                })()}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No users available
              </Typography>
            )}
          </Box>
        )}

        {/* Conversations List */}
        {conversations.length > 0 ? (
          <List sx={{ overflow: 'auto', flexGrow: 1, p: 0 }}>
            {conversations.map(conversation => {
              // Determine the other user in a 1:1 conversation
              const otherUser = conversation.isGroup ? null :
                conversation.participants.find(user => user._id !== currentUser._id) || conversation.participants[0];

              // Format time
              const messageTime = conversation.lastMessage ?
                new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <ListItem
                  key={conversation._id}
                  button
                  alignItems="flex-start"
                  onClick={() => {
                    setConversationActive(conversation);
                    if (isMobile) setMobileView('messages');
                  }}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderLeft: activeConversation?._id === conversation._id ? 3 : 0,
                    borderColor: 'primary.main',
                    bgcolor: activeConversation?._id === conversation._id ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemAvatar>
                    {conversation.isGroup ? (
                      <AvatarGroup max={3} sx={{ width: 40, height: 40 }}>
                        {conversation.participants.slice(0, 3).map(user => (
                          <ProfilePicture
                            key={user._id}
                            src={getProfilePictureUrl(user, 'medium')}
                            alt={user.username}
                            username={user.username}
                            isVerified={user.isVerified}
                            linkToProfile={false}
                            size={{ width: 40, height: 40 }}
                          />
                        ))}
                      </AvatarGroup>
                    ) : (
                      <UserStatus
                        user={otherUser}
                        size="large"
                        showLastSeen={true}
                      />
                    )}
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal' }}>
                          {conversation.isGroup
                            ? conversation.name || `Group (${conversation.participants.length})`
                            : otherUser?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {messageTime}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{
                            maxWidth: '70%',
                            fontWeight: conversation.unreadCount > 0 ? 'medium' : 'normal'
                          }}
                        >
                          {conversation.lastMessage ? (
                            <>
                              {conversation.lastMessage.sender._id === currentUser._id && (
                                <Typography component="span" variant="body2" color="text.secondary">
                                  You:{' '}
                                </Typography>
                              )}
                              {conversation.lastMessage.text || 'Sent an attachment'}
                            </>
                          ) : (
                            'No messages yet'
                          )}
                        </Typography>

                        {conversation.unreadCount > 0 && (
                          <Badge
                            badgeContent={conversation.unreadCount}
                            color="primary"
                            max={99}
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.7rem',
                                height: 20,
                                minWidth: 20,
                                borderRadius: 10,
                                animation: `${pulseAnimation} 2s infinite`,
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                bgcolor: 'primary.main',
                                borderRadius: '50%'
                              }}
                            />
                          </Badge>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              height: '100%'
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No conversations yet
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewConversation(true)}
              sx={{ mt: 2 }}
            >
              Start a conversation
            </Button>
          </Box>
        )}
      </Box>

      {/* Message Area */}
      <Box
        sx={{
          flexGrow: 1,
          height: '100%',
          display: isMobile && mobileView === 'conversations' ? 'none' : 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}
      >
        {activeConversation ? (
          <>
            {/* Message Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isMobile && (
                  <IconButton
                    edge="start"
                    sx={{ mr: 1 }}
                    onClick={() => setMobileView('conversations')}
                  >
                    <BackIcon />
                  </IconButton>
                )}

                {/* Conversation Avatar */}
                {activeConversation.isGroup ? (
                  <AvatarGroup max={3} sx={{ mr: 2 }}>
                    {activeConversation.participants.slice(0, 3).map(user => (
                      <ProfilePicture
                        key={user._id}
                        user={user}
                        alt={user.username}
                        username={user.username}
                        isVerified={user.isVerified}
                        linkToProfile={false}
                        size="medium"
                      />
                    ))}
                  </AvatarGroup>
                ) : (
                  <Box sx={{ mr: 2 }}>
                    <UserStatus
                      user={activeConversation.participants.find(user => user._id !== currentUser._id)}
                      size="large"
                      showLastSeen={false}
                    />
                  </Box>
                )}

                {/* Conversation Info */}
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {activeConversation.isGroup
                      ? activeConversation.name || `Group (${activeConversation.participants.length})`
                      : activeConversation.participants[0]._id === currentUser._id
                        ? activeConversation.participants[1].username
                        : activeConversation.participants[0].username}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {typingUsers.length > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            mr: 0.5,
                            animation: `${typingAnimation} 1.5s infinite ease-in-out`
                          }}
                        />
                        {typingUsers.map(user => user.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </Box>
                    ) : activeConversation.isGroup ? (
                      `${activeConversation.participants.length} participants`
                    ) : (
                      (() => {
                        const otherUser = activeConversation.participants.find(user => user._id !== currentUser._id);
                        return otherUser?.isOnline ? 'Active now' : otherUser?.lastSeen ? `Last seen ${formatLastSeen(otherUser.lastSeen)}` : 'Offline';
                      })()
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Mark All as Read">
                  <IconButton onClick={handleMarkAllAsRead}>
                    <MarkChatReadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Voice Call">
                  <IconButton>
                    <CallIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Video Call">
                  <IconButton>
                    <VideoCallIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="More Options">
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Messages List */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                bgcolor: 'background.default'
              }}
            >
              {messages.length > 0 ? (
                messages.map((message, index) => {
                  const isSender = message.sender._id === currentUser._id;
                  const showAvatar = !isSender && (index === 0 || messages[index - 1].sender._id !== message.sender._id);
                  const isFirstInSequence = index === 0 || messages[index - 1].sender._id !== message.sender._id;
                  const isLastInSequence = index === messages.length - 1 || messages[index + 1].sender._id !== message.sender._id;

                  // Format time
                  const messageTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  // Determine message status
                  let messageStatus = 'pending';
                  let MessageStatusComponent = PendingIcon;

                  if (message.readBy && message.readBy.length > 0) {
                    messageStatus = 'read';
                    MessageStatusComponent = ReadIcon;
                  } else if (message.deliveryStatus === 'delivered' || message.deliveredAt) {
                    messageStatus = 'delivered';
                    MessageStatusComponent = DeliveredIcon;
                  }

                  // For messages that have just been sent and don't have an ID yet
                  const isTemporaryMessage = message._id && message._id.toString().startsWith('temp-');
                  if (isTemporaryMessage) {
                    messageStatus = 'pending';
                    MessageStatusComponent = PendingIcon;
                  }

                  return (
                    <Box
                      key={message._id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSender ? 'flex-end' : 'flex-start',
                        alignSelf: isSender ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        mb: isLastInSequence ? 2 : 0.5
                      }}
                    >
                      {/* Group chat username */}
                      {activeConversation.isGroup && !isSender && isFirstInSequence && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: showAvatar ? 7 : 1, mb: 0.5 }}
                        >
                          {message.sender.username}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                        {/* Avatar for received messages */}
                        {showAvatar && (
                          <UserStatus
                            user={message.sender}
                            size="small"
                            sx={{ mr: 1, mb: 1, visibility: isFirstInSequence ? 'visible' : 'hidden' }}
                          />
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, position: 'relative' }}>
                          {/* Reply reference */}
                          {message.replyTo && (
                            <MessageReply
                              replyTo={message.replyTo}
                              isSender={isSender}
                              onClick={() => {
                                // Scroll to original message
                                const originalMessage = document.getElementById(`message-${message.replyTo._id}`);
                                if (originalMessage) {
                                  originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  // Highlight briefly
                                  originalMessage.classList.add('highlight-message');
                                  setTimeout(() => {
                                    originalMessage.classList.remove('highlight-message');
                                  }, 2000);
                                }
                              }}
                            />
                          )}

                          {/* Text message */}
                          {message.text && (
                            <Paper
                              id={`message-${message._id}`}
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: isSender ? 'primary.main' : 'background.paper',
                                color: isSender ? 'primary.contrastText' : 'text.primary',
                                ml: !isSender && !showAvatar ? 5 : 0,
                                position: 'relative',
                                '&::after': isLastInSequence ? {
                                  content: '""',
                                  position: 'absolute',
                                  width: 10,
                                  height: 10,
                                  bottom: 0,
                                  [isSender ? 'right' : 'left']: -5,
                                  bgcolor: isSender ? 'primary.main' : 'background.paper',
                                  transform: 'rotate(45deg)',
                                  zIndex: -1
                                } : {},
                                '&.highlight-message': {
                                  animation: `${pulseAnimation} 1.5s`,
                                  boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.4)'
                                }
                              }}
                            >
                              {message.edited && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    mb: 0.5,
                                    opacity: 0.7,
                                    fontSize: '0.65rem',
                                    fontStyle: 'italic'
                                  }}
                                >
                                  Edited
                                </Typography>
                              )}
                              <Typography variant="body2">{message.text}</Typography>

                              {/* Message Actions */}
                              <MessageActions
                                message={message}
                                onReply={handleReply}
                                onReact={handleReaction}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                onForward={handleForward}
                                onMarkRead={handleMarkMessageAsRead}
                                onMarkUnread={handleMarkMessageAsUnread}
                                isSender={isSender}
                                currentUser={currentUser}
                                isRead={message.readBy && message.readBy.includes(currentUser._id)}
                              />
                            </Paper>
                          )}

                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {message.attachments.map((attachment, i) => (
                                <Box
                                  key={i}
                                  sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    maxWidth: 300,
                                    ml: !isSender && !showAvatar ? 5 : 0
                                  }}
                                >
                                  {attachment.type?.startsWith('image/') ? (
                                    <Box
                                      component="img"
                                      src={attachment.url}
                                      alt="Attachment"
                                      sx={{
                                        width: '100%',
                                        height: 'auto',
                                        objectFit: 'cover',
                                        borderRadius: 2
                                      }}
                                    />
                                  ) : attachment.type?.startsWith('video/') ? (
                                    <Box
                                      component="video"
                                      controls
                                      sx={{
                                        width: '100%',
                                        borderRadius: 2
                                      }}
                                    >
                                      <source src={attachment.url} type={attachment.type} />
                                    </Box>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      startIcon={<AttachFileIcon />}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{
                                        textTransform: 'none',
                                        color: isSender ? 'primary.contrastText' : 'primary.main',
                                        borderColor: isSender ? 'primary.contrastText' : 'primary.main',
                                      }}
                                    >
                                      {attachment.name || 'Download attachment'}
                                    </Button>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Message info (time and status) */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mt: 0.5,
                          ml: !isSender && !showAvatar ? 5 : (showAvatar ? 5 : 0)
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {messageTime}
                        </Typography>

                        {isSender && (
                          <Tooltip title={messageStatus === 'read' ? 'Read' : messageStatus === 'delivered' ? 'Delivered' : 'Sending'}>
                            <Box component="span">
                              <MessageStatusComponent
                                sx={{
                                  ml: 0.5,
                                  fontSize: 12,
                                  color: messageStatus === 'read' ? 'primary.main' :
                                         messageStatus === 'delivered' ? 'success.main' :
                                         'text.secondary',
                                  animation: isTemporaryMessage ? `${pulseAnimation} 1.5s infinite` : 'none'
                                }}
                              />
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 3,
                    color: 'text.secondary'
                  }}
                >
                  <Typography variant="body1" gutterBottom>
                    No messages yet
                  </Typography>
                  <Typography variant="body2">
                    Send a message to start the conversation
                  </Typography>
                </Box>
              )}
              <Box ref={messagesEndRef} />
            </Box>

            {/* Message Input Area */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 2
                  }}
                >
                  {attachments.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        borderRadius: 1,
                        overflow: 'hidden',
                        width: 100,
                        height: 100,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {file.type.startsWith('image/') ? (
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt="attachment"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            p: 1
                          }}
                        >
                          <AttachFileIcon color="primary" />
                          <Typography variant="caption" noWrap sx={{ maxWidth: '100%' }}>
                            {file.name}
                          </Typography>
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => removeAttachment(index)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          p: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.7)'
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Reply/Edit Status */}
              {(replyingTo || editingMessage) && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    borderLeft: '4px solid',
                    borderColor: editingMessage ? 'warning.main' : 'info.main'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {editingMessage ? (
                      <>
                        <EditIcon color="warning" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Editing message
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                            {editingMessage.text}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        <ReplyIcon color="info" sx={{ mr: 1, transform: 'scaleX(-1)' }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Replying to {replyingTo.sender.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                            {replyingTo.text || (replyingTo.attachments?.length > 0 ? 'Attachment' : '')}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                  <IconButton size="small" onClick={editingMessage ? cancelEdit : cancelReply}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                    ml: 2,
                    color: 'text.secondary',
                    fontSize: '0.8rem'
                  }}
                >
                  <Box sx={{ display: 'flex', mr: 1 }}>
                    {typingUsers.slice(0, 3).map((user, index) => (
                      <ProfilePicture
                        key={user._id}
                        user={user}
                        alt={user.username}
                        username={user.username}
                        isVerified={user.isVerified}
                        linkToProfile={false}
                        size={{ width: 24, height: 24 }}
                        sx={{
                          ml: index > 0 ? -1 : 0,
                          border: '1px solid white'
                        }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption">
                      {typingUsers.length === 1
                        ? `${typingUsers[0].username} is typing`
                        : typingUsers.length === 2
                          ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing`
                          : `${typingUsers.length} people are typing`}
                    </Typography>
                    <Box sx={{ display: 'flex', ml: 0.5 }}>
                      {[0, 1, 2].map(i => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: 'text.secondary',
                            mx: 0.2,
                            animation: `${typingAnimation} 1s infinite`,
                            animationDelay: `${i * 0.2}s`
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Input Field with Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  color="primary"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  sx={{
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <EmojiIcon />
                </IconButton>

                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={editingMessage ? "Edit your message..." :
                              replyingTo ? `Reply to ${replyingTo.sender.username}...` :
                              "Type a message..."}
                  size="small"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyUp={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  inputRef={messageInputRef}
                  disabled={isUploading}
                  multiline
                  maxRows={4}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 4,
                      bgcolor: 'background.default',
                      transition: 'all 0.3s ease',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.2)'
                      }
                    }
                  }}
                />

                <Tooltip title="Attach File">
                  <IconButton
                    component="label"
                    color="primary"
                    disabled={isUploading}
                    sx={{
                      flexShrink: 0,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <AttachFileIcon />
                    <input
                      type="file"
                      multiple
                      onChange={handleFileAttachment}
                      style={{ display: 'none' }}
                      disabled={isUploading}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Voice Message">
                  <IconButton
                    color="primary"
                    sx={{
                      flexShrink: 0,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <MicIcon />
                  </IconButton>
                </Tooltip>

                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  disabled={(!messageText.trim() && attachments.length === 0) || isUploading}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      boxShadow: 'none'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabledBackground',
                      color: 'action.disabled'
                    },
                    flexShrink: 0,
                    animation: isUploading ? `${pulseAnimation} 1.5s infinite` : 'none'
                  }}
                >
                  {isUploading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </IconButton>
              </Box>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 20,
                    zIndex: 10,
                    boxShadow: 3,
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 1
                  }}
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setMessageText(prev => prev + emojiData.emoji);
                      messageInputRef.current?.focus();
                    }}
                    width={320}
                    height={400}
                  />
                </Box>
              )}
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                opacity: 0.8
              }}
            >
              <SendIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Your Messages
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 300 }}>
              Send private messages to friends and create group conversations
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewConversation(true)}
            >
              New Message
            </Button>
          </Box>
        )}
      </Box>

      {/* New Conversation Modal */}
      <Dialog
        open={showNewConversation}
        onClose={() => {
          setShowNewConversation(false);
          setSearchQuery('');
          setSearchResults([]);
          setSelectedUsers([]);
        }}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SendIcon color="primary" />
            <Typography variant="h6">New Message</Typography>
          </Box>
          <IconButton
            edge="end"
            onClick={() => {
              setShowNewConversation(false);
              setSearchQuery('');
              setSearchResults([]);
              setSelectedUsers([]);
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          {/* Search Input */}
          <TextField
            fullWidth
            placeholder="Search for people..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);

              // Clear previous timeout
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }

              // Set new timeout for debounce
              searchTimeoutRef.current = setTimeout(() => {
                searchPeople(e.target.value);
              }, 300); // 300ms debounce
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                searchPeople(searchQuery);
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  {isSearching ? (
                    <CircularProgress size={20} color="primary" />
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&.Mui-focused': {
                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.2)'
                }
              }
            }}
          />

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {selectedUsers.map(user => (
                <Chip
                  key={user._id}
                  avatar={<ProfilePicture user={user} alt={user.username} username={user.username} isVerified={user.isVerified} linkToProfile={false} size={{ width: 24, height: 24 }} />}
                  label={user.username}
                  onDelete={() => toggleUserSelection(user)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}

          {/* Search Results */}
          <Box sx={{ mt: 2 }}>
            {isSearching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : searchResults.length > 0 ? (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, pl: 1 }}>
                  {searchQuery ? `Search results for "${searchQuery}"` : 'Suggested people'}
                </Typography>
                <List sx={{ p: 0, maxHeight: 350, overflow: 'auto', borderRadius: 2, bgcolor: 'background.default' }}>
                  {searchResults.map(user => {
                    // Skip invalid users
                    if (!user || !user._id) return null;

                    // Ensure user has avatar property for ProfilePicture component
                    const enhancedUser = {
                      ...user,
                      avatar: user.avatar || user.profilePicture || user.profile_picture || user.image || '/assets/default-avatar.png'
                    };

                    const isSelected = selectedUsers.some(u => u._id === user._id);
                    const displayName = user.username || user.fullName || 'User';
                    const userAvatar = user.avatar || user.profilePicture || '/assets/default-avatar.png';
                    const isOnline = onlineUsers.includes(user._id);

                    // Check if there's an existing conversation with this user
                    const existingConversation = conversations.find(conv =>
                      !conv.isGroup && conv.participants.some(p => p._id === user._id)
                    );

                    return (
                      <ListItem
                        key={user._id}
                        button
                        onClick={() => toggleUserSelection(user)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          bgcolor: isSelected ? 'action.selected' : 'transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isSelected ? 'action.selected' : 'action.hover',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: isOnline ? 'success.main' : 'text.disabled',
                                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                                width: 8,
                                height: 8,
                                borderRadius: '50%'
                              }
                            }}
                          >
                            <ProfilePicture
                              user={enhancedUser}
                              alt={displayName}
                              username={user.username}
                              isVerified={user.isVerified}
                              linkToProfile={false}
                              size={{ width: 40, height: 40 }}
                              sx={{
                                border: isSelected ? '2px solid #1976d2' : 'none'
                              }}
                            />
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: isSelected ? 600 : 400,
                                  color: isSelected ? 'primary.main' : 'text.primary'
                                }}
                              >
                                {displayName}
                              </Typography>
                              {existingConversation && (
                                <Tooltip title="You already have a conversation with this user">
                                  <Chip
                                    label="Existing chat"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.6rem' }}
                                  />
                                </Tooltip>
                              )}
                              {isOnline && (
                                <Typography variant="caption" color="success.main" sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      bgcolor: 'success.main',
                                      mr: 0.5,
                                      display: 'inline-block'
                                    }}
                                  />
                                  Active now
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {user.fullName && user.fullName !== displayName ? user.fullName : ''}
                              {user.email && (!user.fullName || user.fullName === displayName) ? user.email : ''}
                            </Typography>
                          }
                        />
                        <Checkbox
                          edge="end"
                          checked={isSelected}
                          color="primary"
                          sx={{
                            '& .MuiSvgIcon-root': {
                              fontSize: 24,
                              transition: 'all 0.2s ease',
                              transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                            }
                          }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </>
            ) : searchQuery ? (
              <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary', bgcolor: 'background.default', borderRadius: 2 }}>
                <SearchOffIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="subtitle1" gutterBottom>No people found</Typography>
                <Typography variant="body2">Try a different search term or check your spelling</Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary', bgcolor: 'background.default', borderRadius: 2 }}>
                <SearchIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="subtitle1" gutterBottom>Search for people</Typography>
                <Typography variant="body2">Find people to start a conversation with</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowNewConversation(false);
              setSearchQuery('');
              setSearchResults([]);
              setSelectedUsers([]);
            }}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createConversation}
            disabled={selectedUsers.length === 0}
            startIcon={<SendIcon />}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              '&::after': selectedUsers.length > 0 ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
                animation: `${pulseAnimation} 2s infinite`,
              } : {}
            }}
          >
            {selectedUsers.length > 0 ? `Chat with ${selectedUsers.length === 1 ? selectedUsers[0].username : `${selectedUsers.length} users`}` : 'Start Conversation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forward Message Dialog */}
      <Dialog
        open={showForwardDialog}
        onClose={() => {
          setShowForwardDialog(false);
          setForwardingMessage(null);
          setForwardTargets([]);
        }}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
      >
        <DialogTitle>Forward Message</DialogTitle>
        <DialogContent dividers>
          {forwardingMessage && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Message from {forwardingMessage.sender.username}
              </Typography>
              {forwardingMessage.text && (
                <Typography variant="body2">{forwardingMessage.text}</Typography>
              )}
              {forwardingMessage.attachments && forwardingMessage.attachments.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {forwardingMessage.attachments.length} attachment{forwardingMessage.attachments.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Typography variant="subtitle2" gutterBottom>
            Select conversations to forward to:
          </Typography>

          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {conversations.map(conversation => {
              const isSelected = forwardTargets.includes(conversation._id);
              const otherUser = conversation.isGroup ? null :
                conversation.participants.find(user => user._id !== currentUser._id);

              return (
                <ListItem
                  key={conversation._id}
                  button
                  onClick={() => {
                    if (isSelected) {
                      setForwardTargets(prev => prev.filter(id => id !== conversation._id));
                    } else {
                      setForwardTargets(prev => [...prev, conversation._id]);
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: isSelected ? 'action.selected' : 'transparent'
                  }}
                >
                  <ListItemAvatar>
                    {conversation.isGroup ? (
                      <AvatarGroup max={3} sx={{ width: 40, height: 40 }}>
                        {conversation.participants.slice(0, 3).map(user => (
                          <ProfilePicture
                            key={user._id}
                            user={user}
                            alt={user.username}
                            username={user.username}
                            isVerified={user.isVerified}
                            linkToProfile={false}
                            size={{ width: 24, height: 24 }}
                          />
                        ))}
                      </AvatarGroup>
                    ) : (
                      <ProfilePicture
                        user={otherUser}
                        alt={otherUser?.username}
                        username={otherUser?.username}
                        isVerified={otherUser?.isVerified}
                        linkToProfile={false}
                        size={{ width: 40, height: 40 }}
                      />
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={conversation.isGroup
                      ? conversation.name || `Group (${conversation.participants.length})`
                      : otherUser?.username}
                  />
                  <Checkbox
                    edge="end"
                    checked={isSelected}
                    color="primary"
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowForwardDialog(false);
              setForwardingMessage(null);
              setForwardTargets([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={forwardMessage}
            disabled={forwardTargets.length === 0}
          >
            Forward
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Profile Preview */}
      {showUserProfile && selectedUser && (
        <Dialog
          open={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          maxWidth="sm"
          TransitionComponent={Transition}
          PaperProps={{
            sx: {
              borderRadius: 2,
              overflow: 'visible'
            }
          }}
        >
          <UserProfilePreview
            user={selectedUser}
            onClose={() => setShowUserProfile(false)}
            onStartConversation={handleStartConversation}
            currentUser={currentUser}
          />
        </Dialog>
      )}



      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Messages;
