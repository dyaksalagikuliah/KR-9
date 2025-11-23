const { query, transaction } = require('../config/database');
const { cache } = require('../config/redis');
const {
  verifySignature,
  generateToken,
  generateRefreshToken,
} = require('../middleware/auth');

/**
 * Generate nonce for wallet signature
 */
exports.getNonce = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    const address = walletAddress.toLowerCase();

    // Generate random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const timestamp = Date.now();

    // Message to sign
    const message = `Sign this message to authenticate with Proof of Crime.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    // Store nonce in Redis (expire in 5 minutes)
    await cache.set(`nonce:${address}`, { nonce, timestamp }, 300);

    res.json({
      success: true,
      data: {
        message,
        nonce,
        timestamp,
      },
    });
  } catch (error) {
    console.error('Get nonce error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce',
    });
  }
};

/**
 * Login with wallet signature
 */
exports.login = async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    const address = walletAddress.toLowerCase();

    // Verify signature
    const isValid = verifySignature(message, signature, address);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Check if nonce exists and is valid
    const storedData = await cache.get(`nonce:${address}`);
    if (!storedData) {
      return res.status(401).json({
        success: false,
        error: 'Nonce expired or invalid',
      });
    }

    // Verify nonce in message
    if (!message.includes(storedData.nonce)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid nonce',
      });
    }

    // Delete used nonce
    await cache.del(`nonce:${address}`);

    // Get or create user
    let result = await query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [address]
    );

    let user;
    if (result.rows.length === 0) {
      // Create new user
      result = await query(
        `INSERT INTO users (wallet_address, role, is_active, last_login_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [address, 'hunter', true]
      );
      user = result.rows[0];

      // Initialize hunter stats
      await query(
        `INSERT INTO hunter_stats (wallet_address)
         VALUES ($1)
         ON CONFLICT (wallet_address) DO NOTHING`,
        [address]
      );
    } else {
      user = result.rows[0];

      // Check if banned
      if (user.is_banned) {
        return res.status(403).json({
          success: false,
          error: 'Account is banned',
          reason: user.ban_reason,
        });
      }

      // Update last login
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );
    }

    // Generate tokens
    const accessToken = generateToken(address);
    const refreshToken = generateRefreshToken(address);

    // Store refresh token in Redis
    await cache.set(`refresh:${address}`, refreshToken, 30 * 24 * 60 * 60); // 30 days

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          email: user.email,
          username: user.username,
          profileImageUrl: user.profile_image_url,
          role: user.role,
          kycStatus: user.kyc_status,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    const address = decoded.walletAddress.toLowerCase();

    // Check if token exists in Redis
    const storedToken = await cache.get(`refresh:${address}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token has been revoked',
      });
    }

    // Generate new access token
    const accessToken = generateToken(address);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
    });
  }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  try {
    const address = req.user.wallet_address.toLowerCase();

    // Delete refresh token from Redis
    await cache.del(`refresh:${address}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
};

/**
 * Get current user
 */
exports.me = async (req, res) => {
  try {
    const user = req.user;

    // Get hunter stats if user is a hunter
    let stats = null;
    if (user.role === 'hunter') {
      const result = await query(
        'SELECT * FROM hunter_stats WHERE wallet_address = $1',
        [user.wallet_address]
      );
      stats = result.rows[0] || null;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          email: user.email,
          username: user.username,
          profileImageUrl: user.profile_image_url,
          bio: user.bio,
          role: user.role,
          kycStatus: user.kyc_status,
          isActive: user.is_active,
          createdAt: user.created_at,
        },
        stats: stats ? {
          totalEarned: stats.total_earned,
          successfulSubmissions: stats.successful_submissions,
          totalSubmissions: stats.total_submissions,
          reputationScore: stats.reputation_score,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
    });
  }
};
