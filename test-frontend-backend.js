const axios = require('axios');

// Test backend health
const testBackendHealth = async () => {
  try {
    console.log('Testing backend health...');
    const response = await axios.get('http://localhost:60000/api/health/check');
    console.log('Backend health check successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Backend health check failed!');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
};

// Test user login
const testUserLogin = async () => {
  try {
    console.log('\nTesting user login...');
    const credentials = {
      email: 'test_1745130794466@example.com',
      password: 'password123'
    };

    const response = await axios.post('http://localhost:60000/api/auth/login', credentials);
    console.log('Login successful!');
    console.log('Token:', response.data.token.substring(0, 20) + '...');
    return response.data.token;
  } catch (error) {
    console.error('Login failed!');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
};

// Test protected endpoint
const testProtectedEndpoint = async (token) => {
  try {
    console.log('\nTesting protected endpoint...');
    const response = await axios.get('http://localhost:60000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Protected endpoint access successful!');
    console.log('User data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Protected endpoint access failed!');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('=== BACKEND CONNECTION TESTS ===');

  // Test backend health
  const healthOk = await testBackendHealth();
  if (!healthOk) {
    console.error('Backend health check failed. Make sure the backend is running on port 60000.');
    return;
  }

  // Test user login
  const token = await testUserLogin();
  if (!token) {
    console.error('Login failed. Cannot proceed with protected endpoint test.');
    return;
  }

  // Test protected endpoint
  const protectedOk = await testProtectedEndpoint(token);
  if (!protectedOk) {
    console.error('Protected endpoint test failed.');
    return;
  }

  console.log('\n=== ALL TESTS PASSED ===');
  console.log('Backend is running correctly and authentication is working properly.');
  console.log('The frontend should be able to connect to the backend without issues.');
};

// Run the tests
runTests();
