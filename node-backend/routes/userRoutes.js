const express = require('express');
const router = express.Router();
const {
  getUserByUsername,
  getUserPosts,
  getUserReels,
  getUserLivestreams,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getUserFollowers,
  getUserFollowing,
  getUserStories,
  getSuggestedUsers,
  getFollowRequests,
  removeFollower,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/username/:username', getUserByUsername);
router.get('/suggested', getSuggestedUsers); // Make suggested users public
router.get('/suggestions', getSuggestedUsers); // Add alias for compatibility

// Protected routes
router.use(protect);

router.post('/:username/follow', followUser);
router.post('/username/:username/follow', followUser); // Add alternative route format
router.post('/id/:userId/follow', followUser); // Add ID-based route
router.post('/follow/:userId', followUser); // Add another alternative format

router.post('/:username/unfollow', unfollowUser);
router.post('/username/:username/unfollow', unfollowUser); // Add alternative route format
router.post('/id/:userId/unfollow', unfollowUser); // Add ID-based route
router.post('/unfollow/:userId', unfollowUser); // Add another alternative format

// Other user routes
router.get('/:username', getUserByUsername); // Add this route to handle both formats
router.get('/:username/posts', getUserPosts);
router.get('/:username/reels', getUserReels);
router.get('/:username/livestreams', getUserLivestreams);
router.get('/:username/followers', getUserFollowers);
router.get('/:username/following', getUserFollowing);
router.get('/:userId/followers', getUserFollowers);
router.get('/:userId/following', getUserFollowing);
router.get('/:username/stories', getUserStories);
router.get('/:username/stats', getUserStats);
router.get('/:userId/stats', getUserStats);

router.post('/:username/remove-follower', removeFollower);
router.post('/id/:userId/remove-follower', removeFollower); // Add ID-based route for compatibility
router.post('/remove-follower/:userId', removeFollower); // Add another alternative format
router.get('/follow-requests', getFollowRequests);
router.post('/follow-requests/:userId/accept', acceptFollowRequest);
router.post('/follow-requests/:userId/reject', rejectFollowRequest);

module.exports = router;
