const axios = require('axios');

async function geocodeCity(cityName) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json`,
      {
        headers: {
          'User-Agent': 'BusTicketingApp/1.0 (your-email@example.com)'
        }
      }
    );
    if (response.data.length === 0) {
      throw new Error(`No coordinates found for ${cityName}`);
    }
    const { lat, lon } = response.data[0];
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon)
    };
  } catch (error) {
    throw new Error(`Geocoding failed for ${cityName}: ${error.message}`);
  }
}

module.exports = { geocodeCity };