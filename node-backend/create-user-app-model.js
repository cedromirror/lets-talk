require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Lets_Talk')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Import the actual User model from the application
    const User = require('./models/User');
    
    // User data
    const userData = {
      username: 'iammirror2026',
      email: 'iammirror2026@example.com',
      password: 'password123',
      fullName: 'IAM MIRROR 2026'
    };
    
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });
      
      if (existingUser) {
        console.log('User already exists:');
        console.log(`Username: ${existingUser.username}`);
        console.log(`Email: ${existingUser.email}`);
        console.log('Password: password123 (hashed in database)');
        
        // Test login with this user
        const userWithPassword = await User.findById(existingUser._id).select('+password');
        const isMatch = await userWithPassword.matchPassword('password123');
        console.log(`Password match test: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
        
      } else {
        // Create new user using the User model's create method
        const newUser = await User.create({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName
        });
        
        console.log('User created successfully:');
        console.log(`Username: ${newUser.username}`);
        console.log(`Email: ${newUser.email}`);
        console.log(`Password: ${userData.password} (hashed in database)`);
        
        // Generate token
        const token = newUser.getSignedJwtToken();
        console.log(`JWT Token: ${token}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Close connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
