const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Product = require('../models/Product');
const Conversation = require('../models/Conversation');

/**
 * @desc    Search for users, posts, and tags
 * @route   GET /api/search
 * @access  Public
 */
exports.search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search for users - prioritize username matches
    // First try to find exact username matches
    let usernameExactMatches = await User.find({
      username: q
    })
      .select('username fullName avatar bio isVerified isOnline')
      .limit(5);

    // Then find username prefix matches
    let usernamePrefixMatches = await User.find({
      username: { $regex: `^${q}`, $options: 'i' },
      _id: { $nin: usernameExactMatches.map(u => u._id) }
    })
      .select('username fullName avatar bio isVerified isOnline')
      .limit(5);

    // Then find other matches (username contains, fullName, email)
    let otherMatches = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: {
        $nin: [...usernameExactMatches.map(u => u._id), ...usernamePrefixMatches.map(u => u._id)]
      }
    })
      .select('username fullName avatar bio isVerified isOnline')
      .limit(10);

    // Combine all results, prioritizing exact and prefix matches
    const users = [...usernameExactMatches, ...usernamePrefixMatches, ...otherMatches];

    // Search for posts
    const posts = await Post.find({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { hashtags: { $regex: q, $options: 'i' } }
      ],
      isArchived: false
    })
      .populate('user', 'username avatar fullName')
      .select('image caption likes comments createdAt')
      .limit(10);

    // Search for reels
    const reels = await Reel.find({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { hashtags: { $regex: q, $options: 'i' } }
      ],
      isArchived: false
    })
      .populate('user', 'username avatar fullName')
      .select('video thumbnail caption likes comments views createdAt')
      .limit(10);

    // Search for products
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    })
      .populate('seller', 'username avatar fullName businessInfo')
      .select('name description price currency images category tags inventory status featured')
      .limit(10);

    // Extract unique hashtags from posts and reels
    const postHashtags = posts.reduce((tags, post) => {
      if (post.hashtags && post.hashtags.length > 0) {
        post.hashtags.forEach(tag => {
          if (tag.toLowerCase().includes(q.toLowerCase()) && !tags.includes(tag)) {
            tags.push(tag);
          }
        });
      }
      return tags;
    }, []);

    const reelHashtags = reels.reduce((tags, reel) => {
      if (reel.hashtags && reel.hashtags.length > 0) {
        reel.hashtags.forEach(tag => {
          if (tag.toLowerCase().includes(q.toLowerCase()) && !tags.includes(tag)) {
            tags.push(tag);
          }
        });
      }
      return tags;
    }, []);

    // Combine and deduplicate hashtags
    const tags = [...new Set([...postHashtags, ...reelHashtags])].slice(0, 10);

    // Add isFollowing field if user is authenticated
    if (req.user) {
      for (let user of users) {
        user._doc.isFollowing = req.user.following.includes(user._id);
        user._doc.isFollowingYou = user.following.includes(req.user._id);
        user._doc.isMe = req.user._id.toString() === user._id.toString();
      }

      for (let post of posts) {
        post._doc.isLiked = post.likes.includes(req.user._id);
        post._doc.isSaved = req.user.savedPosts.includes(post._id);
      }

      for (let reel of reels) {
        reel._doc.isLiked = reel.likes.includes(req.user._id);
        reel._doc.isSaved = req.user.savedReels.includes(reel._id);
      }

      for (let product of products) {
        product._doc.isSaved = product.saves && product.saves.includes(req.user._id);
      }
    }

    res.status(200).json({
      success: true,
      users,
      posts,
      reels,
      products,
      tags
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Search for users
 * @route   GET /api/search/users
 * @access  Public
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};

    // If search query is provided, use it to filter users
    if (q && q.trim() !== '') {
      // First try to find exact username matches
      let usernameExactMatches = await User.find({
        username: q
      })
        .select('username fullName avatar bio isVerified isOnline followers following')
        .limit(5);

      // Then find username prefix matches
      let usernamePrefixMatches = await User.find({
        username: { $regex: `^${q}`, $options: 'i' },
        _id: { $nin: usernameExactMatches.map(u => u._id) }
      })
        .select('username fullName avatar bio isVerified isOnline followers following')
        .limit(5);

      // Then find other matches (username contains, fullName, email)
      let otherMatches = await User.find({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { fullName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ],
        _id: {
          $nin: [...usernameExactMatches.map(u => u._id), ...usernamePrefixMatches.map(u => u._id)]
        }
      })
        .select('username fullName avatar bio isVerified isOnline followers following')
        .limit(10);

      // Combine all results, prioritizing exact and prefix matches
      const users = [...usernameExactMatches, ...usernamePrefixMatches, ...otherMatches];

      // Add isFollowing field if user is authenticated
      if (req.user) {
        for (let user of users) {
          user._doc.isFollowing = req.user.following.includes(user._id);
          user._doc.isFollowingYou = user.following.includes(req.user._id);
          user._doc.isMe = req.user._id.toString() === user._id.toString();
          user._doc.followerCount = user.followers.length;
          user._doc.followingCount = user.following.length;
        }
      }

      return res.status(200).json({
        success: true,
        users
      });
    }

    // If user is authenticated, exclude the current user from results
    if (req.user) {
      query._id = { $ne: req.user._id };
    }

    // Search for users
    const users = await User.find(query)
      .select('username fullName avatar bio isVerified isOnline followers following')
      .limit(20);

    // Add isFollowing field if user is authenticated
    if (req.user) {
      for (let user of users) {
        user._doc.isFollowing = req.user.following.includes(user._id);
        user._doc.isFollowingYou = user.following.includes(req.user._id);
        user._doc.isMe = req.user._id.toString() === user._id.toString();
        user._doc.followerCount = user.followers.length;
        user._doc.followingCount = user.following.length;
      }
    }

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Search for posts
 * @route   GET /api/search/posts
 * @access  Public
 */
exports.searchPosts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search for posts
    const posts = await Post.find({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { hashtags: { $regex: q, $options: 'i' } }
      ],
      isArchived: false
    })
      .populate('user', 'username avatar fullName')
      .select('image caption likes comments createdAt')
      .limit(20);

    // Add isLiked and isSaved fields if user is authenticated
    if (req.user) {
      for (let post of posts) {
        post._doc.isLiked = post.likes.includes(req.user._id);
        post._doc.isSaved = req.user.savedPosts.includes(post._id);
      }
    }

    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Search for products
 * @route   GET /api/search/products
 * @access  Public
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search for products
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    })
      .populate('seller', 'username avatar fullName businessInfo')
      .select('name description price currency images category tags inventory status featured')
      .limit(20);

    // Add isSaved field if user is authenticated
    if (req.user) {
      for (let product of products) {
        product._doc.isSaved = product.saves && product.saves.includes(req.user._id);
      }
    }

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Search for reels
 * @route   GET /api/search/reels
 * @access  Public
 */
exports.searchReels = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search for reels
    const reels = await Reel.find({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { hashtags: { $regex: q, $options: 'i' } }
      ],
      isArchived: false
    })
      .populate('user', 'username avatar fullName')
      .select('video thumbnail caption likes comments views createdAt')
      .limit(20);

    // Add isLiked and isSaved fields if user is authenticated
    if (req.user) {
      for (let reel of reels) {
        reel._doc.isLiked = reel.likes.includes(req.user._id);
        reel._doc.isSaved = req.user.savedReels.includes(reel._id);
      }
    }

    res.status(200).json({
      success: true,
      reels
    });
  } catch (error) {
    console.error('Search reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Search for tags
 * @route   GET /api/search/tags
 * @access  Public
 */
exports.searchTags = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search for posts with matching hashtags
    const posts = await Post.find({
      hashtags: { $regex: q, $options: 'i' },
      isArchived: false
    }).select('hashtags');

    // Search for reels with matching hashtags
    const reels = await Reel.find({
      hashtags: { $regex: q, $options: 'i' },
      isArchived: false
    }).select('hashtags');

    // Extract and count hashtags
    const hashtagCounts = {};

    // Process post hashtags
    posts.forEach(post => {
      if (post.hashtags && post.hashtags.length > 0) {
        post.hashtags.forEach(tag => {
          if (tag.toLowerCase().includes(q.toLowerCase())) {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          }
        });
      }
    });

    // Process reel hashtags
    reels.forEach(reel => {
      if (reel.hashtags && reel.hashtags.length > 0) {
        reel.hashtags.forEach(tag => {
          if (tag.toLowerCase().includes(q.toLowerCase())) {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by count
    const tags = Object.keys(hashtagCounts).map(tag => ({
      name: tag,
      count: hashtagCounts[tag]
    })).sort((a, b) => b.count - a.count).slice(0, 20);

    res.status(200).json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Search tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
