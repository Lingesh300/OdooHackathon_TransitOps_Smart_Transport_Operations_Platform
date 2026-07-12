const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  listDrivers,
  getDispatchPool,
  getDriverById,
  createDriver,
  updateDriverStatus,
} = require('../controllers/drivers.controller');

const router = express.Router();

router.use(authenticate);

router.get('/dispatch-pool', requirePermission('drivers', 'read'), getDispatchPool);
router.get('/', requirePermission('drivers', 'read'), listDrivers);
router.get('/:id', requirePermission('drivers', 'read'), getDriverById);
router.post('/', requirePermission('drivers', 'write'), createDriver);
router.patch('/:id/status', requirePermission('drivers', 'write'), updateDriverStatus);

module.exports = router;
