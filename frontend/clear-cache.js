const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

// Paths to clean
const pathsToClean = [
  path.resolve(__dirname, 'node_modules/.cache'),
  path.resolve(__dirname, 'build'),
  path.resolve(__dirname, '.cache')
];

// Clean each path
pathsToClean.forEach(pathToClean => {
  console.log(`Cleaning ${pathToClean}...`);
  try {
    if (fs.existsSync(pathToClean)) {
      rimraf.sync(pathToClean);
      console.log(`Successfully cleaned ${pathToClean}`);
    } else {
      console.log(`Path ${pathToClean} does not exist, skipping`);
    }
  } catch (error) {
    console.error(`Error cleaning ${pathToClean}:`, error);
  }
});

console.log('Cache cleaning completed!');
