const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
});

/**
 * @route   GET /api/v1/auth/nonce/:walletAddress
 * @desc    Get nonce for wallet signature
 * @access  Public
 */
router.get('/nonce/:walletAddress', authLimiter, authController.getNonce);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with wallet signature
 * @access  Public
 */
router.post('/login', authLimiter, authValidation.login, authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authLimiter, authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
