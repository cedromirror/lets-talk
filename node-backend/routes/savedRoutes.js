const express = require('express');
const router = express.Router();
const {
  getSavedPosts,
  savePost,
  unsavePost
} = require('../controllers/savedController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getSavedPosts);
router.get('/posts', getSavedPosts); // Add alias for compatibility

// Protected routes
router.use(protect);

router.post('/:postId', savePost);
router.delete('/:postId', unsavePost);

module.exports = router;
