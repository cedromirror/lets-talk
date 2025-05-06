const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorVerified: {
    type: Boolean,
    default: false
  },
  fullName: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [150, 'Bio cannot exceed 150 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isBusinessAccount: {
    type: Boolean,
    default: false
  },
  businessCategory: {
    type: String,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingFollowRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  savedReels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel'
  }],
  collections: [{
    name: String,
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }]
  }],
  notifications: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    liveNotifications: { type: Boolean, default: true },
    postNotifications: { type: Boolean, default: true },
    storyNotifications: { type: Boolean, default: true },
    mentionNotifications: { type: Boolean, default: true },
    tagNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    soundNotifications: { type: Boolean, default: true }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    // Basic validation
    if (!enteredPassword || !this.password) {
      console.error('Missing password data for comparison');
      return false;
    }

    // Ensure password is a string
    const passwordString = String(enteredPassword);

    // Compare passwords
    const isMatch = await bcrypt.compare(passwordString, this.password);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function() {
  try {
    // Create payload with essential user data
    const payload = {
      id: this._id,
      username: this.username,
      role: this.role || 'user',
      iat: Math.floor(Date.now() / 1000) // Issued at time
    };

    // Use environment variable with secure fallback
    const secret = process.env.JWT_SECRET || 'lets_talk_secure_jwt_secret_key_2024';
    const expiry = process.env.JWT_EXPIRE || '30d';

    // Generate token
    const token = jwt.sign(
      payload,
      secret,
      { expiresIn: expiry }
    );

    return token;
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// Get user profile (public data)
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

// No mock user handling - use real users only

// Get follower count
UserSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Get following count
UserSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

module.exports = mongoose.model('User', UserSchema);
