require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with the credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test function to verify Cloudinary configuration
async function testCloudinaryConfig() {
  try {
    console.log('Testing Cloudinary configuration...');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key:', process.env.CLOUDINARY_API_KEY);
    console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '******' : 'Not set');
    
    // Ping Cloudinary to verify credentials
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection successful!');
    console.log('Response:', result);
    return true;
  } catch (error) {
    console.error('Cloudinary connection failed:', error.message);
    return false;
  }
}

// Run the test
testCloudinaryConfig()
  .then(success => {
    if (success) {
      console.log('Cloudinary is properly configured and working!');
    } else {
      console.error('Cloudinary configuration test failed.');
    }
  })
  .catch(error => {
    console.error('Error running Cloudinary test:', error);
  });
