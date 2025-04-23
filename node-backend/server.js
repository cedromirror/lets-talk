const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load environment variables
dotenv.config();

// Global error handlers for uncaught exceptions and unhandled promise rejections

// Simplified error handling without automatic restarts

// Helper function to handle errors
const handleServerError = (type, error) => {
  console.error(`${type}! 💥 Logging error details...`);

  if (type === 'UNCAUGHT EXCEPTION') {
    console.error(error.name, error.message, error.stack);
  } else {
    console.error('Reason:', error);
  }

  // Log memory usage when an error occurs
  const memUsage = process.memoryUsage();
  console.log('Memory usage at error time:', {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
  });

  // Run garbage collection if available
  if (global.gc) {
    console.log('Running garbage collection after error');
    global.gc();
  }
};

process.on('uncaughtException', (error) => {
  handleServerError('UNCAUGHT EXCEPTION', error);
});

process.on('unhandledRejection', (reason) => {
  handleServerError('UNHANDLED REJECTION', reason);
});

// Log important environment variables (without sensitive data)
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('MONGODB_URI_LOCAL:', process.env.MONGODB_URI_LOCAL ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set (hidden)' : 'Not set');

// Import socket.io initialization
const initializeSocket = require('./socket');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const reelRoutes = require('./routes/reelRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const exploreRoutes = require('./routes/exploreRoutes');
const storyRoutes = require('./routes/storyRoutes');
const savedRoutes = require('./routes/savedRoutes');
const liveRoutes = require('./routes/liveRoutes'); // Unified livestream routes
const healthRoutes = require('./routes/healthRoutes');
const shopRoutes = require('./routes/shopRoutes');
const messageRoutes = require('./routes/messageRoutes');
const searchRoutes = require('./routes/searchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Import middleware
const errorHandler = require('./middleware/error');

// Import DB connection and seed data
// Use simplified DB connection for better reliability
const connectDB = require('./config/simplified-db');
const seedDefaultData = require('./config/seedData');

// Import memory monitor
const memoryMonitor = require('./utils/memoryMonitor');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:30000',
      'http://localhost:3000',
      'http://localhost:6001',
      'http://localhost:6000',
      'http://localhost:30001'
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Log CORS configuration
console.log(`CORS configuration: Allow all origins in development mode with credentials`);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure required directories exist
const ensureDirectories = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'profile'),
    path.join(__dirname, 'uploads', 'posts'),
    path.join(__dirname, 'uploads', 'stories'),
    path.join(__dirname, 'uploads', 'reels'),
    path.join(__dirname, 'uploads', 'products')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

ensureDirectories();

// Root health endpoint for server discovery
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root health endpoint for quick checks
app.get('/api/health/check', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      posts: '/api/posts/*'
    }
  });
});

// Mount routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/livestreams', liveRoutes); // Use the same routes for backward compatibility
app.use('/api/health', healthRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);

// Mount routes without /api prefix for backward compatibility
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/reels', reelRoutes);
app.use('/notifications', notificationRoutes);
app.use('/explore', exploreRoutes);
app.use('/stories', storyRoutes);
app.use('/saved', savedRoutes);
app.use('/live', liveRoutes);
app.use('/livestreams', liveRoutes); // Use the same routes for backward compatibility
app.use('/health', healthRoutes);
app.use('/shop', shopRoutes);
app.use('/messages', messageRoutes);
app.use('/search', searchRoutes);
app.use('/analytics', analyticsRoutes);

// Serve static files from the uploads directory
const uploadsPath = path.join(__dirname, 'uploads');
console.log(`Serving static files from: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath));

// Handle 404 errors for API routes
app.use('/api/*', (req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'API endpoint not found', path: req.originalUrl });
});

// Handle remaining 404 errors for non-API routes
app.use('*', (req, res, next) => {
  // Skip if it's a static file or health check
  if (req.originalUrl.startsWith('/uploads/') || req.originalUrl === '/health') {
    return next();
  }

  // Skip if the request has already been handled
  if (res.headersSent) {
    return next();
  }

  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Endpoint not found', path: req.originalUrl });
});

// Global error handler
app.use(errorHandler);

// Define the port to use
const PORT = process.env.PORT || 60000;
console.log(`Using port: ${PORT}`);

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
};

// Start the server
const startServer = async () => {
  try {
    // Try to connect to the database
    try {
      await connectDB();
      console.log('Database connection established');

      // Seed default data
      try {
        await seedDefaultData();
        console.log('Default data seeded successfully');
      } catch (seedError) {
        console.error('Error seeding default data:', seedError.message);
        console.warn('Continuing without seeding default data');
      }
    } catch (dbError) {
      console.error('Database connection failed:', dbError.message);
      console.warn('Starting server without database connection - some features will not work');
    }

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize socket.io
    const io = initializeSocket(server);

    // Check if the port is in use
    const portInUse = await isPortInUse(PORT);
    if (portInUse) {
      // Try alternative ports
      const alternativePorts = [60001, 60002, 60003, 60004, 60005];
      let selectedPort = null;

      for (const altPort of alternativePorts) {
        const altPortInUse = await isPortInUse(altPort);
        if (!altPortInUse) {
          selectedPort = altPort;
          break;
        }
      }

      if (selectedPort) {
        console.log(`Port ${PORT} is already in use, using alternative port ${selectedPort}`);
        // Start the server on the alternative port
        server.listen(selectedPort, () => {
          console.log(`Server running on port ${selectedPort} in ${process.env.NODE_ENV} mode`);
          console.log(`Socket.io server initialized`);

          // Memory monitoring is disabled to prevent refreshing issues
          console.log('Memory monitoring is disabled to prevent refreshing issues');

          // Signal that the server is ready (for PM2)
          if (process.send) {
            process.send('ready');
            console.log('Sent ready signal to process manager');
          }
        });

        // Handle server errors
        server.on('error', (err) => {
          console.error(`Server error on port ${selectedPort}:`, err);
        });

        return server; // Return server instance for graceful shutdown
      } else {
        console.error(`All ports are in use. Please free up a port and try again.`);
        process.exit(1);
      }
    } else {
      // Start the server on the original port
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        console.log(`Socket.io server initialized`);

        // Memory monitoring is disabled to prevent refreshing issues
        console.log('Memory monitoring is disabled to prevent refreshing issues');

        // Signal that the server is ready (for PM2)
        if (process.send) {
          process.send('ready');
          console.log('Sent ready signal to process manager');
        }
      });

      // Handle server errors
      server.on('error', (err) => {
        console.error(`Server error on port ${PORT}:`, err);
      });

      return server; // Return server instance for graceful shutdown
    }
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Run the server and handle graceful shutdown
(async () => {
  const server = await startServer();

  // Handle graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);

    // Log memory usage before shutdown
    const memUsage = process.memoryUsage();
    console.log('Memory usage before shutdown:', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
    });

    // Memory monitoring is disabled
    console.log('Memory monitoring is disabled');

    // Clean up resources
    if (global.gc) {
      console.log('Running garbage collection before shutdown');
      global.gc();
    }

    // Clear any global caches
    global._cachedData = null;

    server.close(() => {
      console.log('HTTP server closed.');

      // Close database connection
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });

      // Force exit after 10 seconds if connections haven't closed
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    });
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();

