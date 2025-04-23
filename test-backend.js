const fetch = require('node-fetch');

// Test the backend health endpoint
async function testBackendHealth() {
  try {
    console.log('Testing backend health endpoint...');
    const response = await fetch('http://localhost:60000/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('Backend is running! Response:', data);
      return true;
    } else {
      console.error(`Backend health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Backend health check error:', error.message);
    return false;
  }
}

// Test the registration endpoint
async function testRegistration() {
  try {
    console.log('Testing registration endpoint...');
    
    // Generate a unique username and email
    const timestamp = Date.now();
    const testUser = {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123',
      fullName: 'Test User'
    };
    
    console.log('Attempting to register user:', testUser);
    
    const response = await fetch('http://localhost:60000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Registration successful! Response:', data);
      return true;
    } else {
      console.error('Registration failed! Response:', data);
      return false;
    }
  } catch (error) {
    console.error('Registration test error:', error.message);
    return false;
  }
}

// Run the tests
async function runTests() {
  const healthCheck = await testBackendHealth();
  
  if (healthCheck) {
    await testRegistration();
  } else {
    console.log('Skipping registration test because health check failed');
  }
}

runTests();
