const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const { query } = require('../config/database');

/**
 * @route   GET /api/v1/users/:address
 * @desc    Get user profile
 * @access  Public
 */
router.get('/:address', userValidation.get, async (req, res) => {
  try {
    const { address } = req.params;

    const result = await query(
      `SELECT
        u.wallet_address,
        u.username,
        u.profile_image_url,
        u.bio,
        u.role,
        u.created_at,
        hs.total_earned,
        hs.successful_submissions,
        hs.total_submissions,
        hs.reputation_score
       FROM users u
       LEFT JOIN hunter_stats hs ON u.wallet_address = hs.wallet_address
       WHERE u.wallet_address = $1 AND u.is_active = TRUE`,
      [address.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, userValidation.updateProfile, async (req, res) => {
  try {
    const { email, username, bio, profileImageUrl } = req.body;
    const userId = req.user.id;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      params.push(email);
      paramCount++;
    }
    if (username !== undefined) {
      updates.push(`username = $${paramCount}`);
      params.push(username);
      paramCount++;
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount}`);
      params.push(bio);
      paramCount++;
    }
    if (profileImageUrl !== undefined) {
      updates.push(`profile_image_url = $${paramCount}`);
      params.push(profileImageUrl);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    res.json({
      success: true,
      data: { user: result.rows[0] },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

module.exports = router;
