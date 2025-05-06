const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Lets_Talk')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Define User model
    const User = mongoose.model('User', new mongoose.Schema({}), 'users');
    
    try {
      // Find user
      const user = await User.findOne({ email: 'testuser123@example.com' });
      
      if (!user) {
        console.log('User not found');
        return;
      }
      
      console.log('User found:');
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      
      // Hash new password
      const newPassword = 'password123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update user's password
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log(`\nPassword updated successfully to '${newPassword}'`);
      console.log(`New hashed password: ${hashedPassword}`);
      
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
