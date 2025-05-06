const { createProxyMiddleware } = require('http-proxy-middleware');

const BACKEND_PORT = 60000; // Backend port
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Helper function to log proxy activity
function logProxyActivity(type, req, target) {
  console.log(`[Proxy] ${type} request: ${req.method || 'WS'} ${req.path || req.url} -> ${target}`);
}

// Filter function for requests
function filterRequests(pathname, req) {
  return pathname.match('^/api') ||
         pathname.match('^/socket.io') ||
         pathname.match('^/uploads') ||
         pathname.match('^/images');
}

module.exports = function(app) {
  console.log(`Setting up proxy middleware to backend at ${BACKEND_URL}`);

  // Proxy API requests to the backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/api': '/api' },
      headers: {
        'Connection': 'keep-alive'
      },
      onProxyReq: (proxyReq, req, res) => {
        logProxyActivity('API', req, BACKEND_URL);
      },
      onError: (err, req, res) => {
        console.error('[Proxy] API proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('Proxy error: Could not connect to the backend server');
      }
    })
  );

  // Proxy WebSocket requests
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      secure: false,
      ws: true,
      headers: {
        'Connection': 'keep-alive'
      },
      onProxyReqWs: (proxyReq, req, socket, options, head) => {
        logProxyActivity('WebSocket', req, BACKEND_URL);
      },
      onError: (err, req, socket) => {
        console.error('[Proxy] WebSocket proxy error:', err);
        if (socket && socket.end) {
          socket.end();
        }
      }
    })
  );

  // Proxy uploads requests to the backend
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      secure: false,
      headers: {
        'Connection': 'keep-alive'
      },
      onProxyReq: (proxyReq, req, res) => {
        logProxyActivity('Uploads', req, BACKEND_URL);
      },
      onError: (err, req, res) => {
        console.error('[Proxy] Uploads proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('Proxy error: Could not connect to the backend server');
      }
    })
  );

  // Proxy images requests to the backend
  app.use(
    '/images',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      secure: false,
      headers: {
        'Connection': 'keep-alive'
      },
      onProxyReq: (proxyReq, req, res) => {
        logProxyActivity('Images', req, BACKEND_URL);
      },
      onError: (err, req, res) => {
        console.error('[Proxy] Images proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('Proxy error: Could not connect to the backend server');
      }
    })
  );

  console.log('Proxy middleware setup complete');
};
