const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:60000';
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'password123'
};

// Helper function to log responses
const logResponse = (endpoint, response) => {
  console.log(`\n=== ${endpoint} ===`);
  console.log('Status:', response.status);
  console.log('Data:', JSON.stringify(response.data, null, 2));
};

// Helper function to log errors
const logError = (endpoint, error) => {
  console.error(`\n=== ${endpoint} ERROR ===`);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Status:', error.response.status);
    console.error('Data:', JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error:', error.message);
  }
};

// Test the health endpoint
const testHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    logResponse('Health Check', response);
    return true;
  } catch (error) {
    logError('Health Check', error);
    return false;
  }
};

// Test the login endpoint
const testLogin = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_USER);
    logResponse('Login', response);
    return response.data.token;
  } catch (error) {
    logError('Login', error);
    
    // Try alternative endpoint
    try {
      console.log('\nTrying alternative login endpoint...');
      const altResponse = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
      logResponse('Login (Alternative)', altResponse);
      return altResponse.data.token;
    } catch (altError) {
      logError('Login (Alternative)', altError);
      return null;
    }
  }
};

// Test the get current user endpoint
const testGetMe = async (token) => {
  if (!token) {
    console.error('\n=== Get Current User ===');
    console.error('Skipped: No authentication token available');
    return;
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, config);
    logResponse('Get Current User', response);
  } catch (error) {
    logError('Get Current User', error);
    
    // Try alternative endpoint
    try {
      console.log('\nTrying alternative get me endpoint...');
      const altResponse = await axios.get(`${API_BASE_URL}/auth/me`, config);
      logResponse('Get Current User (Alternative)', altResponse);
    } catch (altError) {
      logError('Get Current User (Alternative)', altError);
    }
  }
};

// Run all tests
const runTests = async () => {
  console.log('Starting API endpoint tests...');
  
  // Test health endpoint
  const healthOk = await testHealth();
  if (!healthOk) {
    console.error('\nHealth check failed. Make sure the backend server is running.');
    return;
  }
  
  // Test login
  const token = await testLogin();
  
  // Test get current user
  await testGetMe(token);
  
  console.log('\nTests completed.');
};

// Run the tests
runTests();
