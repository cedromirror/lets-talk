const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
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
  location: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Please provide an image']
  },
  optimizedImage: {
    type: String,
    default: null
  },
  lowQualityImage: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
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
PostSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
PostSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Method to check if a user has liked this post
PostSchema.methods.isLikedByUser = function(userId) {
  return this.likes.some(like => like.toString() === userId.toString());
};

// Index for faster queries
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });

module.exports = mongoose.model('Post', PostSchema);
