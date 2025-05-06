/**
 * Utility functions for handling Cloudinary video URLs
 */

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'droja6ntk';
const CLOUDINARY_API_KEY = '366288452711478';
const CLOUDINARY_API_SECRET = 'IApH9iLAbpU1eYLTQjwtXRPoytw';

// Default fallbacks
const DEFAULT_VIDEO_FALLBACK = '/assets/default-video.mp4';
const DEFAULT_IMAGE_FALLBACK = '/assets/default-image.svg';
const DEFAULT_THUMBNAIL_FALLBACK = '/assets/default-image.svg';

// Create a cache for successful URLs to avoid repeated failures
const urlCache = new Map();

/**
 * Properly formats a Cloudinary video URL to ensure it works correctly
 * @param {string} videoId - The video ID or full URL
 * @param {Object} options - Options for video formatting
 * @returns {string} - Properly formatted Cloudinary URL
 */
export const getCloudinaryVideoUrl = (videoId, options = {}) => {
  if (!videoId) return DEFAULT_VIDEO_FALLBACK;

  try {
    // Clean up the videoId first
    let cleanId = videoId;

    // If it's already a full URL with http/https, check if it's a Cloudinary URL
    if (videoId.startsWith('http')) {
      // If it's not a Cloudinary URL, return as is
      if (!videoId.includes('cloudinary.com') && !videoId.includes('res.cloudinary.com')) {
        return videoId;
      }

      // It's a Cloudinary URL, extract the ID
      cleanId = extractCloudinaryId(videoId);

      // If extraction failed, use the original ID
      if (!cleanId || cleanId === videoId) {
        console.warn('Failed to extract Cloudinary ID from URL:', videoId);
        // Try a different approach - just get the filename
        const urlParts = videoId.split('/');
        const filename = urlParts[urlParts.length - 1];
        cleanId = filename.split('.')[0].split('?')[0];
      }
    } else if (videoId.includes('/')) {
      // It's a partial path, extract just the filename
      const pathParts = videoId.split('/');
      cleanId = pathParts[pathParts.length - 1].split('.')[0].split('?')[0];
    }

    // Set default options with more conservative settings
    const {
      format = 'mp4',
      quality = 'auto',
      width = 720,
      height = null,
      crop = 'scale'
    } = options;

    // Build transformation string with delivery optimization
    let transformation = `f_${format},q_${quality},vc_auto`; // Add video codec auto

    // Add width and height if provided
    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;

    // Add crop mode if width or height is specified
    if ((width || height) && crop) transformation += `,c_${crop}`;

    // Build the final URL - try both video and raw resource types
    let url;

    // First try with video resource type (standard approach)
    url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transformation}/${cleanId}`;

    // Make sure the URL has the correct file extension
    if (!url.endsWith(`.${format}`)) {
      url = `${url}.${format}`;
    }

    // Add a stable cache key that changes daily instead of every minute
    // This reduces the number of unique URLs while still allowing for updates
    const cacheKey = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Changes every day
    return `${url}?_t=${cacheKey}`;
  } catch (error) {
    console.error('Error formatting Cloudinary video URL:', error);
    console.log('Original videoId:', videoId);

    // As a fallback, try multiple approaches

    // 1. Try with just the ID and minimal transformations
    let simpleId = videoId;

    // Extract just the filename if it's a path
    if (videoId.includes('/')) {
      const parts = videoId.split('/');
      simpleId = parts[parts.length - 1].split('.')[0].split('?')[0];
    } else if (videoId.includes('.')) {
      // Remove extension if present
      simpleId = videoId.split('.')[0];
    }

    // Try a direct URL with minimal transformations
    const cacheKey = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Daily cache key
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/q_auto,f_auto/${simpleId}?_t=${cacheKey}`;
  }
};

/**
 * Gets multiple resolution versions of a video for adaptive streaming
 * @param {string} videoId - The video ID or full URL
 * @returns {Object} - Object with different resolution URLs
 */
export const getAdaptiveVideoUrls = (videoId) => {
  if (!videoId) {
    return {
      low: DEFAULT_VIDEO_FALLBACK,
      medium: DEFAULT_VIDEO_FALLBACK,
      high: DEFAULT_VIDEO_FALLBACK,
      poster: DEFAULT_THUMBNAIL_FALLBACK
    };
  }

  try {
    // Extract just the ID if it's a full URL
    let cleanId = extractCloudinaryId(videoId);

    // If extraction failed, try a simpler approach
    if (!cleanId || cleanId === videoId) {
      if (videoId.includes('/')) {
        const parts = videoId.split('/');
        cleanId = parts[parts.length - 1].split('.')[0].split('?')[0];
      } else {
        cleanId = videoId.split('.')[0].split('?')[0];
      }
    }

    // Use a stable cache key that changes daily
    const cacheKey = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    // Create multiple resolution versions with different formats as fallbacks
    return {
      // Primary sources with MP4 format
      low: getCloudinaryVideoUrl(videoId, { width: 480, quality: 70, format: 'mp4' }),
      medium: getCloudinaryVideoUrl(videoId, { width: 720, quality: 80, format: 'mp4' }),
      high: getCloudinaryVideoUrl(videoId, { width: 1080, quality: 90, format: 'mp4' }),

      // Alternative sources with WebM format
      lowWebm: getCloudinaryVideoUrl(videoId, { width: 480, quality: 70, format: 'webm' }),
      mediumWebm: getCloudinaryVideoUrl(videoId, { width: 720, quality: 80, format: 'webm' }),

      // Poster image with daily cache key
      poster: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/f_jpg,q_auto,w_720/${cleanId}.jpg?_t=${cacheKey}`
    };
  } catch (error) {
    console.error('Error generating adaptive video URLs:', error);
    return {
      low: DEFAULT_VIDEO_FALLBACK,
      medium: DEFAULT_VIDEO_FALLBACK,
      high: DEFAULT_VIDEO_FALLBACK,
      lowWebm: DEFAULT_VIDEO_FALLBACK,
      mediumWebm: DEFAULT_VIDEO_FALLBACK,
      poster: DEFAULT_THUMBNAIL_FALLBACK
    };
  }
};

/**
 * Checks if a video URL is valid and accessible
 * @param {string} url - The video URL to check
 * @returns {Promise<boolean>} - Promise resolving to true if valid
 */
export const checkVideoUrl = async (url) => {
  if (!url) return false;

  try {
    // Try a HEAD request to check if the URL is valid
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking video URL:', error);
    return false;
  }
};

/**
 * Extracts the video ID from a Cloudinary URL
 * @param {string} url - The Cloudinary URL
 * @returns {string} - The extracted video ID
 */
export const extractCloudinaryId = (url) => {
  if (!url) return '';

  try {
    // Check if we've already processed this URL successfully
    if (urlCache.has(url)) {
      return urlCache.get(url);
    }

    // If it's a Cloudinary URL, extract the ID
    if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length !== 2) {
        // Try another approach for URLs with transformations
        const matches = url.match(/\/([^\/]+?)(?:\.[^\.]+)?(?:\?.*)?$/);
        if (matches && matches[1]) {
          const id = matches[1];
          urlCache.set(url, id); // Cache the result
          return id;
        }
        return url;
      }

      // Get the last part of the URL (after /upload/)
      const lastPart = parts[1];

      // Remove any transformations
      const segments = lastPart.split('/');
      const filename = segments[segments.length - 1];

      // Remove file extension and query parameters
      const id = filename.split('.')[0].split('?')[0];
      urlCache.set(url, id); // Cache the result
      return id;
    }

    return url;
  } catch (error) {
    console.error('Error extracting Cloudinary ID:', error);
    return url;
  }
};

/**
 * Gets a direct Cloudinary URL with minimal transformations
 * @param {string} id - The Cloudinary resource ID
 * @param {string} resourceType - The resource type (video, image, raw)
 * @returns {string} - Direct Cloudinary URL
 */
export const getDirectCloudinaryUrl = (id, resourceType = 'video') => {
  if (!id) return resourceType === 'video' ? DEFAULT_VIDEO_FALLBACK : DEFAULT_IMAGE_FALLBACK;

  try {
    // Clean the ID
    const cleanId = extractCloudinaryId(id);

    // Create a direct URL with minimal transformations
    const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/q_auto/${cleanId}`;
    return url;
  } catch (error) {
    console.error('Error creating direct Cloudinary URL:', error);
    return resourceType === 'video' ? DEFAULT_VIDEO_FALLBACK : DEFAULT_IMAGE_FALLBACK;
  }
};

/**
 * Gets a thumbnail URL for a video
 * @param {string} videoId - The video ID or URL
 * @returns {string} - Thumbnail URL
 */
export const getVideoThumbnailUrl = (videoId) => {
  if (!videoId) return DEFAULT_THUMBNAIL_FALLBACK;

  try {
    // Extract the ID
    const cleanId = extractCloudinaryId(videoId);

    // Create a thumbnail URL
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/f_jpg,q_auto,w_720/${cleanId}.jpg`;
  } catch (error) {
    console.error('Error creating video thumbnail URL:', error);
    return DEFAULT_THUMBNAIL_FALLBACK;
  }
};

export default {
  getCloudinaryVideoUrl,
  getAdaptiveVideoUrls,
  checkVideoUrl,
  extractCloudinaryId,
  getDirectCloudinaryUrl,
  getVideoThumbnailUrl
};
