const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'like_post', 
      'like_comment', 
      'like_reel',
      'comment_post', 
      'comment_reel',
      'reply_comment',
      'follow_request', 
      'follow_accept',
      'mention_post', 
      'mention_comment', 
      'mention_story',
      'tag_post',
      'new_follower',
      'new_message',
      'live_started',
      'post_reminder',
      'story_view',
      'story_reply',
      'post_from_following',
      'reel_from_following',
      'story_from_following',
      'live_from_following',
      'system_announcement',
      'content_digest'
    ],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['Post', 'Comment', 'Reel', 'Story', 'User', 'Message', 'LiveStream', 'Product', null]
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Method to mark notification as read
NotificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Index for faster queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

module.exports = mongoose.model('Notification', NotificationSchema);
