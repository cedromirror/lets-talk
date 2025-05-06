const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Get notifications for the current user
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('sender', 'username avatar fullName')
      .populate('targetId');

    // Get total count
    const total = await Notification.countDocuments({ recipient: req.user._id });

    // Return empty array if no notifications exist
    if (notifications.length === 0) {
      return res.status(200).json({
        success: true,
        notifications: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Find notification
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to the current user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this notification as read'
      });
    }

    // Mark as read
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    // Update all unread notifications for the current user
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    // Count unread notifications
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    // Get user notification settings
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize notifications object if it doesn't exist
    if (!user.notifications) {
      user.notifications = {
        likes: true,
        comments: true,
        follows: true,
        messages: true,
        liveNotifications: true,
        postNotifications: true,
        storyNotifications: true,
        mentionNotifications: true,
        tagNotifications: true,
        emailNotifications: false,
        pushNotifications: true,
        soundNotifications: true
      };
      await user.save();
    }

    res.status(200).json({
      success: true,
      settings: user.notifications
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    const {
      likes,
      comments,
      follows,
      messages,
      liveNotifications,
      postNotifications,
      storyNotifications,
      mentionNotifications,
      tagNotifications,
      emailNotifications,
      pushNotifications,
      soundNotifications
    } = req.body;

    // Update user notification settings
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize notifications object if it doesn't exist
    if (!user.notifications) {
      user.notifications = {};
    }

    // Update settings
    if (likes !== undefined) user.notifications.likes = likes;
    if (comments !== undefined) user.notifications.comments = comments;
    if (follows !== undefined) user.notifications.follows = follows;
    if (messages !== undefined) user.notifications.messages = messages;
    if (liveNotifications !== undefined) user.notifications.liveNotifications = liveNotifications;
    if (postNotifications !== undefined) user.notifications.postNotifications = postNotifications;
    if (storyNotifications !== undefined) user.notifications.storyNotifications = storyNotifications;
    if (mentionNotifications !== undefined) user.notifications.mentionNotifications = mentionNotifications;
    if (tagNotifications !== undefined) user.notifications.tagNotifications = tagNotifications;
    if (emailNotifications !== undefined) user.notifications.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) user.notifications.pushNotifications = pushNotifications;
    if (soundNotifications !== undefined) user.notifications.soundNotifications = soundNotifications;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification settings updated',
      settings: user.notifications
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
