module.exports = {
  apps: [
    {
      name: 'instagram-backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 60000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 60000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      merge_logs: true,
      time: true,
      // Restart app if it uses more than 70% of CPU for 10s
      max_cpu_usage_restart: '70%',
      // Restart app if it uses more than 70% of memory for 10s
      max_memory_usage_restart: '70%',
      // Restart app if it doesn't respond to HTTP requests for 10s
      restart_delay: 5000,
      // Wait 5s before restarting app
      wait_ready: true,
      // Wait for app to emit 'ready' event
      listen_timeout: 10000,
      // Wait 10s for app to start
      kill_timeout: 5000,
      // Wait 5s before killing app
      source_map_support: true,
      // Enable source map support
      node_args: '--expose-gc --max-old-space-size=512'
      // Enable garbage collection and limit Node.js memory usage
    }
  ]
};
