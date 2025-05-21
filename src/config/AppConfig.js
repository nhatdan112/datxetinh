module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'your-api-key',
    scraper: {
      delay: 5000,
      maxRetries: 3,
      maxConcurrency: 2,
    },
  };