const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Use WeakMap for better garbage collection
const activeUsers = new Map();
// Map to store user's active rooms (conversations)
const userRooms = new Map();
// Map to track socket IDs to user IDs for faster lookups and cleanup
const socketToUser = new Map();
// Map to track connection timestamps
const connectionTimes = new Map();

// Set up periodic cleanup to prevent memory leaks
let cleanupInterval;

// Function to clean up stale connections
const cleanupStaleConnections = () => {
  const now = Date.now();
  const staleThreshold = 900000; // 15 minutes (reduced from 30 minutes)

  let cleanedCount = 0;

  // Clean up stale connections from activeUsers
  for (const [userId, userData] of activeUsers.entries()) {
    if (!userData || !userData.connectedAt) {
      activeUsers.delete(userId);
      userRooms.delete(userId);
      cleanedCount++;
      continue;
    }

    const connectionAge = now - userData.connectedAt.getTime();
    if (connectionAge > staleThreshold) {
      console.log(`Cleaning up stale connection for user ${userId}, age: ${connectionAge/1000/60} minutes`);

      // Get the socket ID to properly disconnect
      const socketId = userData.socketId;
      if (socketId) {
        // Remove from socketToUser map
        socketToUser.delete(socketId);

        // Try to disconnect the socket if it still exists
        try {
          const io = global.io; // Assuming io is stored globally
          if (io) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
              console.log(`Forcefully disconnecting stale socket ${socketId}`);
              socket.disconnect(true);
            }
          }
        } catch (error) {
          console.error(`Error disconnecting stale socket: ${error.message}`);
        }
      }

      // Clean up user data
      activeUsers.delete(userId);
      userRooms.delete(userId);
      connectionTimes.delete(userId);
      cleanedCount++;
    }
  }

  // Also check for orphaned socket entries
  for (const [socketId, userId] of socketToUser.entries()) {
    if (!activeUsers.has(userId)) {
      console.log(`Cleaning up orphaned socket mapping: ${socketId} -> ${userId}`);
      socketToUser.delete(socketId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} stale connections and mappings`);

    // Log current memory usage after cleanup
    const memUsage = process.memoryUsage();
    console.log('Memory usage after cleanup:', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
    });
  }
};

const initializeSocket = (server) => {
  // Create socket.io server with improved configuration
  const io = new Server(server, {
    cors: {
      // Use the same CORS configuration as the Express app
      origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
          process.env.CLIENT_URL || 'http://localhost:30000',
          'http://localhost:3000',
          'http://localhost:6001',
          'http://localhost:6000'
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          console.log('Socket.io CORS blocked origin:', origin);
          callback(null, true); // Allow all origins in development
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Add performance and stability improvements
    transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
    pingTimeout: 60000, // Increase ping timeout to 60 seconds
    pingInterval: 25000, // Ping clients every 25 seconds
    connectTimeout: 30000, // Connection timeout after 30 seconds
    maxHttpBufferSize: 1e6, // 1MB max buffer size
    // Add error handling
    handlePreflightRequest: (req, res) => {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Credentials': true
      });
      res.end();
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Get token from multiple possible sources
      let token = socket.handshake.auth.token ||
                 socket.handshake.headers.authorization ||
                 socket.handshake.query?.token;

      // Check if token is in Bearer format and extract the token
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
        console.log('Socket token extracted from Bearer format');
      }

      if (!token) {
        console.warn('Socket connection attempt without token');
        return next(new Error('Authentication error: Token not provided'));
      }

      console.log('Socket token verification:', token.substring(0, 10) + '...');

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Get user from database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
          console.warn(`Socket auth: User not found for ID ${decoded.id}`);
          return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket
        socket.user = user;
        console.log(`Socket authenticated for user: ${user.username}`);
        next();
      } catch (tokenError) {
        console.error('Socket token verification error:', tokenError.message);

        // Try to extract user ID from expired token for better logging
        try {
          const decodedAnyway = jwt.decode(token);
          if (decodedAnyway && decodedAnyway.id) {
            console.warn(`Expired token for user ID: ${decodedAnyway.id}`);
          }
        } catch (decodeError) {
          // Ignore decode errors
        }

        return next(new Error(`Authentication error: ${tokenError.message}`));
      }
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Track connection attempts for rate limiting
  const connectionAttempts = new Map();
  const MAX_CONNECTIONS_PER_MINUTE = 20;
  const CONNECTION_RESET_INTERVAL = 60000; // 1 minute

  // Clean up connection attempts periodically
  setInterval(() => {
    connectionAttempts.clear();
  }, CONNECTION_RESET_INTERVAL);

  // Handle new connections
  io.on('connection', (socket) => {
    try {
      // Validate socket.user exists
      if (!socket.user || !socket.user._id) {
        console.error('Socket connection without valid user data');
        socket.disconnect();
        return;
      }

      const userId = socket.user._id.toString();

      // Rate limiting
      const userAttempts = connectionAttempts.get(userId) || 0;
      connectionAttempts.set(userId, userAttempts + 1);

      if (userAttempts > MAX_CONNECTIONS_PER_MINUTE) {
        console.warn(`Rate limiting socket connection for user ${userId}`);
        socket.emit('error', { message: 'Too many connection attempts. Please try again later.' });
        socket.disconnect();
        return;
      }

      console.log(`User connected: ${socket.user.username} (${userId})`);

      // Check if user is already connected
      const existingConnection = activeUsers.get(userId);
      if (existingConnection) {
        console.log(`User ${userId} already has an active connection. Updating socket ID.`);

        // Clean up old socket mapping
        if (existingConnection.socketId) {
          socketToUser.delete(existingConnection.socketId);
        }

        // Update the socket ID for the existing connection
        existingConnection.socketId = socket.id;
        existingConnection.connectedAt = new Date(); // Update connection time
        activeUsers.set(userId, existingConnection);
      } else {
        // Add user to active users
        activeUsers.set(userId, {
          socketId: socket.id,
          user: {
            _id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar
          },
          connectedAt: new Date()
        });

        // Initialize user rooms
        userRooms.set(userId, new Set());

        // Update user's online status
        updateUserOnlineStatus(userId, true);
      }

      // Add to socketToUser mapping
      socketToUser.set(socket.id, userId);

      // Update connection time
      connectionTimes.set(userId, new Date());

      // Emit online users to all connected clients
      emitOnlineUsers();

      // Send connection acknowledgment
      socket.emit('connection-established', {
        userId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling socket connection:', error);
      // Attempt to disconnect the socket on error
      try {
        socket.disconnect();
      } catch (disconnectError) {
        console.error('Error disconnecting socket:', disconnectError);
      }
      return;
    }

    // Handle joining a conversation
    socket.on('join-conversation', async ({ conversationId }) => {
      try {
        // Check if conversation exists and user is a participant
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (!conversation.hasParticipant(userId)) {
          socket.emit('error', { message: 'You are not a participant in this conversation' });
          return;
        }

        // Join the room
        socket.join(conversationId);

        // Add room to user's rooms
        const userRoomSet = userRooms.get(userId) || new Set();
        userRoomSet.add(conversationId);
        userRooms.set(userId, userRoomSet);

        console.log(`User ${socket.user.username} joined conversation ${conversationId}`);
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Error joining conversation' });
      }
    });

    // Handle leaving a conversation
    socket.on('leave-conversation', ({ conversationId }) => {
      socket.leave(conversationId);

      // Remove room from user's rooms
      const userRoomSet = userRooms.get(userId);
      if (userRoomSet) {
        userRoomSet.delete(conversationId);
      }

      console.log(`User ${socket.user.username} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on('new-message', async (messageData) => {
      try {
        const { conversationId, message } = messageData;

        // Emit to all users in the conversation
        io.to(conversationId).emit('new-message', message);

        // Send notification to offline users
        const conversation = await Conversation.findById(conversationId)
          .populate('participants', '_id username');

        if (conversation) {
          conversation.participants.forEach(participant => {
            const participantId = participant._id.toString();

            // Skip the sender
            if (participantId === userId) return;

            // Check if user is online and in this conversation
            const isOnline = activeUsers.has(participantId);
            const userRoomSet = userRooms.get(participantId);
            const isInConversation = userRoomSet && userRoomSet.has(conversationId);

            // If user is not online or not in this conversation, send notification
            if (!isOnline || !isInConversation) {
              // Here you would typically send a push notification
              console.log(`Sending notification to ${participant.username} for new message`);
            }
          });
        }
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user-typing', {
        user: {
          _id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar
        },
        conversation: conversationId
      });
    });

    // Handle stop typing
    socket.on('stop-typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user-stopped-typing', {
        user: {
          _id: socket.user._id,
          username: socket.user.username
        },
        conversation: conversationId
      });
    });

    // Handle message read
    socket.on('message-read', async ({ conversationId, messageId }) => {
      try {
        // Update message in database
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: {
            readBy: {
              user: userId,
              readAt: new Date()
            }
          },
          deliveryStatus: 'read'
        });

        // Emit to all users in the conversation
        io.to(conversationId).emit('message-read', {
          messageId,
          userId,
          conversationId
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle message reaction
    socket.on('message-reaction', async ({ messageId, emoji, action }) => {
      try {
        const message = await Message.findById(messageId)
          .populate('conversation');

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const conversationId = message.conversation._id.toString();

        // Update message in database
        if (action === 'add') {
          await Message.findByIdAndUpdate(messageId, {
            $pull: { reactions: { user: userId } }
          });

          await Message.findByIdAndUpdate(messageId, {
            $push: {
              reactions: {
                user: userId,
                emoji
              }
            }
          });
        } else if (action === 'remove') {
          await Message.findByIdAndUpdate(messageId, {
            $pull: { reactions: { user: userId } }
          });
        }

        // Emit to all users in the conversation
        io.to(conversationId).emit('message-reaction-updated', {
          messageId,
          userId,
          emoji,
          action,
          user: {
            _id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
        });
      } catch (error) {
        console.error('Error handling message reaction:', error);
      }
    });

    // Handle socket errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user?.username || 'unknown'}:`, error);
    });

    // Handle client errors
    socket.on('client-error', (error) => {
      console.error(`Client error reported by ${socket.user?.username || 'unknown'}:`, error);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      try {
        // Get the socket ID for cleanup
        const socketId = socket.id;

        // Try to get userId from socketToUser map first (more reliable)
        let disconnectUserId = socketToUser.get(socketId);

        // If not found in map, try to get from socket.user
        if (!disconnectUserId && socket.user && socket.user._id) {
          disconnectUserId = socket.user._id.toString();
        }

        if (!disconnectUserId) {
          console.warn(`Socket disconnect without valid user data. Socket ID: ${socketId}, Reason: ${reason}`);
          // Clean up the socket mapping anyway
          socketToUser.delete(socketId);
          return;
        }

        console.log(`User disconnected: ${socket.user?.username || 'Unknown'} (${disconnectUserId}). Reason: ${reason}`);

        // Remove socket from socketToUser map
        socketToUser.delete(socketId);

        // Check if this user has other active connections
        const userData = activeUsers.get(disconnectUserId);
        if (userData && userData.socketId === socketId) {
          // This was the user's only/latest connection, so remove them
          activeUsers.delete(disconnectUserId);
          userRooms.delete(disconnectUserId);
          connectionTimes.delete(disconnectUserId);

          // Update user's online status in database
          updateUserOnlineStatus(disconnectUserId, false);

          // Emit online users to all connected clients
          emitOnlineUsers();
        } else if (userData && userData.socketId !== socketId) {
          console.log(`User ${disconnectUserId} has another active connection. Not updating online status.`);
        }

        // If the disconnect was due to a transport error, log it
        if (reason === 'transport error' || reason === 'transport close') {
          console.warn(`Transport error disconnect for user ${disconnectUserId}. This might indicate network issues.`);
        }

        // Log memory usage occasionally
        if (Math.random() < 0.1) { // 10% chance to log memory usage
          const memUsage = process.memoryUsage();
          console.log('Memory usage after disconnect:', {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
          });
        }
      } catch (error) {
        console.error('Error handling socket disconnect:', error);
        // Don't throw the error to prevent server crashes

        // Try to clean up socket mapping anyway
        try {
          if (socket && socket.id) {
            socketToUser.delete(socket.id);
          }
        } catch (cleanupError) {
          console.error('Error during disconnect cleanup:', cleanupError);
        }
      }
    });
  });

  // Handle server-wide socket.io errors
  io.engine.on('connection_error', (err) => {
    console.error('Socket.io connection error:', err);
  });

  // Start periodic cleanup of stale connections
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  cleanupInterval = setInterval(cleanupStaleConnections, 900000); // Run every 15 minutes

  // Run an initial cleanup immediately
  setTimeout(cleanupStaleConnections, 5000);

  // Function to update user's online status in database
  const updateUserOnlineStatus = async (userId, isOnline) => {
    try {
      if (!userId) {
        console.warn('updateUserOnlineStatus called with invalid userId');
        return;
      }

      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: isOnline ? undefined : new Date()
      });
    } catch (error) {
      console.error('Error updating user online status:', error);
      // Don't throw the error to prevent server crashes
    }
  };

  // Function to emit online users to all connected clients
  const emitOnlineUsers = () => {
    try {
      const onlineUsers = Array.from(activeUsers.values())
        .filter(data => data && data.user) // Filter out any invalid entries
        .map(data => data.user);
      io.emit('online-users', onlineUsers);
    } catch (error) {
      console.error('Error emitting online users:', error);
      // Don't throw the error to prevent server crashes
    }
  };

  return io;
};

module.exports = initializeSocket;
