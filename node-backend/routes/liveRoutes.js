const express = require('express');
const router = express.Router();
const {
  createLiveStream,
  getLiveStreams,
  getLiveStream,
  startLiveStream,
  endLiveStream,
  joinLiveStream,
  leaveLiveStream,
  getLiveStreamViewers,
  addComment,
  getComments,
  getUserLiveStreams,
  deleteLiveStream,
  updateLiveStream
} = require('../controllers/liveController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getLiveStreams);
router.get('/:id', getLiveStream);
router.get('/:id/viewers', getLiveStreamViewers);
router.get('/:id/comments', getComments);
router.get('/user/:username', getUserLiveStreams);

// Protected routes
router.use(protect);

router.post('/', createLiveStream);
router.put('/:id', updateLiveStream);
router.delete('/:id', deleteLiveStream);
router.put('/:id/start', startLiveStream);
router.put('/:id/end', endLiveStream);
router.post('/:id/join', joinLiveStream);
router.post('/:id/leave', leaveLiveStream);
router.post('/:id/comments', addComment);

module.exports = router;
