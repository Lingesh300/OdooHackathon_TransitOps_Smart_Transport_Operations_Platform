const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  listTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require('../controllers/trips.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('trips', 'read'), listTrips);
router.get('/:id', requirePermission('trips', 'read'), getTripById);
router.post('/', requirePermission('trips', 'write'), createTrip);
router.post('/:id/dispatch', requirePermission('trips', 'dispatch'), dispatchTrip);
router.post('/:id/complete', requirePermission('trips', 'write'), completeTrip);
router.post('/:id/cancel', requirePermission('trips', 'write'), cancelTrip);

module.exports = router;
