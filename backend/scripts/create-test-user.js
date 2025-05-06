/**
 * Script to create a test user in the database
 * Run with: node scripts/create-test-user.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import User model
const User = require('../models/User');

// MongoDB connection string
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Lets_Talk';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'iammirror2024@gmail.com',
  password: 'password123',
  fullName: 'Test User',
  bio: 'This is a test user account',
  isVerified: true,
  role: 'user'
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return false;
  }
};

// Create test user
const createTestUser = async () => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: testUser.email },
        { username: testUser.username }
      ]
    });

    if (existingUser) {
      console.log('Test user already exists:');
      console.log(`Username: ${existingUser.username}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Full Name: ${existingUser.fullName}`);
      console.log('Use these credentials to log in.');
      return;
    }

    // Create new user
    const user = new User(testUser);
    await user.save();

    console.log('Test user created successfully:');
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${testUser.password}`);
    console.log('Use these credentials to log in.');
  } catch (err) {
    console.error('Error creating test user:', err.message);
  }
};

// Main function
const main = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB. Exiting...');
    process.exit(1);
  }

  await createTestUser();

  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
  process.exit(0);
};

// Run the script
main();
