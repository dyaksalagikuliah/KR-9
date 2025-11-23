const { query, transaction } = require('../config/database');
const { cache } = require('../config/redis');

/**
 * Get all bounties with filters and pagination
 */
exports.getBounties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
      company,
      sortBy = 'created_at',
      order = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['1=1'];
    const params = [];
    let paramCount = 1;

    // Filter by status
    if (status !== undefined) {
      conditions.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    // Filter by category
    if (category) {
      conditions.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    // Filter by company
    if (company) {
      conditions.push(`EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = bounties.company_id
        AND u.wallet_address = $${paramCount}
      )`);
      params.push(company.toLowerCase());
      paramCount++;
    }

    // Search in title and description
    if (search) {
      conditions.push(`(title ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    // Build query
    const whereClause = conditions.join(' AND ');
    const orderByClause = `${sortBy} ${order}`;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM bounties WHERE ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get bounties with company info
    params.push(limit, offset);
    const result = await query(
      `SELECT
        b.*,
        u.wallet_address as company_wallet,
        u.username as company_name,
        u.profile_image_url as company_avatar,
        (SELECT COUNT(*) FROM submissions WHERE bounty_id = b.id) as submission_count,
        (SELECT COUNT(*) FROM submissions WHERE bounty_id = b.id AND status = 2) as valid_submission_count
       FROM bounties b
       LEFT JOIN users u ON b.company_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderByClause}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    res.json({
      success: true,
      data: {
        bounties: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get bounties error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bounties',
    });
  }
};

/**
 * Get single bounty by ID
 */
exports.getBountyById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        b.*,
        u.wallet_address as company_wallet,
        u.username as company_name,
        u.profile_image_url as company_avatar,
        u.email as company_email,
        (SELECT COUNT(*) FROM submissions WHERE bounty_id = b.id) as submission_count,
        (SELECT COUNT(*) FROM submissions WHERE bounty_id = b.id AND status = 2) as valid_submission_count
       FROM bounties b
       LEFT JOIN users u ON b.company_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bounty not found',
      });
    }

    const bounty = result.rows[0];

    // Increment view count (async, don't wait)
    query('UPDATE bounties SET view_count = view_count + 1 WHERE id = $1', [id]).catch(console.error);

    res.json({
      success: true,
      data: { bounty },
    });
  } catch (error) {
    console.error('Get bounty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bounty',
    });
  }
};

/**
 * Create bounty (off-chain record)
 */
exports.createBounty = async (req, res) => {
  try {
    const {
      title,
      description,
      targetContractAddress,
      targetContractSourceCode,
      documentationUrl,
      tags,
      category,
      visibility = 'public',
    } = req.body;

    const companyId = req.user.id;

    // Check if user is a company or admin
    if (req.user.role !== 'company' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only companies can create bounties',
      });
    }

    // Create off-chain bounty record (will be updated when on-chain bounty is created)
    const result = await query(
      `INSERT INTO bounties (
        company_id, title, description, target_contract_address,
        target_contract_source_code, documentation_url, tags, category, visibility
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        companyId,
        title,
        description,
        targetContractAddress.toLowerCase(),
        targetContractSourceCode,
        documentationUrl,
        tags,
        category,
        visibility,
      ]
    );

    const bounty = result.rows[0];

    res.status(201).json({
      success: true,
      data: { bounty },
      message: 'Bounty created successfully. Please submit on-chain transaction.',
    });
  } catch (error) {
    console.error('Create bounty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bounty',
    });
  }
};

/**
 * Update bounty (only off-chain data)
 */
exports.updateBounty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      targetContractSourceCode,
      documentationUrl,
      tags,
      category,
      visibility,
    } = req.body;

    // Check if bounty exists and user is the owner
    const bountyResult = await query(
      'SELECT * FROM bounties WHERE id = $1',
      [id]
    );

    if (bountyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bounty not found',
      });
    }

    const bounty = bountyResult.rows[0];

    if (bounty.company_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own bounties',
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      params.push(title);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (targetContractSourceCode !== undefined) {
      updates.push(`target_contract_source_code = $${paramCount}`);
      params.push(targetContractSourceCode);
      paramCount++;
    }
    if (documentationUrl !== undefined) {
      updates.push(`documentation_url = $${paramCount}`);
      params.push(documentationUrl);
      paramCount++;
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramCount}`);
      params.push(tags);
      paramCount++;
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }
    if (visibility !== undefined) {
      updates.push(`visibility = $${paramCount}`);
      params.push(visibility);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query(
      `UPDATE bounties SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    res.json({
      success: true,
      data: { bounty: result.rows[0] },
      message: 'Bounty updated successfully',
    });
  } catch (error) {
    console.error('Update bounty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bounty',
    });
  }
};

/**
 * Get bounty submissions
 */
exports.getBountySubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Check if bounty exists
    const bountyResult = await query(
      'SELECT * FROM bounties WHERE id = $1',
      [id]
    );

    if (bountyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bounty not found',
      });
    }

    const bounty = bountyResult.rows[0];

    // Build where clause
    const conditions = ['bounty_id = $1'];
    const params = [id];
    let paramCount = 2;

    if (status !== undefined) {
      conditions.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    // Only show public submissions or own submissions
    if (!req.user || (req.user.id !== bounty.company_id && req.user.role !== 'admin')) {
      conditions.push('is_public = TRUE');
    }

    const whereClause = conditions.join(' AND ');

    // Get submissions
    params.push(limit, offset);
    const result = await query(
      `SELECT
        s.*,
        u.wallet_address as hunter_wallet,
        u.username as hunter_name,
        u.profile_image_url as hunter_avatar
       FROM submissions s
       LEFT JOIN users u ON s.hunter_id = u.id
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM submissions WHERE ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      success: true,
      data: {
        submissions: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get bounty submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
    });
  }
};

/**
 * Get bounty statistics
 */
exports.getBountyStats = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 2 THEN 1 END) as valid_submissions,
        COUNT(CASE WHEN status = 3 THEN 1 END) as invalid_submissions,
        COUNT(CASE WHEN is_paid = TRUE THEN 1 END) as paid_submissions,
        COALESCE(SUM(CASE WHEN is_paid = TRUE THEN reward_amount::numeric ELSE 0 END), 0) as total_paid
       FROM submissions
       WHERE bounty_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: { stats: result.rows[0] },
    });
  } catch (error) {
    console.error('Get bounty stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bounty statistics',
    });
  }
};
