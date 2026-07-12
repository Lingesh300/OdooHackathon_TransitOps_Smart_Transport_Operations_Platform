const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { login, logout, refresh, me } = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post('/logout', [body('refreshToken').notEmpty()], validate, logout);
router.post('/refresh', [body('refreshToken').notEmpty()], validate, refresh);
router.get('/me', authenticate, me);

module.exports = router;
