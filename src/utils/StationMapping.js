const mongoose = require('mongoose');
const StationModel = require('../models/StationModel');
const MapHelper = require('./MapHelper');

class StationMapping {
  static cityToStationMap = {
    'Ho Chi Minh City': '60f7b3a4c8b9e12345678901',
    'Da Lat': '60f7b3a4c8b9e12345678902',
    'Lam Dong Province': '60f7b3a4c8b9e12345678903',
    'Ba Ria - Vung Tau': '60f7b3a4c8b9e12345678904',
    'Da Nang': '60f7b3a4c8b9e12345678905',
  };

  async getStationId(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      throw new Error('Invalid city name');
    }

    try {
      let stationId = StationMapping.cityToStationMap[cityName];

      if (!stationId) {
        const station = await StationModel.findOne({
          name: { $regex: new RegExp(`^${cityName}$`, 'i') },
        });

        if (station) {
          stationId = station._id.toString();
          StationMapping.cityToStationMap[cityName] = stationId;
        } else {
          let coordinates;
          try {
            const coords = await MapHelper.geocodeCity(cityName);
            coordinates = { lat: coords.latitude, lng: coords.longitude };
          } catch (error) {
            console.error(`Geocoding failed for ${cityName}:`, error.message);
            coordinates = { lat: 0, lng: 0 };
          }

          const newStation = await StationModel.create({
            name: cityName,
            coordinates,
            address: cityName,
          });
          stationId = newStation._id.toString();
          StationMapping.cityToStationMap[cityName] = stationId;
        }
      }

      return mongoose.Types.ObjectId(stationId);
    } catch (error) {
      console.error(`Error getting station ID for ${cityName}:`, error.message);
      throw error;
    }
  }
}

module.exports = new StationMapping();