const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Report = require('../models/Report');

/**
 * @desc    Report content (post, reel, comment, user)
 * @route   POST /api/moderation/report
 * @access  Private
 */
exports.reportContent = async (req, res) => {
  try {
    const { contentType, contentId, reason, details } = req.body;
    
    // Validate content type
    const validContentTypes = ['post', 'reel', 'comment', 'user'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type'
      });
    }
    
    // Validate content exists
    let contentExists = false;
    let contentOwner = null;
    
    switch (contentType) {
      case 'post':
        const post = await Post.findById(contentId);
        contentExists = !!post;
        contentOwner = post ? post.user : null;
        break;
      case 'reel':
        const reel = await Reel.findById(contentId);
        contentExists = !!reel;
        contentOwner = reel ? reel.user : null;
        break;
      case 'comment':
        const comment = await Comment.findById(contentId);
        contentExists = !!comment;
        contentOwner = comment ? comment.user : null;
        break;
      case 'user':
        const user = await User.findById(contentId);
        contentExists = !!user;
        contentOwner = user ? user._id : null;
        break;
    }
    
    if (!contentExists) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Prevent reporting your own content
    if (contentOwner && contentOwner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own content'
      });
    }
    
    // Check if already reported by this user
    const existingReport = await Report.findOne({
      contentType,
      contentId,
      reportedBy: req.user._id
    });
    
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this content'
      });
    }
    
    // Create report
    const report = await Report.create({
      contentType,
      contentId,
      reason,
      details,
      reportedBy: req.user._id,
      contentOwner
    });
    
    res.status(201).json({
      success: true,
      message: 'Content reported successfully',
      reportId: report._id
    });
  } catch (error) {
    console.error('Report content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get reported content (for moderators and admins)
 * @route   GET /api/moderation/reports
 * @access  Private (moderator, admin)
 */
exports.getReports = async (req, res) => {
  try {
    // Check if user is moderator or admin
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const { status, contentType, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (contentType) query.contentType = contentType;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get reports with pagination
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'username avatar')
      .populate('contentOwner', 'username avatar');
    
    // Get total count
    const total = await Report.countDocuments(query);
    
    res.status(200).json({
      success: true,
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Review reported content (for moderators and admins)
 * @route   PUT /api/moderation/reports/:id
 * @access  Private (moderator, admin)
 */
exports.reviewReport = async (req, res) => {
  try {
    // Check if user is moderator or admin
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const { id } = req.params;
    const { status, moderationNotes, action } = req.body;
    
    // Find report
    const report = await Report.findById(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Update report
    report.status = status || report.status;
    report.moderationNotes = moderationNotes || report.moderationNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    
    await report.save();
    
    // Take action on content if needed
    if (action && status === 'approved') {
      switch (report.contentType) {
        case 'post':
          if (action === 'remove') {
            await Post.findByIdAndUpdate(report.contentId, { isArchived: true });
          }
          break;
        case 'reel':
          if (action === 'remove') {
            await Reel.findByIdAndUpdate(report.contentId, { isArchived: true });
          }
          break;
        case 'comment':
          if (action === 'remove') {
            await Comment.findByIdAndDelete(report.contentId);
          }
          break;
        case 'user':
          if (action === 'suspend') {
            await User.findByIdAndUpdate(report.contentId, { isSuspended: true });
          }
          break;
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Report reviewed successfully',
      report
    });
  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get moderation dashboard stats
 * @route   GET /api/moderation/stats
 * @access  Private (moderator, admin)
 */
exports.getModerationStats = async (req, res) => {
  try {
    // Check if user is moderator or admin
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Get counts by status
    const pendingCount = await Report.countDocuments({ status: 'pending' });
    const approvedCount = await Report.countDocuments({ status: 'approved' });
    const rejectedCount = await Report.countDocuments({ status: 'rejected' });
    
    // Get counts by content type
    const postCount = await Report.countDocuments({ contentType: 'post' });
    const reelCount = await Report.countDocuments({ contentType: 'reel' });
    const commentCount = await Report.countDocuments({ contentType: 'comment' });
    const userCount = await Report.countDocuments({ contentType: 'user' });
    
    // Get counts by reason
    const reasonCounts = await Report.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Calculate average response time (for reviewed reports)
    const responseTimeData = await Report.aggregate([
      {
        $match: {
          reviewedAt: { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          responseTime: { $subtract: ['$reviewedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          averageResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get top reporters (users who report the most)
    const topReporters = await Report.aggregate([
      {
        $group: {
          _id: '$reportedBy',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$user.username',
          avatar: '$user.avatar',
          reportCount: '$count'
        }
      }
    ]);
    
    // Get recent activity (last 5 reviewed reports)
    const recentActivity = await Report.find({
      reviewedAt: { $exists: true, $ne: null }
    })
      .sort({ reviewedAt: -1 })
      .limit(5)
      .populate('reviewedBy', 'username avatar')
      .populate('contentOwner', 'username avatar')
      .select('contentType status reason reviewedAt moderationNotes');
    
    // Get reports by day (for the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const reportsByDay = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format response time in minutes
    const responseTime = responseTimeData.length > 0 ? {
      average: Math.round(responseTimeData[0].averageResponseTime / (1000 * 60)), // Convert ms to minutes
      min: Math.round(responseTimeData[0].minResponseTime / (1000 * 60)),
      max: Math.round(responseTimeData[0].maxResponseTime / (1000 * 60)),
      count: responseTimeData[0].count
    } : null;
    
    // Return all stats
    res.status(200).json({
      success: true,
      stats: {
        counts: {
          total: pendingCount + approvedCount + rejectedCount,
          byStatus: {
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount
          },
          byContentType: {
            post: postCount,
            reel: reelCount,
            comment: commentCount,
            user: userCount
          }
        },
        reasonCounts: reasonCounts.map(item => ({
          reason: item._id,
          count: item.count
        })),
        responseTime,
        topReporters,
        recentActivity,
        reportsByDay: reportsByDay.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Get moderation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
