/**
 * Simplified memory monitor that logs memory usage without causing restarts
 */

// Helper function to format memory usage in MB
function formatMemoryUsage(memoryUsage) {
  return {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100} MB`
  };
}

// Simplified memory monitor that only logs memory usage
const memoryMonitor = {
  // Start monitoring memory usage (just logs, no automatic restarts)
  start: (interval = 300000) => { // Default: check every 5 minutes
    console.log('Starting simplified memory usage monitoring (logging only)');

    // Initial memory usage
    const initialMemory = process.memoryUsage();
    console.log('Initial memory usage:', formatMemoryUsage(initialMemory));

    // Store the interval ID so we can clear it later
    const intervalId = setInterval(() => {
      // Log current memory usage
      const currentMemory = process.memoryUsage();
      console.log('Current memory usage:', formatMemoryUsage(currentMemory));

      // Run garbage collection if available (only works with --expose-gc flag)
      if (global.gc) {
        global.gc();
        console.log('Garbage collection completed');
      }
    }, interval);

    return intervalId;
  },

  // Stop monitoring
  stop: (intervalId) => {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('Memory usage monitoring stopped');
    }
  }
};

module.exports = memoryMonitor;
