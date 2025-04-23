const Reel = require('../models/Reel');
const User = require('../models/User');
const Comment = require('../models/Comment');

// @desc    Create a new reel
// @route   POST /api/reels
// @access  Private
exports.createReel = async (req, res) => {
  try {
    const { caption, audio, duration, hashtags } = req.body;

    // Check if video was uploaded
    if (!req.file && !req.cloudinaryUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video'
      });
    }

    // Get video URLs (optimized if available)
    const videoUrl = req.file.cloudinaryUrl;
    const optimizedVideoUrl = req.file.optimizedUrl || videoUrl;
    const lowQualityVideoUrl = req.file.lowQualityUrl || null;

    // Create thumbnail from the first frame if not provided
    let thumbnail = null;
    if (req.file.cloudinaryUrl && req.file.cloudinaryUrl.includes('cloudinary.com')) {
      // Extract base URL and transformations
      const urlParts = req.file.cloudinaryUrl.split('/upload/');
      if (urlParts.length === 2) {
        // Create a thumbnail from the video
        thumbnail = `${urlParts[0]}/upload/w_480,h_480,c_fill,g_auto,q_auto,f_auto,so_0/${urlParts[1]}`;
      }
    }

    // Create new reel
    const newReel = new Reel({
      user: req.user._id,
      caption,
      video: videoUrl,
      optimizedVideo: optimizedVideoUrl,
      lowQualityVideo: lowQualityVideoUrl,
      thumbnail: thumbnail,
      audio: {
        original: true,
        name: audio || 'Original Audio',
        artist: req.user.username,
        audioUrl: optimizedVideoUrl || videoUrl
      },
      duration: duration || 15, // Default duration
      hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()) : []
    });

    // Save reel
    await newReel.save();

    // Populate user data
    await newReel.populate('user', 'username avatar fullName');

    res.status(201).json({
      success: true,
      reel: newReel
    });
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get reels for feed
// @route   GET /api/reels
// @access  Public/Private
exports.getReels = async (req, res) => {
  try {
    const { page = 1, limit = 10, tab = 'for-you' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = { isArchived: false };

    // If tab is 'following' and user is authenticated, only show reels from followed users
    if (tab === 'following' && req.user) {
      // Get list of followed users
      const user = await User.findById(req.user._id);
      if (user && user.following.length > 0) {
        query.user = { $in: user.following };
      } else {
        // If user doesn't follow anyone, return empty array
        return res.status(200).json({
          success: true,
          reels: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            pages: 0
          }
        });
      }
    }

    // Get reels
    const reels = await Reel.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Reel.countDocuments(query);

    // Add isLiked field if user is authenticated
    if (req.user) {
      for (let reel of reels) {
        reel._doc.isLiked = reel.likes.includes(req.user._id);
        reel._doc.isSaved = req.user.savedReels.includes(reel._id);
      }
    }

    res.status(200).json({
      success: true,
      reels,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a single reel
// @route   GET /api/reels/:id
// @access  Public/Private
exports.getReel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find reel
    const reel = await Reel.findById(id)
      .populate('user', 'username avatar fullName');

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if reel is archived
    if (reel.isArchived) {
      // Only allow owner to view archived reels
      if (!req.user || reel.user._id.toString() !== req.user._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Reel not found'
        });
      }
    }

    // Add isLiked field if user is authenticated
    if (req.user) {
      reel._doc.isLiked = reel.likes.includes(req.user._id);
      reel._doc.isSaved = req.user.savedReels.includes(reel._id);
    }

    // Increment view count
    reel.views += 1;
    await reel.save();

    res.status(200).json({
      success: true,
      reel
    });
  } catch (error) {
    console.error('Get reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update a reel
// @route   PUT /api/reels/:id
// @access  Private
exports.updateReel = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, hashtags, hideLikes, hideComments, hideViewCount, allowComments } = req.body;

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check ownership
    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reel'
      });
    }

    // If caption is being updated, add to edit history
    if (caption && caption !== reel.caption) {
      reel.editHistory.push({
        caption: reel.caption,
        editedAt: Date.now()
      });
      reel.isEdited = true;
    }

    // Update fields
    reel.caption = caption || reel.caption;
    reel.hashtags = hashtags ? hashtags.split(',').map(tag => tag.trim()) : reel.hashtags;

    // Update privacy settings if provided
    if (hideLikes !== undefined) reel.hideLikes = hideLikes;
    if (hideComments !== undefined) reel.hideComments = hideComments;
    if (hideViewCount !== undefined) reel.hideViewCount = hideViewCount;
    if (allowComments !== undefined) reel.allowComments = allowComments;

    // Save updated reel
    await reel.save();

    // Populate user data
    await reel.populate('user', 'username avatar fullName');

    res.status(200).json({
      success: true,
      reel
    });
  } catch (error) {
    console.error('Update reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a reel
// @route   DELETE /api/reels/:id
// @access  Private
exports.deleteReel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check ownership
    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reel'
      });
    }

    // Delete reel
    await reel.remove();

    res.status(200).json({
      success: true,
      message: 'Reel deleted successfully'
    });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like a reel
// @route   POST /api/reels/:id/like
// @access  Private
exports.likeReel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if already liked
    if (reel.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Reel already liked'
      });
    }

    // Add like
    reel.likes.push(req.user._id);
    await reel.save();

    res.status(200).json({
      success: true,
      likesCount: reel.likes.length
    });
  } catch (error) {
    console.error('Like reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unlike a reel
// @route   POST /api/reels/:id/unlike
// @access  Private
exports.unlikeReel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if liked
    if (!reel.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Reel not liked yet'
      });
    }

    // Remove like
    reel.likes = reel.likes.filter(like => like.toString() !== req.user._id.toString());
    await reel.save();

    res.status(200).json({
      success: true,
      likesCount: reel.likes.length
    });
  } catch (error) {
    console.error('Unlike reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get reel comments
// @route   GET /api/reels/:id/comments
// @access  Public/Private
exports.getReelComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Get comments
    const comments = await Comment.find({ reel: id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Comment.countDocuments({ reel: id });

    // Add isLiked field if user is authenticated
    if (req.user) {
      for (let comment of comments) {
        comment._doc.isLiked = comment.likes.includes(req.user._id);
      }
    }

    res.status(200).json({
      success: true,
      comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get reel comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add comment to reel
// @route   POST /api/reels/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if comments are allowed
    if (!reel.allowComments) {
      return res.status(403).json({
        success: false,
        message: 'Comments are disabled for this reel'
      });
    }

    // Create comment
    const newComment = new Comment({
      user: req.user._id,
      reel: id,
      text
    });

    // Save comment
    await newComment.save();

    // Add comment to reel
    reel.comments.push(newComment._id);
    await reel.save();

    // Populate user data
    await newComment.populate('user', 'username avatar fullName');

    res.status(201).json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Archive a reel
// @route   PUT /api/reels/:id/archive
// @access  Private
exports.archiveReel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check ownership
    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to archive this reel'
      });
    }

    // Archive reel
    reel.isArchived = true;
    await reel.save();

    res.status(200).json({
      success: true,
      message: 'Reel archived successfully'
    });
  } catch (error) {
    console.error('Archive reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unarchive a reel
// @route   PUT /api/reels/:id/unarchive
// @access  Private
exports.unarchiveReel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check ownership
    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unarchive this reel'
      });
    }

    // Unarchive reel
    reel.isArchived = false;
    await reel.save();

    res.status(200).json({
      success: true,
      message: 'Reel unarchived successfully'
    });
  } catch (error) {
    console.error('Unarchive reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get reels feed with additional options
// @route   GET /api/reels/feed
// @access  Public/Private
exports.getFeedReels = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest', includeAll = false } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const includeAllUsers = includeAll === 'true';

    let query = { isArchived: false };
    let sortOptions = {};

    // Set sort options
    if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'popular') {
      sortOptions = { likesCount: -1, createdAt: -1 };
    } else if (sort === 'trending') {
      // For trending, we'll use a combination of recent + popular
      sortOptions = { views: -1, likesCount: -1, createdAt: -1 };
    }

    // If user is authenticated and includeAll is false, only show reels from followed users
    if (req.user && !includeAllUsers) {
      // Get list of followed users
      const user = await User.findById(req.user._id);
      if (user && user.following.length > 0) {
        query.user = { $in: user.following };
      } else {
        // If user doesn't follow anyone, return empty array
        return res.status(200).json({
          success: true,
          reels: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            pages: 0
          }
        });
      }
    }

    // Get reels
    const reels = await Reel.find(query)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Reel.countDocuments(query);

    // Add isLiked field if user is authenticated
    if (req.user) {
      for (let reel of reels) {
        reel._doc.isLiked = reel.likes.includes(req.user._id);
        reel._doc.isSaved = req.user.savedReels.includes(reel._id);
        // Add isFromFollowed flag
        const user = await User.findById(req.user._id);
        reel._doc.isFromFollowed = user.following.includes(reel.user._id);
      }
    }

    res.status(200).json({
      success: true,
      reels,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get feed reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get archived reels
// @route   GET /api/reels/archived
// @access  Private
exports.getArchivedReels = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Get archived reels
    const reels = await Reel.find({ user: req.user._id, isArchived: true })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Reel.countDocuments({ user: req.user._id, isArchived: true });

    res.status(200).json({
      success: true,
      reels,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get archived reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Save a reel
// @route   POST /api/reels/:id/save
// @access  Private
exports.saveReel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find reel
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    // Check if already saved
    if (user.savedReels.includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Reel already saved'
      });
    }

    // Add to saved reels
    user.savedReels.push(id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Reel saved successfully'
    });
  } catch (error) {
    console.error('Save reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unsave a reel
// @route   POST /api/reels/:id/unsave
// @access  Private
exports.unsaveReel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findById(req.user._id);

    // Check if saved
    if (!user.savedReels.includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Reel not saved yet'
      });
    }

    // Remove from saved reels
    user.savedReels = user.savedReels.filter(reelId => reelId.toString() !== id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Reel removed from saved items'
    });
  } catch (error) {
    console.error('Unsave reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
