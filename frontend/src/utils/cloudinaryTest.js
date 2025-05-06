/**
 * Cloudinary configuration test utility
 * This file helps verify that Cloudinary is properly configured
 */

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'droja6ntk';
const CLOUDINARY_API_KEY = '366288452711478';

// Test video ID (the one that's failing)
const TEST_VIDEO_ID = 'lxjk9ba9xtuwraosh6o2';

/**
 * Test function to check if Cloudinary is properly configured
 * @returns {Promise<Object>} Test results
 */
export const testCloudinaryConfig = async () => {
  console.log('Testing Cloudinary configuration...');
  
  const results = {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY ? 'Configured' : 'Missing',
    testResults: []
  };
  
  // Test 1: Direct URL with no transformations
  const directUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${TEST_VIDEO_ID}`;
  results.testResults.push(await testUrl(directUrl, 'Direct URL (no transformations)'));
  
  // Test 2: URL with basic transformations
  const basicUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4,q_auto/${TEST_VIDEO_ID}`;
  results.testResults.push(await testUrl(basicUrl, 'Basic transformations (f_mp4,q_auto)'));
  
  // Test 3: URL with more transformations
  const advancedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4,q_auto,w_720/${TEST_VIDEO_ID}`;
  results.testResults.push(await testUrl(advancedUrl, 'Advanced transformations (f_mp4,q_auto,w_720)'));
  
  // Test 4: URL with extension
  const withExtension = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4,q_auto/${TEST_VIDEO_ID}.mp4`;
  results.testResults.push(await testUrl(withExtension, 'With extension (.mp4)'));
  
  // Test 5: URL with cache busting
  const cacheBusting = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4,q_auto/${TEST_VIDEO_ID}.mp4?_t=${Date.now()}`;
  results.testResults.push(await testUrl(cacheBusting, 'With cache busting'));
  
  console.log('Cloudinary configuration test results:', results);
  return results;
};

/**
 * Test a URL to see if it's accessible
 * @param {string} url - URL to test
 * @param {string} label - Label for the test
 * @returns {Promise<Object>} Test result
 */
const testUrl = async (url, label) => {
  console.log(`Testing URL (${label}): ${url}`);
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const status = response.status;
    const ok = response.ok;
    
    console.log(`Result for ${label}: ${status} (${ok ? 'OK' : 'Failed'})`);
    
    return {
      url,
      label,
      status,
      ok,
      error: null
    };
  } catch (error) {
    console.error(`Error testing ${label}:`, error);
    
    return {
      url,
      label,
      status: 0,
      ok: false,
      error: error.message
    };
  }
};

export default { testCloudinaryConfig };
