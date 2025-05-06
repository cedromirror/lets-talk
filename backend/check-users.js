const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Lets_Talk')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Create a simple User model to query the existing collection
    const User = mongoose.model('User', new mongoose.Schema({}), 'users');
    
    // Find all users and display their email and username
    return User.find({}, 'email username fullName')
      .then(users => {
        console.log('Users in database:');
        console.log(JSON.stringify(users, null, 2));
      })
      .finally(() => {
        // Close the connection
        mongoose.connection.close();
        console.log('MongoDB connection closed');
      });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
