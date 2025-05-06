const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Lets_Talk')
  .then(async () => {
    console.log('Connected to MongoDB');

    // Define User schema
    const UserSchema = new mongoose.Schema({
      username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
      },
      email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
          /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
          'Please provide a valid email'
        ]
      },
      password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
      },
      fullName: {
        type: String,
        default: ''
      },
      bio: {
        type: String,
        maxlength: [150, 'Bio cannot exceed 150 characters'],
        default: ''
      },
      avatar: {
        type: String,
        default: ''
      },
      followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      isVerified: {
        type: Boolean,
        default: false
      },
      role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
      }
    });

    // Hash password before saving
    UserSchema.pre('save', async function(next) {
      if (!this.isModified('password')) {
        return next();
      }

      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    });

    // Match password
    UserSchema.methods.matchPassword = async function(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    };

    // Generate JWT token
    UserSchema.methods.getSignedJwtToken = function() {
      return jwt.sign(
        { id: this._id },
        'lets_talk_secure_jwt_secret_key_2024',
        { expiresIn: '30d' }
      );
    };

    // Create User model
    const User = mongoose.model('User', UserSchema);

    // User data for the mirror user
    const userData = {
      username: 'iammirror2027',
      email: 'iammirror2027@gmail.com',
      password: 'password123',
      fullName: 'IAM Mirror 2027',
      bio: 'This is my profile',
      isVerified: true,
      role: 'user'
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
        // Create new user
        const newUser = new User({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName,
          bio: userData.bio,
          isVerified: userData.isVerified,
          role: userData.role
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
