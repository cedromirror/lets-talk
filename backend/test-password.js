const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Lets_Talk')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find user and test password
    const User = mongoose.model('User', new mongoose.Schema({
      password: {
        type: String,
        select: false
      }
    }), 'users');
    
    try {
      // Find user with password field included
      const user = await User.findOne({ email: 'testuser123@example.com' }).select('+password');
      
      if (!user) {
        console.log('User not found');
        return;
      }
      
      console.log('User found:');
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Hashed Password: ${user.password}`);
      
      // Test password
      const testPassword = 'password123';
      const isMatch = await bcrypt.compare(testPassword, user.password);
      
      console.log(`\nPassword test for '${testPassword}':`);
      console.log(`Match result: ${isMatch ? 'SUCCESS - Password matches' : 'FAILED - Password does not match'}`);
      
      // Create a new hashed password for reference
      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(testPassword, salt);
      console.log(`\nNew hashed password for '${testPassword}': ${newHashedPassword}`);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Close connection
      mongoose.connection.close();
      console.log('\nMongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
