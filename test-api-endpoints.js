const fetch = require('node-fetch');

// Base URL for API requests
const baseUrl = 'http://localhost:60000';

// Test endpoints
const endpoints = [
  // Auth endpoints
  { method: 'POST', url: '/api/auth/login', description: 'Login endpoint', 
    body: { email: 'test@example.com', password: 'password123' } 
  },
  { method: 'POST', url: '/auth/login', description: 'Login endpoint (no /api prefix)', 
    body: { email: 'test@example.com', password: 'password123' } 
  },
  
  // User endpoints
  { method: 'GET', url: '/api/users/suggestions?limit=8', description: 'Suggested users' },
  { method: 'GET', url: '/api/explore/users?limit=8', description: 'Explore users' },
  
  // Posts endpoints
  { method: 'GET', url: '/api/posts?page=1&limit=10', description: 'Posts' },
  
  // Reels endpoints
  { method: 'GET', url: '/api/reels?page=1&limit=10&tab=all&sort=newest', description: 'Reels' },
  
  // Stories endpoints
  { method: 'GET', url: '/api/stories/user/testuser', description: 'User stories' },
  
  // Explore endpoints
  { method: 'GET', url: '/api/explore', description: 'Explore content' },
  { method: 'GET', url: '/api/explore/trending', description: 'Trending content' },
];

// Test each endpoint
async function testEndpoints() {
  console.log('Testing API endpoints...');
  console.log('==============================================');
  
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
      
      console.log(`Status: ${status} (${response.statusText})`);
      
      if (status === 404) {
        console.log('FAILED: Endpoint not found (404)');
      } else if (status >= 500) {
        console.log('FAILED: Server error');
      } else if (status === 401) {
        console.log('PARTIAL: Authentication required (401)');
      } else if (status >= 400) {
        console.log('FAILED: Client error');
      } else {
        console.log('SUCCESS: Endpoint is working');
        
        try {
          const data = await response.json();
          console.log('Response data available');
        } catch (e) {
          console.log('Could not parse JSON response');
        }
      }
      
      console.log('----------------------------------------------');
    } catch (error) {
      console.error(`Error testing ${endpoint.url}:`, error.message);
      console.log('----------------------------------------------');
    }
  }
  
  console.log('API endpoint testing complete!');
}

// Run the tests
testEndpoints();
