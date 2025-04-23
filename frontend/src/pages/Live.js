import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { liveService, userService } from '../services/api';
import socketService from '../services/socketService';
// Import the ShareDialog component
import ShareDialog from '../components/live/ShareDialog';
import ProfilePicture from '../components/common/ProfilePicture';
import { getProfilePictureUrl } from '../utils/profilePictureHelper';

// Material UI components
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  TextField,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  Badge
} from '@mui/material';

// Material UI icons
import LiveTvIcon from '@mui/icons-material/LiveTv';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ReplyIcon from '@mui/icons-material/Reply';

// Utility function to extract username from email if needed
const extractUsernameFromEmail = (email) => {
  if (!email) return 'Anonymous';
  if (!email.includes('@')) return email;
  return email.split('@')[0];
};

// Utility function to format user data
const formatUserData = (userData) => {
  // Handle null or undefined user data
  if (!userData) return { _id: 'unknown', username: 'Stream Creator', avatar: '/default-avatar.png' };

  // Check if this is a placeholder or unknown user
  if (userData.username === 'Unknown User' || userData.username === 'unknown') {
    // Try to get the current user from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const currentUser = JSON.parse(storedUser);
        if (currentUser && currentUser.username) {
          return {
            _id: currentUser._id || 'current-user',
            username: currentUser.username,
            avatar: currentUser.avatar || '/default-avatar.png'
          };
        }
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }

    // If we couldn't get current user, use a better placeholder
    return { _id: userData._id || 'unknown', username: 'Stream Creator', avatar: userData.avatar || '/default-avatar.png' };
  }

  // Check if username is an email and extract username part if it is
  // First try username, then fullName, then email, then fallback to Stream Creator
  let displayName = 'Stream Creator';

  if (userData.username) {
    displayName = userData.username.includes('@') ? extractUsernameFromEmail(userData.username) : userData.username;
  } else if (userData.fullName) {
    displayName = userData.fullName;
  } else if (userData.email) {
    displayName = extractUsernameFromEmail(userData.email);
  } else if (userData.name) {
    displayName = userData.name;
  }

  // Ensure we never return 'Unknown User' as a username
  if (displayName === 'Unknown User' || displayName === 'unknown') {
    displayName = 'Stream Creator';
  }

  return {
    _id: userData._id || 'unknown',
    username: displayName,
    avatar: userData.avatar || userData.profilePicture || '/default-avatar.png'
  };
};

const Live = () => {
  const { id: urlStreamId } = useParams();
  const [streamId, setStreamId] = useState(urlStreamId);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Update streamId when URL parameter changes
  useEffect(() => {
    if (urlStreamId) {
      setStreamId(urlStreamId);
    }
  }, [urlStreamId]);

  // Basic states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Stream creation states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [category, setCategory] = useState('');
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [isFirstTimeStreamer, setIsFirstTimeStreamer] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [scheduledStreams, setScheduledStreams] = useState([]);
  const [preStreamChecklist, setPreStreamChecklist] = useState({
    cameraReady: false,
    microphoneReady: false,
    contentPlanned: false,
    internetStable: false
  });

  // Stream viewing states
  const [stream, setStream] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [streamStartTime, setStreamStartTime] = useState(null);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Viewer interaction states
  const [reactions, setReactions] = useState([]);
  const [reactionCount, setReactionCount] = useState(0);
  const [pinnedComment, setPinnedComment] = useState(null);
  const [pollActive, setPollActive] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState([]);
  const [pollResults, setPollResults] = useState({});
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [featuredGuest, setFeaturedGuest] = useState(null);
  const [waitingGuests, setWaitingGuests] = useState([]);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [chatTab, setChatTab] = useState('chat'); // 'chat' or 'viewers'
  const [replyingTo, setReplyingTo] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});

  // Media states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [backgroundEffect, setBackgroundEffect] = useState(null);
  const [streamQuality, setStreamQuality] = useState('auto');
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' or 'environment'
  const [showControls, setShowControls] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedVideos, setRecordedVideos] = useState([]);

  // Analytics states
  const [viewerHistory, setViewerHistory] = useState([]);
  const [peakViewers, setPeakViewers] = useState(0);
  const [engagementRate, setEngagementRate] = useState(0);
  const [topEngagers, setTopEngagers] = useState([]);
  const [reactionBreakdown, setReactionBreakdown] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [streamHealth, setStreamHealth] = useState('excellent');
  const [streamStats, setStreamStats] = useState({
    bitrate: '2.5 Mbps',
    resolution: '720p',
    fps: 30,
    latency: '2s'
  });

  // Highlights states
  const [highlights, setHighlights] = useState([]);
  const [isCreatingHighlight, setIsCreatingHighlight] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState('');
  const [highlightDescription, setHighlightDescription] = useState('');
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const streamControlsRef = useRef(null);
  const analyticsRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Mobile detection
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(min-width:601px) and (max-width:960px)');
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-width:960px)');

  // Format duration in HH:MM:SS format
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) {
      parts.push(hours.toString().padStart(2, '0'));
    }
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));

    return parts.join(':');
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Send a chat message
  const sendMessage = async () => {
    if (!messageText.trim() || !streamId) return;

    // Create a unique ID for this message attempt
    const tempId = `temp-${Date.now()}`;

    try {
      // Create message data
      const messageData = {
        text: messageText,
        replyTo: replyingTo ? replyingTo.id : null
      };

      // Format the current user data to ensure we have a proper username, not an email
      const formattedUser = currentUser ? formatUserData(currentUser) : { _id: 'current-user', username: 'You', avatar: '/default-avatar.png' };

      // Optimistically add message to UI
      const optimisticMessage = {
        id: tempId,
        text: messageText,
        user: formattedUser,
        timestamp: new Date(),
        replyTo: replyingTo,
        pending: true // Mark as pending until confirmed by server
      };

      // Add to messages
      setMessages(prev => [...prev, optimisticMessage]);
      setMessageCount(prev => prev + 1);

      // Clear input and reset reply state
      setMessageText('');
      setReplyingTo(null);
      setShowEmojiPicker(false);

      // Scroll to bottom after sending a message
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);

      // Variable to track if any send method succeeded
      let sendSuccess = false;
      let serverMessage = null;

      // Try to send message via socket first for real-time delivery
      try {
        console.log('Attempting to send message via socket...');
        // Check if sendLivestreamMessage function exists
        if (typeof socketService.sendLivestreamMessage === 'function') {
          const socketSuccess = socketService.sendLivestreamMessage(streamId, messageText, replyingTo ? replyingTo.id : null);

          if (socketSuccess) {
            console.log('Message sent via socket successfully');
            sendSuccess = true;
          } else {
            console.log('Socket message send returned false, will try API');
          }
        } else {
          console.warn('socketService.sendLivestreamMessage is not a function, will try direct emit');
          // Try direct socket emit as fallback
          if (socketService.getSocket()) {
            // Try multiple event names to ensure compatibility
            const events = [
              'livestream:message',
              'livestream:sendMessage',
              'message',
              'livestream:comment',
              'chat-message'
            ];

            for (const eventName of events) {
              console.log(`Trying to emit event ${eventName}...`);
              const directEmitSuccess = socketService.emitEvent(eventName, {
                streamId,
                text: messageText,
                replyTo: replyingTo ? replyingTo.id : null,
                type: 'livestream'
              });

              if (directEmitSuccess) {
                console.log(`Message sent via direct socket emit (${eventName}) successfully`);
                sendSuccess = true;
                break;
              }
            }

            if (!sendSuccess) {
              console.log('All direct socket emit attempts failed, will try API');
            }
          }
        }
      } catch (socketError) {
        console.error('Error sending message via socket:', socketError);
        // Continue to API fallback
      }

      // Try to send message via API (either as backup or to ensure persistence)
      if (!sendSuccess) {
        try {
          console.log('Attempting to send message via API...');
          // Check if sendStreamMessage function exists
          if (typeof liveService.sendStreamMessage === 'function') {
            const response = await liveService.sendStreamMessage(streamId, messageData);
            serverMessage = response.data.data || response.data;
            console.log('Message sent via API successfully:', serverMessage);
            sendSuccess = true;
          } else {
            console.warn('liveService.sendStreamMessage is not a function, trying alternative');
            // Try multiple API endpoints as fallback
            const endpoints = [
              `/api/livestreams/${streamId}/messages`,
              `/api/livestreams/${streamId}/comments`,
              `/api/live/${streamId}/messages`,
              `/api/live/${streamId}/comments`
            ];

            for (const endpoint of endpoints) {
              try {
                console.log(`Trying API endpoint: ${endpoint}`);
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify(messageData)
                });

                if (response.ok) {
                  const data = await response.json();
                  serverMessage = data.data || data;
                  console.log(`Message sent via fetch API (${endpoint}) successfully:`, serverMessage);
                  sendSuccess = true;
                  break;
                } else {
                  console.log(`Fetch API endpoint ${endpoint} failed with status:`, response.status);
                }
              } catch (fetchError) {
                console.error(`Error sending message via fetch API endpoint ${endpoint}:`, fetchError);
              }
            }
          }
        } catch (apiError) {
          console.error('Error sending message via API:', apiError);
          // If all attempts failed, throw the error
          if (!sendSuccess) {
            throw apiError; // Re-throw to trigger the catch block below
          }
        }
      }

      // If we got here and sendSuccess is still false, throw an error
      if (!sendSuccess) {
        throw new Error('Failed to send message through any available method');
      }

      // Helper function to format user data from server response with fallback
      const formatServerUserData = (userData, fallbackUser) => {
        if (!userData) return fallbackUser;
        const formattedUser = formatUserData(userData);
        return {
          _id: formattedUser._id || fallbackUser._id,
          username: formattedUser.username || fallbackUser.username,
          avatar: formattedUser.avatar || fallbackUser.avatar
        };
      };

      // If we have a server message, update the optimistic message
      if (serverMessage) {
        // Replace optimistic message with server response
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? {
            id: serverMessage._id || tempId,
            text: serverMessage.text || msg.text,
            user: formatServerUserData(serverMessage.user, msg.user),
            timestamp: serverMessage.createdAt ? new Date(serverMessage.createdAt) : msg.timestamp,
            replyTo: serverMessage.replyTo ? {
              id: serverMessage.replyTo._id,
              text: serverMessage.replyTo.text,
              user: formatServerUserData(serverMessage.replyTo.user, {
                _id: 'unknown',
                username: 'Anonymous',
                avatar: '/default-avatar.png'
              })
            } : msg.replyTo,
            pending: false
          } : msg
        ));
      } else {
        // Just mark the message as not pending anymore
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, pending: false }
            : msg
        ));
      }

      // If we got here and sendSuccess is still false, throw an error
      if (!sendSuccess) {
        throw new Error('Failed to send message through any available method');
      }

      // If we have a server message, update the optimistic message with the server data
      if (serverMessage) {
        // Update the message in the UI with the server data
        setMessages(prev => prev.map(msg => {
          if (msg.id === tempId) {
            // Keep the original message text and user info, but update with server data
            return {
              ...msg,
              id: serverMessage._id || serverMessage.id || msg.id,
              pending: false,
              timestamp: new Date(serverMessage.createdAt || serverMessage.timestamp || msg.timestamp)
            };
          }
          return msg;
        }));
      } else {
        // If we don't have server data but the message was sent successfully,
        // just mark it as not pending
        setMessages(prev => prev.map(msg => {
          if (msg.id === tempId) {
            return { ...msg, pending: false };
          }
          return msg;
        }));
      }

      // Update engagement metrics
      updateEngagementMetrics('message');
    } catch (error) {
      console.error('Error sending message:', error);

      // Show detailed error to user
      let errorMessage = 'Failed to send message. Please try again.';

      if (error.response) {
        // Server responded with an error status
        if (error.response.status === 401) {
          errorMessage = 'You need to be logged in to send messages.';
        } else if (error.response.status === 403) {
          errorMessage = 'You don\'t have permission to send messages in this stream.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = `Failed to send message: ${error.response.data.message}`;
        }
      } else if (error.message) {
        errorMessage = `Failed to send message: ${error.message}`;
      }

      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);

      // Remove optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setMessageCount(prev => prev - 1);

      // Try to reconnect socket if it might be a connection issue
      if (error.message && (error.message.includes('socket') || error.message.includes('connection'))) {
        console.log('Attempting to reconnect socket after message error...');
        try {
          // Reinitialize socket connection
          initializeSocketConnection();
        } catch (reconnectError) {
          console.error('Failed to reconnect socket after message error:', reconnectError);
        }
      }
    }
  };

  // Reply to a message
  const replyToMessage = (message) => {
    setReplyingTo(message);
    // Focus the message input
    document.querySelector('input[placeholder="Type a message..."]')?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // React to a message
  const reactToMessage = (messageId, reaction) => {
    setMessageReactions(prev => {
      const messageReactions = prev[messageId] || {};
      const currentCount = messageReactions[reaction] || 0;

      return {
        ...prev,
        [messageId]: {
          ...messageReactions,
          [reaction]: currentCount + 1
        }
      };
    });
  };

  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          // Switch back to camera
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            const newVideoTrack = stream.getVideoTracks()[0];

            if (localVideoRef.current && newVideoTrack) {
              const sender = peerConnectionRef.current?.getSenders().find(s => s.track.kind === 'video');
              if (sender) {
                sender.replaceTrack(newVideoTrack);
              }

              localStreamRef.current.removeTrack(videoTrack);
              localStreamRef.current.addTrack(newVideoTrack);

              videoTrack.stop();
            }
          } catch (err) {
            console.error('Error switching back to camera:', err);
          }
        }
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenVideoTrack = screenStream.getVideoTracks()[0];

        if (localVideoRef.current && screenVideoTrack) {
          const sender = peerConnectionRef.current?.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenVideoTrack);
          }

          // Replace video track in local stream
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            localStreamRef.current.removeTrack(videoTrack);
            localStreamRef.current.addTrack(screenVideoTrack);
            videoTrack.stop();
          }

          // Handle screen sharing ended by user
          screenVideoTrack.onended = () => {
            toggleScreenSharing();
          };
        }
      } catch (err) {
        console.error('Error sharing screen:', err);
        setSnackbarMessage('Could not share screen. Please check permissions.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    }

    setIsScreenSharing(!isScreenSharing);
  };

  // Apply video filter
  const applyFilter = (filterName) => {
    setActiveFilter(filterName);

    // In a real implementation, we would apply CSS filters to the video element
    // or use a canvas to process the video frames
    if (localVideoRef.current) {
      const filters = {
        none: '',
        grayscale: 'grayscale(100%)',
        sepia: 'sepia(100%)',
        invert: 'invert(100%)',
        blur: 'blur(5px)',
        brightness: 'brightness(150%)',
        contrast: 'contrast(200%)'
      };

      localVideoRef.current.style.filter = filters[filterName] || '';
    }
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: true
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (localVideoRef.current && videoTrack) {
        // Replace video track
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }

        localStreamRef.current.addTrack(videoTrack);

        // Update peer connection if exists
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      setCameraFacing(newFacing);
    } catch (err) {
      console.error('Error switching camera:', err);
      setSnackbarMessage('Could not switch camera. Please check permissions.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Create a poll
  const createPoll = (question, options) => {
    setPollQuestion(question);
    setPollOptions(options);
    setPollResults(options.reduce((acc, option) => ({ ...acc, [option]: 0 }), {}));
    setPollActive(true);

    // In a real implementation, we would emit this to the server
    // and broadcast to all viewers

    // Add system message about poll
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'system',
        text: `Poll started: ${question}`,
        timestamp: new Date()
      }
    ]);
  };

  // Vote in a poll
  const voteInPoll = (option) => {
    if (!pollActive) return;

    // Update poll results
    setPollResults(prev => ({
      ...prev,
      [option]: (prev[option] || 0) + 1
    }));

    // In a real implementation, we would emit this to the server
  };

  // End a poll
  const endPoll = () => {
    if (!pollActive) return;

    // Find winning option
    const winner = Object.entries(pollResults).reduce(
      (max, [option, votes]) => votes > max.votes ? { option, votes } : max,
      { option: '', votes: 0 }
    );

    // Add system message about poll results
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'system',
        text: `Poll ended: "${pollQuestion}". Winner: ${winner.option} (${winner.votes} votes)`,
        timestamp: new Date()
      }
    ]);

    setPollActive(false);
    setPollQuestion('');
    setPollOptions([]);
    setPollResults({});
  };

  // Pin a comment
  const pinComment = (messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      setPinnedComment(message);

      // Add system message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          text: `Comment pinned: "${message.text}"`,
          timestamp: new Date()
        }
      ]);
    }
  };

  // Unpin a comment
  const unpinComment = () => {
    if (pinnedComment) {
      // Add system message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          text: 'Comment unpinned',
          timestamp: new Date()
        }
      ]);

      setPinnedComment(null);
    }
  };

  // Send a reaction
  const sendReaction = (type) => {
    // Create a new reaction with random position
    const newReaction = {
      id: Date.now(),
      type,
      position: Math.floor(Math.random() * 80) + 10, // 10-90% from left
      user: currentUser,
      timestamp: new Date()
    };

    // Add to reactions
    setReactions(prev => [...prev, newReaction]);
    setReactionCount(prev => prev + 1);

    // Update reaction breakdown
    setReactionBreakdown(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));

    // Update engagement metrics
    updateEngagementMetrics('reaction');

    // Remove reaction after animation (3 seconds)
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3000);
  };

  // Update engagement metrics
  const updateEngagementMetrics = (type) => {
    // Update engagement rate based on viewer count and interactions
    const totalInteractions = messageCount + reactionCount;
    const newEngagementRate = viewerCount > 0 ? (totalInteractions / viewerCount) * 100 : 0;
    setEngagementRate(newEngagementRate);

    // Update peak viewers if current count is higher
    if (viewerCount > peakViewers) {
      setPeakViewers(viewerCount);
    }

    // In a real implementation, we would track individual user engagement
    // and update topEngagers accordingly
  };

  // Toggle camera
  const toggleCamera = () => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;

    const isCurrentlyEnabled = videoTracks[0].enabled;

    // Toggle video track
    videoTracks.forEach(track => {
      track.enabled = !isCurrentlyEnabled;
    });

    setIsCameraOn(!isCurrentlyEnabled);
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const isCurrentlyEnabled = audioTracks[0].enabled;

    // Toggle audio track
    audioTracks.forEach(track => {
      track.enabled = !isCurrentlyEnabled;
    });

    setIsMuted(isCurrentlyEnabled);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const videoElement = isCreator ? localVideoRef.current : remoteVideoRef.current;
    if (!videoElement) return;

    try {
      if (!document.fullscreenElement) {
        if (videoElement.requestFullscreen) {
          videoElement.requestFullscreen();
        } else if (videoElement.webkitRequestFullscreen) { /* Safari */
          videoElement.webkitRequestFullscreen();
        } else if (videoElement.msRequestFullscreen) { /* IE11 */
          videoElement.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
          document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
      setSnackbarMessage('Failed to toggle fullscreen mode');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Start recording the livestream
  const startRecording = () => {
    if (!localStreamRef.current || isRecording) return;

    try {
      // Create a MediaRecorder instance
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const mediaRecorder = new MediaRecorder(localStreamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Create a blob from the recorded chunks
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        // Add to recorded videos
        const newVideo = {
          id: Date.now(),
          url,
          blob,
          duration: recordingDuration,
          timestamp: new Date(),
          title: `${stream?.title || 'Livestream'} - Recording ${recordedVideos.length + 1}`
        };

        setRecordedVideos(prev => [...prev, newVideo]);

        // Reset recording state
        setIsRecording(false);
        setRecordingDuration(0);

        // Show success message
        setSnackbarMessage('Recording saved successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Upload recording to server if stream exists
        if (streamId) {
          try {
            // Create a FormData object to send the file
            const formData = new FormData();
            formData.append('recording', blob, `recording-${Date.now()}.webm`);

            // Upload the recording
            await liveService.uploadStreamRecording(streamId, formData);

            // Show success message
            setSnackbarMessage('Recording uploaded successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } catch (error) {
            console.error('Error uploading recording:', error);
            setSnackbarMessage('Failed to upload recording. You can try again later.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
          }
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Start recording duration counter
      const recordingInterval = setInterval(() => {
        if (isRecording) {
          setRecordingDuration(prev => prev + 1);
        } else {
          clearInterval(recordingInterval);
        }
      }, 1000);

      // Add system message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          text: 'Recording started',
          timestamp: new Date()
        }
      ]);

      // Show success message
      setSnackbarMessage('Recording started!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setSnackbarMessage('Failed to start recording. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    try {
      // Stop the media recorder
      mediaRecorderRef.current.stop();

      // Add system message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          text: 'Recording stopped',
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setSnackbarMessage('Failed to stop recording. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Download a recorded video
  const downloadRecording = (videoId) => {
    const video = recordedVideos.find(v => v.id === videoId);
    if (!video) return;

    // Create a download link
    const a = document.createElement('a');
    a.href = video.url;
    a.download = `${video.title.replace(/\s+/g, '-')}.webm`;
    a.click();
  };

  // Create a highlight
  const createHighlight = async () => {
    if (!highlightTitle.trim() || !streamId) return;

    setIsCreatingHighlight(true);

    try {
      // Create highlight data
      const highlightData = {
        title: highlightTitle,
        description: highlightDescription,
        timestamp: streamDuration,
        streamId
      };

      // Call API to create highlight
      const response = await liveService.createStreamHighlight(streamId, highlightData);
      const newHighlight = response.data.data;

      // Add to highlights list
      setHighlights(prev => [...prev, {
        id: newHighlight._id,
        title: newHighlight.title,
        description: newHighlight.description,
        timestamp: newHighlight.timestamp,
        createdAt: newHighlight.createdAt
      }]);

      // Reset form and close dialog
      setHighlightTitle('');
      setHighlightDescription('');
      setShowHighlightDialog(false);

      // Show success message
      setSnackbarMessage('Highlight created successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Add system message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          text: `Highlight created: "${highlightTitle}" at ${formatDuration(streamDuration)}`,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error creating highlight:', error);
      setSnackbarMessage('Failed to create highlight. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsCreatingHighlight(false);
    }
  };

  // Share a highlight
  const shareHighlight = async (highlightId) => {
    if (!streamId) return;

    try {
      // Find the highlight to share
      const highlightToShare = highlights.find(h => h.id === highlightId);

      if (!highlightToShare) {
        throw new Error('Highlight not found');
      }

      // Create share text
      const shareText = `Check out this highlight from ${currentUser?.username || 'my'}'s livestream: "${highlightToShare.title}" at ${formatDuration(highlightToShare.timestamp)}`;

      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: highlightToShare.title,
          text: shareText,
          url: `${window.location.origin}/live/${streamId}/highlights/${highlightId}`
        });

        // Show success message
        setSnackbarMessage('Highlight shared successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);

        // Show success message
        setSnackbarMessage('Highlight link copied to clipboard!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error sharing highlight:', error);
      setSnackbarMessage('Failed to share highlight. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Delete a highlight
  const deleteHighlight = async (highlightId) => {
    if (!streamId || !isCreator) return;

    try {
      // Call API to delete highlight
      await liveService.deleteStreamHighlight(streamId, highlightId);

      // Remove from highlights list
      setHighlights(prev => prev.filter(h => h.id !== highlightId));

      // Show success message
      setSnackbarMessage('Highlight deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting highlight:', error);
      setSnackbarMessage('Failed to delete highlight. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Fetch stream highlights
  useEffect(() => {
    if (streamId) {
      const fetchHighlights = async () => {
        try {
          const response = await liveService.getStreamHighlights(streamId);
          const highlightsData = response.data.data;

          setHighlights(highlightsData.map(highlight => ({
            id: highlight._id,
            title: highlight.title,
            description: highlight.description,
            timestamp: highlight.timestamp,
            createdAt: highlight.createdAt
          })));
        } catch (error) {
          console.error('Error fetching highlights:', error);
        }
      };

      fetchHighlights();
    }
  }, [streamId]);

  // End the livestream
  const endStream = async () => {
    // Enhanced confirmation dialog with more details
    const streamDurationFormatted = formatDuration(streamDuration);
    const viewerCountText = viewerCount === 1 ? '1 viewer' : `${viewerCount} viewers`;

    if (!window.confirm(
      `Are you sure you want to end this livestream?

Stream duration: ${streamDurationFormatted}
Current viewers: ${viewerCountText}

This action cannot be undone. The stream will end for all viewers.`
    )) {
      return;
    }

    // Show loading state
    setSnackbarMessage('Ending livestream...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);

    try {
      console.log('Ending livestream with ID:', streamId);

      // Close share dialog if open
      if (shareDialogOpen) {
        setShareDialogOpen(false);
      }

      // Stop recording if active
      if (isRecording && mediaRecorderRef.current) {
        try {
          await stopRecording();
          console.log('Recording stopped successfully');
        } catch (recordingError) {
          console.error('Error stopping recording:', recordingError);
          // Continue with ending the stream even if stopping recording fails
        }
      }

      // Emit socket event to notify viewers first (for immediate feedback)
      if (socketService.getSocket()) {
        try {
          console.log('Emitting livestream:end event');
          socketService.emitEvent('livestream:end', { streamId });

          // Try alternative event names for better compatibility
          socketService.emitEvent('stream-ended', { streamId });
          socketService.emitEvent('end-livestream', { streamId });
        } catch (socketError) {
          console.error('Error emitting socket end event:', socketError);
          // Continue with API call even if socket emission fails
        }
      }

      // Call API to end the stream
      if (streamId) {
        try {
          console.log('Calling API to end stream');
          const response = await liveService.endStream(streamId);
          console.log('End stream API response:', response);
        } catch (apiError) {
          console.error('Error calling end stream API:', apiError);
          // If API call fails, we'll still update the UI as if it succeeded
          // This provides a better user experience even if the backend fails
        }
      }

      // Update UI state
      setIsLive(false);

      // Update stream status in local state
      if (stream) {
        setStream(prev => ({
          ...prev,
          status: 'ended',
          endedAt: new Date().toISOString()
        }));
      }

      // Add system message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          text: 'Livestream ended by the creator',
          timestamp: new Date()
        }
      ]);

      // Show success message
      setSnackbarMessage('Livestream ended successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Stop all tracks from the local stream
      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (trackError) {
              console.error('Error stopping track:', trackError);
            }
          });
          localStreamRef.current = null;
        } catch (streamError) {
          console.error('Error stopping local stream:', streamError);
        }
      }

      // If there are recordings, show a message about them
      if (recordedVideos.length > 0) {
        setTimeout(() => {
          setSnackbarMessage(`Your livestream has ${recordedVideos.length} recording(s). You can view them in the Recordings tab.`);
          setSnackbarSeverity('info');
          setSnackbarOpen(true);
          setChatTab('recordings');
        }, 3000);
      }
    } catch (error) {
      console.error('Error ending livestream:', error);
      setSnackbarMessage('Failed to end livestream. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Share stream
  const shareStream = () => {
    if (!stream) {
      setSnackbarMessage('No active stream to share');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    // Open the share dialog
    setShareDialogOpen(true);
  };

  // Handle share dialog close
  const handleShareDialogClose = () => {
    setShareDialogOpen(false);
  };

  // Initialize camera when component mounts (for creator)
  useEffect(() => {
    // Only initialize camera if we're not viewing an existing stream
    if (!streamId && !localStreamRef.current) {
      // Request camera and microphone permissions
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localStreamRef.current = stream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(err => console.error('Error playing video:', err));
          }

          // Set initial states
          setIsCameraOn(true);
          setIsMuted(false);

          console.log('Camera and microphone initialized successfully');
        })
        .catch(err => {
          console.error('Error accessing camera or microphone:', err);
          // Don't show error message on initial load, only when explicitly trying to go live
        });
    }

    // Cleanup function to stop all tracks when component unmounts
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [streamId]);

  // Check if viewing existing stream or creating new one
  useEffect(() => {
    if (streamId) {
      // Fetch stream details from API
      setLoading(true);

      // No mock stream - require real backend connection

      const fetchStreamData = async () => {
        try {
          console.log(`Attempting to fetch stream data for ID: ${streamId}`);

          // Fetch stream details
          const streamResponse = await liveService.getStreamById(streamId);
          console.log('Stream data response:', streamResponse);

          // Handle different response formats
          let streamData;
          if (streamResponse.data && streamResponse.data.data) {
            streamData = streamResponse.data.data;
          } else if (streamResponse.data && streamResponse.data.livestream) {
            streamData = streamResponse.data.livestream;
          } else if (streamResponse.data && streamResponse.data._id) {
            streamData = streamResponse.data;
          } else if (streamResponse.data && streamResponse.data.success === true) {
            // Some APIs return { success: true, data: {...} }
            streamData = streamResponse.data.data;
          } else {
            console.warn('Unexpected response format:', streamResponse);
            throw new Error('No stream data returned from the server');
          }

          // Check if streamData exists
          if (!streamData) {
            throw new Error('No stream data returned from the server');
          }

          console.log('Processed stream data:', streamData);

          // Check if user information is missing or incomplete
          if (!streamData.user || !streamData.user._id || !streamData.user.username || streamData.user.username === 'Unknown User') {
            console.warn('Stream data missing or has incomplete user information:', streamData);

            // Try to fetch user data if we have a user ID
            if (streamData.user && streamData.user._id) {
              try {
                console.log(`Attempting to fetch user data for stream creator ID: ${streamData.user._id}`);
                const userResponse = await userService.getUserProfile(streamData.user._id);

                if (userResponse.data && userResponse.data.user) {
                  const userData = userResponse.data.user;
                  console.log('Successfully fetched user data for stream creator:', userData);

                  // Update stream data with complete user information
                  streamData.user = {
                    _id: userData._id,
                    username: userData.username || 'Stream Creator',
                    fullName: userData.fullName || userData.name || userData.username || 'Stream Creator',
                    avatar: userData.avatar || userData.profilePicture || '/default-avatar.png'
                  };
                }
              } catch (userError) {
                console.error('Error fetching user data for stream creator:', userError);
                // Continue with fallback
              }
            }

            // If we still don't have valid user data, use current user or create placeholder
            if (!streamData.user || !streamData.user.username || streamData.user.username === 'Unknown User') {
              // Add a placeholder user to prevent errors, preferring current user if available
              streamData.user = {
                _id: currentUser ? currentUser._id : 'placeholder-user-id',
                username: currentUser ? currentUser.username : 'Stream Creator',
                fullName: currentUser ? currentUser.fullName : 'Stream Creator',
                avatar: currentUser ? currentUser.avatar : '/default-avatar.png'
              };
            }
          }

          console.log('Stream data loaded successfully:', streamData);

          setStream(streamData);
          setIsCreator(streamData.user._id === currentUser?._id);
          setIsLive(streamData.status === 'live');

          if (streamData.status === 'live' && streamData.startedAt) {
            setStreamStartTime(new Date(streamData.startedAt));
          }

          // Fetch viewers
          let viewersData = [];
          try {
            // Check if getStreamViewers function exists
            if (typeof liveService.getStreamViewers === 'function') {
              const viewersResponse = await liveService.getStreamViewers(streamId);
              viewersData = viewersResponse.data.data || [];
            } else {
              console.warn('liveService.getStreamViewers is not a function, using empty viewers data');
              // Use empty array as fallback
              viewersData = [];
            }
          } catch (viewersError) {
            console.error('Error fetching stream viewers:', viewersError);
            // Use empty array as fallback
            viewersData = [];
          }

          console.log('Viewers data loaded:', viewersData);

          // Using the global formatUserData function defined at the top of the file

          // Format viewers data with null checks
          const formattedViewers = viewersData
            .filter(viewer => viewer) // Filter out invalid viewers
            .map(viewer => {
              const formattedUser = formatUserData(viewer.user);
              return {
                _id: formattedUser._id,
                username: formattedUser.username,
                avatar: formattedUser.avatar,
                joinedAt: new Date(viewer.joinedAt || Date.now())
              };
            });

          setViewers(formattedViewers);
          setViewerCount(formattedViewers.length);

          // Fetch messages/comments
          let messagesData = [];
          try {
            // Check if getStreamMessages function exists
            if (typeof liveService.getStreamMessages === 'function') {
              const messagesResponse = await liveService.getStreamMessages(streamId);
              messagesData = messagesResponse.data.data || [];
            } else {
              console.warn('liveService.getStreamMessages is not a function, using empty messages data');
              // Use empty array as fallback
              messagesData = [];
            }
          } catch (messagesError) {
            console.error('Error fetching stream messages:', messagesError);
            // Use empty array as fallback
            messagesData = [];
          }

          console.log('Messages data loaded:', messagesData);

          // Using the global formatUserData function defined at the top of the file

          // Format messages data with null checks
          const formattedMessages = messagesData
            .filter(comment => comment && comment._id) // Filter out invalid comments
            .map(comment => ({
              id: comment._id,
              text: comment.text || '',
              user: formatUserData(comment.user),
              timestamp: new Date(comment.createdAt || Date.now()),
              replyTo: comment.replyTo ? {
                id: comment.replyTo._id,
                text: comment.replyTo.text || '',
                user: formatUserData(comment.replyTo.user)
              } : null
            }));

          // Add system message if no messages exist
          if (formattedMessages.length === 0) {
            formattedMessages.push({
              id: Date.now(),
              type: 'system',
              text: 'Livestream started',
              timestamp: streamData.startedAt ? new Date(streamData.startedAt) : new Date()
            });
          }

          setMessages(formattedMessages);
          setMessageCount(formattedMessages.length);

          // Join the stream if not the creator
          if (!isCreator) {
            try {
              // Check if joinStream function exists
              if (typeof liveService.joinStream === 'function') {
                await liveService.joinStream(streamId);
              } else {
                console.warn('liveService.joinStream is not a function, skipping join stream');
              }
            } catch (joinError) {
              console.error('Error joining stream:', joinError);
              // Continue anyway
            }

            // Initialize socket connection for real-time updates
            initializeSocketConnection();
          }

          setLoading(false);
        } catch (error) {
          console.error('Error fetching stream data:', error);

          // Get more detailed error information
          let errorMessage = 'Failed to load livestream. Please try again.';

          // No mock stream - require real backend connection

          if (error.response) {
            // Server responded with an error status
            console.log('Server error response:', error.response);
            if (error.response.status === 404) {
              errorMessage = 'Livestream not found. It may have been deleted or never existed.';

              // No mock stream - require real backend connection
              console.log('Livestream not found');
            } else if (error.response.status === 401) {
              errorMessage = 'You are not authorized to view this livestream. Please log in or check permissions.';
            } else if (error.response.data && error.response.data.message) {
              errorMessage = `Failed to load livestream: ${error.response.data.message}`;
            }
          } else if (error.request) {
            // Request was made but no response received (network error)
            console.log('Network error - no response received:', error.request);
            errorMessage = 'Network error. Please check your internet connection and try again.';

            // No mock stream - require real backend connection
            console.log('Network error when trying to load livestream');
          } else {
            // Something else happened while setting up the request
            console.log('Error setting up request:', error.message);
            errorMessage = `Error: ${error.message}`;

            // No mock stream - require real backend connection
            console.log('Error setting up livestream request');
          }

          setError(errorMessage);
          setLoading(false);
        }
      };

      fetchStreamData();

      // Clean up function
      return () => {
        // Safely leave the stream if not the creator
        if (streamId && !isCreator) {
          try {
            console.log('Attempting to leave stream:', streamId);
            // Check if leaveStream function exists
            if (typeof liveService.leaveStream === 'function') {
              // Use Promise.resolve to handle both Promise and non-Promise returns
              Promise.resolve(liveService.leaveStream(streamId))
                .then(response => {
                  console.log('Successfully left stream:', response);
                })
                .catch(err => {
                  console.error('Error leaving stream:', err);
                  // No need to throw, just log the error
                });
            } else {
              console.warn('liveService.leaveStream is not a function, trying socket method');
              // Try using socket directly
              try {
                if (socketService.getSocket() && typeof socketService.leaveLivestream === 'function') {
                  socketService.leaveLivestream(streamId);
                  console.log('Left stream using socket method');
                }
              } catch (socketError) {
                console.error('Error leaving stream via socket:', socketError);
                // Continue anyway
              }
            }
          } catch (leaveError) {
            console.error('Error in leave stream cleanup:', leaveError);
            // Continue anyway
          }
        }

        // Safely disconnect socket
        try {
          if (socketService.getSocket()) {
            // Remove event listeners
            try {
              socketService.offEvent('livestream:newMessage');
              socketService.offEvent('livestream:viewerJoined');
              socketService.offEvent('livestream:viewerLeft');
              socketService.offEvent('livestream:ended');
              socketService.offEvent('livestream:reaction');

              // Also try alternative event names
              socketService.offEvent('new-message');
              socketService.offEvent('viewer-joined');
              socketService.offEvent('viewer-left');
              socketService.offEvent('stream-ended');
              socketService.offEvent('reaction');
            } catch (eventError) {
              console.error('Error removing socket event listeners:', eventError);
              // Continue anyway
            }
          }
        } catch (socketError) {
          console.error('Error cleaning up socket:', socketError);
          // Continue anyway
        }
      };
    } else {
      setLoading(false);
    }
  }, [streamId, currentUser, isCreator]);

  // Initialize socket connection for real-time updates
  const initializeSocketConnection = useCallback(() => {
    console.log('Initializing socket connection for livestream...');

    // Wrap in try-catch to prevent any uncaught errors
    try {
      // Check if socket exists, if not create it
      if (!socketService.getSocket()) {
        console.log('No existing socket, creating new socket connection');
        const token = localStorage.getItem('token');
        if (token) {
          try {
            socketService.initializeSocket(token);
            console.log('Socket initialized with token');
          } catch (error) {
            console.error('Error initializing socket with token:', error);
            // Try to initialize without token as fallback
            try {
              socketService.initializeSocket();
              console.log('Socket initialized without token as fallback');
            } catch (fallbackError) {
              console.error('Error initializing socket without token:', fallbackError);
              setSnackbarMessage('Failed to connect to chat. Please refresh the page.');
              setSnackbarSeverity('error');
              setSnackbarOpen(true);

              // Create a mock socket for development mode
              if (process.env.NODE_ENV === 'development') {
                console.log('Creating mock socket for development');
                return true; // Pretend it worked for development
              }
              return false;
            }
          }
        } else {
          console.error('No authentication token available for socket connection');
          // Try to initialize without token as fallback
          try {
            socketService.initializeSocket();
            console.log('Socket initialized without token as fallback');
          } catch (error) {
            console.error('Error initializing socket without token:', error);
            setSnackbarMessage('Authentication error. Please try logging in again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);

            // Create a mock socket for development mode
            if (process.env.NODE_ENV === 'development') {
              console.log('Creating mock socket for development');
              return true; // Pretend it worked for development
            }
            return false;
          }
        }
      } else {
        console.log('Using existing socket connection');
        // Ensure the socket is connected
        if (!socketService.getSocket().connected) {
          console.log('Socket exists but not connected, reconnecting...');
          try {
            if (typeof socketService.connect === 'function') {
              socketService.connect();
              console.log('Socket reconnected successfully');
            } else {
              console.warn('socketService.connect is not a function, trying to reinitialize');
              throw new Error('Connect method not available');
            }
          } catch (error) {
            console.error('Error reconnecting socket:', error);
            // Try to initialize a new socket as fallback
            try {
              const token = localStorage.getItem('token');
              socketService.initializeSocket(token);
              console.log('Socket reinitialized with token as fallback');
            } catch (fallbackError) {
              console.error('Error reinitializing socket:', fallbackError);
              setSnackbarMessage('Failed to connect to chat. Please refresh the page.');
              setSnackbarSeverity('error');
              setSnackbarOpen(true);

              // No mock socket - require real backend connection
              console.log('Failed to connect to chat');
              return false;
            }
          }
        }
      }
    } catch (unexpectedError) {
      console.error('Unexpected error in socket initialization:', unexpectedError);
      // Don't show error to user, just log it

      // No mock socket - require real backend connection
      console.log('Unexpected error in socket initialization');
      return false;
    }

    const socket = socketService.getSocket();
    if (!socket) {
      console.error('Failed to initialize socket connection');
      setSnackbarMessage('Failed to connect to chat. Please refresh the page.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return false;
    }

    console.log('Socket connection established, joining livestream room:', streamId);

    // Join livestream room using the dedicated function
    if (streamId) {
      try {
        const joinSuccess = socketService.joinLivestream(streamId);
        console.log('Join livestream result:', joinSuccess);

        if (!joinSuccess) {
          // Try again with the direct emit event as fallback
          console.log('Falling back to direct emit for joining livestream');
          socketService.emitEvent('livestream:join', { streamId });
        }
      } catch (error) {
        console.error('Error joining livestream room:', error);
        // Continue anyway - we'll still try to listen for events
      }
    } else {
      console.warn('No streamId available to join livestream room');
    }

    // Remove any existing listeners to prevent duplicates
    try {
      socketService.offEvent('livestream:newMessage');
      socketService.offEvent('livestream:viewerJoined');
      socketService.offEvent('livestream:viewerLeft');
      socketService.offEvent('livestream:ended');
      socketService.offEvent('livestream:reaction');

      // Also try alternative event names
      socketService.offEvent('new-message');
      socketService.offEvent('viewer-joined');
      socketService.offEvent('viewer-left');
      socketService.offEvent('stream-ended');
      socketService.offEvent('reaction');
    } catch (error) {
      console.error('Error removing existing socket listeners:', error);
      // Continue anyway
    }

    // Using the global formatUserData function defined at the top of the file

    // Listen for new messages with multiple event names for compatibility
    const setupMessageListener = (eventName) => {
      socketService.onEvent(eventName, (data) => {
        console.log(`Received new message from event ${eventName}:`, data);

        // Handle different data formats
        const messageData = data.message || data;

        // Format user data to ensure we have a proper username, not an email
        const formattedUser = formatUserData(messageData.user || messageData.sender || {
          _id: 'unknown',
          username: 'Unknown User',
          avatar: '/default-avatar.png'
        });

        const newMessage = {
          id: messageData._id || messageData.id || Date.now(),
          text: messageData.text || messageData.content || messageData.message || '',
          user: formattedUser,
          timestamp: new Date(messageData.createdAt || messageData.timestamp || Date.now()),
          replyTo: messageData.replyTo ? {
            ...messageData.replyTo,
            user: formatUserData(messageData.replyTo.user || messageData.replyTo.sender || {})
          } : null
        };

        // Check if this message already exists to avoid duplicates
        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev; // Skip duplicate messages
          }
          return [...prev, newMessage];
        });

        setMessageCount(prev => prev + 1);
      });
    };

    // Set up listeners for multiple event names for compatibility
    setupMessageListener('livestream:newMessage');
    setupMessageListener('livestream:message');
    setupMessageListener('new-message');
    setupMessageListener('chat-message');

    // Set up viewer joined event listeners with multiple event names for compatibility
    const setupViewerJoinedListener = (eventName) => {
      socketService.onEvent(eventName, (data) => {
        console.log(`Received viewer joined event from ${eventName}:`, data);

        // Handle different data formats
        const userData = data.user || data.viewer || data;

        // Format user data to ensure we have a proper username, not an email
        const formattedUser = formatUserData(userData);

        const newViewer = {
          _id: formattedUser._id,
          username: formattedUser.username,
          avatar: formattedUser.avatar,
          joinedAt: new Date(data.joinedAt || data.timestamp || Date.now())
        };

        // Check if viewer already exists
        if (!viewers.some(v => v._id === newViewer._id)) {
          setViewers(prev => [...prev, newViewer]);
          setViewerCount(prev => prev + 1);

          // Add system message about new viewer
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              type: 'system',
              text: `${newViewer.username} joined the stream`,
              timestamp: new Date()
            }
          ]);
        }
      });
    };

    // Set up viewer left event listeners with multiple event names for compatibility
    const setupViewerLeftListener = (eventName) => {
      socketService.onEvent(eventName, (data) => {
        console.log(`Received viewer left event from ${eventName}:`, data);

        // Handle different data formats
        const userData = data.user || data.viewer || data;

        // Format user data to ensure we have a proper username, not an email
        const formattedUser = formatUserData(userData);
        const leftViewerId = formattedUser._id;

        // Remove viewer from list
        setViewers(prev => prev.filter(v => v._id !== leftViewerId));
        setViewerCount(prev => Math.max(0, prev - 1));

        // Add system message about viewer leaving
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'system',
            text: `${formattedUser.username} left the stream`,
            timestamp: new Date()
          }
        ]);
      });
    };

    // Set up listeners for multiple event names for compatibility
    setupViewerJoinedListener('livestream:viewerJoined');
    setupViewerJoinedListener('viewer-joined');
    setupViewerJoinedListener('join');

    setupViewerLeftListener('livestream:viewerLeft');
    setupViewerLeftListener('viewer-left');
    setupViewerLeftListener('leave');

    // Set up stream ended event listeners with multiple event names for compatibility
    const setupStreamEndedListener = (eventName) => {
      socketService.onEvent(eventName, (data) => {
        console.log(`Received stream ended event from ${eventName}:`, data);

        // Only process if the stream is currently live
        if (isLive) {
          // Update UI state
          setIsLive(false);

          // Update stream status in local state
          if (stream) {
            setStream(prev => ({
              ...prev,
              status: 'ended',
              endedAt: new Date().toISOString()
            }));
          }

          // Add system message about stream ending
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              type: 'system',
              text: 'This livestream has ended by the creator',
              timestamp: new Date()
            }
          ]);

          // Show notification
          setSnackbarMessage('This livestream has ended');
          setSnackbarSeverity('info');
          setSnackbarOpen(true);

          // Close share dialog if open
          if (shareDialogOpen) {
            setShareDialogOpen(false);
          }

          // Stop all tracks from the local stream if not the creator
          if (!isCreator && localStreamRef.current) {
            try {
              localStreamRef.current.getTracks().forEach(track => {
                try {
                  track.stop();
                } catch (trackError) {
                  console.error('Error stopping track:', trackError);
                }
              });
              localStreamRef.current = null;
            } catch (streamError) {
              console.error('Error stopping local stream:', streamError);
            }
          }
        }
      });
    };

    // Set up reaction event listeners with multiple event names for compatibility
    const setupReactionListener = (eventName) => {
      socketService.onEvent(eventName, (data) => {
        console.log(`Received reaction event from ${eventName}:`, data);

        // Handle different data formats
        const reactionData = data.reaction || data.emoji || data;
        const userData = data.user || data.sender || data;

        // Format user data to ensure we have a proper username, not an email
        const formattedUser = formatUserData(userData);

        // Extract the reaction from different possible formats
        const reaction = typeof reactionData === 'string' ? reactionData :
                        reactionData.type || reactionData.emoji || reactionData.reaction || '❤️';

        sendReaction(reaction, formattedUser);
      });
    };

    // Set up listeners for multiple event names for compatibility
    setupStreamEndedListener('livestream:ended');
    setupStreamEndedListener('stream-ended');
    setupStreamEndedListener('end');

    setupReactionListener('livestream:reaction');
    setupReactionListener('reaction');
    setupReactionListener('emoji');

    return true;
  }, [streamId, viewers]);

  // Update stream duration
  useEffect(() => {
    let durationInterval;

    if (isLive && streamStartTime) {
      // Start duration counter
      durationInterval = setInterval(() => {
        const now = new Date();
        const durationInSeconds = Math.floor((now - streamStartTime) / 1000);
        setStreamDuration(durationInSeconds);
      }, 1000);
    }

    return () => {
      if (durationInterval) {
        clearInterval(durationInterval);
      }
    };
  }, [isLive, streamStartTime]);

  // Initialize all live features (chat, camera, viewers, etc.)
  const initializeLiveFeatures = () => {
    console.log('Initializing live features...');

    // Initialize camera and microphone if not already done
    if (!localStreamRef.current) {
      console.log('Requesting camera and microphone permissions...');
      // Request camera and microphone permissions with better constraints
      navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: cameraFacing
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
        .then(stream => {
          console.log('Camera and microphone access granted');
          localStreamRef.current = stream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play()
              .then(() => {
                console.log('Video playback started successfully');
              })
              .catch(err => {
                console.error('Error playing video:', err);
                // Try again with user interaction
                const retryPlayback = () => {
                  localVideoRef.current.play()
                    .then(() => {
                      console.log('Video playback started on retry');
                      document.removeEventListener('click', retryPlayback);
                    })
                    .catch(err => console.error('Error playing video on retry:', err));
                };
                document.addEventListener('click', retryPlayback, { once: true });
              });
          }

          // Set initial states
          setIsCameraOn(true);
          setIsMuted(false);

          console.log('Camera and microphone initialized successfully');

          // Emit socket event to notify server that camera is ready
          // Use the streamId from the component state, not from the MediaStream object
          if (socketService.getSocket() && streamId) {
            console.log('Emitting camera ready event for stream ID:', streamId);
            socketService.emitEvent('livestream:cameraReady', { streamId });
          } else {
            console.log('Not emitting camera ready event - either no socket or no streamId');
          }
        })
        .catch(err => {
          console.error('Error accessing camera or microphone:', err);
          setSnackbarMessage(
            err.name === 'NotAllowedError'
              ? 'Camera or microphone access denied. Please check your browser permissions.'
              : err.name === 'NotFoundError'
              ? 'No camera or microphone found. Please connect a device and try again.'
              : 'Could not access camera or microphone. Please check your device and permissions.'
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);

          // Try to continue with audio only if video fails
          if (err.name === 'NotFoundError' || err.name === 'NotAllowedError') {
            navigator.mediaDevices.getUserMedia({ audio: true })
              .then(audioStream => {
                console.log('Audio-only stream created as fallback');
                localStreamRef.current = audioStream;
                setIsCameraOn(false);
                setIsMuted(false);
                setSnackbarMessage('Continuing with audio only. Video is disabled.');
                setSnackbarSeverity('warning');
                setSnackbarOpen(true);

                // Emit socket event to notify server that audio is ready
                if (socketService.getSocket() && streamId) {
                  console.log('Emitting audio ready event for stream ID:', streamId);
                  socketService.emitEvent('livestream:audioReady', { streamId });
                }
              })
              .catch(audioErr => {
                console.error('Failed to create audio-only stream:', audioErr);
              });
          }
        });
    } else {
      console.log('Using existing camera and microphone stream');
      // If stream exists but video element doesn't have it, set it up
      if (localVideoRef.current && !localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(err => console.error('Error playing existing video:', err));
      }
    }

    // Initialize chat container scroll to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);

    // Add initial system message if none exists
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          type: 'system',
          text: 'Livestream started',
          timestamp: new Date()
        },
        {
          id: Date.now() + 1,
          type: 'system',
          text: `Welcome to ${currentUser?.username || 'your host'}'s livestream!`,
          timestamp: new Date(Date.now() + 1000)
        }
      ]);
    }

    // No mock viewers - use real viewers from backend only

    console.log('Live features initialization complete');
  };

  // No random greetings - use real messages from backend only

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (isLive && chatContainerRef.current && messages.length > 0) {
      // Check if user is already at the bottom (or close to it)
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // Only auto-scroll if user is already near the bottom
      if (isNearBottom) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    }
  }, [messages, isLive]);

  // Create a new livestream
  const createStream = async () => {
    if (!title.trim()) {
      setSnackbarMessage('Please enter a title for your livestream');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      setLoading(true); // Set loading state

      // Set a timeout to prevent getting stuck in loading state
      const timeoutId = setTimeout(() => {
        if (isCreating) {
          setIsCreating(false);
          setLoading(false);
          setSnackbarMessage('Stream creation is taking longer than expected. Please try again.');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }
      }, 20000); // 20 seconds timeout

      // Create livestream data
      const livestreamData = {
        title,
        description: description || title, // Use title as fallback for description
        isPrivate,
        allowedUsers: isPrivate ? allowedUsers : [],
        settings: {
          allowComments: isChatEnabled
        },
        category: category || 'General', // Use 'General' as default category
        status: 'scheduled' // Start as scheduled, then transition to live
      };

      console.log('Attempting to create livestream with data:', livestreamData);

      // Create livestream via API
      const response = await liveService.startStream(livestreamData);
      console.log('Livestream creation response:', response);

      // Handle different response formats
      let newStream;
      if (response.data && response.data.data) {
        newStream = response.data.data;
      } else if (response.data && response.data._id) {
        newStream = response.data;
      } else if (response.data && response.data.livestream) {
        newStream = response.data.livestream;
      } else {
        throw new Error('Invalid response format from server');
      }

      console.log('Created new livestream:', newStream);

      // Clear the timeout since creation was successful
      clearTimeout(timeoutId);

      // Update state
      setStream(newStream);
      setStreamId(newStream._id); // Set the stream ID
      setIsCreator(true);
      setCreationSuccess(true);
      setIsCreating(false); // Make sure to reset the creating state

      // Show success message
      setSnackbarMessage('Livestream created successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // After a shorter delay, start the livestream automatically
      setTimeout(async () => {
        try {
          console.log('Automatically starting livestream with ID:', newStream._id);

          // Start the livestream via API
          const startResponse = await liveService.startScheduledStream(newStream._id);
          console.log('Start livestream response:', startResponse);

          // Update UI state
          setIsLive(true);
          setStreamStartTime(new Date());
          setCreationSuccess(false); // Hide the success screen and show the livestream
          setLoading(false); // Ensure loading is false when transitioning to live

          // Initialize socket connection for real-time updates
          const socketInitialized = initializeSocketConnection();
          console.log('Socket initialized:', socketInitialized);

          // Initialize chat and related features
          initializeLiveFeatures();

          // Add welcome messages
          const welcomeMessages = [
            {
              id: Date.now(),
              type: 'system',
              text: 'Livestream started',
              timestamp: new Date()
            },
            {
              id: Date.now() + 1,
              type: 'system',
              text: `Welcome to ${currentUser ? formatUserData(currentUser).username : 'your host'}'s livestream!`,
              timestamp: new Date(Date.now() + 1000)
            },
            {
              id: Date.now() + 2,
              user: {
                _id: 'system',
                username: 'Let\'s Talk',
                avatar: '/logo.png'
              },
              text: `👋 Welcome to your first livestream! Try saying hello to your viewers and ask them where they're watching from.`,
              timestamp: new Date(Date.now() + 2000),
              isHighlighted: true
            }
          ];

          setMessages(welcomeMessages);

          // Scroll chat to bottom after messages are added
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
          }, 300);

          // Set up a timer to add engagement prompts
          setTimeout(() => {
            if (isLive) {
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now(),
                  user: {
                    _id: 'system',
                    username: 'Let\'s Talk',
                    avatar: '/logo.png'
                  },
                  text: `💡 Pro tip: Create a poll to engage with your viewers! Click the poll icon in the stream controls.`,
                  timestamp: new Date(),
                  isHighlighted: true
                }
              ]);
            }
          }, 60000); // After 1 minute
        } catch (startError) {
          console.error('Error starting livestream:', startError);

          // Try an alternative approach to start the stream
          try {
            console.log('Trying alternative approach to start livestream');
            // Update the stream status directly
            await liveService.updateStream(newStream._id, { status: 'live', startedAt: new Date().toISOString() });

            // Update UI state
            setIsLive(true);
            setStreamStartTime(new Date());
            setCreationSuccess(false);
            setLoading(false);

            // Initialize socket and features
            initializeSocketConnection();
            initializeLiveFeatures();

            // Add welcome messages
            const welcomeMessages = [
              {
                id: Date.now(),
                type: 'system',
                text: 'Livestream started',
                timestamp: new Date()
              },
              {
                id: Date.now() + 1,
                type: 'system',
                text: `Welcome to ${currentUser ? formatUserData(currentUser).username : 'your host'}'s livestream!`,
                timestamp: new Date(Date.now() + 1000)
              }
            ];

            setMessages(welcomeMessages);

            setSnackbarMessage('You are now live! Your camera and chat are ready.');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } catch (alternativeError) {
            console.error('Alternative approach also failed:', alternativeError);

            // Show error message
            setSnackbarMessage('Failed to start livestream. Please try again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);

            // Reset state
            setIsLive(false);
            setCreationSuccess(false);
            setLoading(false);
          }
        }
      }, 1500); // 1.5 seconds delay
    } catch (err) {
      console.error('Error creating livestream:', err);

      // Get a more detailed error message
      let errorMessage = 'Failed to create livestream. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = `Failed to create livestream: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = `Failed to create livestream: ${err.message}`;
      }

      // No mock livestream - require real backend connection

      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setIsCreating(false);
      setLoading(false); // Ensure loading is reset on error
    }
  };

  // Schedule a stream for later
  const scheduleStream = async () => {
    if (!title.trim()) {
      setSnackbarMessage('Please enter a title for your scheduled stream');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Combine date and time
      const scheduledDateTime = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(':');
      scheduledDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      // Validate that scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        setSnackbarMessage('Please schedule the stream for a future date and time');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setIsCreating(false);
        return;
      }

      // Create livestream data
      const livestreamData = {
        title,
        description,
        isPrivate,
        allowedUsers: isPrivate ? allowedUsers : [],
        settings: {
          allowComments: isChatEnabled
        },
        category,
        isScheduled: true,
        scheduledFor: scheduledDateTime.toISOString()
      };

      console.log('Scheduling stream with data:', livestreamData);

      // First try the dedicated schedule endpoint
      try {
        // Schedule livestream via API
        const response = await liveService.scheduleStream(livestreamData);
        const newScheduledStream = response.data.data;

        // Add to scheduled streams list
        setScheduledStreams(prev => [...prev, {
          id: newScheduledStream._id,
          title: newScheduledStream.title,
          description: newScheduledStream.description,
          category: newScheduledStream.category,
          isPrivate: newScheduledStream.isPrivate,
          scheduledFor: newScheduledStream.scheduledFor
        }]);

        // Show success message
        setSnackbarMessage('Stream scheduled successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Reset form
        setTitle('');
        setDescription('');
        setCategory('');
        setIsPrivate(false);
        setAllowedUsers([]);
        setIsScheduled(false);
      } catch (scheduleError) {
        console.error('Error using dedicated schedule endpoint, trying regular stream endpoint:', scheduleError);

        // If the dedicated schedule endpoint fails, try the regular stream endpoint
        const response = await liveService.startStream(livestreamData);
        const newScheduledStream = response.data.data;

        // Add to scheduled streams list
        setScheduledStreams(prev => [...prev, {
          id: newScheduledStream._id,
          title: newScheduledStream.title,
          description: newScheduledStream.description || '',
          category: newScheduledStream.category || '',
          isPrivate: newScheduledStream.isPrivate || false,
          scheduledFor: scheduledDateTime.toISOString()
        }]);

        // Show success message
        setSnackbarMessage('Stream scheduled successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Reset form
        setTitle('');
        setDescription('');
        setCategory('');
        setIsPrivate(false);
        setAllowedUsers([]);
        setIsScheduled(false);
      }
    } catch (err) {
      console.error('Error scheduling stream:', err);
      setSnackbarMessage('Failed to schedule stream. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  // Start a scheduled stream
  const startScheduledStream = async (streamId) => {
    try {
      setLoading(true);

      console.log('Starting scheduled stream with ID:', streamId);

      // Call API to start the scheduled stream
      const response = await liveService.startScheduledStream(streamId);
      console.log('Start scheduled stream response:', response);

      // Handle different response formats
      let startedStream;
      if (response.data && response.data.data) {
        startedStream = response.data.data;
      } else if (response.data && response.data._id) {
        startedStream = response.data;
      } else if (response.data && response.data.livestream) {
        startedStream = response.data.livestream;
      } else {
        // If we can't get the stream ID from the response, use the original ID
        startedStream = { _id: streamId };
      }

      // Remove from scheduled streams
      setScheduledStreams(prev => prev.filter(stream => stream.id !== streamId));

      // Show success message
      setSnackbarMessage('Starting your scheduled stream...');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Navigate to the stream
      navigate(`/live/${startedStream._id}`);
    } catch (error) {
      console.error('Error starting scheduled stream:', error);

      // Try alternative approach
      try {
        console.log('Trying alternative approach to start scheduled stream');

        // Try to update the stream status directly
        await liveService.updateStream(streamId, { status: 'live', startedAt: new Date().toISOString() });

        // Remove from scheduled streams
        setScheduledStreams(prev => prev.filter(stream => stream.id !== streamId));

        // Show success message
        setSnackbarMessage('Starting your scheduled stream (alternative method)...');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Navigate to the stream
        navigate(`/live/${streamId}`);
        return; // Exit early since we succeeded with the alternative approach
      } catch (alternativeError) {
        console.error('Alternative approach also failed:', alternativeError);

        // If both approaches fail, try to create a new stream with the same data
        try {
          console.log('Trying to create a new stream as a last resort');

          // Find the scheduled stream data
          const scheduledStream = scheduledStreams.find(stream => stream.id === streamId);

          if (scheduledStream) {
            // Create a new stream with the same data
            const newStreamData = {
              title: scheduledStream.title,
              description: scheduledStream.description,
              isPrivate: scheduledStream.isPrivate,
              category: scheduledStream.category,
              status: 'scheduled' // Start as scheduled, then transition to live
            };

            const response = await liveService.startStream(newStreamData);
            console.log('New stream creation response:', response);

            // Handle different response formats
            let newStream;
            if (response.data && response.data.data) {
              newStream = response.data.data;
            } else if (response.data && response.data._id) {
              newStream = response.data;
            } else if (response.data && response.data.livestream) {
              newStream = response.data.livestream;
            } else {
              throw new Error('Invalid response format from server');
            }

            // Remove from scheduled streams
            setScheduledStreams(prev => prev.filter(stream => stream.id !== streamId));

            // Show success message
            setSnackbarMessage('Created new stream based on scheduled stream...');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);

            // Navigate to the new stream
            navigate(`/live/${newStream._id}`);
            return; // Exit early since we succeeded with the last resort approach
          }
        } catch (lastResortError) {
          console.error('Last resort approach also failed:', lastResortError);
          // Continue to show the original error message
        }
      }

      // If all approaches fail, show error message
      setSnackbarMessage('Failed to start scheduled stream. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  // Fetch scheduled streams
  useEffect(() => {
    if (!streamId && currentUser) {
      const fetchScheduledStreams = async () => {
        try {
          console.log('Fetching scheduled streams');
          const response = await liveService.getScheduledStreams();
          console.log('Scheduled streams response:', response);

          // Handle different response formats
          let scheduledStreamsData = [];
          if (response.data && Array.isArray(response.data.data)) {
            scheduledStreamsData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            scheduledStreamsData = response.data;
          } else if (response.data && Array.isArray(response.data.livestreams)) {
            scheduledStreamsData = response.data.livestreams;
          }

          console.log('Processed scheduled streams data:', scheduledStreamsData);

          setScheduledStreams(scheduledStreamsData.map(stream => ({
            id: stream._id,
            title: stream.title || 'Untitled Stream',
            description: stream.description || '',
            category: stream.category || 'General',
            isPrivate: stream.isPrivate || false,
            scheduledFor: stream.scheduledFor || stream.scheduledAt || new Date().toISOString()
          })));
        } catch (error) {
          console.error('Error fetching scheduled streams:', error);
        }
      };

      fetchScheduledStreams();
    }
  }, [streamId, currentUser]);

  // Auto-start livestream after creation success
  useEffect(() => {
    let countdownTimer;
    let autoStartTimer;

    if (creationSuccess && !isLive) {
      console.log('Starting auto-start countdown for livestream');

      // Create a countdown from 3 to 1
      let countdown = 3;
      const countdownElement = document.querySelector('.auto-start-countdown');

      countdownTimer = setInterval(() => {
        countdown -= 1;
        if (countdownElement) {
          countdownElement.textContent = countdown;
        }

        if (countdown <= 0) {
          clearInterval(countdownTimer);
        }
      }, 1000);

      // Auto-start the livestream after countdown
      autoStartTimer = setTimeout(() => {
        if (creationSuccess && !isLive) {
          console.log('Auto-starting livestream');

          // Request camera access immediately
          navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: cameraFacing
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          })
          .then(stream => {
            console.log('Camera and microphone access granted for auto-start');
            localStreamRef.current = stream;

            // Initialize livestream state
            setIsLive(true);
            setStreamStartTime(new Date());
            setCreationSuccess(false);
            setLoading(false);

            // Initialize socket connection for real-time updates
            initializeSocketConnection();

            // Complete the rest of the initialization
            initializeLiveFeatures();

            // Show success message
            setSnackbarMessage('You are now live! Your camera and chat are ready.');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          })
          .catch(err => {
            console.error('Error accessing camera or microphone during auto-start:', err);

            setSnackbarMessage(
              err.name === 'NotAllowedError'
                ? 'Camera or microphone access denied. Please check your browser permissions.'
                : err.name === 'NotFoundError'
                ? 'No camera or microphone found. Please connect a device and try again.'
                : 'Could not access camera or microphone. Please check your device and permissions.'
            );
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          });
        }
      }, 3000); // 3 seconds countdown
    }

    // Cleanup timers
    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
      if (autoStartTimer) clearTimeout(autoStartTimer);
    };
  }, [creationSuccess, isLive]);

  // Render the component
  return (
    <Box sx={{ maxWidth: streamId || creationSuccess ? 1200 : 800, mx: 'auto', p: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">Loading livestream...</Typography>
        </Box>
      ) : creationSuccess ? (
        // Success screen after creating a livestream
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            animation: 'scale-in 0.5s ease-out',
            '@keyframes scale-in': {
              '0%': { transform: 'scale(0)' },
              '70%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' }
            }
          }}>
            <Box component="span" sx={{ fontSize: 60 }}>✅</Box>
          </Box>

          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
            Your livestream is ready!
          </Typography>

          <Typography variant="h6" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            We're preparing your stream. You'll be live in a few seconds...
          </Typography>

          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            mb: 4
          }}>
            <CircularProgress size={20} />
            <Typography variant="body1" color="text.secondary">
              Setting up your livestream environment
            </Typography>
          </Box>

          {/* Auto-start countdown */}
          <Box sx={{
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}>
            <Typography variant="body1" color="text.secondary">
              Going live automatically in
            </Typography>
            <Typography
              className="auto-start-countdown"
              variant="body1"
              fontWeight="bold"
              color="primary.main"
              sx={{
                minWidth: 30,
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.7 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.7 }
                }
              }}
            >
              3
            </Typography>
            <Typography variant="body1" color="text.secondary">
              seconds
            </Typography>
          </Box>

          <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ mr: 1, fontSize: 24 }}>💡</Box>
              Quick Tips for a Great Stream
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Box component="span" sx={{ fontSize: 24, mr: 1 }}>📹</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Check your lighting
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Make sure your face is well-lit and visible to viewers
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Box component="span" sx={{ fontSize: 24, mr: 1 }}>🎤</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Test your microphone
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Speak clearly and check that your audio is working properly
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Box component="span" sx={{ fontSize: 24, mr: 1 }}>👋</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Engage with viewers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Respond to comments and make viewers feel included
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Box component="span" sx={{ fontSize: 24, mr: 1 }}>🔗</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Share your stream
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Let your followers know you're going live to increase viewers
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setShowTips(!showTips)}
              sx={{ mt: 2 }}
              startIcon={<Box component="span" sx={{ fontSize: 18 }}>{showTips ? '🔽' : '🔼'}</Box>}
            >
              {showTips ? 'Hide advanced tips' : 'Show more tips'}
            </Button>

            {showTips && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Advanced Tips
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <Box component="span" sx={{ mr: 1, fontSize: 18 }}>💬</Box>
                        Conversation Starters
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Introduce yourself and what you'll be doing
                        <br />
                        • Ask viewers where they're watching from
                        <br />
                        • Create a poll to get viewers' opinions
                        <br />
                        • Share a recent experience or story
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <Box component="span" sx={{ mr: 1, fontSize: 18 }}>💻</Box>
                        Technical Tips
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Use a stable internet connection
                        <br />
                        • Close unnecessary apps to improve performance
                        <br />
                        • Position your camera at eye level
                        <br />
                        • Use headphones to prevent echo
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <Box component="span" sx={{ mr: 1, fontSize: 18 }}>📈</Box>
                        Growth Strategies
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Schedule your streams consistently
                        <br />
                        • Promote your stream on other social platforms
                        <br />
                        • Collaborate with other creators
                        <br />
                        • Create highlights after your stream ends
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Box component="span" sx={{ fontSize: 18 }}>🔗</Box>}
              onClick={shareStream}
            >
              Share Your Stream
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => {
                // Prevent multiple clicks
                if (isLive) return;

                // Show loading state while initializing camera
                const btnElement = document.activeElement;
                if (btnElement) {
                  btnElement.innerHTML = '<span style="display:flex;align-items:center;gap:8px;"><svg class="MuiCircularProgress-svg" viewBox="22 22 44 44"><circle class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate" cx="44" cy="44" r="20.2" fill="none" stroke-width="3.6"></circle></svg> Opening Camera...</span>';
                  btnElement.disabled = true;
                }

                // Request camera access immediately
                navigator.mediaDevices.getUserMedia({
                  video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: cameraFacing
                  },
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                  }
                })
                .then(stream => {
                  console.log('Camera and microphone access granted immediately');
                  localStreamRef.current = stream;

                  // Initialize livestream state
                  setIsLive(true);
                  setStreamStartTime(new Date());
                  setCreationSuccess(false);
                  setLoading(false);

                  // Initialize socket connection for real-time updates
                  initializeSocketConnection();

                  // Complete the rest of the initialization
                  initializeLiveFeatures();

                  // Show success message
                  setSnackbarMessage('You are now live! Your camera and chat are ready.');
                  setSnackbarSeverity('success');
                  setSnackbarOpen(true);
                })
                .catch(err => {
                  console.error('Error accessing camera or microphone:', err);
                  // Reset button state
                  if (btnElement) {
                    btnElement.innerHTML = '<span class="MuiButton-startIcon MuiButton-iconSizeLarge css-htszrh-MuiButton-startIcon"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.11-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z"></path></svg></span>Go Live Now';
                    btnElement.disabled = false;
                  }

                  setSnackbarMessage(
                    err.name === 'NotAllowedError'
                      ? 'Camera or microphone access denied. Please check your browser permissions.'
                      : err.name === 'NotFoundError'
                      ? 'No camera or microphone found. Please connect a device and try again.'
                      : 'Could not access camera or microphone. Please check your device and permissions.'
                  );
                  setSnackbarSeverity('error');
                  setSnackbarOpen(true);
                });
              }}
              disabled={isLive} // Disable if already live
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: 3,
                animation: !isLive ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                  '100%': { transform: 'scale(1)' }
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 5
                },
                transition: 'all 0.2s'
              }}
              startIcon={<LiveTvIcon />}
            >
              Go Live Now
            </Button>
          </Box>

          {/* Auto-start timer effect */}
          {creationSuccess && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Click "Go Live Now" or wait for automatic start
              </Typography>
            </Box>
          )}
        </Box>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="error" gutterBottom>{error}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              There was a problem loading the livestream. This could be due to network issues, server problems, or the livestream may no longer be available.
            </Typography>
            {error.includes('missing user information') && (
              <Typography variant="body2" color="info.main" sx={{ mb: 2 }}>
                The livestream data is incomplete. This may be because the creator's account has been deleted or there's an issue with the database.
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => {
                // Clear error state and retry loading
                setError(null);
                setLoading(true);
                // Force re-fetch by remounting the component
                const currentId = streamId;
                navigate('/');
                setTimeout(() => navigate(`/live/${currentId}`), 100);
              }}
              startIcon={<Box component="span" sx={{ fontSize: 18 }}>🔄</Box>}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                // Try to create a new livestream instead
                navigate('/live');
              }}
              startIcon={<Box component="span" sx={{ fontSize: 18 }}>📹</Box>}
            >
              Create New Livestream
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              startIcon={<Box component="span" sx={{ fontSize: 18 }}>🏠</Box>}
            >
              Go Home
            </Button>
          </Box>
        </Paper>
      ) : streamId ? (
        // Viewing an existing livestream
        <>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ProfilePicture
                    src={getProfilePictureUrl(stream?.user, 'medium')}
                    alt={stream?.user ? formatUserData(stream.user).username : 'username'}
                    username={stream?.user ? formatUserData(stream.user).username : 'username'}
                    isVerified={stream?.user?.isVerified}
                    linkToProfile={false}
                    size={{ width: 48, height: 48 }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {stream?.user ? formatUserData(stream.user).username : 'username'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={isLive ? 'LIVE' : 'ENDED'}
                        color={isLive ? 'error' : 'default'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          ...(isLive && {
                            animation: 'pulse 1.5s infinite',
                            '@keyframes pulse': {
                              '0%': { opacity: 0.7 },
                              '50%': { opacity: 1 },
                              '100%': { opacity: 0.7 }
                            }
                          })
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {stream?.category || 'General'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 1 }}>
                  {stream?.title || 'Livestream Title'}
                </Typography>

                {stream?.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 600 }}>
                    {stream.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${viewerCount} viewers`}
                    variant="outlined"
                    size="small"
                  />
                  {isLive && streamDuration > 0 && (
                    <Chip
                      label={formatDuration(streamDuration)}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                  <Chip
                    icon={<ChatIcon />}
                    label={`${messageCount} messages`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<FavoriteIcon />}
                    label={`${reactionCount} reactions`}
                    variant="outlined"
                    size="small"
                  />
                  {highlights.length > 0 && (
                    <Chip
                      icon={<Box component="span" sx={{ fontSize: '16px' }}>⭐</Box>}
                      label={`${highlights.length} highlights`}
                      variant="outlined"
                      size="small"
                      onClick={() => setShowHighlightDialog('view')}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Box component="span" sx={{ fontSize: '18px' }}>🔗</Box>}
                  onClick={shareStream}
                >
                  Share
                </Button>

                {!isCreator && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Box component="span" sx={{ fontSize: '18px' }}>👤</Box>}
                    onClick={() => navigate(`/profile/${stream?.user?.username}`)}
                  >
                    Profile
                  </Button>
                )}

                {isCreator && isLive && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={endStream}
                  >
                    End Stream
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          <Grid container spacing={3} direction={isLandscape ? 'row' : isMobile ? 'column' : 'row'}>
            <Grid item xs={12} md={8} sx={{
              order: { xs: 1, md: 1 },
              ...(isLandscape && { width: '70%', flexGrow: 1 })
            }}>
              <Paper
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '16/9',
                  bgcolor: 'black'
                }}
              >
                <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  {/* Video element */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'black',
                    overflow: 'hidden'
                  }}>
                    {isCreator ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted={isMuted}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: cameraFacing === 'user' && !isScreenSharing ? 'scaleX(-1)' : 'none',
                          display: isCameraOn ? 'block' : 'none'
                        }}
                      />
                    ) : (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    )}

                    {/* Camera off indicator */}
                    {(!isCameraOn && isCreator) && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        p: 3,
                        textAlign: 'center',
                        bgcolor: 'rgba(0,0,0,0.8)'
                      }}>
                        <VideocamOffIcon sx={{ fontSize: 64, mb: 2, opacity: 0.7 }} />
                        <Typography variant="h6">Camera is turned off</Typography>
                      </Box>
                    )}

                    {/* Stream ended or not started indicator */}
                    {!isLive && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        p: 3,
                        textAlign: 'center',
                        bgcolor: 'rgba(0,0,0,0.8)',
                        zIndex: 10 // Ensure this is above the video element
                      }}>
                        {stream && stream.status === 'ended' ? (
                          <>
                            <LiveTvIcon sx={{ fontSize: 64, mb: 2, opacity: 0.7, color: 'error.main' }} />
                            <Typography variant="h5" gutterBottom>Stream has ended</Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                              This livestream is no longer active.
                              {stream.endedAt && (
                                <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.9rem', opacity: 0.8 }}>
                                  Ended {new Date(stream.endedAt).toLocaleString()}
                                </Box>
                              )}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                              {recordedVideos.length > 0 && isCreator && (
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => setChatTab('recordings')}
                                  startIcon={<Box component="span" sx={{ fontSize: 18 }}>🎬</Box>}
                                >
                                  View Recordings
                                </Button>
                              )}

                              {isCreator && (
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => navigate('/live')}
                                  startIcon={<Box component="span" sx={{ fontSize: 18 }}>📹</Box>}
                                >
                                  Start New Stream
                                </Button>
                              )}

                              <Button
                                variant="contained"
                                color="primary"
                                onClick={shareStream}
                                startIcon={<Box component="span" sx={{ fontSize: 18 }}>🔗</Box>}
                              >
                                Share Stream
                              </Button>
                            </Box>

                            {isCreator && (
                              <Typography variant="body2" sx={{ mt: 3, opacity: 0.7 }}>
                                Your stream has ended. Viewers can still see the stream page and chat history.
                              </Typography>
                            )}
                          </>
                        ) : (
                          <>
                            <LiveTvIcon sx={{ fontSize: 64, mb: 2, opacity: 0.7 }} />
                            <Typography variant="h5" gutterBottom>Preparing Livestream</Typography>
                            <Typography variant="body1">Setting up your stream...</Typography>
                            <CircularProgress color="primary" sx={{ mt: 3 }} />
                            {isCreator && (
                              <Button
                                variant="contained"
                                color="primary"
                                sx={{ mt: 4 }}
                                onClick={() => {
                                  // Show loading state while initializing camera
                                  const btnElement = document.activeElement;
                                  if (btnElement) {
                                    btnElement.innerHTML = '<span style="display:flex;align-items:center;gap:8px;"><svg class="MuiCircularProgress-svg" viewBox="22 22 44 44"><circle class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate" cx="44" cy="44" r="20.2" fill="none" stroke-width="3.6"></circle></svg> Opening Camera...</span>';
                                    btnElement.disabled = true;
                                  }

                                  // Request camera access immediately
                                  navigator.mediaDevices.getUserMedia({
                                    video: {
                                      width: { ideal: 1280 },
                                      height: { ideal: 720 },
                                      facingMode: cameraFacing
                                    },
                                    audio: {
                                      echoCancellation: true,
                                      noiseSuppression: true,
                                      autoGainControl: true
                                    }
                                  })
                                  .then(stream => {
                                    console.log('Camera and microphone access granted immediately');
                                    localStreamRef.current = stream;

                                    // Initialize livestream state
                                    setIsLive(true);
                                    setStreamStartTime(new Date());

                                    // Initialize socket connection for real-time updates
                                    initializeSocketConnection();

                                    // Complete the rest of the initialization
                                    initializeLiveFeatures();

                                    // Show success message
                                    setSnackbarMessage('You are now live! Your camera and chat are ready.');
                                    setSnackbarSeverity('success');
                                    setSnackbarOpen(true);
                                  })
                                  .catch(err => {
                                    console.error('Error accessing camera or microphone:', err);
                                    // Reset button state
                                    if (btnElement) {
                                      btnElement.innerHTML = 'Start Camera & Go Live';
                                      btnElement.disabled = false;
                                    }

                                    setSnackbarMessage(
                                      err.name === 'NotAllowedError'
                                        ? 'Camera or microphone access denied. Please check your browser permissions.'
                                        : err.name === 'NotFoundError'
                                        ? 'No camera or microphone found. Please connect a device and try again.'
                                        : 'Could not access camera or microphone. Please check your device and permissions.'
                                    );
                                    setSnackbarSeverity('error');
                                    setSnackbarOpen(true);
                                  });
                                }}
                              >
                                Start Camera & Go Live
                              </Button>
                            )}
                          </>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Stream info overlay */}
                  <Box sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    zIndex: 10
                  }}>
                    <Chip
                      icon={<LiveTvIcon />}
                      label={isLive ? 'LIVE' : 'OFFLINE'}
                      color={isLive ? 'error' : 'default'}
                      size="small"
                      sx={{
                        fontWeight: 'bold',
                        animation: isLive ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { opacity: 0.6 },
                          '50%': { opacity: 1 },
                          '100%': { opacity: 0.6 }
                        }
                      }}
                    />
                    {isLive && streamStartTime && (
                      <Chip
                        label={formatDuration(streamDuration)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {isRecording && (
                      <Chip
                        icon={<Box component="span" sx={{ fontSize: '16px', color: 'error.main' }}>🔴</Box>}
                        label={`REC ${formatDuration(recordingDuration)}`}
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 0.6 },
                            '50%': { opacity: 1 },
                            '100%': { opacity: 0.6 }
                          }
                        }}
                      />
                    )}
                    <Chip
                      icon={<PeopleIcon />}
                      label={viewerCount}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {/* Floating reactions */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                  }}>
                    {reactions.map(reaction => (
                      <Box
                        key={reaction.id}
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: `${reaction.position}%`,
                          animation: 'float 3s ease-out forwards',
                          '@keyframes float': {
                            '0%': { transform: 'translateY(0)', opacity: 1 },
                            '100%': { transform: 'translateY(-300px)', opacity: 0 }
                          },
                          fontSize: '2rem'
                        }}
                      >
                        {reaction.type}
                      </Box>
                    ))}
                  </Box>

                  {/* Pinned comment */}
                  {pinnedComment && (
                    <Box sx={{
                      position: 'absolute',
                      top: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      maxWidth: '80%',
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      zIndex: 10
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ProfilePicture
                          src={getProfilePictureUrl(pinnedComment.user, 'small')}
                          alt={pinnedComment.user.username}
                          username={pinnedComment.user.username}
                          isVerified={pinnedComment.user.isVerified}
                          linkToProfile={false}
                          size={{ width: 24, height: 24 }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {pinnedComment.user.username}:
                        </Typography>
                      </Box>
                      <Typography variant="body2">{pinnedComment.text}</Typography>
                      {isCreator && (
                        <IconButton
                          size="small"
                          onClick={unpinComment}
                          sx={{ color: 'white', p: 0.5 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}

                  {/* Active poll */}
                  {pollActive && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 80,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '80%',
                      maxWidth: 400,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      borderRadius: 2,
                      p: 2,
                      zIndex: 10
                    }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {pollQuestion}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        {pollOptions.map(option => {
                          const votes = pollResults[option] || 0;
                          const totalVotes = Object.values(pollResults).reduce((sum, count) => sum + count, 0);
                          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                          return (
                            <Box key={option} sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{option}</Typography>
                                <Typography variant="body2">{percentage}%</Typography>
                              </Box>
                              <Box sx={{ position: 'relative', height: 8, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1, overflow: 'hidden' }}>
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    height: '100%',
                                    width: `${percentage}%`,
                                    bgcolor: 'primary.main',
                                    borderRadius: 1,
                                    transition: 'width 0.5s ease'
                                  }}
                                />
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                      {!isCreator ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                          {pollOptions.map(option => (
                            <Button
                              key={option}
                              variant="outlined"
                              size="small"
                              onClick={() => voteInPoll(option)}
                              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                            >
                              {option}
                            </Button>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={endPoll}
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                          >
                            End Poll
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Stream controls */}
                  {isCreator && isLive && (
                    <Box
                      ref={streamControlsRef}
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: isMobile ? 0.5 : 1,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        borderRadius: 2,
                        p: isMobile ? 0.5 : 1,
                        zIndex: 10,
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                        justifyContent: 'center',
                        maxWidth: isMobile ? 'calc(100% - 32px)' : 'auto'
                      }}
                    >
                      <Tooltip title={isCameraOn ? "Turn off camera" : "Turn on camera"}>
                        <IconButton
                          onClick={toggleCamera}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          {isCameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isMuted ? "Unmute microphone" : "Mute microphone"}>
                        <IconButton
                          onClick={toggleMicrophone}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          {isMuted ? <MicOffIcon /> : <MicIcon />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isScreenSharing ? "Stop sharing screen" : "Share screen"}>
                        <IconButton
                          onClick={toggleScreenSharing}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>
                            {isScreenSharing ? '🖥️❌' : '🖥️'}
                          </Box>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Switch camera">
                        <IconButton
                          onClick={switchCamera}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>🔄</Box>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Toggle fullscreen">
                        <IconButton
                          onClick={toggleFullscreen}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <FullscreenIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Create poll">
                        <IconButton
                          onClick={() => {
                            // Simple poll creation (in a real app, this would open a dialog)
                            createPoll('What do you think of this stream?', ['Great!', 'Good', 'OK', 'Meh']);
                          }}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>📊</Box>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Apply filter">
                        <IconButton
                          onClick={() => {
                            // Cycle through filters
                            const filters = ['none', 'grayscale', 'sepia', 'invert', 'brightness'];
                            const currentIndex = filters.indexOf(activeFilter || 'none');
                            const nextIndex = (currentIndex + 1) % filters.length;
                            applyFilter(filters[nextIndex]);
                          }}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>🎨</Box>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Show analytics">
                        <IconButton
                          onClick={() => setShowAnalytics(!showAnalytics)}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>📈</Box>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isRecording ? "Stop recording" : "Start recording"}>
                        <IconButton
                          onClick={isRecording ? stopRecording : startRecording}
                          color={isRecording ? "error" : "primary"}
                          sx={{ bgcolor: isRecording ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>{isRecording ? '⏹️' : '🔴'}</Box>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Create highlight">
                        <IconButton
                          onClick={() => setShowHighlightDialog(true)}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>⭐</Box>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}

                  {/* Viewer controls */}
                  {!isCreator && isLive && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      display: 'flex',
                      gap: isMobile ? 0.5 : 1,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      borderRadius: 2,
                      p: isMobile ? 0.5 : 1,
                      zIndex: 10,
                      ...(isMobile && { flexWrap: 'wrap', maxWidth: 'calc(50% - 16px)' })
                    }}>
                      <Tooltip title="Toggle fullscreen">
                        <IconButton
                          onClick={toggleFullscreen}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <FullscreenIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Send a heart reaction">
                        <IconButton
                          onClick={() => sendReaction('❤️')}
                          color="error"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <FavoriteIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Send a clap reaction">
                        <IconButton
                          onClick={() => sendReaction('👏')}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>👏</Box>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Send a laugh reaction">
                        <IconButton
                          onClick={() => sendReaction('😂')}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>😂</Box>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Send a fire reaction">
                        <IconButton
                          onClick={() => sendReaction('🔥')}
                          color="primary"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                          <Box component="span" sx={{ fontSize: '24px' }}>🔥</Box>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}

                  {/* Analytics overlay */}
                  {showAnalytics && isCreator && (
                    <Box
                      ref={analyticsRef}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: isMobile ? 'calc(100% - 32px)' : 300,
                        maxHeight: isMobile ? 'calc(100% - 32px)' : 'auto',
                        overflowY: isMobile ? 'auto' : 'visible',
                        bgcolor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        borderRadius: 2,
                        p: isMobile ? 1.5 : 2,
                        zIndex: 20
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Live Analytics</Typography>
                        <IconButton
                          size="small"
                          onClick={() => setShowAnalytics(false)}
                          sx={{ color: 'white', p: 0.5 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>Stream Health</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: streamHealth === 'excellent' ? 'success.main' :
                                      streamHealth === 'good' ? 'warning.main' : 'error.main'
                            }}
                          />
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{streamHealth}</Typography>
                        </Box>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>Current Viewers</Typography>
                          <Typography variant="h6">{viewerCount}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>Peak Viewers</Typography>
                          <Typography variant="h6">{peakViewers}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>Messages</Typography>
                          <Typography variant="h6">{messageCount}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>Reactions</Typography>
                          <Typography variant="h6">{reactionCount}</Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>Engagement Rate</Typography>
                        <Box sx={{ position: 'relative', height: 8, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              height: '100%',
                              width: `${Math.min(engagementRate, 100)}%`,
                              bgcolor: 'primary.main',
                              borderRadius: 1
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>{engagementRate.toFixed(1)}%</Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>Stream Stats</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2">Bitrate: {streamStats.bitrate}</Typography>
                          <Typography variant="body2">Resolution: {streamStats.resolution}</Typography>
                          <Typography variant="body2">FPS: {streamStats.fps}</Typography>
                          <Typography variant="body2">Latency: {streamStats.latency}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4} sx={{
              order: { xs: 2, md: 2 },
              ...(isLandscape && { width: '30%', flexGrow: 1 }),
              ...(isMobile && { maxHeight: '400px' })
            }}>
              <Paper sx={{
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                ...(isMobile && { position: 'relative', zIndex: 5 })
              }}>
                <Box sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  {/* Live chat indicator */}
                  {isLive && (
                    <Box sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 0.6, transform: 'scale(0.8)' },
                        '50%': { opacity: 1, transform: 'scale(1.2)' },
                        '100%': { opacity: 0.6, transform: 'scale(0.8)' }
                      }
                    }} />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tabs
                      value={chatTab}
                      onChange={(e, newValue) => setChatTab(newValue)}
                      sx={{ minHeight: 'unset' }}
                    >
                      <Tab
                        label="Chat"
                        value="chat"
                        sx={{
                          minHeight: 'unset',
                          py: 0.5,
                          px: 1,
                          minWidth: 'unset',
                          mr: 1
                        }}
                      />
                      <Tab
                        label="Viewers"
                        value="viewers"
                        sx={{
                          minHeight: 'unset',
                          py: 0.5,
                          px: 1,
                          minWidth: 'unset',
                          mr: 1
                        }}
                      />
                      {isCreator && (
                        <Tab
                          label="Recordings"
                          value="recordings"
                          sx={{
                            minHeight: 'unset',
                            py: 0.5,
                            px: 1,
                            minWidth: 'unset'
                          }}
                        />
                      )}
                    </Tabs>
                  </Box>

                  <Chip
                    icon={chatTab === 'viewers' ? <PeopleIcon /> :
                          chatTab === 'recordings' ? <Box component="span" sx={{ fontSize: '16px' }}>📹</Box> :
                          <ChatIcon />}
                    label={chatTab === 'viewers' ? `${viewers.length}` :
                           chatTab === 'recordings' ? `${recordedVideos.length}` :
                           `${messages.length}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {/* Chat, Viewers, and Recordings Tabs */}
                {chatTab === 'chat' ? (
                  <Box
                    ref={chatContainerRef}
                    sx={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      height: 400
                    }}
                  >
                    {messages.length === 0 ? (
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'text.secondary'
                      }}>
                        <ChatIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <Typography sx={{ mb: 2 }}>No messages yet</Typography>
                        {isLive && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              // Add a welcome message
                              const welcomeMessage = {
                                id: Date.now(),
                                type: 'system',
                                text: 'Welcome to the chat! Say hello to everyone.',
                                timestamp: new Date()
                              };
                              setMessages([welcomeMessage]);

                              // Focus the chat input
                              setTimeout(() => {
                                document.querySelector('input[placeholder="Type a message..."]')?.focus();
                              }, 500);
                            }}
                          >
                            Start Chatting
                          </Button>
                        )}
                      </Box>
                    ) : (
                      messages.map((message, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          position: 'relative',
                          ...(message.type === 'system' ? {
                            justifyContent: 'center',
                            my: 1
                          } : {
                            '&:hover .message-actions': {
                              opacity: 1
                            },
                            mb: 1.5
                          })
                        }}
                      >
                        {message.type !== 'system' && (
                          <ProfilePicture
                            user={message.user}
                            alt={message.user.username}
                            username={message.user.username}
                            isVerified={message.user.isVerified}
                            linkToProfile={false}
                            size={{ width: 32, height: 32 }}
                            sx={{ mr: 1 }}
                          />
                        )}
                        <Box sx={{ maxWidth: '85%' }}>
                          {message.type !== 'system' ? (
                            <>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  component="span"
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {message.user.username}
                                </Typography>
                                {message.user._id === currentUser?._id && (
                                  <Chip
                                    label="You"
                                    size="small"
                                    sx={{ height: 16, fontSize: '0.6rem', px: 0.5 }}
                                  />
                                )}
                              </Box>
                              {message.replyTo && (
                                <Box sx={{
                                  mt: 0.5,
                                  mb: 1,
                                  p: 0.75,
                                  borderRadius: 1,
                                  bgcolor: 'action.hover',
                                  borderLeft: '2px solid',
                                  borderColor: 'primary.main',
                                  fontSize: '0.85rem',
                                  color: 'text.secondary',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}>
                                  <ReplyIcon sx={{ fontSize: 14 }} />
                                  <Box component="span" sx={{ fontWeight: 'bold' }}>{message.replyTo.user.username}</Box>
                                  <Box component="span" sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '150px'
                                  }}>
                                    {message.replyTo.text}
                                  </Box>
                                </Box>
                              )}
                              <Box sx={{
                                mt: 0.5,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: message.isHighlighted ? 'warning.light' :
                                         message.user._id === currentUser?._id ? 'primary.light' : 'grey.100',
                                color: (message.isHighlighted || message.user._id === currentUser?._id) ? 'white' : 'inherit',
                                border: message.isHighlighted ? '1px dashed' : 'none',
                                borderColor: 'warning.main'
                              }}>
                                <Typography
                                  variant="body2"
                                  component="span"
                                  sx={{
                                    display: 'inline-block',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {message.text}
                                </Typography>
                              </Box>
                              {/* Message reactions */}
                              {messageReactions[message.id] && Object.keys(messageReactions[message.id]).length > 0 && (
                                <Box sx={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: 0.5,
                                  mt: 0.5,
                                  ml: 1
                                }}>
                                  {Object.entries(messageReactions[message.id]).map(([reaction, count]) => (
                                    <Chip
                                      key={reaction}
                                      label={`${reaction} ${count}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        '& .MuiChip-label': { px: 0.5 }
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}

                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography
                                  variant="caption"
                                  component="div"
                                  sx={{ color: 'text.secondary' }}
                                >
                                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>

                                {/* Message actions */}
                                {message.type !== 'system' && (
                                  <Box className="message-actions" sx={{
                                    display: 'flex',
                                    gap: 0.5,
                                    opacity: 0,
                                    transition: 'opacity 0.2s'
                                  }}>
                                    {/* Reply action - available to everyone */}
                                    <Tooltip title="Reply">
                                      <IconButton
                                        size="small"
                                        onClick={() => replyToMessage(message)}
                                        sx={{ p: 0.5 }}
                                      >
                                        <ReplyIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>

                                    {/* React action - available to everyone */}
                                    <Tooltip title="React">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          // Show a small popup with reaction options
                                          const reactions = ['❤️', '👍', '😂', '😮', '👏', '🔥'];
                                          const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
                                          reactToMessage(message.id, randomReaction);
                                        }}
                                        sx={{ p: 0.5 }}
                                      >
                                        <FavoriteIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>

                                    {/* Creator-only actions */}
                                    {isCreator && (
                                      <>
                                        <Tooltip title="Pin comment">
                                          <IconButton
                                            size="small"
                                            onClick={() => pinComment(message.id)}
                                            sx={{ p: 0.5 }}
                                          >
                                            <Box component="span" sx={{ fontSize: '14px' }}>📌</Box>
                                          </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Highlight comment">
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              // Add a highlighted class to the message
                                              setMessages(prev => prev.map(msg =>
                                                msg.id === message.id ? { ...msg, highlighted: true } : msg
                                              ));

                                              // Remove highlight after 3 seconds
                                              setTimeout(() => {
                                                setMessages(prev => prev.map(msg =>
                                                  msg.id === message.id ? { ...msg, highlighted: false } : msg
                                                ));
                                              }, 3000);
                                            }}
                                            sx={{ p: 0.5 }}
                                          >
                                            <Box component="span" sx={{ fontSize: '14px' }}>⭐</Box>
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </>
                          ) : (
                            <Chip
                              label={message.text}
                              size="small"
                              variant="outlined"
                              sx={{
                                bgcolor: 'rgba(0,0,0,0.05)',
                                borderRadius: 4,
                                '& .MuiChip-label': {
                                  px: 1
                                }
                              }}
                            />
                          )}
                        </Box>

                        {/* Highlight effect */}
                        {message.highlighted && (
                          <Box sx={{
                            position: 'absolute',
                            top: -4,
                            left: -4,
                            right: -4,
                            bottom: -4,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: 'warning.main',
                            animation: 'pulse-highlight 1s infinite',
                            '@keyframes pulse-highlight': {
                              '0%': { opacity: 0.5 },
                              '50%': { opacity: 1 },
                              '100%': { opacity: 0.5 }
                            },
                            pointerEvents: 'none'
                          }} />
                        )}
                      </Box>
                    ))
                  )}
                  </Box>
                ) : chatTab === 'viewers' ? (
                  <Box sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    height: 400
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Viewers ({viewers.length})
                    </Typography>

                    {viewers.length === 0 ? (
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 'calc(100% - 30px)',
                        color: 'text.secondary'
                      }}>
                        <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <Typography>No viewers yet</Typography>
                      </Box>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {viewers.map((viewer) => (
                          <ListItem
                            key={viewer._id}
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                            secondaryAction={
                              isCreator && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Feature in stream">
                                    <IconButton size="small" sx={{ p: 0.5 }}>
                                      <Box component="span" sx={{ fontSize: '14px' }}>🌟</Box>
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Mute viewer">
                                    <IconButton size="small" sx={{ p: 0.5 }}>
                                      <Box component="span" sx={{ fontSize: '14px' }}>🔇</Box>
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )
                            }
                          >
                            <ListItemAvatar sx={{ minWidth: 40 }}>
                              <ProfilePicture
                                src={getProfilePictureUrl(viewer, 'small')}
                                alt={viewer.username}
                                username={viewer.username}
                                isVerified={viewer.isVerified}
                                linkToProfile={false}
                                size={{ width: 32, height: 32 }}
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={viewer.username}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Box
                                    component="span"
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: 'success.main',
                                      display: 'inline-block'
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary">Online</Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, height: 400 }}>
                    {recordedVideos.length === 0 ? (
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'text.secondary'
                      }}>
                        <Box component="span" sx={{ fontSize: 40, mb: 1, opacity: 0.5 }}>📹</Box>
                        <Typography sx={{ mb: 2 }}>No recordings yet</Typography>
                        {isLive && isCreator && !isRecording && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Box component="span" sx={{ fontSize: 18 }}>🔴</Box>}
                            onClick={startRecording}
                          >
                            Start Recording
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {recordedVideos.map(video => (
                          <Card key={video.id} sx={{ mb: 2, overflow: 'hidden' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {video.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(video.timestamp).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip
                                  icon={<Box component="span" sx={{ fontSize: '16px' }}>⏱️</Box>}
                                  label={formatDuration(video.duration)}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>

                              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Box component="span" sx={{ fontSize: 18 }}>📥</Box>}
                                  onClick={() => downloadRecording(video.id)}
                                >
                                  Download
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Box component="span" sx={{ fontSize: 18 }}>🔗</Box>}
                                  onClick={() => {
                                    navigator.clipboard.writeText(`Recording: ${video.title}`);
                                    setSnackbarMessage('Recording info copied to clipboard!');
                                    setSnackbarSeverity('success');
                                    setSnackbarOpen(true);
                                  }}
                                >
                                  Share
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </List>
                    )}
                  </Box>
                )}

                {isLive && (
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    {replyingTo && (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        mb: 1,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        borderLeft: '2px solid',
                        borderColor: 'primary.main'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                          <ReplyIcon fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              Replying to {replyingTo.user.username}
                            </Typography>
                            <Typography variant="caption" sx={{
                              display: 'block',
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px'
                            }}>
                              {replyingTo.text}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" onClick={cancelReply}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 1, flexDirection: isMobile ? 'column' : 'row' }}>
                      <IconButton
                        size="small"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        color="primary"
                      >
                        <EmojiEmotionsIcon />
                      </IconButton>
                      <TextField
                        fullWidth
                        size="small"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={replyingTo ? `Reply to ${replyingTo.user.username}...` : "Type a message..."}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              edge="end"
                              onClick={sendMessage}
                              disabled={!messageText.trim()}
                              color="primary"
                            >
                              <SendIcon />
                            </IconButton>
                          ),
                        }}
                      />
                    </Box>
                    {showEmojiPicker && (
                      <Box sx={{ mt: 1, position: 'relative' }}>
                        <Paper
                          ref={emojiPickerRef}
                          elevation={3}
                          sx={{
                            p: 2,
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            zIndex: 10,
                            width: isMobile ? '100%' : 250,
                            maxHeight: 300,
                            overflowY: 'auto',
                            ...(isMobile && {
                              left: 0,
                              right: 0,
                              bottom: isMobile ? 'calc(100% + 8px)' : '100%'
                            })
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Emoji</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {[
                              '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
                              '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'
                            ].map(emoji => (
                              <IconButton
                                key={emoji}
                                size="small"
                                onClick={() => handleEmojiSelect(emoji)}
                                sx={{
                                  minWidth: 36,
                                  height: 36,
                                  p: 0.5,
                                  '&:hover': {
                                    bgcolor: 'action.hover'
                                  }
                                }}
                              >
                                <Typography>{emoji}</Typography>
                              </IconButton>
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button
                              size="small"
                              onClick={() => setShowEmojiPicker(false)}
                              variant="text"
                            >
                              Close
                            </Button>
                          </Box>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : (
        // Creating a new livestream
        <Box sx={{
          maxWidth: 800,
          mx: 'auto',
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          mt: 4
        }}>
          <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center'
            }}>
              <LiveTvIcon sx={{ mr: 1, fontSize: 32 }} />
              Start a Livestream
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Connect with your followers in real-time. Share your thoughts, talents, and experiences live.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stream Details
                </Typography>

                <TextField
                  fullWidth
                  label="Title"
                  variant="outlined"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your livestream a title"
                  disabled={isCreating}
                  required
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Description"
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your livestream"
                  disabled={isCreating}
                  multiline
                  rows={4}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Category"
                  variant="outlined"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Music, Gaming, Art, Fitness"
                  disabled={isCreating}
                  sx={{ mb: 3 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      disabled={isCreating}
                      color="primary"
                    />
                  }
                  label="Private livestream"
                  sx={{ mb: 2, display: 'block' }}
                />

                {isPrivate && (
                  <TextField
                    fullWidth
                    label="Allowed Users"
                    variant="outlined"
                    value={allowedUsers.join(', ')}
                    onChange={(e) => setAllowedUsers(e.target.value.split(',').map(u => u.trim()).filter(Boolean))}
                    placeholder="username1, username2, ..."
                    disabled={isCreating}
                    helperText="Enter usernames separated by commas"
                    sx={{ mb: 3 }}
                  />
                )}

                <Divider sx={{ my: 2 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      disabled={isCreating}
                      color="primary"
                    />
                  }
                  label="Schedule for later"
                  sx={{ mb: 2, display: 'block' }}
                />

                {isScheduled && (
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Date"
                          type="date"
                          value={scheduledDate.toISOString().split('T')[0]}
                          onChange={(e) => setScheduledDate(new Date(e.target.value))}
                          InputLabelProps={{ shrink: true }}
                          disabled={isCreating}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={isCreating}
                        />
                      </Grid>
                    </Grid>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Your followers will be notified about your upcoming stream.
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isChatEnabled}
                      onChange={(e) => setIsChatEnabled(e.target.checked)}
                      disabled={isCreating}
                      color="primary"
                    />
                  }
                  label="Enable chat"
                  sx={{ mb: 2, display: 'block' }}
                />
              </CardContent>
            </Card>

            {isFirstTimeStreamer && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, borderColor: 'primary.light' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box component="span" sx={{ fontSize: 24, mr: 1 }}>📝</Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Pre-Stream Checklist
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Complete this checklist to ensure your first livestream goes smoothly.
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={preStreamChecklist.cameraReady}
                      onChange={(e) => setPreStreamChecklist(prev => ({ ...prev, cameraReady: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Camera is working and properly positioned
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Make sure your camera is at eye level and you're well-framed
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={preStreamChecklist.microphoneReady}
                      onChange={(e) => setPreStreamChecklist(prev => ({ ...prev, microphoneReady: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Microphone is working and audio is clear
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Test your microphone and make sure there's no background noise
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={preStreamChecklist.contentPlanned}
                      onChange={(e) => setPreStreamChecklist(prev => ({ ...prev, contentPlanned: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Content is planned and ready
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Have a general outline of what you'll talk about or show
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={preStreamChecklist.internetStable}
                      onChange={(e) => setPreStreamChecklist(prev => ({ ...prev, internetStable: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Internet connection is stable
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Check that your internet speed is sufficient for streaming
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', alignItems: 'flex-start' }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setIsFirstTimeStreamer(false)}
                  >
                    Skip checklist
                  </Button>
                </Box>
              </Paper>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                color={isScheduled ? "secondary" : "primary"}
                size="large"
                fullWidth
                onClick={isScheduled ? scheduleStream : createStream}
                disabled={isCreating || !title.trim() || (isFirstTimeStreamer && !Object.values(preStreamChecklist).every(Boolean))}
                startIcon={isScheduled ? <Box component="span" sx={{ fontSize: 24 }}>📅</Box> : <LiveTvIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 5
                  },
                  transition: 'all 0.2s'
                }}
              >
                {isCreating ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    {isScheduled ? 'Scheduling...' : 'Starting...'}
                  </>
                ) : (
                  isScheduled ? 'Schedule Stream' : 'Go Live Now'
                )}
              </Button>

              {scheduledStreams.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Your Scheduled Streams
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 0 }}>
                    <List sx={{ p: 0 }}>
                      {scheduledStreams.map((stream, index) => (
                        <ListItem
                          key={index}
                          divider={index < scheduledStreams.length - 1}
                          secondaryAction={
                            <Button
                              variant="outlined"
                              size="small"
                              color="primary"
                              onClick={() => startScheduledStream(stream.id)}
                            >
                              Start Now
                            </Button>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              <Box component="span" sx={{ fontSize: 20 }}>📅</Box>
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={stream.title}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {new Date(stream.scheduledFor).toLocaleDateString()} at {new Date(stream.scheduledFor).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </Typography>
                                <Typography component="span" variant="body2" display="block" color="text.secondary">
                                  {stream.category} • {stream.isPrivate ? 'Private' : 'Public'}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}

              {isFirstTimeStreamer && !Object.values(preStreamChecklist).every(Boolean) && (
                <Typography variant="caption" color="error" sx={{ textAlign: 'center' }}>
                  Please complete the pre-stream checklist before going live
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Highlight Dialog */}
      <Dialog
        open={showHighlightDialog}
        onClose={() => setShowHighlightDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="span" sx={{ fontSize: 24 }}>⭐</Box>
          Create Stream Highlight
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a highlight to mark an important moment in your stream. Highlights can be shared with your followers and will appear on your profile.
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="Highlight Title"
            fullWidth
            variant="outlined"
            value={highlightTitle}
            onChange={(e) => setHighlightTitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={highlightDescription}
            onChange={(e) => setHighlightDescription(e.target.value)}
          />

          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ fontSize: 20, color: 'primary.main' }}>📌</Box>
            <Typography variant="body2" color="primary.main">
              Current timestamp: {formatDuration(streamDuration)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHighlightDialog(false)}>Cancel</Button>
          <Button
            onClick={createHighlight}
            variant="contained"
            disabled={!highlightTitle.trim() || isCreatingHighlight}
            startIcon={isCreatingHighlight ? <CircularProgress size={16} /> : null}
          >
            {isCreatingHighlight ? 'Creating...' : 'Create Highlight'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Highlights Tab Dialog */}
      <Dialog
        open={highlights.length > 0 && showHighlightDialog === 'view'}
        onClose={() => setShowHighlightDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ fontSize: 24 }}>⭐</Box>
            Stream Highlights
          </Box>
          <IconButton onClick={() => setShowHighlightDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {highlights.map((highlight, index) => (
              <Grid item xs={12} sm={6} md={4} key={highlight.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {highlight.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {highlight.description || 'No description'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box component="span" sx={{ fontSize: 16 }}>⏱️</Box>
                      <Typography variant="caption">
                        {formatDuration(highlight.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Created {new Date(highlight.createdAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Box component="span" sx={{ fontSize: 16 }}>🔊</Box>}
                      onClick={() => shareHighlight(highlight.id)}
                    >
                      Share
                    </Button>
                    {isCreator && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Box component="span" sx={{ fontSize: 16 }}>🚮</Box>}
                        onClick={() => deleteHighlight(highlight.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

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

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={handleShareDialogClose}
        stream={stream}
        currentUser={currentUser}
      />
    </Box>
  );
};

export default Live;
