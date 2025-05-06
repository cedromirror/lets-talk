const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token and set req.user
exports.protect = async (req, res, next) => {
  let token;

  console.log('Auth middleware checking authorization');
  console.log('Request path:', req.originalUrl);

  // Get token from Authorization header
  if (req.headers.authorization) {
    console.log('Authorization header found');
    // Don't log the full token for security reasons
    console.log('Authorization header type:', typeof req.headers.authorization);
    console.log('Authorization header length:', req.headers.authorization.length);

    // Check if it starts with 'Bearer '
    if (req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Authorization header with Bearer prefix');
      console.log('Extracted token:', token);
      console.log('Token length:', token ? token.length : 0);

      // Check if token is empty or undefined after extraction
      if (!token) {
        console.error('Empty token after Bearer prefix extraction');
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
          error: 'empty_token'
        });
      }
    } else {
      // If Authorization header exists but doesn't start with 'Bearer'
      token = req.headers.authorization;
      console.log('Token found in Authorization header without Bearer prefix');
      console.log('Raw token:', token);
      console.log('Token length:', token ? token.length : 0);
    }
  } else if (req.cookies && req.cookies.token) {
    // Also check cookies for token
    token = req.cookies.token;
    console.log('Token found in cookies');
  } else if (req.body && req.body.token) {
    // Also check request body for token
    token = req.body.token;
    console.log('Token found in request body');
  }

  // Check if token exists
  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: 'no_token'
    });
  }

  try {
    console.log('Verifying token');

    // Check if token is a valid JWT format (base64url.base64url.base64url)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Token does not have 3 parts (not a valid JWT format)');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token format',
        error: 'invalid_token_format'
      });
    }

    console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
    console.log('Token parts:', tokenParts.length);

    // Normal token verification
    let decoded = jwt.verify(token, process.env.JWT_SECRET || 'lets_talk_secure_jwt_secret_key_2024');
    console.log('Token verified successfully for user ID:', decoded.id);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('User not found for token with ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'user_not_found'
      });
    }

    console.log('User authenticated:', user.username);

    // Update last active timestamp
    user.lastActive = new Date();
    try {
      await User.findByIdAndUpdate(user._id, { lastActive: new Date() });
    } catch (updateError) {
      // Don't fail the request if we can't update the last active timestamp
      console.warn('Failed to update last active timestamp:', updateError.message);
    }

    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    // Provide more specific error messages
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'invalid_token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'token_expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: 'auth_failed'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is the owner of a resource
exports.isOwner = (model, paramIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramIdField];
      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if the resource has a user field and if it matches the current user
      if (resource.user && resource.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to perform this action'
        });
      }

      // Add the resource to the request object
      req.resource = resource;
      next();
    } catch (error) {
      console.error('isOwner middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

// Update user's last active timestamp
exports.updateLastActive = async (req, res, next) => {
  if (req.user) {
    try {
      await User.findByIdAndUpdate(req.user._id, {
        lastActive: new Date(),
        isOnline: true
      });
    } catch (error) {
      console.error('Error updating last active timestamp:', error);
    }
  }
  next();
};

// Optional protect middleware - allows both authenticated and unauthenticated requests
// If a valid token is provided, sets req.user, otherwise continues without req.user
exports.optionalProtect = async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (req.headers.authorization) {
    console.log('Optional protect: Authorization header:', req.headers.authorization);
    console.log('Optional protect: Authorization header type:', typeof req.headers.authorization);
    console.log('Optional protect: Authorization header length:', req.headers.authorization.length);

    // Check if it starts with 'Bearer '
    if (req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Optional protect: Token found in Authorization header with Bearer prefix');
      console.log('Optional protect: Extracted token:', token);
      console.log('Optional protect: Token length:', token ? token.length : 0);

      // Check if token is empty or undefined after extraction
      if (!token) {
        console.error('Optional protect: Empty token after Bearer prefix extraction');
        return next(); // Continue without setting req.user
      }
    } else {
      // If Authorization header exists but doesn't start with 'Bearer'
      token = req.headers.authorization;
      console.log('Optional protect: Token found in Authorization header without Bearer prefix');
      console.log('Optional protect: Raw token:', token);
      console.log('Optional protect: Token length:', token ? token.length : 0);
    }
  } else if (req.cookies && req.cookies.token) {
    // Also check cookies for token
    token = req.cookies.token;
    console.log('Optional protect: Token found in cookies');
  } else if (req.body && req.body.token) {
    // Also check request body for token
    token = req.body.token;
    console.log('Optional protect: Token found in request body');
  }

  // If no token, continue without setting req.user
  if (!token) {
    return next();
  }

  try {
    console.log('Optional protect: Verifying token');

    // Check if token is a valid JWT format (base64url.base64url.base64url)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Optional protect: Token does not have 3 parts (not a valid JWT format)');
      return next(); // Continue without setting req.user
    }

    console.log('Optional protect: JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
    console.log('Optional protect: Token parts:', tokenParts.length);

    // Normal token verification
    let decoded = jwt.verify(token, process.env.JWT_SECRET || 'lets_talk_secure_jwt_secret_key_2024');
    console.log('Optional protect: Token verified successfully for user ID:', decoded.id);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (user) {
      // Update last active timestamp
      user.lastActive = new Date();
      try {
        await User.findByIdAndUpdate(user._id, { lastActive: new Date() });
      } catch (updateError) {
        // Don't fail the request if we can't update the last active timestamp
        console.warn('Failed to update last active timestamp:', updateError.message);
      }

      // Set user in request object
      req.user = user;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without setting req.user
    console.warn('Invalid token in optionalProtect middleware:', error.message);
    next();
  }
};
