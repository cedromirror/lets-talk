const fetch = require('node-fetch');

// Base URL for API requests
const baseUrl = 'http://localhost:60000';

// Test endpoints
const endpoints = [
  { method: 'GET', url: '/health', description: 'Health check' },
  { method: 'GET', url: '/api/health', description: 'API health check' },
  { method: 'POST', url: '/api/auth/register', description: 'Register endpoint', 
    body: { 
      username: `testuser${Date.now()}`, 
      email: `test${Date.now()}@example.com`, 
      password: 'password123', 
      fullName: 'Test User' 
    } 
  },
  { method: 'POST', url: '/auth/register', description: 'Register endpoint (no /api prefix)', 
    body: { 
      username: `testuser${Date.now()+1}`, 
      email: `test${Date.now()+1}@example.com`, 
      password: 'password123', 
      fullName: 'Test User' 
    } 
  }
];

// Test each endpoint
async function testEndpoints() {
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.url} - ${endpoint.description}`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`${baseUrl}${endpoint.url}`, options);
      const status = response.status;
      let data;
      
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Could not parse JSON response' };
      }
      
      console.log(`Status: ${status}`);
      console.log('Response:', data);
      console.log('-----------------------------------');
    } catch (error) {
      console.error(`Error testing ${endpoint.url}:`, error.message);
      console.log('-----------------------------------');
    }
  }
}

// Run the tests
testEndpoints();
