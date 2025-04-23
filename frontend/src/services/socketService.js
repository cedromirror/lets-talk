// Real Socket Service using socket.io-client
import { io } from 'socket.io-client';

// Get the base URL from environment or use default
const getBaseUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }

  // Use the consistent backend port - ALWAYS use port 60000 for backend
  // This should match the port where the backend is running
  const backendPort = 60000;

  // Always use direct connection to backend for sockets
  console.log(`Using socket URL: http://localhost:${backendPort}`);
  return `http://localhost:${backendPort}`;
};

let socket = null;

// Track connection attempts to prevent infinite loops
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3; // Reduced from 5 to 3
let connectionResetTimer = null;
let lastConnectionAttemptTime = 0;
const CONNECTION_COOLDOWN_MS = 10000; // 10 seconds cooldown between connection attempts

// Reset connection attempts counter after a period of time
const resetConnectionAttempts = () => {
  connectionAttempts = 0;
  if (connectionResetTimer) {
    clearTimeout(connectionResetTimer);
    connectionResetTimer = null;
  }
};

// No mock socket - require real backend connection

// Safe connect method that handles null socket
export const connect = () => {
  // Check if we're in a cooldown period
  const now = Date.now();
  if (now - lastConnectionAttemptTime < CONNECTION_COOLDOWN_MS) {
    console.log(`Connection attempt cooldown active. Please wait ${Math.ceil((CONNECTION_COOLDOWN_MS - (now - lastConnectionAttemptTime)) / 1000)} seconds before trying again.`);
    return false;
  }

  // Update last attempt time
  lastConnectionAttemptTime = now;

  if (socket) {
    // Only try to connect if not already connected
    if (!socket.connected) {
      console.log('Connecting existing socket');
      socket.connect();
    } else {
      console.log('Socket already connected');
    }
    return true;
  } else {
    console.log('No socket to connect, attempting to initialize');
    // Try to initialize a new socket
    const token = localStorage.getItem('token');
    if (token) {
      const newSocket = initializeSocket(token);
      return !!newSocket; // Return true if socket was initialized, false otherwise
    }
    return false;
  }
};

export const initializeSocket = (token) => {
  try {
    console.log('Initializing socket connection');

    // Check if we already have a connected socket
    if (socket && socket.connected) {
      console.log('Socket already connected, reusing existing connection');
      return socket;
    }

    // Track connection attempts to prevent infinite loops
    connectionAttempts++;
    console.log(`Socket connection attempt ${connectionAttempts} of ${MAX_CONNECTION_ATTEMPTS}`);

    // If we've tried too many times, back off
    if (connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
      console.warn(`Too many connection attempts (${connectionAttempts}). Backing off for 30 seconds.`);
      // Set a timer to reset the counter after 30 seconds (reduced from 60)
      if (!connectionResetTimer) {
        connectionResetTimer = setTimeout(() => {
          console.log('Connection attempt counter reset after timeout');
          resetConnectionAttempts();
        }, 30000);
      }

      // No mock socket - require real backend connection
      console.log('Max reconnection attempts reached, socket connection failed');

      return null;
    }

    // Disconnect existing socket if it exists
    if (socket) {
      console.log('Disconnecting existing socket');
      socket.disconnect();
    }

    // Get token from localStorage if not provided
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      console.warn('No auth token available for socket connection');

      // No mock socket - require real backend connection
      console.log('No auth token available for socket connection');
      return null;
    }

    // Validate token before using it
    if (typeof authToken !== 'string' || authToken.trim() === '') {
      console.warn('Invalid token found for socket connection, removing it from localStorage');
      localStorage.removeItem('token');
      return null;
    }

    console.log('Auth token available for socket connection');

    const baseUrl = getBaseUrl();
    console.log(`Connecting to socket server at: ${baseUrl}`);

    // Create a new socket connection with improved configuration
    // Try without Bearer prefix first as a fallback
    const tokenWithoutBearer = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;

    // Try to create a socket connection with multiple configurations
    try {
      socket = io(baseUrl, {
        auth: { token: tokenWithoutBearer }, // Try without Bearer format first
        query: { token: tokenWithoutBearer }, // Also include token in query without Bearer
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        reconnection: true,
        reconnectionAttempts: 2, // Reduced attempts to avoid excessive retries
        reconnectionDelay: 3000, // Longer delay between attempts
        reconnectionDelayMax: 15000,
        timeout: 20000, // Increased timeout for better reliability
        autoConnect: true,
        forceNew: false, // Don't force a new connection every time
        path: '/socket.io',
        withCredentials: false, // Disable CORS credentials to avoid issues
        extraHeaders: {
          'Authorization': tokenWithoutBearer // Try without Bearer format
        }
      });
    } catch (socketError) {
      console.error('Error creating socket with first configuration:', socketError);

      // Try a simpler configuration as fallback
      try {
        socket = io(baseUrl, {
          query: { token: tokenWithoutBearer },
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionAttempts: 1, // Only try once
          reconnectionDelay: 5000, // Longer delay
          timeout: 20000,
          autoConnect: true
        });
      } catch (fallbackError) {
        console.error('Error creating socket with fallback configuration:', fallbackError);

        // No mock socket - require real backend connection
        console.log('Socket connection failed after multiple attempts');
      }
    }

    console.log('Socket initialized with Bearer token format');

    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      // Reset connection attempts on successful connection
      resetConnectionAttempts();
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);

      // Check if it's an authentication error
      if (error.message && error.message.includes('Authentication error')) {
        console.warn('Socket authentication error detected. Clearing token and stopping reconnection attempts.');
        // Don't try to reconnect with the same invalid token
        connectionAttempts = MAX_CONNECTION_ATTEMPTS + 1;

        // No mock socket - require real backend connection
        console.log('Socket authentication error, cannot proceed without valid authentication');
      } else if (error.message && error.message.includes('Too many connection attempts')) {
        console.warn('Rate limiting detected. Backing off for 30 seconds.');
        // Set a longer cooldown for rate limiting
        lastConnectionAttemptTime = Date.now();
        // Don't try to reconnect immediately
        if (!connectionResetTimer) {
          connectionResetTimer = setTimeout(() => {
            console.log('Connection attempt counter reset after rate limiting timeout');
            resetConnectionAttempts();
          }, 30000);
        }
      } else if (connectionAttempts <= MAX_CONNECTION_ATTEMPTS) {
        // For other errors, try to reconnect after a longer delay
        setTimeout(() => {
          console.log('Attempting to reconnect socket...');
          connect(); // Use the safe connect method instead of socket.connect()
        }, 10000); // Increased from 5000 to 10000
      } else {
        console.warn('Not attempting to reconnect due to too many failed attempts');

        // No mock socket - require real backend connection
        console.log('Max reconnection attempts reached, socket connection failed');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        console.log('Server disconnected the socket, waiting before reconnecting...');
        // Wait a bit before trying to reconnect to avoid rate limiting
        setTimeout(() => {
          // Check if we're still within connection attempt limits
          if (connectionAttempts <= MAX_CONNECTION_ATTEMPTS) {
            console.log('Attempting to reconnect after server disconnect...');
            connect(); // Use the safe connect method instead of socket.connect()
          } else {
            console.warn('Not attempting to reconnect due to too many failed attempts');
          }
        }, 5000);
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        // These are common network-related issues
        console.log(`Socket disconnected due to ${reason}, will attempt automatic reconnection`);
      }
      // else the socket will automatically try to reconnect
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');
      // Try a complete re-initialization after all reconnection attempts fail
      // but only if we haven't exceeded max attempts
      if (connectionAttempts <= MAX_CONNECTION_ATTEMPTS) {
        setTimeout(() => {
          console.log('Attempting complete socket re-initialization...');
          initializeSocket(authToken);
        }, 10000);
      } else {
        console.warn('Not attempting to reinitialize socket due to too many failed attempts');
        // Set a timer to try again after a longer delay
        setTimeout(() => {
          console.log('Attempting socket initialization after extended timeout');
          resetConnectionAttempts();
          initializeSocket(authToken);
        }, 60000); // Try again after 1 minute
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    // Try to initialize again after a delay, but only if we haven't exceeded max attempts
    if (connectionAttempts <= MAX_CONNECTION_ATTEMPTS) {
      setTimeout(() => {
        console.log('Attempting to initialize socket again after error...');
        initializeSocket(token);
      }, 10000);
    } else {
      console.warn('Not attempting to reinitialize socket due to too many failed attempts');
      // Set a timer to try again after a longer delay
      setTimeout(() => {
        console.log('Attempting socket initialization after extended timeout');
        resetConnectionAttempts();
        initializeSocket(token);
      }, 60000); // Try again after 1 minute
    }
    return null;
  }
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected');
  }
};

// Join a conversation room
export const joinConversation = (conversationId) => {
  if (socket) {
    socket.emit('join-conversation', { conversationId });
  }
};

// Leave a conversation room
export const leaveConversation = (conversationId) => {
  if (socket) {
    socket.emit('leave-conversation', { conversationId });
  }
};

// Send typing indicator
export const sendTyping = (conversationId) => {
  if (socket) {
    socket.emit('typing', { conversationId });
  }
};

// Send stop typing indicator
export const sendStopTyping = (conversationId) => {
  if (socket) {
    socket.emit('stop-typing', { conversationId });
  }
};

// Mark message as read
export const markMessageAsRead = (conversationId, messageId) => {
  console.log(`Marking message ${messageId} as read in conversation ${conversationId}`);

  if (!conversationId || !messageId) {
    console.warn('Missing conversationId or messageId for markMessageAsRead');
    return false;
  }

  if (socket && socket.connected) {
    // Try multiple event names for compatibility
    socket.emit('message-read', { conversationId, messageId });
    socket.emit('message:read', { conversationId, messageId });
    return true;
  } else {
    console.log('Socket not connected. Attempting to reconnect...');
    // Try to reconnect and then emit
    const connected = connect();
    if (connected) {
      setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('message-read', { conversationId, messageId });
          socket.emit('message:read', { conversationId, messageId });
        }
      }, 1000);
    }
    return connected;
  }
};

// Send message reaction
export const sendMessageReaction = (messageId, emoji, action = 'add') => {
  if (socket) {
    socket.emit('message-reaction', { messageId, emoji, action });
  }
};

// Send new message via socket
export const sendNewMessage = (conversationId, message) => {
  console.log(`Sending new message to conversation ${conversationId}:`, message);

  if (!conversationId || !message) {
    console.warn('Missing conversationId or message for sendNewMessage');
    return false;
  }

  if (socket && socket.connected) {
    // Try multiple event names for compatibility
    socket.emit('new-message', { conversationId, message });
    socket.emit('message:send', { conversationId, message });

    // Update message delivery status
    if (message._id) {
      setTimeout(() => {
        // After a short delay, update the message status to delivered
        socket.emit('message-delivered', { messageId: message._id, conversationId });
      }, 1000);
    }

    return true;
  } else {
    console.log('Socket not connected. Attempting to reconnect...');
    // Try to reconnect and then emit
    const connected = connect();
    if (connected) {
      setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('new-message', { conversationId, message });
          socket.emit('message:send', { conversationId, message });

          // Update message delivery status
          if (message._id) {
            setTimeout(() => {
              socket.emit('message-delivered', { messageId: message._id, conversationId });
            }, 1000);
          }
        }
      }, 1000);
    }
    return connected;
  }
};

// Listen for online users
export const onOnlineUsers = (callback) => {
  if (socket) {
    socket.on('online-users', callback);
  }
};

// Listen for new messages
export const onNewMessage = (callback) => {
  if (socket) {
    // Remove any existing listeners to prevent duplicates
    socket.off('new-message');
    socket.off('message:new');

    // Listen for both event names for compatibility
    socket.on('new-message', (message) => {
      console.log('Received new message via new-message event:', message);
      callback(message);
    });

    socket.on('message:new', (message) => {
      console.log('Received new message via message:new event:', message);
      callback(message);
    });
  }
};

// Listen for typing indicators
export const onUserTyping = (callback) => {
  if (socket) {
    socket.on('user-typing', callback);
  }
};

// Listen for stop typing indicators
export const onUserStoppedTyping = (callback) => {
  if (socket) {
    socket.on('user-stopped-typing', callback);
  }
};

// Listen for message read receipts
export const onMessageRead = (callback) => {
  if (socket) {
    // Remove any existing listeners to prevent duplicates
    socket.off('message-read');
    socket.off('message:read');

    // Listen for both event names for compatibility
    socket.on('message-read', (data) => {
      console.log('Received message read receipt via message-read event:', data);
      callback(data);
    });

    socket.on('message:read', (data) => {
      console.log('Received message read receipt via message:read event:', data);
      callback(data);
    });
  }
};

// Listen for message delivery status
export const onMessageDelivered = (callback) => {
  if (socket) {
    // Remove any existing listeners to prevent duplicates
    socket.off('message-delivered');
    socket.off('message:delivered');

    // Listen for both event names for compatibility
    socket.on('message-delivered', (data) => {
      console.log('Received message delivery status via message-delivered event:', data);
      callback(data);
    });

    socket.on('message:delivered', (data) => {
      console.log('Received message delivery status via message:delivered event:', data);
      callback(data);
    });
  }
};

// Listen for message reactions
export const onMessageReactionUpdated = (callback) => {
  if (socket) {
    socket.on('message-reaction-updated', callback);
  }
};

// Enhanced emitEvent with auto-initialization and better error handling
export const emitEvent = (event, data, callback) => {
  try {
    if (socket && socket.connected) {
      console.log(`Emitting socket event: ${event}`, data);
      socket.emit(event, data, callback);
      return true;
    } else if (socket && !socket.connected) {
      console.log('Socket exists but not connected. Attempting to reconnect...');
      // Try to reconnect the socket
      socket.connect();

      // Set a short timeout to allow the socket to connect before emitting
      setTimeout(() => {
        if (socket.connected) {
          console.log(`Socket reconnected, now emitting socket event: ${event}`, data);
          socket.emit(event, data, callback);
        } else {
          console.warn(`Socket failed to reconnect for event: ${event}`);
        }
      }, 1000);
      return false;
    } else {
      console.log('Socket not initialized. Attempting to initialize...');
      // Initialize socket if not already initialized
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token available for socket initialization');
        return false;
      }

      // Validate token before using it
      if (typeof token !== 'string' || token.trim() === '') {
        console.warn('Invalid token found for socket initialization, removing it from localStorage');
        localStorage.removeItem('token');
        return false;
      }

      // Initialize socket with token using the safe connect method
      console.log('Initializing socket for emitEvent');
      const connected = connect();
      const newSocket = connected ? getSocket() : null;

      if (newSocket) {
        // Set a short timeout to allow the socket to fully initialize before emitting
        setTimeout(() => {
          if (newSocket.connected) {
            console.log(`Socket initialized, now emitting socket event: ${event}`, data);
            newSocket.emit(event, data, callback);
          } else {
            console.warn(`Socket initialized but not connected for event: ${event}`);
          }
        }, 1000);
        return true;
      } else {
        console.warn(`Failed to initialize socket for event: ${event}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error emitting socket event ${event}:`, error);
    return false;
  }
};

// Enhanced subscribeToEvent with auto-initialization, multi-event support, and better error handling
export const subscribeToEvent = (event, callback) => {
  try {
    // Support for multiple event names (for compatibility)
    const eventNames = Array.isArray(event) ? event : [event];

    // Add alternate event names for common events
    const allEvents = [...eventNames];
    if (event === 'new-message') {
      allEvents.push('message:new');
    } else if (event === 'message:new') {
      allEvents.push('new-message');
    } else if (event === 'user-typing') {
      allEvents.push('typing');
    } else if (event === 'user-stopped-typing') {
      allEvents.push('stop-typing');
    } else if (event === 'message-read') {
      allEvents.push('message:read');
    } else if (event === 'message-reaction-updated') {
      allEvents.push('message:reaction');
    }

    // Create a wrapper callback that logs the event
    const wrappedCallback = (data) => {
      console.log(`Received data from event ${event}:`, data);
      callback(data);
    };

    if (socket) {
      console.log(`Subscribing to socket events: ${allEvents.join(', ')}`);

      // Remove any existing listeners to prevent duplicates
      allEvents.forEach(eventName => socket.off(eventName));

      // Add listeners for all event names
      allEvents.forEach(eventName => socket.on(eventName, wrappedCallback));

      // Return unsubscribe function
      return () => {
        if (socket) { // Check if socket still exists when unsubscribing
          console.log(`Unsubscribing from socket events: ${allEvents.join(', ')}`);
          allEvents.forEach(eventName => socket.off(eventName, wrappedCallback));
        }
      };
    } else {
      console.log('Socket not initialized. Attempting to initialize...');
      // Initialize socket if not already initialized
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token available for socket initialization');
        return () => {}; // Return empty function
      }

      // Validate token before using it
      if (typeof token !== 'string' || token.trim() === '') {
        console.warn('Invalid token found for socket initialization, removing it from localStorage');
        localStorage.removeItem('token');
        return () => {}; // Return empty function
      }

      // Initialize socket with token using the safe connect method
      console.log('Initializing socket for subscribeToEvent');
      const connected = connect();
      const newSocket = connected ? getSocket() : null;

      if (newSocket) {
        console.log(`Socket initialized, now subscribing to socket event: ${event}`);
        newSocket.on(event, callback);
        return () => {
          if (newSocket) { // Check if socket still exists when unsubscribing
            console.log(`Unsubscribing from socket event: ${event}`);
            newSocket.off(event, callback);
          }
        };
      } else {
        console.warn(`Failed to initialize socket for event: ${event}`);
      }
      return () => {}; // Return empty function
    }
  } catch (error) {
    console.error(`Error subscribing to socket event ${event}:`, error);
    return () => {}; // Return empty function
  }
};

// Function to update socket URL
export const updateSocketUrl = (port) => {
  console.log(`Updating socket URL to http://localhost:${port}`);

  // Get token from localStorage
  const authToken = localStorage.getItem('token');

  // Validate token before using it
  if (!authToken || typeof authToken !== 'string' || authToken.trim() === '') {
    console.warn('Invalid token found for socket URL update, removing it from localStorage');
    localStorage.removeItem('token');
    return null;
  }

  // Disconnect existing socket if it exists
  if (socket) {
    console.log('Disconnecting existing socket before updating URL');
    socket.disconnect();
  }

  // Determine the new URL
  let newUrl;
  if (process.env.NODE_ENV === 'development') {
    // In development, use the proxy through the frontend server
    newUrl = window.location.origin;
    console.log(`Using proxy URL: ${newUrl}`);
  } else {
    newUrl = `http://localhost:${port}`;
    console.log(`Using direct URL: ${newUrl}`);
  }

  // Create a new socket with the updated URL
  try {
    // Try without Bearer prefix as a fallback
    const tokenWithoutBearer = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;

    socket = io(newUrl, {
      auth: { token: tokenWithoutBearer }, // Use token without Bearer format
      query: { token: tokenWithoutBearer }, // Also include token in query without Bearer
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      path: '/socket.io',
      withCredentials: false, // Disable CORS credentials to avoid issues
      extraHeaders: {
        'Authorization': tokenWithoutBearer // Use token without Bearer format
      }
    });

    console.log('Socket URL updated with Bearer token format');

    console.log('Socket URL updated and new connection initialized');

    // Set up basic event listeners
    socket.on('connect', () => {
      console.log('Socket connected with new URL, ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error with new URL:', error);
    });
  } catch (error) {
    console.error('Error updating socket URL:', error);
  }

  return socket;
};

// Generic event listener
export const onEvent = (event, callback) => {
  if (socket) {
    // Store the original callback
    const originalCallback = callback;

    // No mock data handling - use real data only
    const wrappedCallback = (data) => {
      // Call the original callback with the real data
      originalCallback(data);
    };

    socket.on(event, wrappedCallback);

    // Return a function to unsubscribe
    return () => {
      if (socket) {
        socket.off(event, wrappedCallback);
      }
    };
  }

  // Return a no-op function if there's no socket
  return () => {};
};

// Generic event unsubscriber
export const offEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};



// Livestream specific functions
export const joinLivestream = (streamId) => {
  console.log(`Joining livestream room: ${streamId}`);

  // Try to ensure socket is connected before joining
  if (socket && !socket.connected) {
    console.log('Socket exists but not connected. Attempting to reconnect before joining livestream...');
    socket.connect();
  }

  // Try multiple event names to ensure compatibility
  const result = emitEvent('livestream:join', { streamId });

  if (!result) {
    console.log('Primary join livestream event failed, trying alternative event name');
    const altResult = emitEvent('join-livestream', { streamId });

    if (!altResult) {
      console.log('Secondary join livestream event failed, trying third event name');
      const thirdResult = emitEvent('join', { streamId, type: 'livestream' });

      if (!thirdResult) {
        console.log('All join livestream events failed');
        return false;
      }
      return thirdResult;
    }
    return altResult;
  }
  return result;
};

export const leaveLivestream = (streamId) => {
  console.log(`Leaving livestream room: ${streamId}`);

  // Try multiple event names to ensure compatibility
  const result = emitEvent('livestream:leave', { streamId });

  if (!result) {
    console.log('Primary leave livestream event failed, trying alternative event name');
    const altResult = emitEvent('leave-livestream', { streamId });

    if (!altResult) {
      console.log('Secondary leave livestream event failed, trying third event name');
      const thirdResult = emitEvent('leave', { streamId, type: 'livestream' });

      if (!thirdResult) {
        console.log('All leave livestream events failed');
        return false;
      }
      return thirdResult;
    }
    return altResult;
  }
  return result;
};

export const sendLivestreamMessage = (streamId, text, replyTo = null) => {
  console.log(`Sending message to livestream: ${streamId}`, { text, replyTo });

  // Try multiple event names to ensure compatibility
  const result = emitEvent('livestream:message', { streamId, text, replyTo });

  if (!result) {
    console.log('Primary socket event failed, trying alternative event name');
    // Try alternative event name
    const altResult = emitEvent('livestream:sendMessage', { streamId, text, replyTo });

    if (!altResult) {
      console.log('Secondary socket event failed, trying third event name');
      // Try another alternative event name
      const thirdResult = emitEvent('message', { streamId, text, replyTo, type: 'livestream' });

      if (!thirdResult) {
        console.log('Fourth attempt - trying livestream:comment event');
        const fourthResult = emitEvent('livestream:comment', { streamId, text, replyTo });

        if (!fourthResult) {
          console.log('All socket events failed for sending message');
          return false;
        }
        return fourthResult;
      }
      return thirdResult;
    }
    return altResult;
  }
  return result;
};

export const sendLivestreamReaction = (streamId, reaction) => {
  console.log(`Sending reaction to livestream: ${streamId}`);

  // Try multiple event names to ensure compatibility
  const result = emitEvent('livestream:reaction', { streamId, reaction });

  if (!result) {
    console.log('Primary reaction event failed, trying alternative event name');
    const altResult = emitEvent('livestream:sendReaction', { streamId, reaction });

    if (!altResult) {
      console.log('Secondary reaction event failed, trying third event name');
      const thirdResult = emitEvent('reaction', { streamId, reaction, type: 'livestream' });

      if (!thirdResult) {
        console.log('All reaction events failed');
        return false;
      }
      return thirdResult;
    }
    return altResult;
  }
  return result;
};

export const notifyCameraReady = (streamId) => {
  console.log(`Notifying camera ready for livestream: ${streamId}`);

  // Try multiple event names to ensure compatibility
  const result = emitEvent('livestream:cameraReady', { streamId });

  if (!result) {
    console.log('Primary camera ready event failed, trying alternative event name');
    const altResult = emitEvent('camera-ready', { streamId, type: 'livestream' });

    if (!altResult) {
      console.log('All camera ready events failed');
      return false;
    }
    return altResult;
  }
  return result;
};

// Default export with all functions
const socketService = {
  initializeSocket,
  getSocket,
  disconnectSocket,
  connect,
  joinConversation,
  leaveConversation,
  sendTyping,
  sendStopTyping,
  markMessageAsRead,
  sendMessageReaction,
  sendNewMessage,
  onOnlineUsers,
  onNewMessage,
  onUserTyping,
  onUserStoppedTyping,
  onMessageRead,
  onMessageDelivered,
  // Livestream specific functions
  joinLivestream,
  leaveLivestream,
  sendLivestreamMessage,
  sendLivestreamReaction,
  notifyCameraReady,
  onMessageReactionUpdated,
  emitEvent,
  onEvent,
  offEvent,
  subscribeToEvent,
  updateSocketUrl
};

export default socketService;
