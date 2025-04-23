// Script to fix Material UI chunk loading errors
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

console.log('Fixing Material UI chunk loading errors...');

// Path to the cache directory
const cachePath = path.join(__dirname, 'frontend', 'node_modules', '.cache');

// Check if the cache directory exists
if (fs.existsSync(cachePath)) {
  console.log(`Removing cache directory: ${cachePath}`);
  try {
    // Use rimraf to remove the directory
    rimraf.sync(cachePath);
    console.log('Cache directory removed successfully.');
  } catch (error) {
    console.error('Error removing cache directory:', error);
  }
} else {
  console.log('Cache directory does not exist.');
}

console.log('Material UI chunk loading errors should be fixed.');
console.log('Please restart your frontend application with:');
console.log('cd frontend && npm start');
