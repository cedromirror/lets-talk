const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getSettings,
  updateSettings
} = require('../controllers/notificationController');

// Protected routes
router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.get('/unread-count', getUnreadCount);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
