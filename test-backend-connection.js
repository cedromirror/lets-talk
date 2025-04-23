/**
 * Test script to check backend connectivity
 *
 * This script tests:
 * 1. MongoDB connection
 * 2. Backend server availability
 * 3. Socket.io connection
 */

const axios = require('axios');
const mongoose = require('mongoose');
const { io } = require('socket.io-client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const BACKEND_PORT = process.env.PORT || 60000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Lets_Talk';

// Test MongoDB connection
const testMongoConnection = async () => {
  console.log('\n=== Testing MongoDB Connection ===');
  console.log('Using connection string:', MONGO_URI);

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });

    console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check if users collection exists and has documents
    if (collections.some(c => c.name === 'users')) {
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`\nUser collection contains ${userCount} documents`);

      if (userCount > 0) {
        // Get a sample user
        const sampleUser = await mongoose.connection.db.collection('users').findOne({});
        console.log('\nSample user data:');
        console.log(sampleUser);
        console.log('\n✅ Real users exist in the database!');
      } else {
        console.log('\n⚠️ User collection is empty');
      }
    } else {
      console.log('\n⚠️ Users collection not found');
    }

    // Create a test document to verify write access
    const TestConnection = mongoose.model('TestConnection', new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    }));

    const testDoc = await TestConnection.create({ name: 'Connection Test' });
    console.log(`\n✅ Successfully created test document: ${testDoc}`);

    // Clean up test document
    await TestConnection.deleteOne({ _id: testDoc._id });
    console.log('✅ Successfully deleted test document');

    console.log('\n✅ Database connection is fully operational');

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    if (error.name === 'MongoServerSelectionError') {
      console.error('Make sure MongoDB is running on your machine');
    }
    return false;
  }
};

// Test backend server availability
const testBackendServer = async () => {
  console.log('\n=== Testing Backend Server ===');
  console.log(`Testing connection to: ${BACKEND_URL}`);

  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
    console.log('Health endpoint response:', healthResponse.data);

    if (healthResponse.status === 200) {
      console.log('✅ Backend server is running and health endpoint is accessible');

      // Test a few more endpoints
      try {
        const postsResponse = await axios.get(`${BACKEND_URL}/api/posts`, { timeout: 5000 });
        console.log('Posts endpoint accessible:', postsResponse.status === 200);
      } catch (error) {
        console.log('Posts endpoint error:', error.message);
      }

      return true;
    } else {
      console.error(`❌ Health endpoint returned status: ${healthResponse.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Backend server test failed: ${error.message}`);
    console.error('Make sure the backend server is running on port', BACKEND_PORT);
    return false;
  }
};

// Test socket.io connection
const testSocketConnection = async () => {
  console.log('\n=== Testing Socket.io Connection ===');
  console.log(`Testing socket connection to: ${BACKEND_URL}`);

  // First try the public namespace
  const publicResult = await testPublicSocketConnection();

  if (publicResult) {
    console.log('✅ Public socket namespace is working correctly');
    return true;
  } else {
    console.log('⚠️ Public socket namespace test failed, trying authenticated connection...');
    // If public namespace fails, try the authenticated connection
    return await testAuthenticatedSocketConnection();
  }
};

// Test public socket.io namespace
const testPublicSocketConnection = async () => {
  console.log(`Testing public socket namespace: ${BACKEND_URL}/public`);

  return new Promise((resolve) => {
    try {
      const socket = io(`${BACKEND_URL}/public`, {
        transports: ['polling', 'websocket'],
        timeout: 5000,
        reconnectionAttempts: 1
      });

      // Set timeout for connection attempt
      const connectionTimeout = setTimeout(() => {
        console.error('❌ Public socket namespace connection timeout');
        socket.disconnect();
        resolve(false);
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log(`✅ Public socket namespace connected successfully with ID: ${socket.id}`);

        // Test ping-pong
        socket.emit('ping');

        // Listen for pong response
        socket.once('pong', (data) => {
          console.log(`✅ Received pong response with timestamp: ${new Date(data.timestamp).toISOString()}`);
          socket.disconnect();
          console.log('Public socket connection closed');
          resolve(true);
        });

        // Set timeout for pong response
        setTimeout(() => {
          if (socket.connected) {
            console.error('❌ Did not receive pong response');
            socket.disconnect();
            resolve(false);
          }
        }, 2000);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        console.error(`❌ Public socket namespace connection error: ${error.message}`);
        socket.disconnect();
        resolve(false);
      });

      socket.on('error', (error) => {
        console.error(`Public socket namespace error: ${error}`);
      });

    } catch (error) {
      console.error(`❌ Public socket namespace test failed: ${error.message}`);
      resolve(false);
    }
  });
};

// Test authenticated socket.io connection
const testAuthenticatedSocketConnection = async () => {
  console.log(`Testing authenticated socket connection: ${BACKEND_URL}`);

  return new Promise((resolve) => {
    try {
      // For testing purposes, we'll try to connect without authentication
      // This should fail with a specific error message
      const socket = io(BACKEND_URL, {
        transports: ['polling', 'websocket'],
        timeout: 5000,
        reconnectionAttempts: 1
      });

      // Set timeout for connection attempt
      const connectionTimeout = setTimeout(() => {
        console.error('❌ Socket.io connection timeout');
        socket.disconnect();
        resolve(false);
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log(`✅ Socket.io connected successfully with ID: ${socket.id}`);
        socket.disconnect();
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        // Check if the error is the expected authentication error
        if (error.message.includes('Authentication error: Token not provided')) {
          console.log('✅ Received expected authentication error: ' + error.message);
          socket.disconnect();
          resolve(true); // This is actually expected behavior
        } else {
          console.error(`❌ Socket.io connection error: ${error.message}`);
          socket.disconnect();
          resolve(false);
        }
      });

      socket.on('error', (error) => {
        console.error(`Socket.io error: ${error}`);
      });

    } catch (error) {
      console.error(`❌ Socket.io test failed: ${error.message}`);
      resolve(false);
    }
  });
};

// Run all tests
const runTests = async () => {
  console.log('=== Instagram Clone Backend Connection Tests ===');
  console.log('Testing backend connectivity for the Instagram Clone project');
  console.log('Date:', new Date().toLocaleString());
  console.log('Backend URL:', BACKEND_URL);
  console.log('MongoDB URI:', MONGO_URI);

  // Test MongoDB
  const mongoResult = await testMongoConnection();

  // Test Backend Server
  const serverResult = await testBackendServer();

  // Test Socket.io
  const socketResult = await testSocketConnection();

  // Summary
  console.log('\n=== Test Results Summary ===');
  console.log(`MongoDB Connection: ${mongoResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Backend Server: ${serverResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Socket.io Connection: ${socketResult ? '✅ PASS' : '❌ FAIL'}`);

  const overallResult = mongoResult && serverResult && socketResult;
  console.log(`\nOverall Result: ${overallResult ? '✅ PASS' : '❌ FAIL'}`);

  if (!overallResult) {
    console.log('\nTroubleshooting Tips:');
    if (!mongoResult) {
      console.log('- Make sure MongoDB is running on your machine');
      console.log('- Check that the MongoDB connection string is correct');
    }
    if (!serverResult) {
      console.log('- Make sure the backend server is running on port', BACKEND_PORT);
      console.log('- Check for any errors in the backend server logs');
    }
    if (!socketResult) {
      console.log('- Socket.io issues often indicate backend server configuration problems');
      console.log('- Check CORS settings in the backend server');
    }
  }

  return overallResult;
};

// Run the tests
runTests()
  .then(result => {
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
  });
