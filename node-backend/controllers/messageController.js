const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createError } = require('../utils/error');

/**
 * Get all conversations for the current user
 */
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate({
        path: 'participants',
        select: '_id username fullName avatar isOnline lastSeen'
      })
      .populate({
        path: 'lastMessage',
        select: '_id text media createdAt sender readBy',
        populate: {
          path: 'sender',
          select: '_id username avatar'
        }
      })
      .sort({ updatedAt: -1 });

    // Add unread count for each conversation
    const conversationsWithUnreadCount = conversations.map(conversation => {
      const unreadCount = conversation.getUnreadCountForUser(userId);
      return {
        ...conversation.toObject(),
        unreadCount
      };
    });

    res.status(200).json(conversationsWithUnreadCount);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a conversation by ID
 */
exports.getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id)
      .populate({
        path: 'participants',
        select: '_id username fullName avatar isOnline lastSeen'
      })
      .populate({
        path: 'lastMessage',
        select: '_id text media createdAt sender readBy',
        populate: {
          path: 'sender',
          select: '_id username avatar'
        }
      });

    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    // Check if user is a participant
    if (!conversation.hasParticipant(userId)) {
      return next(createError(403, 'You are not a participant in this conversation'));
    }

    // Add unread count
    const unreadCount = conversation.getUnreadCountForUser(userId);
    const conversationWithUnreadCount = {
      ...conversation.toObject(),
      unreadCount
    };

    res.status(200).json(conversationWithUnreadCount);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new conversation
 */
exports.createConversation = async (req, res, next) => {
  try {
    const { participants, isGroup, groupName, groupAvatar } = req.body;
    const userId = req.user._id;

    // Ensure participants is an array and includes the current user
    let participantIds = Array.isArray(participants) ? [...participants] : [];

    // Add current user if not already included
    if (!participantIds.includes(userId.toString())) {
      participantIds.push(userId);
    }

    // Remove duplicates
    participantIds = [...new Set(participantIds)];

    // Validate participants
    if (participantIds.length < 2) {
      return next(createError(400, 'A conversation must have at least 2 participants'));
    }

    // Check if a direct (non-group) conversation already exists between these users
    if (participantIds.length === 2 && !isGroup) {
      const existingConversation = await Conversation.findOne({
        participants: { $all: participantIds },
        isGroup: false
      })
        .populate({
          path: 'participants',
          select: '_id username fullName avatar isOnline lastSeen'
        })
        .populate({
          path: 'lastMessage',
          select: '_id text media createdAt sender readBy',
          populate: {
            path: 'sender',
            select: '_id username avatar'
          }
        });

      if (existingConversation) {
        return res.status(200).json(existingConversation);
      }
    }

    // Create new conversation
    const newConversation = new Conversation({
      participants: participantIds,
      isGroup: !!isGroup,
      groupName: isGroup ? groupName : undefined,
      groupAvatar: isGroup ? groupAvatar : undefined,
      admin: isGroup ? userId : undefined
    });

    await newConversation.save();

    // Populate the participants
    await newConversation.populate({
      path: 'participants',
      select: '_id username fullName avatar isOnline lastSeen'
    });

    res.status(201).json(newConversation);
  } catch (err) {
    next(err);
  }
};

/**
 * Get messages for a conversation
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    if (!conversation.hasParticipant(userId)) {
      return next(createError(403, 'You are not a participant in this conversation'));
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages with pagination, sorted by newest first
    const messages = await Message.find({
      conversation: id,
      isDeleted: false
    })
      .populate({
        path: 'sender',
        select: '_id username fullName avatar'
      })
      .populate({
        path: 'replyTo',
        select: '_id text media sender',
        populate: {
          path: 'sender',
          select: '_id username avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Reverse to get oldest first for client display
    const sortedMessages = messages.reverse();

    res.status(200).json(sortedMessages);
  } catch (err) {
    next(err);
  }
};

/**
 * Send a new message
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, replyTo } = req.body;
    const userId = req.user._id;
    const files = req.files;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    if (!conversation.hasParticipant(userId)) {
      return next(createError(403, 'You are not a participant in this conversation'));
    }

    // Validate that message has either text or media
    const hasText = text && text.trim().length > 0;
    const hasFiles = files && files.length > 0;

    if (!hasText && !hasFiles) {
      return next(createError(400, 'Message must have either text or media'));
    }

    // Create media object if files are attached
    let media = null;
    if (hasFiles) {
      const file = files[0];
      const fileType = file.mimetype.split('/')[0];

      // Check if file has cloudinaryUrl (from uploadToCloudinary middleware)
      const fileUrl = file.cloudinaryUrl || file.path;

      media = {
        type: fileType,
        url: fileUrl,
        fileName: file.originalname,
        fileSize: file.size
      };

      // Add thumbnail for images and videos
      if (fileType === 'image' || fileType === 'video') {
        media.thumbnail = file.cloudinaryUrl ? file.cloudinaryUrl : file.path;
      }

      console.log(`Created media object for ${fileType}: ${fileUrl}`);
    }

    // Create new message with sanitized text
    const newMessage = new Message({
      conversation: id,
      sender: userId,
      text: hasText ? text.trim() : null,
      media,
      replyTo: replyTo || null
    });

    try {
      await newMessage.save();
      console.log(`Message saved successfully with ID: ${newMessage._id}`);
    } catch (saveError) {
      console.error('Error saving message:', saveError);
      return next(createError(400, saveError.message || 'Failed to save message'));
    }

    // Update conversation's lastMessage and updatedAt
    conversation.lastMessage = newMessage._id;

    // Increment unread count for all participants except sender
    conversation.participants.forEach(participantId => {
      if (!participantId.equals(userId)) {
        const currentCount = conversation.getUnreadCountForUser(participantId);
        conversation.updateUnreadCountForUser(participantId, currentCount + 1);
      }
    });

    await conversation.save();

    // Populate sender and replyTo
    await newMessage.populate([
      {
        path: 'sender',
        select: '_id username fullName avatar'
      },
      {
        path: 'replyTo',
        select: '_id text media sender',
        populate: {
          path: 'sender',
          select: '_id username avatar'
        }
      }
    ]);

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error in sendMessage controller:', err);
    next(err);
  }
};

/**
 * Mark a conversation as read
 */
exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    if (!conversation.hasParticipant(userId)) {
      return next(createError(403, 'You are not a participant in this conversation'));
    }

    // Reset unread count for the user
    conversation.updateUnreadCountForUser(userId, 0);
    await conversation.save();

    // Mark all messages as read by this user
    await Message.updateMany(
      {
        conversation: id,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        },
        $set: { deliveryStatus: 'read' }
      }
    );

    res.status(200).json({ message: 'Conversation marked as read' });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a message
 */
exports.updateMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Find the message
    const message = await Message.findById(id);
    if (!message) {
      return next(createError(404, 'Message not found'));
    }

    // Check if user is the sender
    if (!message.sender.equals(userId)) {
      return next(createError(403, 'You can only edit your own messages'));
    }

    // Check if message is deleted
    if (message.isDeleted) {
      return next(createError(400, 'Cannot edit a deleted message'));
    }

    // Save original text to edit history
    message.editHistory.push({
      text: message.text,
      editedAt: new Date()
    });

    // Update message
    message.text = text;
    message.isEdited = true;
    await message.save();

    // Populate sender
    await message.populate({
      path: 'sender',
      select: '_id username fullName avatar'
    });

    res.status(200).json(message);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a message
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the message
    const message = await Message.findById(id);
    if (!message) {
      return next(createError(404, 'Message not found'));
    }

    // Check if user is the sender
    if (!message.sender.equals(userId)) {
      return next(createError(403, 'You can only delete your own messages'));
    }

    // Soft delete the message
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = null;
    message.media = null;
    await message.save();

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Add a reaction to a message
 */
exports.addReaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    // Validate emoji
    if (!emoji) {
      return next(createError(400, 'Emoji is required'));
    }

    // Find the message
    const message = await Message.findById(id);
    if (!message) {
      return next(createError(404, 'Message not found'));
    }

    // Check if message is deleted
    if (message.isDeleted) {
      return next(createError(400, 'Cannot react to a deleted message'));
    }

    // Check if user has already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.equals(userId) && r.emoji === emoji
    );

    if (existingReactionIndex >= 0) {
      // Remove existing reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any existing reaction from this user
      const userReactionIndex = message.reactions.findIndex(
        r => r.user.equals(userId)
      );

      if (userReactionIndex >= 0) {
        message.reactions.splice(userReactionIndex, 1);
      }

      // Add new reaction
      message.reactions.push({
        user: userId,
        emoji
      });
    }

    await message.save();

    // Populate reactions with user info
    await message.populate({
      path: 'reactions.user',
      select: '_id username avatar'
    });

    res.status(200).json(message.reactions);
  } catch (err) {
    next(err);
  }
};

/**
 * Remove a reaction from a message
 */
exports.removeReaction = async (req, res, next) => {
  try {
    const { id, emoji } = req.params;
    const userId = req.user._id;

    // Find the message
    const message = await Message.findById(id);
    if (!message) {
      return next(createError(404, 'Message not found'));
    }

    // Remove the reaction
    await Message.findByIdAndUpdate(id, {
      $pull: {
        reactions: {
          user: userId,
          emoji
        }
      }
    });

    res.status(200).json({ message: 'Reaction removed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get reactions for a message
 */
exports.getReactions = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the message
    const message = await Message.findById(id).populate({
      path: 'reactions.user',
      select: '_id username fullName avatar'
    });

    if (!message) {
      return next(createError(404, 'Message not found'));
    }

    res.status(200).json(message.reactions);
  } catch (err) {
    next(err);
  }
};

/**
 * Reply to a message
 */
exports.replyToMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, conversationId } = req.body;
    const userId = req.user._id;
    const files = req.files;

    // Find the original message
    const originalMessage = await Message.findById(id);
    if (!originalMessage) {
      return next(createError(404, 'Original message not found'));
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    if (!conversation.hasParticipant(userId)) {
      return next(createError(403, 'You are not a participant in this conversation'));
    }

    // Create media object if files are attached
    let media = null;
    if (files && files.length > 0) {
      const file = files[0];
      const fileType = file.mimetype.split('/')[0];

      media = {
        type: fileType,
        url: file.path,
        fileName: file.originalname,
        fileSize: file.size
      };

      // Add thumbnail for images and videos
      if (fileType === 'image' || fileType === 'video') {
        media.thumbnail = file.path;
      }
    }

    // Create new message as a reply
    const newMessage = new Message({
      conversation: conversationId,
      sender: userId,
      text,
      media,
      replyTo: id
    });

    await newMessage.save();

    // Update conversation's lastMessage and updatedAt
    conversation.lastMessage = newMessage._id;

    // Increment unread count for all participants except sender
    conversation.participants.forEach(participantId => {
      if (!participantId.equals(userId)) {
        const currentCount = conversation.getUnreadCountForUser(participantId);
        conversation.updateUnreadCountForUser(participantId, currentCount + 1);
      }
    });

    await conversation.save();

    // Populate sender and replyTo
    await newMessage.populate([
      {
        path: 'sender',
        select: '_id username fullName avatar'
      },
      {
        path: 'replyTo',
        select: '_id text media sender',
        populate: {
          path: 'sender',
          select: '_id username avatar'
        }
      }
    ]);

    res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
};

/**
 * Forward a message
 */
exports.forwardMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { conversationId } = req.body;
    const userId = req.user._id;

    // Find the original message
    const originalMessage = await Message.findById(id);
    if (!originalMessage) {
      return next(createError(404, 'Original message not found'));
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    if (!conversation.hasParticipant(userId)) {
      return next(createError(403, 'You are not a participant in this conversation'));
    }

    // Create new message as a forward
    const newMessage = new Message({
      conversation: conversationId,
      sender: userId,
      text: originalMessage.text,
      media: originalMessage.media,
      isForwarded: true,
      forwardedFrom: id
    });

    await newMessage.save();

    // Update conversation's lastMessage and updatedAt
    conversation.lastMessage = newMessage._id;

    // Increment unread count for all participants except sender
    conversation.participants.forEach(participantId => {
      if (!participantId.equals(userId)) {
        const currentCount = conversation.getUnreadCountForUser(participantId);
        conversation.updateUnreadCountForUser(participantId, currentCount + 1);
      }
    });

    await conversation.save();

    // Populate sender
    await newMessage.populate({
      path: 'sender',
      select: '_id username fullName avatar'
    });

    res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
};

/**
 * Search messages
 */
exports.searchMessages = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user._id;

    if (!q) {
      return next(createError(400, 'Search query is required'));
    }

    // Find conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId
    });

    const conversationIds = conversations.map(c => c._id);

    // Search messages in these conversations
    const messages = await Message.find({
      conversation: { $in: conversationIds },
      text: { $regex: q, $options: 'i' },
      isDeleted: false
    })
      .populate({
        path: 'sender',
        select: '_id username fullName avatar'
      })
      .populate({
        path: 'conversation',
        select: '_id participants isGroup groupName',
        populate: {
          path: 'participants',
          select: '_id username avatar'
        }
      })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a conversation
 */
exports.updateConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { groupName, groupAvatar } = req.body;
    const userId = req.user._id;

    // Find the conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    // Check if user is a participant
    if (!conversation.hasParticipant(userId)) {
      return next(createError(403, 'You are not a participant in this conversation'));
    }

    // Check if conversation is a group
    if (!conversation.isGroup) {
      return next(createError(400, 'Cannot update a non-group conversation'));
    }

    // Check if user is admin (for group conversations)
    if (conversation.admin && !conversation.admin.equals(userId)) {
      return next(createError(403, 'Only the group admin can update the conversation'));
    }

    // Update conversation
    if (groupName) conversation.groupName = groupName;
    if (groupAvatar) conversation.groupAvatar = groupAvatar;

    await conversation.save();

    // Populate participants
    await conversation.populate({
      path: 'participants',
      select: '_id username fullName avatar isOnline lastSeen'
    });

    res.status(200).json(conversation);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a conversation
 */
exports.deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    // Check if user is a participant
    if (!conversation.hasParticipant(userId)) {
      return next(createError(403, 'You are not a participant in this conversation'));
    }

    // For group conversations, only admin can delete
    if (conversation.isGroup && conversation.admin && !conversation.admin.equals(userId)) {
      return next(createError(403, 'Only the group admin can delete the conversation'));
    }

    // Delete all messages in the conversation
    await Message.updateMany(
      { conversation: id },
      { isDeleted: true, deletedAt: new Date() }
    );

    // Delete the conversation
    await Conversation.findByIdAndDelete(id);

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = exports;
