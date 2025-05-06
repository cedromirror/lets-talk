/**
 * Health Controller
 * 
 * Provides endpoints for checking the health of the application
 */

const mongoose = require('mongoose');

// @desc    Get health status
// @route   GET /api/health
// @access  Public
exports.getHealth = (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState;
    let dbStatusText;
    
    switch (dbStatus) {
      case 0:
        dbStatusText = 'disconnected';
        break;
      case 1:
        dbStatusText = 'connected';
        break;
      case 2:
        dbStatusText = 'connecting';
        break;
      case 3:
        dbStatusText = 'disconnecting';
        break;
      default:
        dbStatusText = 'unknown';
    }

    // Return health status
    res.status(200).json({
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatusText,
        connected: dbStatus === 1
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};
