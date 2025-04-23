const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// Apply authentication middleware to all routes
router.use(protect);

// Conversation routes
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:id', messageController.getConversationById);
router.post('/conversations', messageController.createConversation);
router.put('/conversations/:id', messageController.updateConversation);
router.delete('/conversations/:id', messageController.deleteConversation);

// Message routes
router.get('/conversations/:id/messages', messageController.getMessages);
router.post('/conversations/:id/messages', upload.array('attachments', 5), uploadToCloudinary('messages'), messageController.sendMessage);
router.put('/messages/:id', messageController.updateMessage);
router.delete('/messages/:id', messageController.deleteMessage);
router.put('/conversations/:id/read', messageController.markConversationAsRead);

// Message reactions
router.post('/messages/:id/reactions', messageController.addReaction);
router.delete('/messages/:id/reactions/:emoji', messageController.removeReaction);
router.get('/messages/:id/reactions', messageController.getReactions);

// Message replies
router.post('/messages/:id/reply', upload.array('attachments', 5), uploadToCloudinary('messages'), messageController.replyToMessage);

// Message forwarding
router.post('/messages/:id/forward', messageController.forwardMessage);

// Search messages
router.get('/search', messageController.searchMessages);

module.exports = router;
