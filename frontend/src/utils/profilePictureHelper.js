/**
 * Utility functions for handling profile pictures
 * This is the single source of truth for profile picture handling
 */

/**
 * Get the appropriate profile picture URL with fallback
 * @param {Object} user - User object
 * @param {string} size - Size of the profile picture ('small', 'medium', 'large')
 * @returns {string} - URL of the profile picture
 */
const getProfilePictureUrl = (user, size = 'medium') => {
  if (!user) return '/assets/default-avatar.png';

  try {
    // Try different possible profile picture fields
    const avatarUrl = user.avatar || user.profilePicture || user.profile_picture || user.image;
    if (!avatarUrl) return '/assets/default-avatar.png';

    // Check if the avatar is a Cloudinary URL
    if (avatarUrl.includes('cloudinary.com')) {
      // Extract the base URL and transformation parts
      const parts = avatarUrl.split('/upload/');
      if (parts.length !== 2) return avatarUrl;

      // Add transformation based on size
      let transformation = '';
      switch (size) {
        case 'small':
          transformation = 'c_fill,g_face,h_40,w_40,q_auto:good/';
          break;
        case 'medium':
          transformation = 'c_fill,g_face,h_80,w_80,q_auto:good/';
          break;
        case 'large':
          transformation = 'c_fill,g_face,h_150,w_150,q_auto:good/';
          break;
        case 'xlarge':
          transformation = 'c_fill,g_face,h_300,w_300,q_auto:good/';
          break;
        default:
          // If size is an object with width and height
          if (typeof size === 'object' && size.width && size.height) {
            const width = typeof size.width === 'object' ? 80 : size.width;
            const height = typeof size.height === 'object' ? 80 : size.height;
            transformation = `c_fill,g_face,h_${height},w_${width},q_auto:good/`;
          } else {
            transformation = 'c_fill,g_face,h_80,w_80,q_auto:good/';
          }
      }

      return `${parts[0]}/upload/${transformation}${parts[1]}`;
    }

    // If not a Cloudinary URL, return as is
    return avatarUrl;
  } catch (error) {
    console.error('Error processing profile picture URL:', error);
    // Use a default avatar if avatarUrl is not defined in this scope
    return '/assets/default-avatar.png';
  }
};

/**
 * Get a unique profile picture URL that bypasses cache
 * @param {Object} user - User object
 * @param {string} url - Original URL
 * @returns {string} - URL with cache-busting parameter
 */
const getCacheBustedProfileUrl = (user, url) => {
  if (!url || url === '/assets/default-avatar.png') return url;

  try {
    // Remove any existing cache-busting parameters
    let cleanUrl = url;
    if (url.includes('?t=') || url.includes('&t=')) {
      // Remove t parameter
      cleanUrl = url.replace(/([?&])t=[^&]*(&|$)/, (match, prefix, suffix) => {
        return suffix === '&' ? prefix : '';
      });
    }

    // Add or update cache-busting parameter
    const separator = cleanUrl.includes('?') ? '&' : '?';

    // Use the most reliable timestamp source in this priority:
    // 1. User's avatarTimestamp (set when avatar is updated)
    // 2. User's updatedAt (if available)
    // 3. Current time as fallback
    const timestamp = user?.avatarTimestamp ||
                     (user?.updatedAt ? new Date(user.updatedAt).getTime() : null) ||
                     Date.now();

    return `${cleanUrl}${separator}t=${timestamp}`;
  } catch (error) {
    console.error('Error creating cache-busted URL:', error);
    return url;
  }
};

/**
 * Get the complete profile picture URL with cache busting
 * @param {Object} user - User object
 * @param {string} size - Size of the profile picture
 * @returns {string} - Complete profile picture URL
 */
const getCompleteProfilePictureUrl = (user, size = 'medium') => {
  if (!user) return '/assets/default-avatar.png';

  try {
    const baseUrl = getProfilePictureUrl(user, size);
    return getCacheBustedProfileUrl(user, baseUrl);
  } catch (error) {
    console.error('Error in getCompleteProfilePictureUrl:', error);
    return '/assets/default-avatar.png';
  }
};

/**
 * Create ProfilePicture component props object
 * @param {Object} user - User object
 * @param {string|Object} size - Size of the profile picture
 * @param {boolean} linkToProfile - Whether to link to the user's profile
 * @param {Object} additionalProps - Additional props to merge
 * @returns {Object} - Props for the ProfilePicture component
 */
const createProfilePictureProps = (user, size = 'medium', linkToProfile = true, additionalProps = {}) => {
  if (!user) return { user: null, ...additionalProps };

  return {
    user,
    size,
    linkToProfile,
    ...additionalProps
  };
};

/**
 * Check if a user has a valid profile picture
 * @param {Object} user - User object
 * @returns {boolean} - Whether the user has a valid profile picture
 */
const hasValidProfilePicture = (user) => {
  if (!user) return false;
  return Boolean(user.avatar || user.profilePicture || user.profile_picture || user.image);
};

/**
 * Preload a user's profile picture to improve perceived performance
 * @param {Object} user - User object
 * @param {string} size - Size of the profile picture
 * @returns {Promise} - Promise that resolves when the image is loaded or rejects on error
 */
const preloadProfilePicture = (user, size = 'medium') => {
  if (!user) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const url = getCompleteProfilePictureUrl(user, size);
    if (!url || url === '/assets/default-avatar.png') {
      resolve(); // No need to preload default avatar
      return;
    }

    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => {
      console.warn(`Failed to preload profile picture: ${url}`);
      reject(new Error(`Failed to preload profile picture: ${url}`));
    };
    img.src = url;
  });
};

// Export all functions individually and as a default object
export {
  getProfilePictureUrl,
  getCacheBustedProfileUrl,
  getCompleteProfilePictureUrl,
  createProfilePictureProps,
  hasValidProfilePicture,
  preloadProfilePicture
};

const profilePictureHelper = {
  getProfilePictureUrl,
  getCacheBustedProfileUrl,
  getCompleteProfilePictureUrl,
  createProfilePictureProps,
  hasValidProfilePicture,
  preloadProfilePicture
};

export default profilePictureHelper;
