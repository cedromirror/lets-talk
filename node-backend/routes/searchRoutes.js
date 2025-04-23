const express = require('express');
const router = express.Router();
const { search, searchUsers, searchPosts, searchTags, searchReels, searchProducts } = require('../controllers/searchController');
const { optionalProtect } = require('../middleware/auth');

// Apply optional authentication middleware to all routes
// This allows both authenticated and unauthenticated users to search,
// but provides additional personalized data for authenticated users
router.use(optionalProtect);

// Search routes
router.get('/', search);
router.get('/users', searchUsers);
router.get('/posts', searchPosts);
router.get('/reels', searchReels);
router.get('/products', searchProducts);
router.get('/tags', searchTags);

module.exports = router;
