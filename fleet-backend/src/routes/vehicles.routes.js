const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  listVehicles,
  getDispatchPool,
  getVehicleById,
  createVehicle,
  updateVehicle,
} = require('../controllers/vehicles.controller');

const router = express.Router();

router.use(authenticate);

// NOTE: /dispatch-pool and /:id both match GET /vehicles/<segment> — the
// literal route must be declared before the :id param route or Express will
// treat "dispatch-pool" as an :id value.
router.get('/dispatch-pool', requirePermission('vehicles', 'read'), getDispatchPool);
router.get('/', requirePermission('vehicles', 'read'), listVehicles);
router.get('/:id', requirePermission('vehicles', 'read'), getVehicleById);
router.post('/', requirePermission('vehicles', 'write'), createVehicle);
router.put('/:id', requirePermission('vehicles', 'write'), updateVehicle);

module.exports = router;
