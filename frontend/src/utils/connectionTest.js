import api from '../services/api';
import { io } from 'socket.io-client';

/**
 * Tests the connection to the backend API
 * @returns {Promise<Object>} The result of the connection test
 */
export const testBackendConnection = async () => {
  try {
    const response = await api.get('/health');

    return {
      success: true,
      message: 'Successfully connected to the backend API',
      data: response.data,
      status: response.status
    };
  } catch (error) {
    console.error('Backend connection test failed:', error);

    return {
      success: false,
      message: 'Failed to connect to the backend API',
      error: error.message,
      status: error.response?.status || 'Network Error'
    };
  }
};

/**
 * Tests the socket connection
 * @param {Object} socketService The socket service instance
 * @returns {Promise<Object>} The result of the socket connection test
 */
export const testSocketConnection = (socketService) => {
  return new Promise((resolve) => {
    // First try the public namespace for a basic connectivity test
    testPublicSocketConnection()
      .then(publicResult => {
        if (publicResult.success) {
          // If public namespace works, try the authenticated connection
          // Initialize socket if not already initialized
          const socket = socketService.getSocket() || socketService.initializeSocket();

          // Set a timeout in case the connection takes too long
          const timeout = setTimeout(() => {
            resolve({
              success: true, // Consider it a success if public namespace works
              message: 'Public socket namespace is working, but authenticated connection timed out',
              publicStatus: 'Connected',
              authStatus: 'Timeout',
              socketId: publicResult.socketId
            });
          }, 5000);

          // Check if already connected
          if (socket && socket.connected) {
            clearTimeout(timeout);
            resolve({
              success: true,
              message: 'Both public and authenticated socket connections are working',
              socketId: socket.id,
              publicStatus: 'Connected',
              authStatus: 'Connected'
            });
            return;
          }

          // Listen for connection event
          if (socket) {
            socket.once('connect', () => {
              clearTimeout(timeout);
              resolve({
                success: true,
                message: 'Both public and authenticated socket connections are working',
                socketId: socket.id,
                publicStatus: 'Connected',
                authStatus: 'Connected'
              });
            });

            // Listen for connection error
            socket.once('connect_error', (error) => {
              clearTimeout(timeout);
              // If we get an authentication error, that's expected without a token
              const isAuthError = error.message.includes('Authentication error');
              resolve({
                success: true, // Still consider it a success if public namespace works
                message: isAuthError ?
                  'Public socket namespace is working, authenticated connection requires login' :
                  'Public socket namespace is working, but authenticated connection failed',
                error: error.message,
                publicStatus: 'Connected',
                authStatus: isAuthError ? 'Auth Required' : 'Error'
              });
            });
          } else {
            clearTimeout(timeout);
            resolve({
              success: true, // Still consider it a success if public namespace works
              message: 'Public socket namespace is working, but could not initialize authenticated connection',
              publicStatus: 'Connected',
              authStatus: 'Not Initialized'
            });
          }
        } else {
          // If public namespace fails, the socket server might be down
          resolve(publicResult);
        }
      });
  });
};

/**
 * Tests the public socket namespace
 * @returns {Promise<Object>} The result of the public socket connection test
 */
const testPublicSocketConnection = () => {
  return new Promise((resolve) => {
    try {
      // Get the base URL from the current window location
      const baseUrl = window.location.origin.replace(/:\d+/, '');
      const port = 60000; // Backend port
      const publicNamespaceUrl = `${baseUrl}:${port}/public`;

      console.log('Testing public socket namespace:', publicNamespaceUrl);

      // Connect to the public namespace
      const socket = io(publicNamespaceUrl, {
        transports: ['polling', 'websocket'],
        reconnection: false,
        timeout: 5000
      });

      // Set a timeout in case the connection takes too long
      const timeout = setTimeout(() => {
        socket.disconnect();
        resolve({
          success: false,
          message: 'Public socket namespace connection test timed out',
          status: 'Timeout'
        });
      }, 5000);

      // Listen for connection event
      socket.once('connect', () => {
        console.log('Connected to public socket namespace');

        // Test ping-pong
        socket.emit('ping');

        // Listen for pong response
        socket.once('pong', (data) => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve({
            success: true,
            message: 'Successfully connected to the public socket namespace',
            socketId: socket.id,
            status: 'Connected',
            timestamp: data.timestamp
          });
        });

        // Set timeout for pong response
        setTimeout(() => {
          if (socket.connected) {
            socket.disconnect();
            resolve({
              success: false,
              message: 'Connected to public socket namespace but did not receive pong response',
              socketId: socket.id,
              status: 'No Response'
            });
          }
        }, 2000);
      });

      // Listen for connection error
      socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve({
          success: false,
          message: 'Failed to connect to the public socket namespace',
          error: error.message,
          status: 'Error'
        });
      });
    } catch (error) {
      resolve({
        success: false,
        message: 'Error testing public socket namespace',
        error: error.message,
        status: 'Exception'
      });
    }
  });
};
