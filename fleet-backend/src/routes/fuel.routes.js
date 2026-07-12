const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { listFuelLogs, createFuelLog } = require('../controllers/fuel.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('fuel', 'read'), listFuelLogs);
router.post('/', requirePermission('fuel', 'write'), createFuelLog);

module.exports = router;
