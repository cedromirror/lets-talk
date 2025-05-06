const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  media: {
    type: String,
    required: [true, 'Please provide media content']
  },
  optimizedMedia: {
    type: String,
    default: null
  },
  lowQualityMedia: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [500, 'Caption cannot exceed 500 characters']
  },
  location: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    default: 15 // Default duration in seconds
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters']
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
  stickers: [{
    type: {
      type: String,
      enum: ['emoji', 'gif', 'poll', 'question', 'countdown', 'location', 'mention', 'hashtag', 'slider']
    },
    content: mongoose.Schema.Types.Mixed,
    position: {
      x: Number,
      y: Number
    },
    scale: {
      type: Number,
      default: 1
    },
    rotation: {
      type: Number,
      default: 0
    }
  }],
  isHighlight: {
    type: Boolean,
    default: false
  },
  highlightGroup: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for view count
StorySchema.virtual('viewCount').get(function() {
  return this.viewers.length;
});

// Virtual for reply count
StorySchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to check if a user has viewed this story
StorySchema.methods.isViewedByUser = function(userId) {
  return this.viewers.some(viewer => viewer.user.toString() === userId.toString());
};

// Check if story is expired
StorySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Index for faster queries
StorySchema.index({ user: 1, createdAt: -1 });
StorySchema.index({ expiresAt: 1 }); // For cleanup of expired stories

module.exports = mongoose.model('Story', StorySchema);
