const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Story = require('../models/Story');
const LiveStream = require('../models/LiveStream');
const Notification = require('../models/Notification');

// @desc    Get user by username
// @route   GET /api/users/:username
// @access  Public
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user data
    const userData = user.getPublicProfile();

    // Get follower and following counts
    userData.followerCount = user.followers.length;
    userData.followingCount = user.following.length;

    // Check if the requesting user is following this user
    if (req.user) {
      userData.isFollowing = user.followers.includes(req.user._id);
      userData.isFollowingYou = user.following.includes(req.user._id);
      userData.isMe = req.user._id.toString() === user._id.toString();
    }

    // Get post count
    const postCount = await Post.countDocuments({ user: user._id, isArchived: false });
    userData.postCount = postCount;

    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user posts
// @route   GET /api/users/:username/posts
// @access  Public/Private (depends on user privacy)
exports.getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following
    if (user.isPrivate && req.user && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This account is private'
      });
    }

    // Get posts
    const posts = await Post.find({ user: user._id, isArchived: false })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Post.countDocuments({ user: user._id, isArchived: false });

    // Add isLiked field if user is authenticated
    if (req.user) {
      for (let post of posts) {
        post._doc.isLiked = post.likes.includes(req.user._id);
      }
    }

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
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user reels
// @route   GET /api/users/:username/reels
// @access  Public/Private (depends on user privacy)
exports.getUserReels = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following
    if (user.isPrivate && req.user && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This account is private'
      });
    }

    // Get reels
    const reels = await Reel.find({ user: user._id, isArchived: false })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await Reel.countDocuments({ user: user._id, isArchived: false });

    // Add isLiked field if user is authenticated
    if (req.user) {
      for (let reel of reels) {
        reel._doc.isLiked = reel.likes.includes(req.user._id);
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
    console.error('Get user reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user livestreams
// @route   GET /api/users/:username/livestreams
// @access  Public/Private (depends on user privacy)
exports.getUserLivestreams = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 12, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following
    if (user.isPrivate && req.user && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This account is private'
      });
    }

    // Build query
    const query = { user: user._id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Get livestreams
    const livestreams = await LiveStream.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username avatar fullName');

    // Get total count
    const total = await LiveStream.countDocuments(query);

    res.status(200).json({
      success: true,
      livestreams,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user livestreams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Follow user
// @route   POST /api/users/:username/follow
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user to follow
    const userToFollow = await User.findOne({ username });

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is trying to follow themselves
    if (userToFollow._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if already following
    if (userToFollow.followers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Check if user has a pending follow request
    if (userToFollow.pendingFollowRequests.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending follow request'
      });
    }

    // If account is private, add to pending requests
    if (userToFollow.isPrivate) {
      await User.findByIdAndUpdate(userToFollow._id, {
        $push: { pendingFollowRequests: req.user._id }
      });

      // Create notification for follow request
      await Notification.create({
        recipient: userToFollow._id,
        sender: req.user._id,
        type: 'follow_request',
        targetId: req.user._id,
        targetModel: 'User'
      });

      return res.status(200).json({
        success: true,
        message: 'Follow request sent',
        status: 'pending'
      });
    }

    // If account is public, follow directly
    await User.findByIdAndUpdate(userToFollow._id, {
      $push: { followers: req.user._id }
    });

    // Add to current user's following list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { following: userToFollow._id }
    });

    // Create notification for new follower
    await Notification.create({
      recipient: userToFollow._id,
      sender: req.user._id,
      type: 'new_follower',
      targetId: req.user._id,
      targetModel: 'User'
    });

    // Get updated follower and following counts
    const updatedUserToFollow = await User.findById(userToFollow._id);
    const updatedCurrentUser = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      message: 'User followed successfully',
      status: 'following',
      data: {
        followerCount: updatedUserToFollow.followers.length,
        followingCount: updatedCurrentUser.following.length,
        targetUserId: userToFollow._id,
        currentUserId: req.user._id
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unfollow user
// @route   POST /api/users/:username/unfollow
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user to unfollow
    const userToUnfollow = await User.findOne({ username });

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is trying to unfollow themselves
    if (userToUnfollow._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself'
      });
    }

    // Check if not following
    if (!userToUnfollow.followers.includes(req.user._id)) {
      // Check if there's a pending request
      if (userToUnfollow.pendingFollowRequests.includes(req.user._id)) {
        // Remove from pending requests
        await User.findByIdAndUpdate(userToUnfollow._id, {
          $pull: { pendingFollowRequests: req.user._id }
        });

        return res.status(200).json({
          success: true,
          message: 'Follow request canceled',
          status: 'not_following'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }

    // Remove from followers
    await User.findByIdAndUpdate(userToUnfollow._id, {
      $pull: { followers: req.user._id }
    });

    // Remove from current user's following list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: userToUnfollow._id }
    });

    // Get updated follower and following counts
    const updatedUserToUnfollow = await User.findById(userToUnfollow._id);
    const updatedCurrentUser = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully',
      status: 'not_following',
      data: {
        followerCount: updatedUserToUnfollow.followers.length,
        followingCount: updatedCurrentUser.following.length,
        targetUserId: userToUnfollow._id,
        currentUserId: req.user._id
      }
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Accept follow request
// @route   POST /api/users/follow-requests/:userId/accept
// @access  Private
exports.acceptFollowRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if request exists
    const user = await User.findById(req.user._id);

    if (!user.pendingFollowRequests.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'No follow request from this user'
      });
    }

    // Remove from pending requests and add to followers in one operation
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pendingFollowRequests: userId },
      $push: { followers: userId }
    });

    // Add to follower's following list
    await User.findByIdAndUpdate(userId, {
      $push: { following: req.user._id }
    });

    // Create notification for accepted follow request
    await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'follow_accept',
      targetId: req.user._id,
      targetModel: 'User'
    });

    res.status(200).json({
      success: true,
      message: 'Follow request accepted'
    });
  } catch (error) {
    console.error('Accept follow request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reject follow request
// @route   POST /api/users/follow-requests/:userId/reject
// @access  Private
exports.rejectFollowRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if request exists
    const user = await User.findById(req.user._id);

    if (!user.pendingFollowRequests.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'No follow request from this user'
      });
    }

    // Remove from pending requests
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pendingFollowRequests: userId }
    });

    res.status(200).json({
      success: true,
      message: 'Follow request rejected'
    });
  } catch (error) {
    console.error('Reject follow request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get follow requests
// @route   GET /api/users/follow-requests
// @access  Private
exports.getFollowRequests = async (req, res) => {
  try {
    // Get current user with pending follow requests
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get details of users who sent follow requests
    const requests = await User.find(
      { _id: { $in: user.pendingFollowRequests } },
      'username fullName avatar'
    );

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get follow requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove follower
// @route   POST /api/users/:username/remove-follower
// @access  Private
exports.removeFollower = async (req, res) => {
  try {
    const { username } = req.params;

    // Find the follower to remove
    const followerToRemove = await User.findOne({ username });

    if (!followerToRemove) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the user is actually a follower
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.followers.includes(followerToRemove._id)) {
      return res.status(400).json({
        success: false,
        message: 'This user is not following you'
      });
    }

    // Remove from followers
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { followers: followerToRemove._id }
    });

    // Remove from follower's following list
    await User.findByIdAndUpdate(followerToRemove._id, {
      $pull: { following: req.user._id }
    });

    res.status(200).json({
      success: true,
      message: 'Follower removed successfully'
    });
  } catch (error) {
    console.error('Remove follower error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user followers
// @route   GET /api/users/:username/followers or GET /api/users/:userId/followers
// @access  Public/Private (depends on user privacy)
exports.getUserFollowers = async (req, res) => {
  try {
    const { username, userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Find user by username or userId
    let user;
    if (username) {
      user = await User.findOne({ username });
    } else if (userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following
    if (user.isPrivate && req.user && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This account is private'
      });
    }

    // Get followers with pagination
    const followers = await User.find({ _id: { $in: user.followers } })
      .select('username fullName avatar bio followers following')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Add isFollowing field if user is authenticated
    if (req.user) {
      for (let follower of followers) {
        follower._doc.isFollowing = req.user.following.includes(follower._id);
        follower._doc.isMe = req.user._id.toString() === follower._id.toString();
        follower._doc.followerCount = follower.followers.length;
        follower._doc.followingCount = follower.following.length;
      }
    }

    res.status(200).json({
      success: true,
      followers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: user.followers.length,
        pages: Math.ceil(user.followers.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user following
// @route   GET /api/users/:username/following or GET /api/users/:userId/following
// @access  Public/Private (depends on user privacy)
exports.getUserFollowing = async (req, res) => {
  try {
    const { username, userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Find user by username or userId
    let user;
    if (username) {
      user = await User.findOne({ username });
    } else if (userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following
    if (user.isPrivate && req.user && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This account is private'
      });
    }

    // Get following with pagination
    const following = await User.find({ _id: { $in: user.following } })
      .select('username fullName avatar bio followers following')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Add isFollowing field if user is authenticated
    if (req.user) {
      for (let followedUser of following) {
        followedUser._doc.isFollowing = req.user.following.includes(followedUser._id);
        followedUser._doc.isMe = req.user._id.toString() === followedUser._id.toString();
        followedUser._doc.followerCount = followedUser.followers.length;
        followedUser._doc.followingCount = followedUser.following.length;
      }
    }

    res.status(200).json({
      success: true,
      following,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: user.following.length,
        pages: Math.ceil(user.following.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user stories
// @route   GET /api/users/:username/stories
// @access  Private
exports.getUserStories = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following
    if (user.isPrivate && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This account is private'
      });
    }

    // Get active stories (not expired)
    const stories = await Story.find({
      user: user._id,
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: 1 })
      .populate('user', 'username avatar fullName');

    // Add viewed status for the requesting user
    for (let story of stories) {
      story._doc.isViewed = story.isViewedByUser(req.user._id);
    }

    res.status(200).json({
      success: true,
      stories
    });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggested
// @access  Private
// @desc    Get user statistics (likes, comments, views)
// @route   GET /api/users/:username/stats or GET /api/users/:userId/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const { username, userId } = req.params;

    // Find user by username or userId
    let user;
    if (username) {
      user = await User.findOne({ username });
    } else if (userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the requesting user is the profile owner
    const isProfileOwner = req.user && req.user._id.toString() === user._id.toString();

    // Only allow the profile owner to see their stats
    if (!isProfileOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these statistics'
      });
    }

    // Get post likes and comments
    const posts = await Post.find({ user: user._id, isArchived: false });
    const postsLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);
    const postsComments = posts.reduce((sum, post) => sum + post.comments.length, 0);

    // Get reel likes and comments
    const reels = await Reel.find({ user: user._id, isArchived: false });
    const reelsLikes = reels.reduce((sum, reel) => sum + reel.likes.length, 0);
    const reelsComments = reels.reduce((sum, reel) => sum + reel.comments.length, 0);
    const reelsViews = reels.reduce((sum, reel) => sum + (reel.views ? reel.views.length : 0), 0);

    // Get livestream likes and comments
    const livestreams = await LiveStream.find({ user: user._id });
    const livestreamsLikes = livestreams.reduce((sum, stream) => sum + (stream.likes ? stream.likes.length : 0), 0);
    const livestreamsComments = livestreams.reduce((sum, stream) => sum + (stream.comments ? stream.comments.length : 0), 0);
    const livestreamsViews = livestreams.reduce((sum, stream) => sum + (stream.viewers ? stream.viewers.length : 0), 0);

    // Calculate totals
    const totalLikes = postsLikes + reelsLikes + livestreamsLikes;
    const totalComments = postsComments + reelsComments + livestreamsComments;
    const totalViews = reelsViews + livestreamsViews;

    // Calculate profile views (typically higher than engagement)
    // Use a deterministic calculation instead of random to prevent refreshing
    const profileViews = Math.floor((totalLikes + totalComments) * 2.5) + 300;

    res.status(200).json({
      success: true,
      stats: {
        profileViews,
        totalLikes,
        totalComments,
        totalViews,
        postsCount: posts.length,
        reelsCount: reels.length,
        livestreamsCount: livestreams.length
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    const { limit = 20, includeAll = 'true' } = req.query;
    const limitNum = parseInt(limit);
    const shouldIncludeAll = includeAll === 'true';

    // Check if user is authenticated
    if (!req.user) {
      console.log('No authenticated user, returning error');
      return res.status(401).json({
        success: false,
        message: 'Authentication required to get suggested users'
      });
    }

    // Get users that the current user is not following
    const following = req.user.following;
    const currentUserId = req.user._id.toString();

    // Get total user count to ensure we're returning all users
    const totalUserCount = await User.countDocuments();
    console.log(`Total users in database: ${totalUserCount}`);

    // If includeAll is true, get all users except the current user and those they're following
    if (shouldIncludeAll) {
      // Get all users except the current user and those they're following
      const allUsers = await User.find({
        _id: { $ne: req.user._id, $nin: following }
      })
        .select('username fullName avatar bio isVerified isOnline isBusinessAccount businessCategory website followers following email')
        .limit(limitNum);

      console.log(`Found ${allUsers.length} users to suggest`);

      // Add additional information to each suggested user
      const enhancedSuggestedUsers = await Promise.all(allUsers.map(async (user) => {
        // Get post count
        const postCount = await Post.countDocuments({ user: user._id, isArchived: false });

        // Get follower and following counts
        const followerCount = user.followers.length;
        const followingCount = user.following.length;

        // Check if the current user is followed by this user
        const isFollowingYou = user.following.includes(req.user._id);

        // Return enhanced user object
        return {
          ...user._doc,
          postCount,
          followerCount,
          followingCount,
          isFollowingYou,
          suggestionReason: 'Suggested for you'
        };
      }));

      return res.status(200).json({
        success: true,
        users: enhancedSuggestedUsers,
        totalUsers: totalUserCount
      });
    }

    // Otherwise, use the original algorithm with improvements
    // Get users followed by people the user follows
    const followingOfFollowing = await User.find({ _id: { $in: following } })
      .select('following')
      .limit(15);

    // Extract IDs
    const potentialSuggestions = [];
    followingOfFollowing.forEach(user => {
      user.following.forEach(id => {
        if (!following.includes(id) && id.toString() !== currentUserId) {
          potentialSuggestions.push(id);
        }
      });
    });

    // Count occurrences to find most common suggestions
    const suggestionCounts = {};
    potentialSuggestions.forEach(id => {
      const idStr = id.toString();
      suggestionCounts[idStr] = (suggestionCounts[idStr] || 0) + 1;
    });

    // Sort by count and get top suggestions
    const topSuggestionIds = Object.keys(suggestionCounts)
      .sort((a, b) => suggestionCounts[b] - suggestionCounts[a])
      .slice(0, limitNum / 2); // Only use half the limit for mutual suggestions

    // If we don't have enough suggestions, add some random users
    let suggestedUsers = [];

    // Select more detailed user information for suggested users
    if (topSuggestionIds.length > 0) {
      suggestedUsers = await User.find({ _id: { $in: topSuggestionIds } })
        .select('username fullName avatar bio isVerified isOnline isBusinessAccount businessCategory website followers following email');
    }

    // Always add random users to ensure we have a diverse set of suggestions
    // and to make sure we're showing all users in the database
    const excludedIds = [...following, req.user._id, ...suggestedUsers.map(u => u._id)];
    const remainingCount = limitNum - suggestedUsers.length;

    // Get random users that the current user is not following
    const randomUsers = await User.find({
      _id: { $nin: excludedIds }
    })
      .select('username fullName avatar bio isVerified isOnline isBusinessAccount businessCategory website followers following email')
      .limit(remainingCount);

    console.log(`Found ${randomUsers.length} additional random users to suggest`);
    suggestedUsers = [...suggestedUsers, ...randomUsers];

    // Add additional information to each suggested user
    const enhancedSuggestedUsers = await Promise.all(suggestedUsers.map(async (user) => {
      // Get post count
      const postCount = await Post.countDocuments({ user: user._id, isArchived: false });

      // Get follower and following counts
      const followerCount = user.followers.length;
      const followingCount = user.following.length;

      // Check if the current user is followed by this user
      const isFollowingYou = user.following.includes(req.user._id);

      // Add suggestion reason
      const idStr = user._id.toString();
      let suggestionReason = 'Suggested for you';
      let mutualCount = 0;

      if (suggestionCounts[idStr]) {
        mutualCount = suggestionCounts[idStr];
        suggestionReason = `Followed by ${mutualCount} people you follow`;
      }

      // Return enhanced user object
      return {
        ...user._doc,
        postCount,
        followerCount,
        followingCount,
        isFollowingYou,
        mutualCount,
        suggestionReason
      };
    }));

    res.status(200).json({
      success: true,
      users: enhancedSuggestedUsers,
      totalUsers: totalUserCount
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
