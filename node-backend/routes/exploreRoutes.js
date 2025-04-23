const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Temporary controller functions until we implement the full controllers
const getTrending = async (req, res) => {
  try {
    // Get models
    const Post = require('../models/Post');
    const Reel = require('../models/Reel');
    const User = require('../models/User');
    const Tag = require('../models/Tag');

    // Get trending posts (most liked and commented)
    const posts = await Post.find()
      .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
      .limit(12)
      .populate('user', 'username fullName avatar')
      .lean();

    // Get trending reels
    const reels = await Reel.find()
      .sort({ viewsCount: -1, likesCount: -1, createdAt: -1 })
      .limit(12)
      .populate('user', 'username fullName avatar')
      .lean();

    // Get popular users
    const users = await User.find()
      .sort({ followersCount: -1 })
      .limit(12)
      .select('username fullName avatar followersCount followingCount')
      .lean();

    // Get popular tags
    const tags = await Tag.find()
      .sort({ postsCount: -1 })
      .limit(12)
      .lean();

    res.status(200).json({
      success: true,
      posts: posts || [],
      reels: reels || [],
      users: users || [],
      tags: tags || [],
      pagination: {
        page: 1,
        limit: 20,
        total: posts.length + reels.length + users.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error in getTrending:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending content',
      error: error.message
    });
  }
};

const getExplorePosts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get Post model
    const Post = require('../models/Post');

    // Get posts with pagination
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'username fullName avatar')
      .lean();

    // Get total count for pagination
    const total = await Post.countDocuments();

    res.status(200).json({
      success: true,
      posts: posts || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (error) {
    console.error('Error in getExplorePosts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching explore posts',
      error: error.message
    });
  }
};

const getExploreReels = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get Reel model
    const Reel = require('../models/Reel');

    // Get reels with pagination
    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'username fullName avatar')
      .lean();

    // Get total count for pagination
    const total = await Reel.countDocuments();

    res.status(200).json({
      success: true,
      reels: reels || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (error) {
    console.error('Error in getExploreReels:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching explore reels',
      error: error.message
    });
  }
};

const getExploreUsers = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get User model
    const User = require('../models/User');

    // Get users with pagination
    const users = await User.find()
      .sort({ followersCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('username fullName avatar bio followersCount followingCount isVerified')
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      users: users || [],
      totalUsers: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (error) {
    console.error('Error in getExploreUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching explore users',
      error: error.message
    });
  }
};

const getForYou = async (req, res) => {
  try {
    // Get user ID from request (if authenticated)
    const userId = req.user ? req.user._id : null;

    // Get models
    const Post = require('../models/Post');
    const Reel = require('../models/Reel');
    const User = require('../models/User');

    let posts = [];
    let reels = [];
    let users = [];

    if (userId) {
      // If user is authenticated, get content from followed users first
      const userObj = await User.findById(userId).select('following').lean();
      const followingIds = userObj?.following?.map(follow => follow.user) || [];

      if (followingIds.length > 0) {
        // Get posts from followed users
        posts = await Post.find({ user: { $in: followingIds } })
          .sort({ createdAt: -1 })
          .limit(6)
          .populate('user', 'username fullName avatar')
          .lean();

        // Get reels from followed users
        reels = await Reel.find({ user: { $in: followingIds } })
          .sort({ createdAt: -1 })
          .limit(6)
          .populate('user', 'username fullName avatar')
          .lean();
      }

      // Get suggested users (not followed by the user)
      users = await User.find({ _id: { $nin: [...followingIds, userId] } })
        .sort({ followersCount: -1 })
        .limit(6)
        .select('username fullName avatar followersCount followingCount')
        .lean();
    }

    // If not enough content, fill with trending content
    if (posts.length < 6) {
      const morePosts = await Post.find(userId ? { user: { $ne: userId } } : {})
        .sort({ likesCount: -1, commentsCount: -1 })
        .limit(6 - posts.length)
        .populate('user', 'username fullName avatar')
        .lean();
      posts = [...posts, ...morePosts];
    }

    if (reels.length < 6) {
      const moreReels = await Reel.find(userId ? { user: { $ne: userId } } : {})
        .sort({ viewsCount: -1, likesCount: -1 })
        .limit(6 - reels.length)
        .populate('user', 'username fullName avatar')
        .lean();
      reels = [...reels, ...moreReels];
    }

    if (users.length < 6) {
      const moreUsers = await User.find(userId ? { _id: { $ne: userId } } : {})
        .sort({ followersCount: -1 })
        .limit(6 - users.length)
        .select('username fullName avatar followersCount followingCount')
        .lean();
      users = [...users, ...moreUsers];
    }

    res.status(200).json({
      success: true,
      posts: posts || [],
      reels: reels || [],
      users: users || [],
      pagination: {
        page: 1,
        limit: 20,
        total: posts.length + reels.length + users.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error in getForYou:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching personalized content',
      error: error.message
    });
  }
};

const getByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get models
    const Post = require('../models/Post');
    const Reel = require('../models/Reel');

    let posts = [];
    let reels = [];
    let total = 0;

    // Handle different categories
    switch (category.toLowerCase()) {
      case 'photography':
        posts = await Post.find({ type: 'photo' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('user', 'username fullName avatar')
          .lean();
        total = await Post.countDocuments({ type: 'photo' });
        break;
      case 'videos':
        reels = await Reel.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('user', 'username fullName avatar')
          .lean();
        total = await Reel.countDocuments();
        break;
      case 'trending':
        posts = await Post.find()
          .sort({ likesCount: -1, commentsCount: -1 })
          .skip(skip)
          .limit(Math.floor(limitNum / 2))
          .populate('user', 'username fullName avatar')
          .lean();

        reels = await Reel.find()
          .sort({ viewsCount: -1, likesCount: -1 })
          .skip(skip)
          .limit(Math.ceil(limitNum / 2))
          .populate('user', 'username fullName avatar')
          .lean();

        total = await Post.countDocuments() + await Reel.countDocuments();
        break;
      default:
        // Default to all content
        posts = await Post.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Math.floor(limitNum / 2))
          .populate('user', 'username fullName avatar')
          .lean();

        reels = await Reel.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Math.ceil(limitNum / 2))
          .populate('user', 'username fullName avatar')
          .lean();

        total = await Post.countDocuments() + await Reel.countDocuments();
    }

    res.status(200).json({
      success: true,
      category,
      posts: posts || [],
      reels: reels || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (error) {
    console.error(`Error in getByCategory (${req.params.category}):`, error);
    res.status(500).json({
      success: false,
      message: `Server error while fetching content for category: ${req.params.category}`,
      error: error.message
    });
  }
};

const getByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get models
    const Post = require('../models/Post');
    const Reel = require('../models/Reel');
    const Tag = require('../models/Tag');

    // Find tag by name
    const tag = await Tag.findOne({ name: hashtag.toLowerCase() }).lean();

    if (!tag) {
      return res.status(200).json({
        success: true,
        hashtag,
        posts: [],
        reels: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0,
          hasMore: false
        }
      });
    }

    // Find posts with this tag
    const posts = await Post.find({ tags: tag._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.floor(limitNum / 2))
      .populate('user', 'username fullName avatar')
      .lean();

    // Find reels with this tag
    const reels = await Reel.find({ tags: tag._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.ceil(limitNum / 2))
      .populate('user', 'username fullName avatar')
      .lean();

    // Get total counts
    const postsCount = await Post.countDocuments({ tags: tag._id });
    const reelsCount = await Reel.countDocuments({ tags: tag._id });
    const total = postsCount + reelsCount;

    res.status(200).json({
      success: true,
      hashtag,
      tag,
      posts: posts || [],
      reels: reels || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (error) {
    console.error(`Error in getByHashtag (${req.params.hashtag}):`, error);
    res.status(500).json({
      success: false,
      message: `Server error while fetching content for hashtag: ${req.params.hashtag}`,
      error: error.message
    });
  }
};

// Get trending tags
const getTrendingTags = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    // Get Tag model
    const Tag = require('../models/Tag');

    // Get trending tags
    const tags = await Tag.find()
      .sort({ postsCount: -1, reelsCount: -1 })
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      tags: tags || [],
      total: tags.length
    });
  } catch (error) {
    console.error('Error in getTrendingTags:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending tags',
      error: error.message
    });
  }
};

// Public routes
router.get('/trending', getTrending);
router.get('/trending-tags', getTrendingTags);
router.get('/for-you', getForYou);
router.get('/category/:category', getByCategory);
router.get('/hashtag/:hashtag', getByHashtag);
router.get('/posts', getExplorePosts);
router.get('/reels', getExploreReels);
router.get('/users', getExploreUsers);

module.exports = router;
