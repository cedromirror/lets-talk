const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Lets_Talk')
  .then(async () => {
    console.log('Connected to MongoDB');
    
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
      }
    });
    
    // Create User model
    const User = mongoose.model('User', UserSchema);
    
    // User data
    const userData = {
      username: 'testuser123',
      email: 'testuser123@example.com',
      password: 'password123',
      fullName: 'Test User 123'
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
      } else {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Create new user
        const newUser = new User({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          fullName: userData.fullName
        });
        
        await newUser.save();
        console.log('User created successfully:');
        console.log(`Username: ${userData.username}`);
        console.log(`Email: ${userData.email}`);
        console.log(`Password: ${userData.password}`);
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
