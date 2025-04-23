/**
 * Utility functions for handling Cloudinary URLs and transformations
 */

// List of known missing sample images
const MISSING_SAMPLE_IMAGES = [
  // Sample posts
  'sample_post_1', 'sample_post_2', 'sample_post_3', 'sample_post_4',
  'sample-post-1', 'sample-post-2', 'sample-post-3', 'sample-post-4',
  'sample_post_', 'sample-post-',

  // Specific missing images from user uploads
  'pnbvzl5zys2xhbshavzo', 'hue6mi92jj1ujwmcw52e', 'knjjmg98ieetsfxdo5kg',

  // Add any other missing image IDs here
];

// List of known missing sample videos
const MISSING_SAMPLE_VIDEOS = [
  // Sample reels
  'lxjk9ba9xtuwraosh6o2', 'wzf6l3vbbx7fjnuldze4',
  'sample_reel_', 'sample-reel-',

  // Add any other missing video IDs here
];

// Function to check if a URL is a valid Cloudinary URL
const isValidCloudinaryUrl = (url) => {
  if (!url) return false;

  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com')) return false;

  // Check for common error patterns in Cloudinary URLs
  if (url.includes('null') || url.includes('undefined')) return false;

  return true;
};

/**
 * Formats a Cloudinary URL to ensure it's valid and has proper transformations
 * @param {string} url - The original Cloudinary URL
 * @param {string} resourceType - The type of resource ('image' or 'video')
 * @param {Object} options - Transformation options
 * @returns {string} - The formatted Cloudinary URL
 */
export const formatCloudinaryUrl = (url, resourceType = 'image', options = {}) => {
  if (!url) {
    // Return default placeholder if URL is empty
    return resourceType === 'image'
      ? '/assets/default-image.svg'
      : '/assets/default-video.svg';
  }

  // Check if it's already a local asset URL
  if (url.startsWith('/assets/') || url.startsWith('/static/') || url.startsWith('/images/')) {
    return url;
  }

  // Check if the URL contains invalid patterns
  if (url.includes('undefined') || url.includes('null')) {
    console.warn('Invalid URL containing undefined or null:', url);
    return resourceType === 'image'
      ? '/assets/default-image.svg'
      : '/assets/default-video.svg';
  }

  // Handle URLs that are already fully formed with transformations
  if (isValidCloudinaryUrl(url) && url.includes('/upload/') &&
      (url.includes('/f_auto/') || url.includes('/q_auto/') || url.includes('/w_'))) {
    return url; // Already has transformations, return as is
  }

  // Check for known missing images
  if (resourceType === 'image') {
    for (const pattern of MISSING_SAMPLE_IMAGES) {
      if (url.includes(pattern)) {
        console.log(`Using fallback for known missing image: ${url}`);
        return '/assets/default-image.svg';
      }
    }
  }

  // Check for known missing videos
  if (resourceType === 'video') {
    for (const pattern of MISSING_SAMPLE_VIDEOS) {
      if (url.includes(pattern)) {
        console.log(`Using fallback for known missing video: ${url}`);
        return '/assets/default-video.svg';
      }
    }
  }

  // Special case: Check if this is a video being used as an image (poster)
  // This happens when a video URL is used for a poster image
  if (resourceType === 'image') {
    for (const pattern of MISSING_SAMPLE_VIDEOS) {
      if (url.includes(pattern)) {
        console.log(`Using fallback for video used as image: ${url}`);
        return '/assets/default-image.svg';
      }
    }
  }

  try {
    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) {
      // If it's an HTTP URL but not Cloudinary, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // If it might be a Cloudinary public ID without the full URL
      if (!url.startsWith('/') && !url.includes('/')) {
        // Try to construct a Cloudinary URL from what might be just a public ID
        const cloudName = 'droja6ntk';
        const formattedUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/f_auto,q_auto/${url}`;
        console.log(`Constructed Cloudinary URL from public ID: ${url} -> ${formattedUrl}`);
        return formattedUrl;
      }

      return url; // Return as is for other cases
    }

    // Parse the URL to extract components
    const cloudName = 'droja6ntk'; // Your Cloudinary cloud name

    // Extract the public ID from the URL
    let publicId = '';
    let version = '';

    // Handle different URL formats
    if (url.includes('/upload/')) {
      const parts = url.split('/upload/');
      if (parts.length !== 2) {
        console.warn('Invalid Cloudinary URL format:', url);
        return resourceType === 'image' ? '/assets/default-image.svg' : '/assets/default-video.svg';
      }

      // Check for version number
      const versionMatch = parts[1].match(/^v\d+\//);
      if (versionMatch) {
        version = versionMatch[0];
        publicId = parts[1].substring(version.length);
      } else {
        // Handle URLs without version
        publicId = parts[1];
      }

      // Remove any existing transformations from the public ID
      if (publicId.includes('/')) {
        const transformParts = publicId.split('/');
        publicId = transformParts[transformParts.length - 1];
      }
    } else {
      // Not a valid Cloudinary URL format
      console.warn('Unrecognized Cloudinary URL format:', url);
      return resourceType === 'image' ? '/assets/default-image.svg' : '/assets/default-video.svg';
    }

    // Build a simple transformation string
    let transformations = [];

    // Add format and quality for better compatibility
    transformations.push('f_auto');
    transformations.push('q_auto:good');

    // Add fetch format for better browser compatibility
    if (resourceType === 'image') {
      transformations.push('fl_progressive');
    } else if (resourceType === 'video') {
      transformations.push('fl_lossy');
    }

    // Add dimensions if provided
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);

    // Add specific quality if provided
    if (options.quality) transformations.push(`q_${options.quality}`);

    // Add crop and gravity for images
    if (resourceType === 'image') {
      transformations.push('c_fill');
      transformations.push('g_auto');
      transformations.push('dpr_auto'); // Automatically adjust for device pixel ratio
    }

    // Join transformations
    const transformString = transformations.join(',');

    // Build the final URL with version if available
    const formattedUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformString}/${version}${publicId}`;

    return formattedUrl;
  } catch (error) {
    console.error('Error formatting Cloudinary URL:', error, 'Original URL:', url);

    // Try a simpler approach as a last resort
    try {
      if (url.includes('cloudinary.com')) {
        // It's a Cloudinary URL but something went wrong with our parsing
        // Return it as is rather than showing a fallback image
        return url;
      } else if (!url.startsWith('/') && !url.includes('/')) {
        // Simple direct URL construction without any fancy parsing
        const cloudName = 'droja6ntk';
        return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${url}`;
      }
    } catch (fallbackError) {
      console.error('Even fallback approach failed:', fallbackError);
    }

    // Return default fallback on error
    return resourceType === 'image' ? '/assets/default-image.svg' : '/assets/default-video.svg';
  }
};

/**
 * Creates a responsive image URL for different screen sizes
 * @param {string} url - The original Cloudinary URL
 * @param {string} size - Size preset ('thumbnail', 'small', 'medium', 'large')
 * @returns {string} - The formatted responsive image URL
 */
export const getResponsiveImageUrl = (url, size = 'medium') => {
  if (!url) return '/assets/default-image.svg';

  // Define size presets - optimized for better performance and quality
  const sizes = {
    thumbnail: { width: 150, height: 150, quality: 80, crop: 'fill' },
    small: { width: 300, height: 300, quality: 80, crop: 'fill' },
    medium: { width: 600, height: 600, quality: 85, crop: 'fill' },
    large: { width: 1200, height: 1200, quality: 90, crop: 'fill' }
  };

  // Get the appropriate size configuration
  const sizeConfig = sizes[size] || sizes.medium;

  try {
    // Check if it's already a local asset URL
    if (url.startsWith('/assets/') || url.startsWith('/static/') || url.startsWith('/images/')) {
      return url;
    }

    // Handle URLs that are already fully formed with transformations
    if (url.includes('cloudinary.com') && url.includes('/upload/') &&
        (url.includes('/f_auto/') || url.includes('/q_auto/') || url.includes('/w_'))) {
      return url; // Already has transformations, return as is
    }

    // Format the URL with the size configuration
    return formatCloudinaryUrl(url, 'image', sizeConfig);
  } catch (error) {
    console.error('Error generating responsive image URL:', error);
    return url; // Return original URL on error
  }
};

/**
 * Creates a responsive video URL for different screen sizes
 * @param {string} url - The original Cloudinary URL
 * @param {string} size - Size preset ('small', 'medium', 'large')
 * @returns {string} - The formatted responsive video URL
 */
export const getResponsiveVideoUrl = (url, size = 'medium') => {
  if (!url) return '/assets/default-video.svg';

  // Define size presets - optimized for better performance and quality
  const sizes = {
    small: { width: 480, quality: 70 },
    medium: { width: 720, quality: 80 },
    large: { width: 1080, quality: 90 }
  };

  // Get the appropriate size configuration
  const sizeConfig = sizes[size] || sizes.medium;

  try {
    // Check if it's already a local asset URL
    if (url.startsWith('/assets/') || url.startsWith('/static/') || url.startsWith('/videos/')) {
      return url;
    }

    // Handle URLs that are already fully formed with transformations
    if (url.includes('cloudinary.com') && url.includes('/upload/') &&
        (url.includes('/f_auto/') || url.includes('/q_auto/') || url.includes('/w_'))) {
      return url; // Already has transformations, return as is
    }

    // Format the URL with the size configuration
    return formatCloudinaryUrl(url, 'video', sizeConfig);
  } catch (error) {
    console.error('Error generating responsive video URL:', error);
    return url; // Return original URL on error
  }
};

/**
 * Generates responsive video URLs for different resolutions
 * @param {string} url - The original Cloudinary URL
 * @param {Object} options - Options for generating responsive URLs
 * @returns {Object} - Object with different resolution URLs
 */
export const getMultiResolutionVideoUrls = (url, options = {}) => {
  if (!url) {
    return {
      low: '/assets/default-video.svg',
      medium: '/assets/default-video.svg',
      high: '/assets/default-video.svg',
      poster: '/assets/default-image.svg'
    };
  }

  // Check if it's already a local asset URL
  if (url.startsWith('/assets/') || url.startsWith('/static/') || url.startsWith('/videos/')) {
    return {
      low: url,
      medium: url,
      high: url,
      poster: url.replace('.mp4', '.jpg').replace('.webm', '.jpg').replace('.mov', '.jpg')
    };
  }

  try {
    // Handle URLs that are already fully formed with transformations
    if (url.includes('cloudinary.com') && url.includes('/upload/') &&
        (url.includes('/f_auto/') || url.includes('/q_auto/') || url.includes('/w_'))) {
      // For already transformed URLs, create variants with different quality settings
      const baseUrl = url.split('/upload/')[0] + '/upload/';
      const publicId = url.split('/upload/')[1].split('/').slice(1).join('/');

      return {
        low: `${baseUrl}f_auto,q_60,w_${options.lowWidth || 480}/${publicId}`,
        medium: `${baseUrl}f_auto,q_75,w_${options.mediumWidth || 720}/${publicId}`,
        high: `${baseUrl}f_auto,q_90,w_${options.highWidth || 1080}/${publicId}`,
        poster: `${baseUrl}f_auto,q_80,w_${options.posterWidth || 720}/${publicId}`
      };
    }

    // Generate different resolution URLs
    const lowQuality = formatCloudinaryUrl(url, 'video', {
      width: options.lowWidth || 480,
      quality: options.lowQuality || 60
    });

    const mediumQuality = formatCloudinaryUrl(url, 'video', {
      width: options.mediumWidth || 720,
      quality: options.mediumQuality || 75
    });

    const highQuality = formatCloudinaryUrl(url, 'video', {
      width: options.highWidth || 1080,
      quality: options.highQuality || 90
    });

    // Generate poster image
    const poster = formatCloudinaryUrl(url, 'video', {
      width: options.posterWidth || 720,
      quality: options.posterQuality || 80
    });

    return {
      low: lowQuality,
      medium: mediumQuality,
      high: highQuality,
      poster: poster
    };
  } catch (error) {
    console.error('Error generating responsive video URLs:', error);
    // Return original URL as fallback
    return {
      low: url,
      medium: url,
      high: url,
      poster: '/assets/default-image.svg'
    };
  }
};

export default {
  formatCloudinaryUrl,
  getResponsiveImageUrl,
  getResponsiveVideoUrl,
  getMultiResolutionVideoUrls
};
