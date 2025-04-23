const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment or use default
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Lets_Talk';

console.log('Connecting to MongoDB...');
console.log('Using connection string:', mongoURI);

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully!');
  
  // Define User schema
  const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  }, {
    timestamps: true,
  });
  
  // Create User model
  const User = mongoose.model('User', UserSchema);
  
  // Check if test user already exists
  const existingUser = await User.findOne({ email: 'testuser@example.com' });
  
  if (existingUser) {
    console.log('Test user already exists:', existingUser.username);
    console.log('User ID:', existingUser._id);
    console.log('Email:', existingUser.email);
    console.log('Password: password123 (hashed in database)');
  } else {
    // Create test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const newUser = new User({
      username: 'testuser',
      email: 'testuser@example.com',
      password: hashedPassword,
      fullName: 'Test User',
      bio: 'This is a test user account',
      isVerified: true,
      role: 'user',
    });
    
    await newUser.save();
    console.log('Test user created successfully!');
    console.log('Username: testuser');
    console.log('Email: testuser@example.com');
    console.log('Password: password123');
    console.log('User ID:', newUser._id);
  }
  
  // Create additional test users
  const additionalUsers = [
    { username: 'user1', email: 'user1@example.com', fullName: 'User One' },
    { username: 'user2', email: 'user2@example.com', fullName: 'User Two' },
    { username: 'user3', email: 'user3@example.com', fullName: 'User Three' },
    { username: 'user4', email: 'user4@example.com', fullName: 'User Four' },
    { username: 'user5', email: 'user5@example.com', fullName: 'User Five' },
  ];
  
  console.log('\nCreating additional test users...');
  
  for (const userData of additionalUsers) {
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      console.log(`User ${userData.username} already exists`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        bio: `This is ${userData.fullName}'s profile`,
        isVerified: true,
        role: 'user',
      });
      
      await newUser.save();
      console.log(`User ${userData.username} created successfully!`);
    }
  }
  
  // Close the connection
  await mongoose.connection.close();
  console.log('\nMongoDB connection closed');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
