require('dotenv').config();
const axios = require('axios');

// API base URL
const API_URL = `http://localhost:${process.env.PORT || 8000}/api`;

// Test function to verify API connection
async function testApiConnection() {
  try {
    console.log('Testing API connection...');
    console.log('API URL:', API_URL);
    
    // Test health endpoint
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('Health endpoint response:', healthResponse.data);
    
    return {
      success: true,
      message: 'API connection successful',
      data: healthResponse.data
    };
  } catch (error) {
    console.error('API connection failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    return {
      success: false,
      message: 'API connection failed',
      error: error.message
    };
  }
}

// Run the test
testApiConnection()
  .then(result => {
    console.log('\nTest result:', result.success ? 'SUCCESS' : 'FAILED');
    console.log(result.message);
    
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error running API test:', error);
    process.exit(1);
  });
