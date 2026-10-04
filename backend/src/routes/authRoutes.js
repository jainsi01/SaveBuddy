const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
} = require('../middleware/validators/authValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// EC-2.5: Brute-Force Rate Limiting specifically on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
    },
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip during test execution
});

/**
 * Public Authentication Routes
 */
router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);

/**
 * Protected User Profile Routes
 */
router.get('/me', protect, getMe);
router.put('/profile', protect, validateProfileUpdate, updateProfile);

module.exports = router;
