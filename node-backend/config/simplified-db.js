const mongoose = require('mongoose');

// MongoDB connection function
const connectDB = async () => {
  try {
    // Simplified connection approach - use a single connection string
    // with simplified options for better compatibility
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/Lets_Talk';

    console.log('Attempting to connect to MongoDB...');
    // Don't log the full connection string for security reasons
    console.log('Using MongoDB connection string (masked):',
      mongoURI.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://****:****@'));

    // Ensure database name is correct
    const dbName = 'Lets_Talk';
    const uriWithCorrectDB = mongoURI.includes('Lets_Talk') ?
      mongoURI :
      mongoURI.replace(/\/([^/]*)$/, `/${dbName}`);

    console.log('Database name:', dbName);

    // Connect with mongoose using simplified options
    const conn = await mongoose.connect(uriWithCorrectDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 5, // Reduced pool size for better stability
      autoIndex: false, // Don't build indexes automatically in production
      connectTimeoutMS: 30000, // 30 seconds connection timeout
    });

    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);

    // Set up basic connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    return conn;
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err.message}`);

    // We should fail if we can't connect to a database
    throw new Error('Could not connect to MongoDB. Application cannot start.');
  }
};

module.exports = connectDB;
