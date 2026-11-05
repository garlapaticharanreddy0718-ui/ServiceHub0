const express = require('express');
const {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  changePassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected Authentication Endpoints
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateMe);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
