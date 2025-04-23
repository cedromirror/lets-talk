const LiveStream = require('../models/LiveStream');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new livestream
// @route   POST /api/live
// @access  Private
exports.createLiveStream = async (req, res) => {
  try {
    const { title, description, isPrivate, allowedUsers } = req.body;

    // Generate a unique stream key
    const streamKey = uuidv4();

    // Create new livestream using MongoDB
    const livestream = new LiveStream({
      user: req.user.id,
      title,
      description,
      streamKey,
      isPrivate: isPrivate || false,
      allowedViewers: isPrivate ? allowedUsers : [],
      status: 'scheduled'
    });

    await livestream.save();

    res.status(201).json({
      success: true,
      data: livestream
    });
  } catch (error) {
    console.error('Error creating livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all active livestreams
// @route   GET /api/live
// @access  Public
exports.getLiveStreams = async (req, res) => {
  try {
    const livestreams = await LiveStream.find({ status: 'live' })
      .populate('user', 'username avatar')
      .sort({ startedAt: -1 });

    res.status(200).json({
      success: true,
      count: livestreams.length,
      data: livestreams
    });
  } catch (error) {
    console.error('Error getting livestreams:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a single livestream
// @route   GET /api/live/:id
// @access  Public
exports.getLiveStream = async (req, res) => {
  try {
    const livestream = await LiveStream.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('viewers.user', 'username avatar');

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Check if private and user is allowed
    if (livestream.isPrivate) {
      // If not logged in, deny access
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'This is a private livestream'
        });
      }

      // If not the creator or in allowed viewers, deny access
      if (
        livestream.user._id.toString() !== req.user.id &&
        !livestream.allowedViewers.includes(req.user.id)
      ) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this livestream'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: livestream
    });
  } catch (error) {
    console.error('Error getting livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Start a livestream
// @route   PUT /api/live/:id/start
// @access  Private
exports.startLiveStream = async (req, res) => {
  try {
    const livestream = await LiveStream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Check if user is the creator
    if (livestream.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this livestream'
      });
    }

    // Update livestream status
    livestream.status = 'live';
    livestream.startedAt = new Date();
    await livestream.save();

    res.status(200).json({
      success: true,
      data: livestream
    });
  } catch (error) {
    console.error('Error starting livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    End a livestream
// @route   PUT /api/live/:id/end
// @access  Private
exports.endLiveStream = async (req, res) => {
  try {
    const livestream = await LiveStream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Check if user is the creator
    if (livestream.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this livestream'
      });
    }

    // Update livestream status
    livestream.status = 'ended';
    livestream.endedAt = new Date();

    // Calculate duration
    if (livestream.startedAt) {
      const durationMs = new Date() - livestream.startedAt;
      livestream.duration = Math.floor(durationMs / 1000); // Convert to seconds
    }

    await livestream.save();

    res.status(200).json({
      success: true,
      data: livestream
    });
  } catch (error) {
    console.error('Error ending livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Join a livestream
// @route   POST /api/live/:id/join
// @access  Private
exports.joinLiveStream = async (req, res) => {
  try {
    const livestream = await LiveStream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Check if livestream is private and user is allowed
    if (livestream.isPrivate && !livestream.canUserView(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this livestream'
      });
    }

    // Check if user is banned
    if (livestream.isUserBanned(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You have been banned from this livestream'
      });
    }

    // Add user to viewers if not already there
    const existingViewer = livestream.viewers.find(
      viewer => viewer.user.toString() === req.user.id
    );

    if (!existingViewer) {
      livestream.viewers.push({
        user: req.user.id,
        joinedAt: new Date()
      });

      // Increment current viewer count
      livestream.currentViewerCount += 1;

      // Update peak viewer count if needed
      if (livestream.currentViewerCount > livestream.peakViewerCount) {
        livestream.peakViewerCount = livestream.currentViewerCount;
      }

      // Increment total unique viewers
      livestream.totalUniqueViewers += 1;
    } else if (existingViewer.leftAt) {
      // User is rejoining
      existingViewer.joinedAt = new Date();
      existingViewer.leftAt = undefined;

      // Increment current viewer count
      livestream.currentViewerCount += 1;

      // Update peak viewer count if needed
      if (livestream.currentViewerCount > livestream.peakViewerCount) {
        livestream.peakViewerCount = livestream.currentViewerCount;
      }
    }

    await livestream.save();

    res.status(200).json({
      success: true,
      data: {
        streamId: livestream._id,
        viewerCount: livestream.currentViewerCount
      }
    });
  } catch (error) {
    console.error('Error joining livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Leave a livestream
// @route   POST /api/live/:id/leave
// @access  Private
exports.leaveLiveStream = async (req, res) => {
  try {
    const livestream = await LiveStream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Update viewer data
    const viewer = livestream.viewers.find(
      viewer => viewer.user.toString() === req.user.id
    );

    if (viewer && !viewer.leftAt) {
      viewer.leftAt = new Date();

      // Decrement current viewer count
      livestream.currentViewerCount = Math.max(0, livestream.currentViewerCount - 1);

      await livestream.save();
    }

    res.status(200).json({
      success: true,
      data: {
        streamId: livestream._id,
        viewerCount: livestream.currentViewerCount
      }
    });
  } catch (error) {
    console.error('Error leaving livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get livestream viewers
// @route   GET /api/live/:id/viewers
// @access  Public
exports.getLiveStreamViewers = async (req, res) => {
  try {
    const livestream = await LiveStream.findById(req.params.id)
      .populate('viewers.user', 'username avatar');

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Filter to get only current viewers (those without a leftAt time)
    const currentViewers = livestream.viewers.filter(viewer => !viewer.leftAt);

    res.status(200).json({
      success: true,
      count: currentViewers.length,
      data: currentViewers
    });
  } catch (error) {
    console.error('Error getting livestream viewers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add a comment to a livestream
// @route   POST /api/live/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const livestream = await LiveStream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Check if comments are allowed
    if (!livestream.settings.allowComments) {
      return res.status(403).json({
        success: false,
        message: 'Comments are disabled for this livestream'
      });
    }

    // Check if user is banned
    if (livestream.isUserBanned(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You have been banned from this livestream'
      });
    }

    // Add comment
    const comment = {
      user: req.user.id,
      text,
      createdAt: new Date()
    };

    livestream.comments.push(comment);
    await livestream.save();

    // Populate user data
    const user = await User.findById(req.user.id).select('username avatar');

    const populatedComment = {
      ...comment.toObject(),
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar
      }
    };

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get livestream comments
// @route   GET /api/live/:id/comments
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const livestream = await LiveStream.findById(req.params.id)
      .populate('comments.user', 'username avatar');

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    res.status(200).json({
      success: true,
      count: livestream.comments.length,
      data: livestream.comments
    });
  } catch (error) {
    console.error('Error getting livestream comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's livestreams
// @route   GET /api/live/user/:username
// @access  Public
exports.getUserLiveStreams = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all livestreams by the user
    const livestreams = await LiveStream.find({ user: user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: livestreams.length,
      data: livestreams
    });
  } catch (error) {
    console.error('Error getting user livestreams:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a livestream
// @route   DELETE /api/live/:id
// @access  Private
exports.deleteLiveStream = async (req, res) => {
  try {
    const livestream = await LiveStream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Check if user is the creator
    if (livestream.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this livestream'
      });
    }

    await livestream.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update a livestream
// @route   PUT /api/live/:id
// @access  Private
exports.updateLiveStream = async (req, res) => {
  try {
    const { title, description, isPrivate, allowedUsers } = req.body;

    const livestream = await LiveStream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Check if user is the creator
    if (livestream.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this livestream'
      });
    }

    // Update fields
    if (title) livestream.title = title;
    if (description !== undefined) livestream.description = description;
    if (isPrivate !== undefined) livestream.isPrivate = isPrivate;
    if (allowedUsers) livestream.allowedViewers = isPrivate ? allowedUsers : [];

    await livestream.save();

    res.status(200).json({
      success: true,
      data: livestream
    });
  } catch (error) {
    console.error('Error updating livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
