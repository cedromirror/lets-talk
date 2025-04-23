const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/healthController');

// Health check route
router.get('/', getHealth);

module.exports = router;
