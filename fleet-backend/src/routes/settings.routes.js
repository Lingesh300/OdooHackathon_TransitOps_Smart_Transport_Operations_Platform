const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getRbac, updateRbac } = require('../controllers/settings.controller');

const router = express.Router();

router.use(authenticate);

// Only admins may view/edit RBAC configuration itself.
router.get('/rbac', authorize('admin'), getRbac);
router.put('/rbac', authorize('admin'), updateRbac);

module.exports = router;
