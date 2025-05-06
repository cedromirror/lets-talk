// Simple script to test backend connectivity
const testBackendConnection = async () => {
  const backendPort = 60000;
  const baseUrl = `http://localhost:${backendPort}`;
  
  console.log(`Testing connection to backend at ${baseUrl}...`);
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (healthResponse.ok) {
      console.log('✅ Health endpoint is working!');
      console.log('Status:', healthResponse.status);
      const data = await healthResponse.json();
      console.log('Response:', data);
    } else {
      console.error('❌ Health endpoint failed!');
      console.error('Status:', healthResponse.status);
    }
    
    // Test auth endpoints
    console.log('\nTesting auth endpoints...');
    
    // Test register endpoint
    try {
      const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      });
      
      console.log('Register endpoint CORS check:');
      console.log('Status:', registerResponse.status);
      console.log('Headers:', {
        'Access-Control-Allow-Origin': registerResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': registerResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': registerResponse.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': registerResponse.headers.get('Access-Control-Allow-Credentials')
      });
    } catch (error) {
      console.error('❌ Register endpoint CORS check failed:', error.message);
    }
    
    // Test login endpoint
    try {
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      });
      
      console.log('\nLogin endpoint CORS check:');
      console.log('Status:', loginResponse.status);
      console.log('Headers:', {
        'Access-Control-Allow-Origin': loginResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': loginResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': loginResponse.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': loginResponse.headers.get('Access-Control-Allow-Credentials')
      });
    } catch (error) {
      console.error('❌ Login endpoint CORS check failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Backend connection test failed!');
    console.error('Error:', error.message);
  }
};

export default testBackendConnection;
