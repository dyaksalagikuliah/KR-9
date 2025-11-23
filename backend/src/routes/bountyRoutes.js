const express = require('express');
const router = express.Router();
const bountyController = require('../controllers/bountyController');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const { bountyValidation } = require('../middleware/validation');

/**
 * @route   GET /api/v1/bounties
 * @desc    Get all bounties with filters
 * @access  Public
 */
router.get('/', optionalAuth, bountyValidation.list, bountyController.getBounties);

/**
 * @route   GET /api/v1/bounties/:id
 * @desc    Get single bounty
 * @access  Public
 */
router.get('/:id', optionalAuth, bountyValidation.get, bountyController.getBountyById);

/**
 * @route   GET /api/v1/bounties/:id/submissions
 * @desc    Get bounty submissions
 * @access  Public (filtered)
 */
router.get('/:id/submissions', optionalAuth, bountyValidation.get, bountyController.getBountySubmissions);

/**
 * @route   GET /api/v1/bounties/:id/stats
 * @desc    Get bounty statistics
 * @access  Public
 */
router.get('/:id/stats', bountyValidation.get, bountyController.getBountyStats);

/**
 * @route   POST /api/v1/bounties
 * @desc    Create new bounty
 * @access  Private (Company/Admin)
 */
router.post('/', authenticate, authorize('company', 'admin'), bountyValidation.create, bountyController.createBounty);

/**
 * @route   PUT /api/v1/bounties/:id
 * @desc    Update bounty
 * @access  Private (Owner/Admin)
 */
router.put('/:id', authenticate, bountyValidation.update, bountyController.updateBounty);

module.exports = router;
