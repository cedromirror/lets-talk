/**
 * Utility functions for handling file paths and URLs
 */

// Backend URL for serving static files
const BACKEND_URL = 'http://localhost:60000';

/**
 * Converts any file path to a proper URL that can be loaded by the browser
 * @param {string} path - The file path or URL
 * @returns {string} - A properly formatted URL
 */
export const getProperFileUrl = (path) => {
  if (!path) return '';

  // If it's already a proper URL (http/https), return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a Cloudinary URL without protocol, add https
  if (path.startsWith('//res.cloudinary.com')) {
    return `https:${path}`;
  }

  // If it's a file:/// URL, convert it to a proper backend URL
  if (path.startsWith('file:///')) {
    // Extract the relative path from the file:/// URL
    const relativePath = path.replace(/file:\/\/\/C:\/instagram\/instagram\/node-backend\//, '');
    return `${BACKEND_URL}/${relativePath}`;
  }

  // Handle Windows paths with backslashes
  if (path.includes('\\') || path.includes('C:')) {
    // Extract just the filename from the path
    const filename = path.split(/[\\\/]/).pop();
    return `${BACKEND_URL}/uploads/reels/${filename}`;
  }

  // If it's a relative path starting with 'uploads/', prefix with backend URL
  if (path.startsWith('uploads/')) {
    return `${BACKEND_URL}/${path}`;
  }

  // For other relative paths, assume they're uploads
  if (!path.startsWith('/')) {
    return `${BACKEND_URL}/uploads/${path}`;
  }

  // For paths starting with /, prefix with backend URL
  return `${BACKEND_URL}${path}`;
};

/**
 * Gets the file extension from a path or URL
 * @param {string} path - The file path or URL
 * @returns {string} - The file extension (without the dot)
 */
export const getFileExtension = (path) => {
  if (!path) return '';

  // Remove query parameters
  const pathWithoutQuery = path.split('?')[0];

  // Get the file extension
  const extension = pathWithoutQuery.split('.').pop().toLowerCase();

  // Return empty string if the extension is the whole path (no dot found)
  return extension === pathWithoutQuery ? '' : extension;
};

/**
 * Checks if a file is a video based on its extension
 * @param {string} path - The file path or URL
 * @returns {boolean} - Whether the file is a video
 */
export const isVideoFile = (path) => {
  const extension = getFileExtension(path);
  return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'm4v'].includes(extension);
};

/**
 * Gets the appropriate MIME type for a file based on its extension
 * @param {string} path - The file path or URL
 * @returns {string} - The MIME type
 */
export const getMimeType = (path) => {
  const extension = getFileExtension(path);

  const mimeTypes = {
    // Video formats
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    m4v: 'video/x-m4v',

    // Image formats
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',

    // Audio formats
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac'
  };

  return mimeTypes[extension] || '';
};

/**
 * Checks if a file exists by making a HEAD request
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Whether the file exists
 */
export const checkFileExists = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
};

export default {
  getProperFileUrl,
  checkFileExists,
  getFileExtension,
  isVideoFile,
  getMimeType
};
