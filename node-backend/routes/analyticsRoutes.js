const express = require('express');
const router = express.Router();
const {
  getAccountOverview,
  getContentPerformance,
  getAudienceInsights,
  getEngagementMetrics,
  getReachAndImpressions
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// All analytics routes require authentication
router.use(protect);

// Analytics routes
router.get('/account-overview', getAccountOverview);
router.get('/content-performance', getContentPerformance);
router.get('/audience-insights', getAudienceInsights);
router.get('/engagement', getEngagementMetrics);
router.get('/reach-impressions', getReachAndImpressions);

// Dashboard data route
router.get('/dashboard', async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user._id;
    
    // Get account overview
    const accountOverviewData = await getAccountOverview(req, { 
      status: (code, data) => ({ code, data }),
      json: (data) => data
    });
    
    // Get content performance
    const contentPerformanceData = await getContentPerformance(req, {
      status: (code, data) => ({ code, data }),
      json: (data) => data
    });
    
    // Get audience insights
    const audienceInsightsData = await getAudienceInsights(req, {
      status: (code, data) => ({ code, data }),
      json: (data) => data
    });
    
    // Combine all data
    const dashboardData = {
      success: true,
      data: {
        accountOverview: accountOverviewData.data,
        contentPerformance: contentPerformanceData.data,
        audienceInsights: audienceInsightsData.data
      }
    };
    
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

module.exports = router;
