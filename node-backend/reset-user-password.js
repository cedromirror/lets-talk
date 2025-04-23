require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Lets_Talk')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Define a simple User model to update the existing collection
    const User = mongoose.model('User', new mongoose.Schema({}), 'users');
    
    // Email of the user to update
    const userEmail = 'iammirror2026@example.com';
    
    try {
      // Find the user
      const user = await User.findOne({ email: userEmail });
      
      if (!user) {
        console.log(`User with email ${userEmail} not found`);
        return;
      }
      
      console.log(`Found user: ${user.username} (${user.email})`);
      
      // Generate a new hashed password
      const plainPassword = 'password123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      // Update the user's password directly
      const result = await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log(`Password updated for user ${user.username}`);
      console.log(`Plain password: ${plainPassword}`);
      console.log(`Hashed password: ${hashedPassword}`);
      console.log(`Update result: ${JSON.stringify(result)}`);
      
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
