const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeedPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostComments,
  addComment,
  archivePost,
  unarchivePost,
  getArchivedPosts
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const Comment = require('../models/Comment');
const User = require('../models/User');

// Public routes
router.get('/', (req, res) => {
  // Simple public endpoint that returns empty data
  res.status(200).json({
    success: true,
    posts: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    }
  });
});

// All routes below need authentication
router.use(protect);

// Feed posts route
router.get('/feed', getFeedPosts);

router.post('/', upload.single('image'), uploadToCloudinary('posts'), createPost);

router.get('/archived', getArchivedPosts);

router.route('/:id')
  .get(getPost)
  .put(updatePost)
  .delete(deletePost);

router.post('/:id/like', likePost);
router.post('/:id/unlike', unlikePost);

router.route('/:id/comments')
  .get(getPostComments)
  .post(addComment);

// Comment reply and like routes
router.post('/:id/comments/:commentId/replies', (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }

    // Find the comment
    Comment.findById(commentId)
      .then(comment => {
        if (!comment) {
          return res.status(404).json({
            success: false,
            message: 'Comment not found'
          });
        }

        // Create reply
        const reply = {
          user: req.user._id,
          text,
          createdAt: new Date()
        };

        // Add reply to comment
        comment.replies.push(reply);
        return comment.save();
      })
      .then(updatedComment => {
        // Populate user data for the new reply
        return User.findById(req.user._id)
          .select('username avatar fullName')
          .then(user => {
            const newReply = updatedComment.replies[updatedComment.replies.length - 1];
            return {
              ...newReply.toObject(),
              user: {
                _id: user._id,
                username: user.username,
                avatar: user.avatar,
                fullName: user.fullName
              }
            };
          });
      })
      .then(populatedReply => {
        res.status(201).json({
          success: true,
          reply: populatedReply
        });
      })
      .catch(err => {
        console.error('Error adding reply:', err);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      });
  } catch (error) {
    console.error('Error in reply route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/:id/comments/:commentId/like', (req, res) => {
  try {
    const { id, commentId } = req.params;

    // Find the comment
    Comment.findById(commentId)
      .then(comment => {
        if (!comment) {
          return res.status(404).json({
            success: false,
            message: 'Comment not found'
          });
        }

        // Check if already liked
        if (comment.likes.includes(req.user._id)) {
          return res.status(400).json({
            success: false,
            message: 'Comment already liked'
          });
        }

        // Add like
        comment.likes.push(req.user._id);
        return comment.save();
      })
      .then(updatedComment => {
        res.status(200).json({
          success: true,
          likesCount: updatedComment.likes.length
        });
      })
      .catch(err => {
        console.error('Error liking comment:', err);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      });
  } catch (error) {
    console.error('Error in like comment route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/:id/comments/:commentId/unlike', (req, res) => {
  try {
    const { id, commentId } = req.params;

    // Find the comment
    Comment.findById(commentId)
      .then(comment => {
        if (!comment) {
          return res.status(404).json({
            success: false,
            message: 'Comment not found'
          });
        }

        // Check if not liked
        if (!comment.likes.includes(req.user._id)) {
          return res.status(400).json({
            success: false,
            message: 'Comment not liked yet'
          });
        }

        // Remove like
        comment.likes = comment.likes.filter(like => like.toString() !== req.user._id.toString());
        return comment.save();
      })
      .then(updatedComment => {
        res.status(200).json({
          success: true,
          likesCount: updatedComment.likes.length
        });
      })
      .catch(err => {
        console.error('Error unliking comment:', err);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      });
  } catch (error) {
    console.error('Error in unlike comment route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/:id/archive', archivePost);
router.put('/:id/unarchive', unarchivePost);

module.exports = router;
