/**
 * Utility functions for error handling
 */

/**
 * Format an API error into a standardized object with useful information
 * @param {Error} error - The error object from an API call
 * @param {Object} context - Additional context about where the error occurred
 * @returns {Object} Formatted error object
 */
export const formatApiError = (error, context = {}) => {
  const formattedError = {
    // Basic error info
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
    code: error.code || 'UNKNOWN_ERROR',

    // HTTP info if available
    status: error.response?.status,
    statusText: error.response?.statusText,

    // Response data if available
    data: error.response?.data,

    // Request info if available
    request: {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    },

    // Network info
    isNetworkError: !error.response,

    // Context info
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    },

    // Original error
    originalError: error,
  };

  return formattedError;
};

/**
 * Get a user-friendly error message from an API error
 * @param {Error} error - The error object from an API call
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error) => {
  // Use the friendly message if it exists
  if (error.friendlyMessage) {
    return error.friendlyMessage;
  }

  // Handle specific HTTP status codes
  if (error.response) {
    const status = error.response.status;

    switch (status) {
      case 400:
        return error.response.data?.message || 'Invalid request. Please check your information and try again.';
      case 401:
        return 'Authentication failed. Please check your credentials or log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This operation could not be completed due to a conflict with the current state.';
      case 422:
        return error.response.data?.message || 'Validation failed. Please check your information.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'An unexpected server error occurred. Please try again later.';
      case 503:
        return 'The service is temporarily unavailable. Please try again later.';
      default:
        return error.response.data?.message || `Error ${status}: ${error.response.statusText || 'Unknown error'}`;
    }
  }

  // Handle network errors
  if (error.isNetworkError || error.message.includes('Network Error')) {
    if (error.message.includes('backend server is running')) {
      return error.message; // Use the specific message about backend server
    }
    return 'Unable to connect to the server. Please check if the backend server is running on port 60000 and try again.';
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'The request timed out. Please try again later.';
  }

  // Default message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Log an error to the console with detailed information
 * @param {Error} error - The error object
 * @param {string} source - The source of the error (component, function, etc.)
 */
export const logError = (error, source = 'unknown') => {
  // Check if this error has already been logged to avoid duplicate logs
  if (error._logged) {
    return;
  }

  // Mark the error as logged
  error._logged = true;

  // Format the error for logging
  const errorInfo = formatApiError(error, { source });

  // In production, only log minimal information
  if (process.env.NODE_ENV === 'production') {
    console.error(`Error in ${source}: ${error.message}`);
  } else {
    // In development, log more detailed information
    console.error(`Error in ${source}:`, error.message);
    console.log(`${source} error details:`, {
      status: errorInfo.status,
      message: errorInfo.message,
      data: errorInfo.data,
      source: source
    });
  }

  // You could also send this to a logging service
  // logErrorToService(errorInfo);
};

/**
 * Handle an API error with standard logging and message extraction
 * @param {Error} error - The error object from an API call
 * @param {string} source - The source of the error (component, function, etc.)
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error, source = 'unknown') => {
  // Skip logging if already logged by interceptor
  if (!error._interceptorLogged) {
    logError(error, source);
  } else if (!error._logged) {
    // If interceptor logged but not fully logged, just mark as logged
    error._logged = true;
  }

  // Return a user-friendly message
  return getUserFriendlyMessage(error);
};

export default {
  formatApiError,
  getUserFriendlyMessage,
  logError,
  handleApiError
};
