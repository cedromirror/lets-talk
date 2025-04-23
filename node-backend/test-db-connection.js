const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment or use default
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Lets_Talk';

console.log('Testing MongoDB connection...');
console.log('Using connection string:', mongoURI);

// Connect to MongoDB with simplified options
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Shorter timeout for testing
})
.then(async (conn) => {
  console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);

  try {
    // Get list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check if User collection exists and count documents
    if (collections.some(c => c.name === 'users')) {
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`\nUser collection contains ${userCount} documents`);

      // Get a sample user to verify data
      if (userCount > 0) {
        const sampleUser = await mongoose.connection.db.collection('users').findOne({}, { projection: { password: 0 } });
        console.log('\nSample user data:');
        console.log(JSON.stringify(sampleUser, null, 2));
        console.log('\n✅ Real users exist in the database!');
      } else {
        console.log('\n⚠️ No users found in the database. You may need to create some users.');
      }
    } else {
      console.log('\n⚠️ User collection does not exist in the database.');
    }

    // Create a simple test document
    const TestModel = mongoose.model('TestConnection', new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    }));

    const doc = await TestModel.create({ name: 'Connection Test' });
    console.log('\n✅ Successfully created test document:', doc);

    await TestModel.findByIdAndDelete(doc._id);
    console.log('✅ Successfully deleted test document');
    console.log('\n✅ Database connection is fully operational');
  } catch (error) {
    console.error('\n❌ Error during database operations:', error);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);

  if (err.name === 'MongoNetworkError') {
    console.error('Make sure MongoDB is installed and running on your system.');
    console.error('For Windows, you can start MongoDB with:');
    console.error('  1. Open Command Prompt as Administrator');
    console.error('  2. Run: net start MongoDB (if installed as a service)');
    console.error('  3. Or navigate to MongoDB bin directory and run: mongod');
  }
})
.finally(() => {
  // Close the connection
  mongoose.connection.close();
});
