const { body, param, query, validationResult } = require('express-validator');
const { ethers } = require('ethers');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Custom validator: Ethereum address
 */
const isEthereumAddress = (value) => {
  return ethers.isAddress(value);
};

/**
 * Validation rules for different routes
 */

// Auth validation
const authValidation = {
  login: [
    body('walletAddress')
      .notEmpty().withMessage('Wallet address is required')
      .custom(isEthereumAddress).withMessage('Invalid Ethereum address'),
    body('signature')
      .notEmpty().withMessage('Signature is required')
      .isLength({ min: 130, max: 132 }).withMessage('Invalid signature format'),
    body('message')
      .notEmpty().withMessage('Message is required'),
    handleValidationErrors
  ],

  register: [
    body('walletAddress')
      .notEmpty().withMessage('Wallet address is required')
      .custom(isEthereumAddress).withMessage('Invalid Ethereum address'),
    body('email')
      .optional()
      .isEmail().withMessage('Invalid email format'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    handleValidationErrors
  ]
};

// Bounty validation
const bountyValidation = {
  create: [
    body('title')
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters'),
    body('description')
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('targetContractAddress')
      .notEmpty().withMessage('Target contract address is required')
      .custom(isEthereumAddress).withMessage('Invalid contract address'),
    body('category')
      .optional()
      .isIn(['smart-contract', 'dapp', 'protocol']).withMessage('Invalid category'),
    body('tags')
      .optional()
      .isArray().withMessage('Tags must be an array'),
    handleValidationErrors
  ],

  update: [
    param('id').isInt({ min: 1 }).withMessage('Invalid bounty ID'),
    body('title')
      .optional()
      .isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters'),
    body('description')
      .optional()
      .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    handleValidationErrors
  ],

  get: [
    param('id').isInt({ min: 1 }).withMessage('Invalid bounty ID'),
    handleValidationErrors
  ],

  list: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status').optional().isIn(['0', '1', '2', '3', '4', '5']).withMessage('Invalid status'),
    query('category').optional().isIn(['smart-contract', 'dapp', 'protocol']).withMessage('Invalid category'),
    handleValidationErrors
  ]
};

// Submission validation
const submissionValidation = {
  create: [
    body('bountyId')
      .notEmpty().withMessage('Bounty ID is required')
      .isInt({ min: 0 }).withMessage('Invalid bounty ID'),
    body('title')
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters'),
    body('description')
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('vulnerabilityType')
      .optional()
      .isString().withMessage('Vulnerability type must be a string'),
    body('proofOfConcept')
      .notEmpty().withMessage('Proof of concept is required')
      .isLength({ min: 50 }).withMessage('PoC must be at least 50 characters'),
    body('reproductionSteps')
      .optional()
      .isString().withMessage('Reproduction steps must be a string'),
    body('suggestedFix')
      .optional()
      .isString().withMessage('Suggested fix must be a string'),
    handleValidationErrors
  ],

  update: [
    param('id').isInt({ min: 1 }).withMessage('Invalid submission ID'),
    body('title')
      .optional()
      .isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters'),
    body('description')
      .optional()
      .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    handleValidationErrors
  ],

  get: [
    param('id').isInt({ min: 1 }).withMessage('Invalid submission ID'),
    handleValidationErrors
  ]
};

// Comment validation
const commentValidation = {
  create: [
    body('submissionId')
      .notEmpty().withMessage('Submission ID is required')
      .isInt({ min: 1 }).withMessage('Invalid submission ID'),
    body('content')
      .notEmpty().withMessage('Comment content is required')
      .isLength({ min: 1, max: 5000 }).withMessage('Comment must be 1-5000 characters'),
    body('parentCommentId')
      .optional()
      .isInt({ min: 1 }).withMessage('Invalid parent comment ID'),
    body('isPrivate')
      .optional()
      .isBoolean().withMessage('isPrivate must be boolean'),
    handleValidationErrors
  ],

  update: [
    param('id').isInt({ min: 1 }).withMessage('Invalid comment ID'),
    body('content')
      .notEmpty().withMessage('Comment content is required')
      .isLength({ min: 1, max: 5000 }).withMessage('Comment must be 1-5000 characters'),
    handleValidationErrors
  ]
};

// User validation
const userValidation = {
  updateProfile: [
    body('email')
      .optional()
      .isEmail().withMessage('Invalid email format'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, _ and -'),
    body('bio')
      .optional()
      .isLength({ max: 500 }).withMessage('Bio must be max 500 characters'),
    body('profileImageUrl')
      .optional()
      .isURL().withMessage('Invalid URL format'),
    handleValidationErrors
  ],

  get: [
    param('address')
      .notEmpty().withMessage('Address is required')
      .custom(isEthereumAddress).withMessage('Invalid Ethereum address'),
    handleValidationErrors
  ]
};

// Validator vote validation
const validatorVoteValidation = {
  castVote: [
    body('submissionId')
      .notEmpty().withMessage('Submission ID is required')
      .isInt({ min: 0 }).withMessage('Invalid submission ID'),
    body('severity')
      .notEmpty().withMessage('Severity is required')
      .isInt({ min: 0, max: 3 }).withMessage('Severity must be 0-3'),
    body('isValid')
      .notEmpty().withMessage('isValid is required')
      .isBoolean().withMessage('isValid must be boolean'),
    body('comments')
      .optional()
      .isLength({ max: 1000 }).withMessage('Comments must be max 1000 characters'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  authValidation,
  bountyValidation,
  submissionValidation,
  commentValidation,
  userValidation,
  validatorVoteValidation,
};
