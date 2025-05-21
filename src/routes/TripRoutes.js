const express = require('express');
const router = express.Router();
const TripController = require('../controllers/TripController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const AdminMiddleware = require('../middlewares/AdminMiddleware');

router.post('/', AuthMiddleware, TripController.createTrip);
router.get('/', TripController.getAllTrips);
router.get('/:id', TripController.getTripById);
router.put('/:id', AuthMiddleware, TripController.updateTrip);
router.delete('/:id', AuthMiddleware, TripController.deleteTrip);
router.post('/scrape', AuthMiddleware, TripController.scrapeTrips);
router.get('/:id/seats', TripController.getTripSeats);
/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Get all trips
 *     responses:
 *       200:
 *         description: List of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   startStation: { type: object }
 *                   endStation: { type: object }
 *                   departureTime: { type: string }
 *                   price: { type: number }
 */
router.get('/', TripController.getAllTrips);
module.exports = router;