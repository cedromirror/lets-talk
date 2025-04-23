const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file', '']
    },
    url: String,
    thumbnail: String,
    fileName: String,
    fileSize: Number,
    duration: Number
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isForwarded: {
    type: Boolean,
    default: false
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    text: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  isUnsent: {
    type: Boolean,
    default: false
  },
  unsentAt: {
    type: Date
  },
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure a message has either text or media
MessageSchema.pre('save', function(next) {
  // Skip validation for deleted or unsent messages
  if (this.isDeleted || this.isUnsent) {
    return next();
  }

  // Check if message has text content
  const hasText = this.text && this.text.trim().length > 0;

  // Check if message has media content
  const hasMedia = this.media && this.media.url && this.media.url.trim().length > 0;

  // Require either text or media
  if (!hasText && !hasMedia) {
    return next(new Error('Message must have either text or media'));
  }

  // If text is empty but we have media, set text to null
  if (!hasText && hasMedia) {
    this.text = null;
  }

  next();
});

// Virtual for reaction count
MessageSchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Virtual for read count
MessageSchema.virtual('readCount').get(function() {
  return this.readBy.length;
});

// Method to check if a user has read this message
MessageSchema.methods.isReadByUser = function(userId) {
  return this.readBy.some(reader => reader.user.toString() === userId.toString());
};

// Method to check if a user has reacted to this message
MessageSchema.methods.hasReactionFromUser = function(userId) {
  return this.reactions.some(reaction => reaction.user.toString() === userId.toString());
};

// Method to get a user's reaction
MessageSchema.methods.getUserReaction = function(userId) {
  const reaction = this.reactions.find(reaction => reaction.user.toString() === userId.toString());
  return reaction ? reaction.emoji : null;
};

// Index for faster queries
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', MessageSchema);
