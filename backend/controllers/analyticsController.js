const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

/**
 * @desc    Get account overview analytics
 * @route   GET /api/analytics/account-overview
 * @access  Private
 */

exports.getAccountOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user data
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get follower count history (simulated for now)
    // In a real implementation, this would come from a time-series database or analytics collection
    const today = new Date();
    const followerHistory = [];

    // Generate 30 days of follower history data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simulate some growth pattern
      const baseCount = user.followers.length;
      const randomFactor = Math.random() * 0.1; // Up to 10% variation
      const growthFactor = 1 - (i / 30); // Linear growth factor

      const count = Math.floor(baseCount * growthFactor * (1 - randomFactor));

      followerHistory.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    // Get post count
    const postCount = await Post.countDocuments({ user: userId, isArchived: false });

    // Get reel count
    const reelCount = await Reel.countDocuments({ user: userId, isArchived: false });

    // Get total likes received
    const posts = await Post.find({ user: userId, isArchived: false });
    const reels = await Reel.find({ user: userId, isArchived: false });

    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0) +
                       reels.reduce((sum, reel) => sum + reel.likes.length, 0);

    // Get total comments received
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0) +
                         reels.reduce((sum, reel) => sum + reel.comments.length, 0);

    // Get engagement rate
    const totalContent = postCount + reelCount;
    const engagementRate = totalContent > 0 ?
      ((totalLikes + totalComments) / (totalContent * user.followers.length)) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        followerCount: user.followers.length,
        followingCount: user.following.length,
        postCount,
        reelCount,
        totalLikes,
        totalComments,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        followerHistory
      }
    });
  } catch (error) {
    console.error('Get account overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get content performance analytics
 * @route   GET /api/analytics/content-performance
 * @access  Private
 */
exports.getContentPerformance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30days', contentType } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Build query
    const query = {
      user: userId,
      isArchived: false,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Get content based on type
    let posts = [];
    let reels = [];

    if (!contentType || contentType === 'post') {
      posts = await Post.find(query)
        .select('image caption likes comments views createdAt')
        .sort({ createdAt: -1 });
    }

    if (!contentType || contentType === 'reel') {
      reels = await Reel.find(query)
        .select('video thumbnail caption likes comments views createdAt')
        .sort({ createdAt: -1 });
    }

    // Process post data
    const postData = posts.map(post => ({
      id: post._id,
      type: 'post',
      thumbnail: post.image,
      caption: post.caption,
      likes: post.likes.length,
      comments: post.comments.length,
      views: post.views || 0,
      engagementRate: ((post.likes.length + post.comments.length) / Math.max(post.views || 1, 1)) * 100,
      createdAt: post.createdAt
    }));

    // Process reel data
    const reelData = reels.map(reel => ({
      id: reel._id,
      type: 'reel',
      thumbnail: reel.thumbnail,
      caption: reel.caption,
      likes: reel.likes.length,
      comments: reel.comments.length,
      views: reel.views || 0,
      engagementRate: ((reel.likes.length + reel.comments.length) / Math.max(reel.views || 1, 1)) * 100,
      createdAt: reel.createdAt
    }));

    // Combine and sort by engagement rate
    const allContent = [...postData, ...reelData].sort((a, b) => b.engagementRate - a.engagementRate);

    // Calculate summary statistics
    const totalLikes = allContent.reduce((sum, item) => sum + item.likes, 0);
    const totalComments = allContent.reduce((sum, item) => sum + item.comments, 0);
    const totalViews = allContent.reduce((sum, item) => sum + item.views, 0);
    const avgEngagementRate = allContent.length > 0 ?
      allContent.reduce((sum, item) => sum + item.engagementRate, 0) / allContent.length : 0;

    res.status(200).json({
      success: true,
      data: {
        content: allContent,
        summary: {
          totalContent: allContent.length,
          totalLikes,
          totalComments,
          totalViews,
          avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2))
        },
        topPerforming: allContent.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get content performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get audience insights
 * @route   GET /api/analytics/audience-insights
 * @access  Private
 */
exports.getAudienceInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's followers
    const user = await User.findById(userId).populate('followers', 'gender lastActive createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Process follower data
    const followers = user.followers;

    // Gender distribution
    const genderDistribution = {
      male: 0,
      female: 0,
      other: 0,
      unspecified: 0
    };

    followers.forEach(follower => {
      if (follower.gender === 'male') genderDistribution.male++;
      else if (follower.gender === 'female') genderDistribution.female++;
      else if (follower.gender === 'other') genderDistribution.other++;
      else genderDistribution.unspecified++;
    });

    // Convert to percentages
    const totalFollowers = followers.length;
    if (totalFollowers > 0) {
      genderDistribution.male = parseFloat(((genderDistribution.male / totalFollowers) * 100).toFixed(1));
      genderDistribution.female = parseFloat(((genderDistribution.female / totalFollowers) * 100).toFixed(1));
      genderDistribution.other = parseFloat(((genderDistribution.other / totalFollowers) * 100).toFixed(1));
      genderDistribution.unspecified = parseFloat(((genderDistribution.unspecified / totalFollowers) * 100).toFixed(1));
    }

    // Activity times (based on lastActive)
    const activityHours = Array(24).fill(0);

    followers.forEach(follower => {
      if (follower.lastActive) {
        const hour = new Date(follower.lastActive).getHours();
        activityHours[hour]++;
      }
    });

    // Follower growth over time
    const followerGrowth = [];
    const now = new Date();
    const monthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 6 months of data

    // Group followers by month they started following
    const followersByMonth = {};

    // Initialize months
    for (let i = 0; i <= 5; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      followersByMonth[monthKey] = 0;
    }

    // Count followers by month (simulated data for now)
    // In a real implementation, you would track when users followed each other
    followers.forEach(follower => {
      const followDate = follower.createdAt; // Using creation date as a proxy
      if (followDate && followDate >= monthsAgo) {
        const monthKey = `${followDate.getFullYear()}-${String(followDate.getMonth() + 1).padStart(2, '0')}`;
        if (followersByMonth[monthKey] !== undefined) {
          followersByMonth[monthKey]++;
        }
      }
    });

    // Convert to array format
    for (const [month, count] of Object.entries(followersByMonth)) {
      followerGrowth.push({
        month,
        count
      });
    }

    // Sort follower growth by month (ascending)
    followerGrowth.sort((a, b) => a.month.localeCompare(b.month));

    res.status(200).json({
      success: true,
      data: {
        genderDistribution,
        activityHours,
        followerGrowth,
        totalFollowers
      }
    });
  } catch (error) {
    console.error('Get audience insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get engagement metrics
 * @route   GET /api/analytics/engagement
 * @access  Private
 */
exports.getEngagementMetrics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30days' } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get user data
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get posts and reels within date range
    const posts = await Post.find({
      user: userId,
      isArchived: false,
      createdAt: { $gte: startDate, $lte: endDate }
    }).select('likes comments views createdAt');

    const reels = await Reel.find({
      user: userId,
      isArchived: false,
      createdAt: { $gte: startDate, $lte: endDate }
    }).select('likes comments views createdAt');

    // Calculate daily engagement metrics
    const dailyMetrics = {};
    const dateFormat = date => date.toISOString().split('T')[0];

    // Initialize daily metrics for each day in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = dateFormat(d);
      dailyMetrics[dateKey] = {
        likes: 0,
        comments: 0,
        views: 0,
        engagementRate: 0
      };
    }

    // Process posts
    posts.forEach(post => {
      const dateKey = dateFormat(post.createdAt);
      if (dailyMetrics[dateKey]) {
        dailyMetrics[dateKey].likes += post.likes.length;
        dailyMetrics[dateKey].comments += post.comments.length;
        dailyMetrics[dateKey].views += post.views || 0;
      }
    });

    // Process reels
    reels.forEach(reel => {
      const dateKey = dateFormat(reel.createdAt);
      if (dailyMetrics[dateKey]) {
        dailyMetrics[dateKey].likes += reel.likes.length;
        dailyMetrics[dateKey].comments += reel.comments.length;
        dailyMetrics[dateKey].views += reel.views || 0;
      }
    });

    // Calculate engagement rates
    const followerCount = user.followers.length || 1; // Avoid division by zero

    for (const dateKey in dailyMetrics) {
      const metrics = dailyMetrics[dateKey];
      const interactions = metrics.likes + metrics.comments;
      const viewsOrFollowers = Math.max(metrics.views, followerCount);
      metrics.engagementRate = parseFloat(((interactions / viewsOrFollowers) * 100).toFixed(2));
    }

    // Convert to array format
    const engagementData = Object.entries(dailyMetrics).map(([date, metrics]) => ({
      date,
      ...metrics
    }));

    // Sort by date
    engagementData.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate overall metrics
    const totalLikes = engagementData.reduce((sum, day) => sum + day.likes, 0);
    const totalComments = engagementData.reduce((sum, day) => sum + day.comments, 0);
    const totalViews = engagementData.reduce((sum, day) => sum + day.views, 0);
    const totalInteractions = totalLikes + totalComments;
    const overallEngagementRate = parseFloat(((totalInteractions / Math.max(totalViews, followerCount)) * 100).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        daily: engagementData,
        summary: {
          totalLikes,
          totalComments,
          totalViews,
          totalInteractions,
          overallEngagementRate
        }
      }
    });
  } catch (error) {
    console.error('Get engagement metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get reach and impressions
 * @route   GET /api/analytics/reach-impressions
 * @access  Private
 */
exports.getReachAndImpressions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30days' } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get posts and reels within date range
    const posts = await Post.find({
      user: userId,
      isArchived: false,
      createdAt: { $gte: startDate, $lte: endDate }
    }).select('views impressions createdAt');

    const reels = await Reel.find({
      user: userId,
      isArchived: false,
      createdAt: { $gte: startDate, $lte: endDate }
    }).select('views impressions createdAt');

    // Calculate daily reach and impressions
    const dailyMetrics = {};
    const dateFormat = date => date.toISOString().split('T')[0];

    // Initialize daily metrics for each day in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = dateFormat(d);
      dailyMetrics[dateKey] = {
        reach: 0,
        impressions: 0
      };
    }

    // Process posts (using views as reach and impressions as impressions)
    posts.forEach(post => {
      const dateKey = dateFormat(post.createdAt);
      if (dailyMetrics[dateKey]) {
        dailyMetrics[dateKey].reach += post.views || 0;
        dailyMetrics[dateKey].impressions += post.impressions || post.views || 0;
      }
    });

    // Process reels
    reels.forEach(reel => {
      const dateKey = dateFormat(reel.createdAt);
      if (dailyMetrics[dateKey]) {
        dailyMetrics[dateKey].reach += reel.views || 0;
        dailyMetrics[dateKey].impressions += reel.impressions || reel.views || 0;
      }
    });

    // Convert to array format
    const reachData = Object.entries(dailyMetrics).map(([date, metrics]) => ({
      date,
      ...metrics
    }));

    // Sort by date
    reachData.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate overall metrics
    const totalReach = reachData.reduce((sum, day) => sum + day.reach, 0);
    const totalImpressions = reachData.reduce((sum, day) => sum + day.impressions, 0);

    res.status(200).json({
      success: true,
      data: {
        daily: reachData,
        summary: {
          totalReach,
          totalImpressions,
          avgImpressions: totalReach > 0 ? parseFloat((totalImpressions / totalReach).toFixed(2)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get reach and impressions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};