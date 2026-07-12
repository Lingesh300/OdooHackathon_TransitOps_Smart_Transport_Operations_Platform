const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  listExpenses,
  createExpense,
  getVehicleExpenseTotal,
} = require('../controllers/expenses.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('expenses', 'read'), listExpenses);
router.post('/', requirePermission('expenses', 'write'), createExpense);
router.get('/vehicle/:id/total', requirePermission('expenses', 'read'), getVehicleExpenseTotal);

module.exports = router;
