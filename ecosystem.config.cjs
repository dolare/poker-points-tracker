module.exports = {
  apps: [
    {
      name: 'poker-api',
      script: './server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production'
      }
    }
  ]
}
