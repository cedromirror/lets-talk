const mongoose = require('mongoose');

const LiveStreamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  streamKey: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'failed'],
    default: 'scheduled'
  },
  scheduledFor: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0 // Duration in seconds
  },
  thumbnail: {
    type: String
  },
  recordingUrl: {
    type: String
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  allowedViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date
    }
  }],
  peakViewerCount: {
    type: Number,
    default: 0
  },
  currentViewerCount: {
    type: Number,
    default: 0
  },
  totalUniqueViewers: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowReactions: {
      type: Boolean,
      default: true
    },
    moderators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    bannedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comment count
LiveStreamSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for reaction count
LiveStreamSchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Method to check if a user is allowed to view this stream
LiveStreamSchema.methods.canUserView = function(userId) {
  if (!this.isPrivate) return true;
  return this.allowedViewers.some(viewer => viewer.toString() === userId.toString());
};

// Method to check if a user is a moderator
LiveStreamSchema.methods.isUserModerator = function(userId) {
  return this.settings.moderators.some(mod => mod.toString() === userId.toString());
};

// Method to check if a user is banned
LiveStreamSchema.methods.isUserBanned = function(userId) {
  return this.settings.bannedUsers.some(user => user.toString() === userId.toString());
};

// Index for faster queries
LiveStreamSchema.index({ user: 1, createdAt: -1 });
LiveStreamSchema.index({ status: 1 });
LiveStreamSchema.index({ scheduledFor: 1 });

module.exports = mongoose.model('LiveStream', LiveStreamSchema);
