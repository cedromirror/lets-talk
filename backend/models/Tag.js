const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  postsCount: {
    type: Number,
    default: 0
  },
  reelsCount: {
    type: Number,
    default: 0
  },
  storiesCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create indexes for better performance
tagSchema.index({ name: 1 });
tagSchema.index({ postsCount: -1 });

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
