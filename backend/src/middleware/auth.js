const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { query } = require('../config/database');

/**
 * Verify JWT token middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await query(
      'SELECT * FROM users WHERE wallet_address = $1 AND is_active = TRUE',
      [decoded.walletAddress.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const user = result.rows[0];

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        error: 'User is banned',
        reason: user.ban_reason
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const result = await query(
        'SELECT * FROM users WHERE wallet_address = $1 AND is_active = TRUE',
        [decoded.walletAddress.toLowerCase()]
      );

      if (result.rows.length > 0 && !result.rows[0].is_banned) {
        req.user = result.rows[0];
      }
    }
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

/**
 * Role-based authorization
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Verify wallet signature
 */
const verifySignature = (message, signature, expectedAddress) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Generate JWT token
 */
const generateToken = (walletAddress, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(
    { walletAddress: walletAddress.toLowerCase() },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (walletAddress) => {
  return jwt.sign(
    { walletAddress: walletAddress.toLowerCase(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  verifySignature,
  generateToken,
  generateRefreshToken,
};
