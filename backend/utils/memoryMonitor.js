/**
 * Disabled memory monitor to prevent refreshing issues
 * This is a dummy implementation that does nothing
 */

// Disabled memory monitor
const memoryMonitor = {
  // Start does nothing and returns null
  start: () => {
    console.log('Memory monitoring is disabled to prevent refreshing issues');
    return null;
  },

  // Stop does nothing
  stop: () => {
    // No-op
  }
};

module.exports = memoryMonitor;
