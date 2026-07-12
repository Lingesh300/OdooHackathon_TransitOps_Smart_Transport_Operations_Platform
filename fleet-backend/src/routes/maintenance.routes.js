const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  listMaintenance,
  openMaintenance,
  closeMaintenance,
} = require('../controllers/maintenance.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('maintenance', 'read'), listMaintenance);
router.post('/', requirePermission('maintenance', 'write'), openMaintenance);
router.patch('/:id/close', requirePermission('maintenance', 'write'), closeMaintenance);

module.exports = router;
