const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const LiveStream = require('../models/LiveStream');
const Notification = require('../models/Notification');

// Initialize socket.io
const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: function(origin, callback) {
        // Allow all origins in development
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    // Add ping configuration for better connection stability
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000  // 25 seconds
  });

  // Create a namespace for public connections (no auth required)
  const publicNamespace = '/public';
  const publicIo = io.of(publicNamespace);

  console.log(`Setting up public socket namespace: ${publicNamespace}`);

  // Set up public namespace
  publicIo.on('connection', (socket) => {
    console.log(`Public socket connected: ${socket.id}`);

    // Handle ping event for connection testing
    socket.on('ping', () => {
      console.log(`Received ping from ${socket.id}, sending pong`);
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle health check
    socket.on('health', () => {
      console.log(`Received health check from ${socket.id}`);
      socket.emit('health:response', {
        status: 'ok',
        timestamp: Date.now(),
        socketId: socket.id
      });
    });

    socket.on('disconnect', () => {
      console.log(`Public socket disconnected: ${socket.id}`);
    });
  });

  // Log available namespaces
  console.log('Available socket namespaces:', Object.keys(io._nsps).join(', '));

  // Authentication middleware for authenticated namespace
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
        // Instead of rejecting, redirect to public namespace
        return next(new Error('Authentication error: Token not provided. Use /public namespace for unauthenticated connections.'));
      }

      console.log('Socket token verification:', token.substring(0, 10) + '...');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Set user in socket
      socket.user = user;

      // Update user's online status
      await User.findByIdAndUpdate(user._id, {
        isOnline: true,
        lastActive: new Date()
      });

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection event
  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Join user's personal room
    socket.join(`user:${socket.user._id}`);

    // Emit user online status to followers
    io.to(`user:${socket.user._id}:followers`).emit('user:status', {
      userId: socket.user._id,
      isOnline: true
    });

    // Join user's conversations
    try {
      const conversations = await Conversation.find({
        participants: socket.user._id
      });

      conversations.forEach(conversation => {
        socket.join(`conversation:${conversation._id}`);
      });
    } catch (error) {
      console.error('Error joining conversation rooms:', error);
    }

    // Handle message events
    setupMessageHandlers(io, socket);

    // Handle notification events
    setupNotificationHandlers(io, socket);

    // Handle livestream events
    setupLivestreamHandlers(io, socket);

    // Handle typing events
    setupTypingHandlers(io, socket);

    // Handle user status events
    setupUserStatusHandlers(io, socket);

    // Disconnect event
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);

      // Update user's online status
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastActive: new Date()
      });

      // Emit user offline status to followers
      io.to(`user:${socket.user._id}:followers`).emit('user:status', {
        userId: socket.user._id,
        isOnline: false
      });
    });
  });

  return io;
};

// Message handlers
const setupMessageHandlers = (io, socket) => {
  // Send message
  socket.on('message:send', async (data) => {
    try {
      const { conversationId, text, media, replyTo } = data;

      // Check if conversation exists and user is a participant
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      if (!conversation.participants.includes(socket.user._id)) {
        return socket.emit('error', { message: 'Not authorized to send messages in this conversation' });
      }

      // Create new message
      const newMessage = new Message({
        conversation: conversationId,
        sender: socket.user._id,
        text,
        media,
        replyTo
      });

      await newMessage.save();

      // Populate sender and replyTo
      await newMessage.populate('sender', 'username avatar');

      if (replyTo) {
        await newMessage.populate('replyTo');
      }

      // Update conversation's last message
      conversation.lastMessage = newMessage._id;

      // Update unread count for all participants except sender
      conversation.participants.forEach(participant => {
        if (participant.toString() !== socket.user._id.toString()) {
          const currentCount = conversation.unreadCount.get(participant.toString()) || 0;
          conversation.unreadCount.set(participant.toString(), currentCount + 1);
        }
      });

      await conversation.save();

      // Emit message to all participants in the conversation
      io.to(`conversation:${conversationId}`).emit('message:new', newMessage);

      // Send notification to all participants except sender
      conversation.participants.forEach(async (participant) => {
        if (participant.toString() !== socket.user._id.toString()) {
          // Create notification
          const notification = new Notification({
            recipient: participant,
            sender: socket.user._id,
            type: 'new_message',
            content: {
              message: text ? text.substring(0, 50) : 'Sent a media message',
              conversationId
            },
            targetId: newMessage._id,
            targetModel: 'Message'
          });

          await notification.save();

          // Emit notification to recipient
          io.to(`user:${participant}`).emit('notification:new', notification);
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('message:read', async (data) => {
    try {
      const { conversationId } = data;

      // Check if conversation exists and user is a participant
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      if (!conversation.participants.includes(socket.user._id)) {
        return socket.emit('error', { message: 'Not authorized to access this conversation' });
      }

      // Update unread count for the user
      conversation.unreadCount.set(socket.user._id.toString(), 0);
      await conversation.save();

      // Mark all messages as read by the user
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.user._id },
          'readBy.user': { $ne: socket.user._id }
        },
        {
          $push: {
            readBy: {
              user: socket.user._id,
              readAt: new Date()
            }
          }
        }
      );

      // Emit read status to all participants
      io.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        userId: socket.user._id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Delete message
  socket.on('message:delete', async (data) => {
    try {
      const { messageId } = data;

      // Find message
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      // Check if user is the sender
      if (message.sender.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Not authorized to delete this message' });
      }

      // Mark message as deleted
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      // Emit delete event to all participants
      io.to(`conversation:${message.conversation}`).emit('message:deleted', {
        messageId,
        conversationId: message.conversation
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Edit message
  socket.on('message:edit', async (data) => {
    try {
      const { messageId, text } = data;

      // Find message
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      // Check if user is the sender
      if (message.sender.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Not authorized to edit this message' });
      }

      // Check if message is deleted
      if (message.isDeleted) {
        return socket.emit('error', { message: 'Cannot edit a deleted message' });
      }

      // Save original text to edit history
      if (!message.isEdited) {
        message.editHistory = [{
          text: message.text,
          editedAt: new Date()
        }];
      } else {
        message.editHistory.push({
          text: message.text,
          editedAt: new Date()
        });
      }

      // Update message
      message.text = text;
      message.isEdited = true;
      await message.save();

      // Emit edit event to all participants
      io.to(`conversation:${message.conversation}`).emit('message:edited', {
        messageId,
        conversationId: message.conversation,
        text,
        isEdited: true
      });
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // React to message
  socket.on('message:react', async (data) => {
    try {
      const { messageId, emoji } = data;

      // Find message
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      // Check if user has already reacted
      const existingReaction = message.reactions.find(
        reaction => reaction.user.toString() === socket.user._id.toString()
      );

      if (existingReaction) {
        // Update existing reaction
        existingReaction.emoji = emoji;
      } else {
        // Add new reaction
        message.reactions.push({
          user: socket.user._id,
          emoji
        });
      }

      await message.save();

      // Emit reaction event to all participants
      io.to(`conversation:${message.conversation}`).emit('message:reaction', {
        messageId,
        conversationId: message.conversation,
        userId: socket.user._id,
        emoji
      });
    } catch (error) {
      console.error('Error reacting to message:', error);
      socket.emit('error', { message: 'Failed to react to message' });
    }
  });
};

// Notification handlers
const setupNotificationHandlers = (io, socket) => {
  // Mark notification as read
  socket.on('notification:read', async (data) => {
    try {
      const { notificationId } = data;

      // Find notification
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return socket.emit('error', { message: 'Notification not found' });
      }

      // Check if user is the recipient
      if (notification.recipient.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Not authorized to mark this notification as read' });
      }

      // Mark as read
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      // Emit read status
      socket.emit('notification:marked_read', {
        notificationId
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  });

  // Mark all notifications as read
  socket.on('notification:read_all', async () => {
    try {
      // Update all unread notifications for the user
      await Notification.updateMany(
        {
          recipient: socket.user._id,
          read: false
        },
        {
          read: true,
          readAt: new Date()
        }
      );

      // Emit read all status
      socket.emit('notification:all_read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      socket.emit('error', { message: 'Failed to mark all notifications as read' });
    }
  });
};

// Livestream handlers
const setupLivestreamHandlers = (io, socket) => {
  // Join livestream
  socket.on('livestream:join', async (data) => {
    try {
      const { streamId } = data;

      // Find livestream
      const livestream = await LiveStream.findById(streamId)
        .populate('user', 'username avatar');

      if (!livestream) {
        return socket.emit('error', { message: 'Livestream not found' });
      }

      // Check if livestream is private and user is allowed
      if (livestream.isPrivate && !livestream.canUserView(socket.user._id)) {
        return socket.emit('error', { message: 'Not authorized to view this livestream' });
      }

      // Check if user is banned
      if (livestream.isUserBanned(socket.user._id)) {
        return socket.emit('error', { message: 'You have been banned from this livestream' });
      }

      // Join livestream room
      socket.join(`livestream:${streamId}`);

      // Add user to viewers if not already there
      const existingViewer = livestream.viewers.find(
        viewer => viewer.user.toString() === socket.user._id.toString()
      );

      if (!existingViewer) {
        livestream.viewers.push({
          user: socket.user._id,
          joinedAt: new Date()
        });

        // Increment current viewer count
        livestream.currentViewerCount += 1;

        // Update peak viewer count if needed
        if (livestream.currentViewerCount > livestream.peakViewerCount) {
          livestream.peakViewerCount = livestream.currentViewerCount;
        }

        // Increment total unique viewers
        livestream.totalUniqueViewers += 1;
      } else if (existingViewer.leftAt) {
        // User is rejoining
        existingViewer.joinedAt = new Date();
        existingViewer.leftAt = undefined;

        // Increment current viewer count
        livestream.currentViewerCount += 1;

        // Update peak viewer count if needed
        if (livestream.currentViewerCount > livestream.peakViewerCount) {
          livestream.peakViewerCount = livestream.currentViewerCount;
        }
      }

      await livestream.save();

      // Emit join event to all viewers
      io.to(`livestream:${streamId}`).emit('livestream:viewer_joined', {
        streamId,
        user: {
          _id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar
        },
        viewerCount: livestream.currentViewerCount
      });

      // Send livestream data to the user
      socket.emit('livestream:data', livestream);
    } catch (error) {
      console.error('Error joining livestream:', error);
      socket.emit('error', { message: 'Failed to join livestream' });
    }
  });

  // Leave livestream
  socket.on('livestream:leave', async (data) => {
    try {
      const { streamId } = data;

      // Find livestream
      const livestream = await LiveStream.findById(streamId);

      if (!livestream) {
        return;
      }

      // Leave livestream room
      socket.leave(`livestream:${streamId}`);

      // Update viewer data
      const viewer = livestream.viewers.find(
        viewer => viewer.user.toString() === socket.user._id.toString()
      );

      if (viewer && !viewer.leftAt) {
        viewer.leftAt = new Date();

        // Decrement current viewer count
        livestream.currentViewerCount = Math.max(0, livestream.currentViewerCount - 1);

        await livestream.save();

        // Emit leave event to all viewers
        io.to(`livestream:${streamId}`).emit('livestream:viewer_left', {
          streamId,
          userId: socket.user._id,
          viewerCount: livestream.currentViewerCount
        });
      }
    } catch (error) {
      console.error('Error leaving livestream:', error);
    }
  });

  // Send comment in livestream
  socket.on('livestream:comment', async (data) => {
    try {
      const { streamId, text } = data;

      // Find livestream
      const livestream = await LiveStream.findById(streamId);

      if (!livestream) {
        return socket.emit('error', { message: 'Livestream not found' });
      }

      // Check if comments are allowed
      if (!livestream.settings.allowComments) {
        return socket.emit('error', { message: 'Comments are disabled for this livestream' });
      }

      // Check if user is banned
      if (livestream.isUserBanned(socket.user._id)) {
        return socket.emit('error', { message: 'You have been banned from this livestream' });
      }

      // Add comment
      const comment = {
        user: socket.user._id,
        text,
        createdAt: new Date()
      };

      livestream.comments.push(comment);
      await livestream.save();

      // Populate user data
      const populatedComment = {
        ...comment,
        user: {
          _id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar
        }
      };

      // Emit comment to all viewers
      io.to(`livestream:${streamId}`).emit('livestream:new_comment', {
        streamId,
        comment: populatedComment
      });
    } catch (error) {
      console.error('Error sending livestream comment:', error);
      socket.emit('error', { message: 'Failed to send comment' });
    }
  });

  // Send reaction in livestream
  socket.on('livestream:react', async (data) => {
    try {
      const { streamId, type } = data;

      // Find livestream
      const livestream = await LiveStream.findById(streamId);

      if (!livestream) {
        return socket.emit('error', { message: 'Livestream not found' });
      }

      // Check if reactions are allowed
      if (!livestream.settings.allowReactions) {
        return socket.emit('error', { message: 'Reactions are disabled for this livestream' });
      }

      // Check if user is banned
      if (livestream.isUserBanned(socket.user._id)) {
        return socket.emit('error', { message: 'You have been banned from this livestream' });
      }

      // Add reaction
      const reaction = {
        user: socket.user._id,
        type,
        createdAt: new Date()
      };

      livestream.reactions.push(reaction);
      await livestream.save();

      // Emit reaction to all viewers
      io.to(`livestream:${streamId}`).emit('livestream:new_reaction', {
        streamId,
        reaction: {
          ...reaction,
          user: {
            _id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
        }
      });
    } catch (error) {
      console.error('Error sending livestream reaction:', error);
      socket.emit('error', { message: 'Failed to send reaction' });
    }
  });

  // End livestream (for stream owner)
  socket.on('livestream:end', async (data) => {
    try {
      const { streamId } = data;

      // Find livestream
      const livestream = await LiveStream.findById(streamId);

      if (!livestream) {
        return socket.emit('error', { message: 'Livestream not found' });
      }

      // Check if user is the stream owner
      if (livestream.user.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Not authorized to end this livestream' });
      }

      // Update livestream status
      livestream.status = 'ended';
      livestream.endedAt = new Date();

      // Calculate duration
      if (livestream.startedAt) {
        const durationMs = new Date() - livestream.startedAt;
        livestream.duration = Math.floor(durationMs / 1000); // Convert to seconds
      }

      await livestream.save();

      // Emit end event to all viewers
      io.to(`livestream:${streamId}`).emit('livestream:ended', {
        streamId,
        endedAt: livestream.endedAt
      });
    } catch (error) {
      console.error('Error ending livestream:', error);
      socket.emit('error', { message: 'Failed to end livestream' });
    }
  });
};

// Typing handlers
const setupTypingHandlers = (io, socket) => {
  // User starts typing
  socket.on('typing:start', async (data) => {
    try {
      const { conversationId } = data;

      // Check if conversation exists and user is a participant
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return;
      }

      if (!conversation.participants.includes(socket.user._id)) {
        return;
      }

      // Add user to typing users if not already there
      if (!conversation.typingUsers.includes(socket.user._id)) {
        conversation.typingUsers.push(socket.user._id);
        await conversation.save();

        // Emit typing start event to all participants except the sender
        socket.to(`conversation:${conversationId}`).emit('typing:started', {
          conversationId,
          userId: socket.user._id,
          username: socket.user.username
        });
      }
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  // User stops typing
  socket.on('typing:stop', async (data) => {
    try {
      const { conversationId } = data;

      // Check if conversation exists
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return;
      }

      // Remove user from typing users
      conversation.typingUsers = conversation.typingUsers.filter(
        userId => userId.toString() !== socket.user._id.toString()
      );

      await conversation.save();

      // Emit typing stop event to all participants except the sender
      socket.to(`conversation:${conversationId}`).emit('typing:stopped', {
        conversationId,
        userId: socket.user._id
      });
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  });
};

// User status handlers
const setupUserStatusHandlers = (io, socket) => {
  // Get online status of users
  socket.on('user:get_status', async (data) => {
    try {
      const { userIds } = data;

      // Get users
      const users = await User.find(
        { _id: { $in: userIds } },
        'isOnline lastActive'
      );

      // Create status map
      const statusMap = {};

      users.forEach(user => {
        statusMap[user._id] = {
          isOnline: user.isOnline,
          lastActive: user.lastActive
        };
      });

      // Emit status to the user
      socket.emit('user:status_list', statusMap);
    } catch (error) {
      console.error('Error getting user status:', error);
      socket.emit('error', { message: 'Failed to get user status' });
    }
  });

  // Subscribe to user status updates
  socket.on('user:subscribe_status', async (data) => {
    try {
      const { userId } = data;

      // Join user's followers room
      socket.join(`user:${userId}:followers`);
    } catch (error) {
      console.error('Error subscribing to user status:', error);
    }
  });

  // Unsubscribe from user status updates
  socket.on('user:unsubscribe_status', async (data) => {
    try {
      const { userId } = data;

      // Leave user's followers room
      socket.leave(`user:${userId}:followers`);
    } catch (error) {
      console.error('Error unsubscribing from user status:', error);
    }
  });

  // Handle follow status change
  socket.on('user:follow_status_change', async (data) => {
    try {
      const { targetUserId, status, followerCount } = data;

      console.log(`User ${socket.user.username} ${status === 'following' ? 'followed' : 'unfollowed'} user ${targetUserId}`);

      // Broadcast the follow status change to all connected clients
      // This will update follower counts in real-time across all open profiles
      io.emit('user:follow_status_change', {
        targetUserId,
        status,
        followerCount,
        follower: {
          _id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar
        }
      });
    } catch (error) {
      console.error('Error handling follow status change:', error);
    }
  });
};

module.exports = initializeSocket;
