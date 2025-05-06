const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');

// @desc    Get saved posts and reels
// @route   GET /api/saved
// @access  Public (returns empty arrays for unauthenticated users)
exports.getSavedPosts = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(200).json({
        success: true,
        savedPosts: [],
        savedReels: []
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get saved posts
    const savedPosts = await Post.find({
      _id: { $in: user.savedPosts || [] }
    }).populate('user', 'username avatar fullName');

    // Get saved reels
    const savedReels = await Reel.find({
      _id: { $in: user.savedReels || [] }
    }).populate('user', 'username avatar fullName');

    res.status(200).json({
      success: true,
      savedPosts,
      savedReels
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Save a post
// @route   POST /api/saved/:postId
// @access  Private
exports.savePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find user
    const user = await User.findById(req.user._id);

    // Initialize savedPosts array if it doesn't exist
    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    // Add to saved posts if not already saved
    if (!user.savedPosts.includes(postId)) {
      user.savedPosts.push(postId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Post saved successfully'
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unsave a post
// @route   DELETE /api/saved/:postId
// @access  Private
exports.unsavePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find user
    const user = await User.findById(req.user._id);

    // Remove from saved posts
    if (user.savedPosts) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Post removed from saved items'
    });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
