const axios = require('axios');

// User credentials to test
const credentials = {
  email: 'test_1745130794466@example.com',
  password: 'password123'
};

// Make the login request
axios.post('http://localhost:60000/api/auth/login', credentials)
  .then(response => {
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('Login failed!');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  });
