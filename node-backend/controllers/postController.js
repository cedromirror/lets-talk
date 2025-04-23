const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { extractHashtags, extractMentions } = require('../utils/helpers');
const { deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { caption, location } = req.body;

    // Check if image was uploaded
    if (!req.file || !req.file.cloudinaryUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Get image URLs (optimized if available)
    const imageUrl = req.file.cloudinaryUrl;
    const optimizedImageUrl = req.file.optimizedUrl || imageUrl;
    const lowQualityImageUrl = req.file.lowQualityUrl || null;

    // Create thumbnail if not provided
    let thumbnail = null;
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      // Extract base URL and transformations
      const urlParts = imageUrl.split('/upload/');
      if (urlParts.length === 2) {
        // Create a thumbnail version
        thumbnail = `${urlParts[0]}/upload/w_320,h_320,c_fill,g_auto,q_auto,f_auto/${urlParts[1]}`;
      }
    }

    // Extract hashtags and mentions
    const hashtags = extractHashtags(caption);
    const mentions = extractMentions(caption);

    // Create post
    const post = await Post.create({
      user: req.user._id,
      caption,
      location,
      image: imageUrl,
      optimizedImage: optimizedImageUrl,
      lowQualityImage: lowQualityImageUrl,
      thumbnail: thumbnail,
      hashtags
    });

    // Populate user data
    await post.populate('user', 'username avatar fullName');

    // Process mentions and create notifications
    if (mentions.length > 0) {
      const mentionedUsers = await User.find({ username: { $in: mentions } });

      // Add mentioned users to tags
      await Post.findByIdAndUpdate(post._id, {
        tags: mentionedUsers.map(user => user._id)
      });

      // Create notifications for mentioned users
      for (const user of mentionedUsers) {
        // Don't notify yourself
        if (user._id.toString() === req.user._id.toString()) continue;

        await Notification.create({
          recipient: user._id,
          sender: req.user._id,
          type: 'mention_post',
          content: {
            postId: post._id,
            caption: caption.substring(0, 50)
          },
          targetId: post._id,
          targetModel: 'Post'
        });
      }
    }

    // Notify followers
    const followers = await User.find({
      _id: { $in: req.user.followers },
      'notifications.postNotifications': true
    });

    for (const follower of followers) {
      await Notification.create({
        recipient: follower._id,
        sender: req.user._id,
        type: 'post_from_following',
        content: {
          postId: post._id
        },
        targetId: post._id,
        targetModel: 'Post'
      });
    }

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Public (returns empty array for unauthenticated users)
exports.getFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Check if user is authenticated
    if (!req.user) {
      return res.status(200).json({
        success: true,
        posts: [],
        hasMore: false,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0
        }
      });
    }

    // Get IDs of users the current user follows
    const following = req.user.following;
    following.push(req.user._id); // Include own posts

    // Get posts from followed users
    const posts = await Post.find({
      user: { $in: following },
      isArchived: false
    })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Post.countDocuments({
      user: { $in: following },
      isArchived: false
    });

    // Add isLiked field
    for (let post of posts) {
      post._doc.isLiked = post.likes.includes(req.user._id);
    }

    res.status(200).json({
      success: true,
      posts,
      hasMore: (pageNum * limitNum) < total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get feed posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a single post
// @route   GET /api/posts/:id
// @access  Public/Private (depends on post owner's privacy)
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;

    // Find post
    const post = await Post.findById(id)
      .populate('user', 'username avatar fullName isPrivate')
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 }, limit: 3 },
        populate: { path: 'user', select: 'username avatar' }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post owner has a private account and user is not following
    if (post.user.isPrivate && req.user && !post.user.followers.includes(req.user._id) && post.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This post is private'
      });
    }

    // Add isLiked field if user is authenticated
    if (req.user) {
      post._doc.isLiked = post.likes.includes(req.user._id);

      // Add isLiked field to comments
      if (post.comments) {
        for (let comment of post.comments) {
          comment._doc.isLiked = comment.likes.includes(req.user._id);
        }
      }
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, location, hideLikes, hideComments, allowComments } = req.body;

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the post owner
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    // Create update object
    const updateData = {};

    // If caption is being updated, save the old one to edit history
    if (caption !== undefined && caption !== post.caption) {
      let editHistory = [];

      if (!post.isEdited) {
        editHistory = [{
          caption: post.caption,
          editedAt: new Date()
        }];
      } else {
        editHistory = [...post.editHistory, {
          caption: post.caption,
          editedAt: new Date()
        }];
      }

      updateData.isEdited = true;
      updateData.caption = caption;
      updateData.editHistory = editHistory;

      // Update hashtags
      updateData.hashtags = extractHashtags(caption);

      // Process mentions
      const mentions = extractMentions(caption);
      if (mentions.length > 0) {
        const mentionedUsers = await User.find({ username: { $in: mentions } });
        updateData.tags = mentionedUsers.map(user => user._id);
      }
    }

    // Update other fields
    if (location !== undefined) updateData.location = location;
    if (hideLikes !== undefined) updateData.hideLikes = hideLikes;
    if (hideComments !== undefined) updateData.hideComments = hideComments;
    if (allowComments !== undefined) updateData.allowComments = allowComments;

    // Update post with findByIdAndUpdate to avoid validation issues
    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      updateData,
      { new: true }
    );

    // Populate user data
    await updatedPost.populate('user', 'username avatar fullName');

    res.status(200).json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the post owner
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete post image from Cloudinary
    if (post.image) {
      try {
        // Extract public ID from URL
        const publicId = post.image.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: post._id });

    // Delete all notifications related to this post
    await Notification.deleteMany({
      targetId: post._id,
      targetModel: 'Post'
    });

    // Delete the post
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already liked the post
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked'
      });
    }

    // Add user to likes
    await Post.findByIdAndUpdate(post._id, {
      $push: { likes: req.user._id }
    });

    // Get updated likes count
    const updatedPost = await Post.findById(post._id);

    // Create notification if the post is not by the current user
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: 'like_post',
        content: {
          postId: post._id
        },
        targetId: post._id,
        targetModel: 'Post'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      likesCount: updatedPost.likes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unlike a post
// @route   POST /api/posts/:id/unlike
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user hasn't liked the post
    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Post not liked yet'
      });
    }

    // Remove user from likes
    await Post.findByIdAndUpdate(post._id, {
      $pull: { likes: req.user._id }
    });

    // Get updated likes count
    const updatedPost = await Post.findById(post._id);

    // Remove notification
    await Notification.deleteOne({
      recipient: post.user,
      sender: req.user._id,
      type: 'like_post',
      targetId: post._id,
      targetModel: 'Post'
    });

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      likesCount: updatedPost.likes.length
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get post comments
// @route   GET /api/posts/:id/comments
// @access  Public/Private (depends on post owner's privacy)
exports.getPostComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Find post
    const post = await Post.findById(id).populate('user', 'isPrivate followers');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post owner has a private account and user is not following
    if (post.user.isPrivate && req.user && !post.user.followers.includes(req.user._id) && post.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This post is private'
      });
    }

    // Get comments
    const comments = await Comment.find({ post: id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Comment.countDocuments({ post: id });

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
    console.error('Get post comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    // Validate text
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if comments are allowed
    if (!post.allowComments) {
      return res.status(403).json({
        success: false,
        message: 'Comments are disabled for this post'
      });
    }

    // Create comment
    const comment = await Comment.create({
      user: req.user._id,
      post: id,
      text
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // Populate user data
    await comment.populate('user', 'username avatar fullName');

    // Create notification if the post is not by the current user
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: 'comment_post',
        content: {
          postId: post._id,
          commentId: comment._id,
          commentText: text.substring(0, 50)
        },
        targetId: comment._id,
        targetModel: 'Comment'
      });
    }

    // Process mentions
    const mentions = extractMentions(text);
    if (mentions.length > 0) {
      const mentionedUsers = await User.find({ username: { $in: mentions } });

      for (const user of mentionedUsers) {
        // Don't notify yourself or the post owner (who already got a comment notification)
        if (user._id.toString() === req.user._id.toString() ||
            user._id.toString() === post.user.toString()) {
          continue;
        }

        await Notification.create({
          recipient: user._id,
          sender: req.user._id,
          type: 'mention_comment',
          content: {
            postId: post._id,
            commentId: comment._id,
            commentText: text.substring(0, 50)
          },
          targetId: comment._id,
          targetModel: 'Comment'
        });
      }
    }

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Archive a post
// @route   PUT /api/posts/:id/archive
// @access  Private
exports.archivePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the post owner
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to archive this post'
      });
    }

    // Update archive status
    post.isArchived = true;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post archived successfully'
    });
  } catch (error) {
    console.error('Archive post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unarchive a post
// @route   PUT /api/posts/:id/unarchive
// @access  Private
exports.unarchivePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the post owner
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unarchive this post'
      });
    }

    // Update archive status
    post.isArchived = false;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post unarchived successfully'
    });
  } catch (error) {
    console.error('Unarchive post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get archived posts
// @route   GET /api/posts/archived
// @access  Private
exports.getArchivedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Get archived posts
    const posts = await Post.find({
      user: req.user._id,
      isArchived: true
    })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Post.countDocuments({
      user: req.user._id,
      isArchived: true
    });

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get archived posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
