const mongoose = require('mongoose');

// MongoDB connection function
const connectDB = async () => {
  // Array of connection strings to try in order
  const connectionStrings = [
    process.env.MONGO_URI,                          // Primary connection
    process.env.MONGODB_URI_LOCAL,                  // Local MongoDB (secondary)
    'mongodb://localhost:27017/Lets_Talk'           // Default fallback
  ];

  console.log('Available MongoDB connection strings:');
  console.log('MONGO_URI:', process.env.MONGO_URI);
  console.log('MONGODB_URI_LOCAL:', process.env.MONGODB_URI_LOCAL);

  // Filter out undefined or empty connection strings
  const validConnectionStrings = connectionStrings.filter(uri => uri);

  // Track errors for reporting
  const connectionErrors = [];

  // Try each connection string in order
  for (const mongoURI of validConnectionStrings) {
    try {
      // Log connection attempt but mask credentials for security
      const sanitizedURI = mongoURI.replace(/:\/\/([^:]+):([^@]+)@/, '://*****:*****@');
      console.log('Attempting to connect to MongoDB with URI:', sanitizedURI);

      // Connect with mongoose
      const conn = await mongoose.connect(mongoURI, {
        // These options are deprecated in newer versions but kept for compatibility
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // Increased timeout to 30 seconds
        socketTimeoutMS: 120000, // Increased timeout to 120 seconds
        family: 4, // Use IPv4, skip trying IPv6
        // Add connection pool settings
        maxPoolSize: 20, // Increased maximum number of connections in the pool
        minPoolSize: 5, // Increased minimum number of connections in the pool
        maxIdleTimeMS: 60000, // Increased idle time to 60 seconds
        // Add heartbeat settings
        heartbeatFrequencyMS: 30000, // Reduced frequency to reduce overhead
        // Add retry settings
        retryWrites: true, // Retry write operations if they fail
        retryReads: true, // Retry read operations if they fail
        connectTimeoutMS: 30000, // Connection timeout
        keepAlive: true, // Keep connection alive
        keepAliveInitialDelay: 300000 // Keep alive initial delay (5 minutes)
      });

      console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);

      // Set up connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        // Log more detailed error information
        if (err.name === 'MongoNetworkError') {
          console.error('MongoDB network error. Check your network connection and MongoDB server status.');
        } else if (err.name === 'MongoServerSelectionError') {
          console.error('MongoDB server selection error. The server might be down or unreachable.');
        }
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
        // No need to manually reconnect as mongoose will do it automatically
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully');
      });

      // Add more event listeners for better monitoring
      mongoose.connection.on('connected', () => {
        console.log('MongoDB connected event fired');
      });

      mongoose.connection.on('reconnectFailed', () => {
        console.error('MongoDB reconnection failed after maximum attempts');
        // In development, we don't want to exit the process
        if (process.env.NODE_ENV === 'production') {
          console.error('Exiting process due to MongoDB reconnection failure');
          process.exit(1);
        }
      });

      // Handle application termination
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed due to app termination');
          process.exit(0);
        } catch (err) {
          console.error('Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });

      return conn;
    } catch (err) {
      // Log the error and continue to the next connection string
      console.error(`Failed to connect to MongoDB: ${err.message}`);
      connectionErrors.push({ uri: mongoURI, error: err.message });
    }
  }

  // If we get here, all connection attempts failed
  console.error('All MongoDB connection attempts failed:');
  connectionErrors.forEach((attempt, index) => {
    console.error(`Attempt ${index + 1}: ${attempt.error}`);
  });

  // We should fail if we can't connect to a database
  throw new Error('Could not connect to any MongoDB instance. Application cannot start.');
};

module.exports = connectDB;
