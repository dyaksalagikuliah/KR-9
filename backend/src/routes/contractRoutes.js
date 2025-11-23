const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/v1/contracts
 * @desc    Get contract addresses and network info
 * @access  Public
 */
router.get('/', contractController.getContractData);

/**
 * @route   GET /api/v1/contracts/bounties/:bountyId
 * @desc    Get bounty from blockchain
 * @access  Public
 */
router.get('/bounties/:bountyId', contractController.getBountyOnChain);

/**
 * @route   GET /api/v1/contracts/submissions/:submissionId
 * @desc    Get submission from blockchain
 * @access  Public
 */
router.get('/submissions/:submissionId', contractController.getSubmissionOnChain);

/**
 * @route   GET /api/v1/contracts/hunters/:address
 * @desc    Get hunter stats from blockchain
 * @access  Public
 */
router.get('/hunters/:address', contractController.getHunterOnChain);

/**
 * @route   GET /api/v1/contracts/token/balance/:address
 * @desc    Get CRIME token balance
 * @access  Public
 */
router.get('/token/balance/:address', contractController.getTokenBalance);

/**
 * @route   GET /api/v1/contracts/token/staking/:address
 * @desc    Get staking info
 * @access  Public
 */
router.get('/token/staking/:address', contractController.getStakingInfo);

/**
 * @route   GET /api/v1/contracts/token/subscription/:address
 * @desc    Check subscription status
 * @access  Public
 */
router.get('/token/subscription/:address', contractController.checkSubscription);

/**
 * @route   GET /api/v1/contracts/validation/:submissionId
 * @desc    Get validation status
 * @access  Public
 */
router.get('/validation/:submissionId', contractController.getValidationStatus);

/**
 * @route   GET /api/v1/contracts/vault/:tokenAddress
 * @desc    Get vault balance
 * @access  Public
 */
router.get('/vault/:tokenAddress', contractController.getVaultBalance);

/**
 * @route   GET /api/v1/contracts/approval/:requestId
 * @desc    Get multi-sig approval status
 * @access  Public
 */
router.get('/approval/:requestId', contractController.getApprovalStatus);

/**
 * @route   GET /api/v1/contracts/tx/:txHash
 * @desc    Get transaction status
 * @access  Public
 */
router.get('/tx/:txHash', contractController.getTransactionStatus);

/**
 * @route   POST /api/v1/contracts/sync/bounty/:bountyId
 * @desc    Manually sync bounty from blockchain
 * @access  Private (Admin)
 */
router.post('/sync/bounty/:bountyId', authenticate, contractController.syncBounty);

module.exports = router;
