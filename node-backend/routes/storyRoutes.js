const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const mongoose = require('mongoose');

// Import User model
const User = require('../models/User');

// Import Story model
const Story = require('../models/Story');

// In-memory stories array for development/testing
let stories = [];

// Get all stories (for the feed)
const getStories = async (req, res) => {
  try {
    // If we have a real User model, get stories from users the current user follows
    if (User && req.user) {
      // Get users the current user follows
      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get stories from followed users and the user's own stories
      const followedUsers = currentUser.following || [];
      const relevantStories = stories.filter(story => {
        // Include stories from followed users and the user's own stories
        return followedUsers.includes(story.user._id) || story.user._id === req.user._id.toString();
      });

      // Add viewed status for the current user
      const storiesWithViewStatus = relevantStories.map(story => {
        return {
          ...story,
          isViewed: story.viewers.some(viewer => viewer.user === req.user._id.toString())
        };
      });

      return res.status(200).json({
        success: true,
        data: storiesWithViewStatus
      });
    }

    // If we don't have a real User model, return all stories
    res.status(200).json({
      success: true,
      data: stories
    });
  } catch (error) {
    console.error('Error getting stories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create a new story
const createStory = async (req, res) => {
  try {
    console.log('Creating new story...');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    // Get data from request
    const { caption, location, type } = req.body;

    // Check if file was uploaded and processed by Cloudinary
    if (!req.file || !req.file.cloudinaryUrl) {
      console.error('No file uploaded or Cloudinary processing failed');
      return res.status(400).json({
        success: false,
        message: 'Media file is required for creating a story'
      });
    }

    // Get media URLs (optimized if available)
    const mediaUrl = req.file.cloudinaryUrl;
    const optimizedMediaUrl = req.file.optimizedUrl || mediaUrl;
    const lowQualityMediaUrl = req.file.lowQualityUrl || null;

    // Create thumbnail if not provided
    let thumbnail = null;
    if (mediaUrl && mediaUrl.includes('cloudinary.com')) {
      // Extract base URL and transformations
      const urlParts = mediaUrl.split('/upload/');
      if (urlParts.length === 2) {
        // Create a thumbnail version based on media type
        if (type === 'video') {
          thumbnail = `${urlParts[0]}/upload/w_320,h_320,c_fill,g_auto,q_auto,f_auto,so_0/${urlParts[1]}`;
        } else {
          thumbnail = `${urlParts[0]}/upload/w_320,h_320,c_fill,g_auto,q_auto,f_auto/${urlParts[1]}`;
        }
      }
    }

    // Create a new story in the database
    const newStory = new Story({
      user: req.user._id,
      type: type || 'image',
      media: mediaUrl,
      optimizedMedia: optimizedMediaUrl,
      lowQualityMedia: lowQualityMediaUrl,
      thumbnail: thumbnail,
      caption: caption || '',
      location: location || ''
    });

    // Save the story to the database
    await newStory.save();
    console.log('Story saved to database:', newStory._id);

    // Populate user information
    const populatedStory = await Story.findById(newStory._id).populate('user', 'username avatar fullName');

    // Also add to in-memory array for backward compatibility
    const storyForMemory = {
      ...populatedStory.toObject(),
      user: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar || '/images/default-avatar.png',
        fullName: req.user.fullName || req.user.username
      }
    };
    stories.push(storyForMemory);

    res.status(201).json({
      success: true,
      data: populatedStory
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    // Find the story
    const storyIndex = stories.findIndex(story => story._id === storyId);

    if (storyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if the user is the owner of the story
    if (req.user && stories[storyIndex].user._id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this story'
      });
    }

    // Remove the story
    stories.splice(storyIndex, 1);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Mark a story as viewed
const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    // Find the story
    const storyIndex = stories.findIndex(story => story._id === storyId);

    if (storyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if the story is private and user is allowed
    if (stories[storyIndex].isPrivate) {
      const isAllowed = stories[storyIndex].allowedUsers.includes(req.user._id.toString());
      const isOwner = stories[storyIndex].user._id === req.user._id.toString();

      if (!isAllowed && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this story'
        });
      }
    }

    // Check if the user has already viewed the story
    const alreadyViewed = stories[storyIndex].viewers.some(
      viewer => viewer.user === req.user._id.toString()
    );

    if (!alreadyViewed) {
      // Add user to viewers
      stories[storyIndex].viewers.push({
        user: req.user._id.toString(),
        viewedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: stories[storyIndex]
    });
  } catch (error) {
    console.error('Error viewing story:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Reply to a story
const replyToStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { text } = req.body;

    // Find the story
    const storyIndex = stories.findIndex(story => story._id === storyId);

    if (storyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if the story is private and user is allowed
    if (stories[storyIndex].isPrivate) {
      const isAllowed = stories[storyIndex].allowedUsers.includes(req.user._id.toString());
      const isOwner = stories[storyIndex].user._id === req.user._id.toString();

      if (!isAllowed && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to reply to this story'
        });
      }
    }

    // Create reply object
    const reply = {
      _id: new mongoose.Types.ObjectId().toString(),
      story: storyId,
      user: req.user ? {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar || '/images/default-avatar.png',
        fullName: req.user.fullName || req.user.username
      } : {
        _id: '1',
        username: 'user1',
        avatar: '/images/default-avatar.png',
        fullName: 'User One'
      },
      text: text,
      createdAt: new Date()
    };

    // Add reply to story
    if (!stories[storyIndex].replies) {
      stories[storyIndex].replies = [];
    }
    stories[storyIndex].replies.push(reply);

    res.status(200).json({
      success: true,
      data: reply
    });
  } catch (error) {
    console.error('Error replying to story:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add reaction to a story
const addReaction = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { emoji } = req.body;

    // Find the story
    const storyIndex = stories.findIndex(story => story._id === storyId);

    if (storyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if the story is private and user is allowed
    if (stories[storyIndex].isPrivate) {
      const isAllowed = stories[storyIndex].allowedUsers.includes(req.user._id.toString());
      const isOwner = stories[storyIndex].user._id === req.user._id.toString();

      if (!isAllowed && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to react to this story'
        });
      }
    }

    // Create reaction object
    const reaction = {
      _id: new mongoose.Types.ObjectId().toString(),
      user: req.user ? {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar || '/images/default-avatar.png',
        fullName: req.user.fullName || req.user.username
      } : {
        _id: '1',
        username: 'user1',
        avatar: '/images/default-avatar.png',
        fullName: 'User One'
      },
      emoji: emoji,
      createdAt: new Date()
    };

    // Add reaction to story
    stories[storyIndex].reactions.push(reaction);

    res.status(200).json({
      success: true,
      data: reaction
    });
  } catch (error) {
    console.error('Error adding reaction to story:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get stories by user
const getUserStories = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user stories
    const userStories = stories.filter(story => story.user.username === username);

    // Check if any stories are private
    const filteredStories = userStories.filter(story => {
      if (!story.isPrivate) return true;
      if (req.user && story.user._id === req.user._id.toString()) return true;
      if (req.user && story.allowedUsers.includes(req.user._id.toString())) return true;
      return false;
    });

    // Add viewed status for the current user
    const storiesWithViewStatus = filteredStories.map(story => {
      return {
        ...story,
        isViewed: req.user ? story.viewers.some(viewer => viewer.user === req.user._id.toString()) : false
      };
    });

    res.status(200).json({
      success: true,
      data: storiesWithViewStatus
    });
  } catch (error) {
    console.error('Error getting user stories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get suggested stories
const getSuggestedStories = async (req, res) => {
  try {
    // If we have a real User model, get stories from users the current user might be interested in
    if (User && req.user) {
      // Get users the current user follows
      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get stories from users the current user doesn't follow
      const followedUsers = currentUser.following || [];
      const suggestedStories = stories.filter(story => {
        // Exclude stories from followed users and the user's own stories
        // Only include public stories
        return !followedUsers.includes(story.user._id) &&
               story.user._id !== req.user._id.toString() &&
               !story.isPrivate;
      });

      // Add viewed status for the current user
      const storiesWithViewStatus = suggestedStories.map(story => {
        return {
          ...story,
          isViewed: story.viewers.some(viewer => viewer.user === req.user._id.toString())
        };
      });

      return res.status(200).json({
        success: true,
        data: storiesWithViewStatus
      });
    }

    // If we don't have a real User model, return all public stories
    const publicStories = stories.filter(story => !story.isPrivate);
    res.status(200).json({
      success: true,
      data: publicStories
    });
  } catch (error) {
    console.error('Error getting suggested stories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add story to highlights
const addToHighlights = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { highlightName } = req.body;

    // Find the story
    const storyIndex = stories.findIndex(story => story._id === storyId);

    if (storyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if the user is the owner of the story
    if (req.user && stories[storyIndex].user._id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add this story to highlights'
      });
    }

    // Update story
    stories[storyIndex].isHighlight = true;
    stories[storyIndex].highlightName = highlightName || 'Highlights';
    // Extend expiration for highlighted stories
    stories[storyIndex].expiresAt = null;

    res.status(200).json({
      success: true,
      data: stories[storyIndex]
    });
  } catch (error) {
    console.error('Error adding story to highlights:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user highlights
const getUserHighlights = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user highlights
    const userHighlights = stories.filter(
      story => story.user.username === username && story.isHighlight
    );

    // Group highlights by name
    const highlights = {};
    userHighlights.forEach(story => {
      const name = story.highlightName || 'Highlights';
      if (!highlights[name]) {
        highlights[name] = [];
      }
      highlights[name].push(story);
    });

    // Convert to array format
    const highlightsArray = Object.keys(highlights).map(name => ({
      name,
      stories: highlights[name],
      coverImage: highlights[name][0].media
    }));

    res.status(200).json({
      success: true,
      data: highlightsArray
    });
  } catch (error) {
    console.error('Error getting user highlights:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Public routes
router.get('/', getStories);
router.get('/suggested', getSuggestedStories);
router.get('/user/:username', getUserStories);
router.get('/highlights/:username', getUserHighlights);

// Protected routes
router.use(protect);
router.post('/', upload.single('media'), uploadToCloudinary('stories'), createStory);
router.delete('/:storyId', deleteStory);
router.post('/:storyId/view', viewStory);
router.post('/:storyId/reply', replyToStory);
router.post('/:storyId/reaction', addReaction);
router.post('/:storyId/highlight', addToHighlights);

module.exports = router;
