const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email
          ? 'Email already in use'
          : 'Username already taken'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName
    });

    // Generate token
    const token = user.getSignedJwtToken();

    // Get user data without password
    const userData = user.getPublicProfile();

    res.status(201).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};



// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('Login attempt received');
    console.log('Request body:', req.body);
    const { email, password } = req.body;
    console.log('Login attempt with email:', email);

    // Validate email & password
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    console.log('Searching for user with email:', email);
    let user = await User.findOne({ email }).select('+password');

    // If user not found, try finding by username instead
    if (!user) {
      console.log('User not found by email, trying username');
      user = await User.findOne({ username: email }).select('+password');
    }

    // No test user creation - using real database only

    if (!user) {
      console.log('Login failed: User not found with email or username:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('User found, checking password for user:', user.username);
    // Check if password matches
    if (!password) {
      console.log('Login failed: Password not provided for user:', user.username);
      return res.status(401).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Ensure password is a string
    const passwordString = String(password);

    // Compare passwords
    const isMatch = await user.matchPassword(passwordString);

    if (!isMatch) {
      console.log('Login failed: Password does not match for user:', user.username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Password matched, generating token');
    // Generate token
    const token = user.getSignedJwtToken();
    console.log('Token generated successfully');

    // Get user data without password
    const userData = user.getPublicProfile();

    console.log('Updating user last active status');
    // Update last active without triggering validation
    await User.findByIdAndUpdate(user._id, {
      lastActive: new Date(),
      isOnline: true
    });

    console.log('Login successful for user:', user.username);
    console.log('Sending response with token and user data');

    // Send response
    return res.status(200).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Update user's online status
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastActive: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    console.log('getMe controller called');
    console.log('User ID from request:', req.user ? req.user._id : 'No user in request');

    // Check if req.user exists
    if (!req.user || !req.user._id) {
      console.error('No user found in request object');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findById(req.user._id);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user data
    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      bio,
      website,
      phone,
      gender,
      isPrivate
    } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    // Create update object with only the fields that are provided
    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio;
    if (website !== undefined) updateFields.website = website;
    if (phone !== undefined) updateFields.phone = phone;
    if (gender !== undefined) updateFields.gender = gender;
    if (isPrivate !== undefined) updateFields.isPrivate = isPrivate;

    // Handle avatar if it's in the request file
    if (req.file && req.file.cloudinaryUrl) {
      updateFields.avatar = req.file.cloudinaryUrl;
    }

    // Update user with findByIdAndUpdate to avoid validation issues
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateFields,
      { new: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password without triggering validation
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update avatar
// @route   PUT /api/auth/avatar
// @access  Private
exports.updateAvatar = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file || !req.file.cloudinaryUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.cloudinaryUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      avatar: user.avatar,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update cover image
// @route   PUT /api/auth/cover-image
// @access  Private
exports.updateCoverImage = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file || !req.file.cloudinaryUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Update user cover image
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { coverImage: req.file.cloudinaryUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      coverImage: user.coverImage,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update cover image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    console.log('Refresh token request received');

    // Get token from request
    let token;
    if (req.headers.authorization) {
      if (req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('Token extracted from Bearer format in Authorization header');
      } else {
        token = req.headers.authorization;
        console.log('Token found in Authorization header without Bearer prefix');
      }
    } else if (req.body && req.body.token) {
      // Also check request body for token
      token = req.body.token;
      console.log('Token found in request body');
    }

    if (!token) {
      console.log('No token provided in refresh request');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    try {
      let decoded;
      // Normal token verification - even if expired
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'lets_talk_secure_jwt_secret_key_2024', {
        ignoreExpiration: true // Allow expired tokens for refresh
      });

      // Get user from token
      const user = await User.findById(decoded.id).select('+password');

      if (!user) {
        console.log('User not found for token refresh');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate new token
      const newToken = user.getSignedJwtToken();

      console.log('Token refreshed successfully for user:', user.username || user.email);
      res.status(200).json({
        success: true,
        token: newToken,
        user: user.getPublicProfile()
      });
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};



// @desc    Verify token
// @route   POST /api/auth/verify-token
// @access  Public
// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    console.log('Forgot password request received');
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If a user with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time (1 hour)
    const resetPasswordExpire = Date.now() + 3600000;

    // Update user with reset token info
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken,
      resetPasswordExpire
    });

    // In a real application, you would send an email with the reset link
    // For this demo, we'll just return the token
    console.log(`Reset token generated for user: ${user.email}`);
    console.log(`Reset token: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'If a user with that email exists, a password reset link has been sent',
      // Only include token in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Validate reset token
// @route   POST /api/auth/validate-reset-token
// @access  Public
exports.validateResetToken = async (req, res) => {
  try {
    console.log('Validate reset token request received');
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and valid expire time
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid'
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    console.log('Reset password request received');
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and valid expire time
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password and clear reset token fields
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined
    });

    console.log(`Password reset successful for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    console.log('Verify token request received');

    // Get token from request body or authorization header
    let token = req.body.token;

    if (!token && req.headers.authorization) {
      if (req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('Token extracted from Bearer format in Authorization header');
      } else {
        token = req.headers.authorization;
        console.log('Token found in Authorization header without Bearer prefix');
      }
    }

    if (!token) {
      console.log('No token provided in verify request');
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        isValid: false
      });
    }

    try {
      let decoded;
      // Normal token verification
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'lets_talk_secure_jwt_secret_key_2024');

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        console.log('User not found for token verification');
        return res.status(401).json({
          success: false,
          message: 'User not found',
          isValid: false
        });
      }

      console.log('Token verified successfully for user:', user.username || user.email);
      res.status(200).json({
        success: true,
        isValid: true,
        user: user.getPublicProfile()
      });
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      return res.status(200).json({
        success: true,
        isValid: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      isValid: false
    });
  }
};
