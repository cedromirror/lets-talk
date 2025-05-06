const axios = require('axios');

// User data for registration
const userData = {
  username: 'testuser_' + Date.now(),
  email: 'test_' + Date.now() + '@example.com',
  password: 'password123',
  fullName: 'Test User'
};

// Make the registration request
axios.post('http://localhost:60000/api/auth/register', userData)
  .then(response => {
    console.log('Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Now try to login with the new user
    return axios.post('http://localhost:60000/api/auth/login', {
      email: userData.email,
      password: userData.password
    });
  })
  .then(loginResponse => {
    console.log('\nLogin successful!');
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
  })
  .catch(error => {
    console.error('Request failed!');
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
