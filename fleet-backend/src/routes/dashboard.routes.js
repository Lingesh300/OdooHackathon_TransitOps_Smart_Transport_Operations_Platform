const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { getKpis } = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(authenticate);

router.get('/kpis', requirePermission('dashboard', 'read'), getKpis);

module.exports = router;
