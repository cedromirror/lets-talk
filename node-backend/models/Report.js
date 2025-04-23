const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  contentType: {
    type: String,
    enum: ['post', 'reel', 'comment', 'user'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'nudity', 'violence', 'harassment', 'false_information', 'hate_speech', 'terrorism', 'self_harm', 'other'],
    required: true
  },
  details: {
    type: String,
    maxlength: 500
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  moderationNotes: {
    type: String
  },
  aiModeration: {
    performed: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    categories: {
      nudity: Number,
      violence: Number,
      harassment: Number,
      hate_speech: Number
    },
    recommendation: String
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate reports
ReportSchema.index({ contentType: 1, contentId: 1, reportedBy: 1 }, { unique: true });

// Create index for faster queries
ReportSchema.index({ status: 1 });
ReportSchema.index({ contentType: 1 });
ReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);