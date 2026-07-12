const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  getFuelEfficiency,
  getFleetUtilization,
  getOperationalCost,
  getRoi,
  exportAnalyticsCsv,
} = require('../controllers/analytics.controller');

const router = express.Router();

router.use(authenticate);

router.get('/fuel-efficiency', requirePermission('analytics', 'read'), getFuelEfficiency);
router.get('/fleet-utilization', requirePermission('analytics', 'read'), getFleetUtilization);
router.get('/operational-cost', requirePermission('analytics', 'read'), getOperationalCost);
router.get('/roi', requirePermission('analytics', 'read'), getRoi);
// Kept as /export.csv to match the original spec's path exactly, in addition
// to the more RESTful /export?format=csv (both hit the same handler).
router.get('/export.csv', requirePermission('analytics', 'read'), exportAnalyticsCsv);
router.get('/export', requirePermission('analytics', 'read'), exportAnalyticsCsv);

module.exports = router;
