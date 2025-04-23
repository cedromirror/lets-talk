// Service Worker for Instagram Clone
const CACHE_NAME = 'instagram-clone-cache-v2';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/vendors~main.chunk.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/assets/default-image.svg'
];

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);

  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);

  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim());

  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Helper function to determine if a request is for a chunk file
const isChunkRequest = (url) => {
  return url.includes('chunk.js') || url.includes('chunk.css') || url.includes('vendors-node_modules_mui');
};

// Helper function to determine if a request is for an API call
const isApiRequest = (url) => {
  return url.includes('/api/');
};

// Helper function to determine if a request is for an image
const isImageRequest = (url) => {
  return (
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.png') ||
    url.endsWith('.gif') ||
    url.endsWith('.svg') ||
    url.includes('/image/') ||
    url.includes('/images/')
  );
};

// Fetch event - network first for API, cache first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin && !url.origin.includes('cloudinary.com')) {
    return;
  }

  // Handle chunk requests with network first, then cache, with increased timeout
  if (isChunkRequest(url.pathname)) {
    event.respondWith(
      Promise.race([
        // Main fetch request
        fetch(event.request, { cache: 'no-store' })
          .then((response) => {
            // Cache the fetched response
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          }),
        // Timeout after 10 seconds
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Chunk request timeout')), 10000)
        )
      ])
      .catch((error) => {
        console.error(`[Service Worker] Chunk fetch error: ${error.message}`);
        // If network fails or times out, try to get from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Returning cached chunk');
            return cachedResponse;
          }
          // If not in cache, try to get the main bundle as fallback
          return caches.match('/static/js/bundle.js').then(bundleResponse => {
            if (bundleResponse) {
              console.log('[Service Worker] Returning bundle.js as fallback');
              return bundleResponse;
            }
            // Last resort - return a basic error response
            return new Response('Failed to load chunk', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' },
            });
          });
        });
      })
    );
    return;
  }

  // Handle API requests with network only
  if (isApiRequest(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle image requests with cache first, then network
  if (isImageRequest(url.pathname) || url.origin.includes('cloudinary.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response immediately
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Cache the fetched response
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Image fetch failed:', error);
            // Return default image if available
            return caches.match('/assets/default-image.svg');
          });
      })
    );
    return;
  }

  // Default strategy: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately if available
      if (cachedResponse) {
        // Fetch from network in the background to update cache
        fetch(event.request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
            });
          })
          .catch((error) => {
            console.error('[Service Worker] Background fetch failed:', error);
          });

        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Cache the fetched response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
          // Return a basic offline page if available
          return caches.match('/index.html');
        });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
