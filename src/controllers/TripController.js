const TripModel = require('../models/TripModel');
const DataCrawler = require('../utils/DataCrawler');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class TripController {
  async createTrip(req, res, next) {
    try {
      const trip = await TripModel.create(req.body);
      res.status(201).json(trip);
    } catch (error) {
      next(error);
    }
  }

  async getAllTrips(req, res, next) {
    try {
      const trips = await TripModel.find();
      res.json(trips);
    } catch (error) {
      next(error);
    }
  }

  async getTripById(req, res, next) {
    try {
      const trip = await TripModel.findById(req.params.id)
        .populate('startStation')
        .populate('endStation');
      if (!trip) throw new Error('Trip not found');
      res.json(trip);
    } catch (error) {
      next(error);
    }
  }
  async getTripSeats(req, res, next) {
    try {
      const tickets = await TicketModel.find({ tripId: req.params.id, status: 'booked' });
      const bookedSeats = tickets.reduce((acc, ticket) => [...acc, ...ticket.seats], []);
      res.json({ bookedSeats });
    } catch (error) {
      next(error);
    }
  }
  async updateTrip(req, res, next) {
    try {
      const trip = await TripModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!trip) throw new Error('Trip not found');
      res.json(trip);
    } catch (error) {
      next(error);
    }
  }

  async deleteTrip(req, res, next) {
    try {
      const trip = await TripModel.findByIdAndDelete(req.params.id);
      if (!trip) throw new Error('Trip not found');
      res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async scrapeTrips(req, res, next) {
    try {
      const urls = [
        'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009794.a10010000&stt=CITY_GEO.CITY_GEO&stn=Ho%20Chi%20Minh%20City.Lam%20Dong%20Province&dt=27-04-2025.null&ps=1&stc=',
        'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009794.a10010169&stt=CITY_GEO.CITY_GEO&stn=Ho%20Chi%20Minh%20City.Da%20Lat&dt=27-04-2025.null&ps=1&stc=',
        'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009794.a10009889&stt=CITY_GEO.CITY_GEO&stn=Ho%20Chi%20Minh%20City.Ba%20Ria%20-%20Vung%20Tau&dt=27-04-2025.null&ps=1&stc=',
        'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009889.a10009794&stt=CITY_GEO.CITY_GEO&stn=Ba%20Ria%20-%20Vung%20Tau.Ho%20Chi%20Minh%20City&dt=27-04-2025.null&ps=1&stc=',
        'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10010000.a10009794&stt=CITY_GEO.CITY_GEO&stn=Lam%20Dong%20Province.Ho%20Chi%20Minh%20City&dt=27-04-2025.null&ps=1&stc=',
        'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10010083.a10009794&stt=CITY_GEO.CITY_GEO&stn=Da%20Nang.Ho%20Chi%20Minh%20City&dt=27-04-2025.null&ps=1&stc=',
        'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009794.a10010083&stt=CITY_GEO.CITY_GEO&stn=Ho%20Chi%20Minh%20City.Da%20Nang&dt=27-04-2025.null&ps=1&stc='
      ];
      const trips = await DataCrawler.crawlAndSave(urls);
      res.json({ message: 'Scraping completed', data: trips });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TripController();