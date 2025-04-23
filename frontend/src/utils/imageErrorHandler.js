/**
 * Utility functions for handling image loading errors
 */

/**
 * Handles image loading errors by setting a fallback image
 * @param {Event} event - The error event
 * @param {string} fallbackSrc - Optional custom fallback image source
 */
export const handleImageError = (event, fallbackSrc = '/assets/default-image.svg') => {
  const img = event.target;
  
  // Prevent infinite error loop if fallback also fails
  if (img.src === fallbackSrc || img.dataset.fallbackApplied === 'true') {
    console.warn('Fallback image also failed to load:', fallbackSrc);
    return;
  }
  
  console.warn('Image failed to load, using fallback:', img.src);
  
  // Mark as fallback applied
  img.dataset.fallbackApplied = 'true';
  
  // Set fallback image
  img.src = fallbackSrc;
};

/**
 * Handles video loading errors by setting a fallback video
 * @param {Event} event - The error event
 * @param {string} fallbackSrc - Optional custom fallback video source
 * @param {string} fallbackPoster - Optional custom fallback poster image
 */
export const handleVideoError = (event, fallbackSrc = '/assets/default-video.svg', fallbackPoster = '/assets/default-image.svg') => {
  const video = event.target;
  
  // Prevent infinite error loop if fallback also fails
  if (video.src === fallbackSrc || video.dataset.fallbackApplied === 'true') {
    console.warn('Fallback video also failed to load:', fallbackSrc);
    return;
  }
  
  console.warn('Video failed to load, using fallback:', video.src);
  
  // Mark as fallback applied
  video.dataset.fallbackApplied = 'true';
  
  // Set fallback video and poster
  video.src = fallbackSrc;
  if (video.poster) {
    video.poster = fallbackPoster;
  }
};

/**
 * Creates an onError handler function for images
 * @param {string} fallbackSrc - Optional custom fallback image source
 * @returns {Function} - The error handler function
 */
export const createImageErrorHandler = (fallbackSrc = '/assets/default-image.svg') => {
  return (event) => handleImageError(event, fallbackSrc);
};

/**
 * Creates an onError handler function for videos
 * @param {string} fallbackSrc - Optional custom fallback video source
 * @param {string} fallbackPoster - Optional custom fallback poster image
 * @returns {Function} - The error handler function
 */
export const createVideoErrorHandler = (fallbackSrc = '/assets/default-video.svg', fallbackPoster = '/assets/default-image.svg') => {
  return (event) => handleVideoError(event, fallbackSrc, fallbackPoster);
};

export default {
  handleImageError,
  handleVideoError,
  createImageErrorHandler,
  createVideoErrorHandler
};
