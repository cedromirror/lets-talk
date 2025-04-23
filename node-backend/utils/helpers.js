// Helper functions for the application

/**
 * Extract hashtags from text
 * @param {string} text - Text to extract hashtags from
 * @returns {Array} - Array of hashtags
 */
const extractHashtags = (text) => {
  if (!text) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  return matches.map(tag => tag.slice(1).toLowerCase());
};

/**
 * Extract mentions from text
 * @param {string} text - Text to extract mentions from
 * @returns {Array} - Array of mentions
 */
const extractMentions = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  
  if (!matches) return [];
  
  return matches.map(mention => mention.slice(1).toLowerCase());
};

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Format date to relative time
 * @param {Date} date - Date to format
 * @returns {string} - Relative time string
 */
const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  
  // Convert milliseconds to seconds
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  // Convert seconds to minutes
  const minutes = Math.floor(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  // Convert minutes to hours
  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  // Convert hours to days
  const days = Math.floor(hours / 24);
  
  if (days < 7) {
    return `${days}d ago`;
  }
  
  // Convert days to weeks
  const weeks = Math.floor(days / 7);
  
  if (weeks < 4) {
    return `${weeks}w ago`;
  }
  
  // Convert weeks to months
  const months = Math.floor(days / 30);
  
  if (months < 12) {
    return `${months}mo ago`;
  }
  
  // Convert months to years
  const years = Math.floor(months / 12);
  
  return `${years}y ago`;
};

/**
 * Paginate results
 * @param {Array} data - Data to paginate
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} - Paginated results
 */
const paginateResults = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = {
    data: data.slice(startIndex, endIndex),
    pagination: {
      total: data.length,
      page,
      limit,
      pages: Math.ceil(data.length / limit)
    }
  };
  
  if (endIndex < data.length) {
    results.pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    results.pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  return results;
};

/**
 * Sanitize user input
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
const sanitizeInput = (text) => {
  if (!text) return '';
  
  // Replace HTML tags
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
};

/**
 * Generate a stream key
 * @returns {string} - Stream key
 */
const generateStreamKey = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  
  return `${timestamp}-${random}`;
};

module.exports = {
  extractHashtags,
  extractMentions,
  generateRandomString,
  formatRelativeTime,
  paginateResults,
  sanitizeInput,
  generateStreamKey
};
