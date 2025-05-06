const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true
  },
  groupAvatar: {
    type: String
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  typingUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  theme: {
    type: String,
    default: 'default'
  },
  emoji: {
    type: String,
    default: '❤️'
  },
  isArchived: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  isMuted: {
    type: Map,
    of: Boolean,
    default: new Map()
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for participant count
ConversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to check if a user is a participant
ConversationSchema.methods.hasParticipant = function(userId) {
  return this.participants.some(participant => participant.toString() === userId.toString());
};

// Method to get unread count for a user
ConversationSchema.methods.getUnreadCountForUser = function(userId) {
  const userIdStr = userId.toString();
  return this.unreadCount.has(userIdStr) ? this.unreadCount.get(userIdStr) : 0;
};

// Method to update unread count for a user
ConversationSchema.methods.updateUnreadCountForUser = function(userId, count) {
  const userIdStr = userId.toString();
  this.unreadCount.set(userIdStr, count);
};

// Method to check if conversation is archived for a user
ConversationSchema.methods.isArchivedForUser = function(userId) {
  const userIdStr = userId.toString();
  return this.isArchived.has(userIdStr) ? this.isArchived.get(userIdStr) : false;
};

// Method to check if conversation is muted for a user
ConversationSchema.methods.isMutedForUser = function(userId) {
  const userIdStr = userId.toString();
  return this.isMuted.has(userIdStr) ? this.isMuted.get(userIdStr) : false;
};

// Index for faster queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
