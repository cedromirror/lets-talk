const mongoose = require('mongoose');

const ReelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [2200, 'Caption cannot exceed 2200 characters']
  },
  video: {
    type: String,
    required: [true, 'Please provide a video']
  },
  optimizedVideo: {
    type: String,
    default: null
  },
  lowQualityVideo: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String
  },
  audio: {
    original: {
      type: Boolean,
      default: true
    },
    name: String,
    artist: String,
    audioUrl: String
  },
  duration: {
    type: Number,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  hideLikes: {
    type: Boolean,
    default: false
  },
  hideComments: {
    type: Boolean,
    default: false
  },
  hideViewCount: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    caption: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
ReelSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
ReelSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Method to check if a user has liked this reel
ReelSchema.methods.isLikedByUser = function(userId) {
  return this.likes.some(like => like.toString() === userId.toString());
};

// Index for faster queries
ReelSchema.index({ user: 1, createdAt: -1 });
ReelSchema.index({ hashtags: 1 });
ReelSchema.index({ views: -1 }); // For trending reels

module.exports = mongoose.model('Reel', ReelSchema);
