const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const phoneValidation = body('phone')
  .matches(/^1[3-9]\d{9}$/)
  .withMessage('Please provide a valid Chinese phone number');

const codeValidation = body('code')
  .isLength({ min: 4, max: 6 })
  .withMessage('Verification code must be 4-6 digits');

// @desc    Send SMS verification code
// @route   POST /api/auth/send-code
// @access  Public
router.post('/send-code', [phoneValidation], authController.sendVerificationCode);

// @desc    Login with phone and verification code
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  phoneValidation,
  codeValidation,
  body('userType').isIn(['company', 'worker']).withMessage('User type must be company or worker')
], authController.login);

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  phoneValidation,
  codeValidation,
  body('userType').isIn(['company', 'worker']).withMessage('User type must be company or worker'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
], authController.register);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, authController.logout);

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', protect, authController.refreshToken);

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, authController.getMe);

// @desc    Quick login with mobile number (一键登录)
// @route   POST /api/auth/quick-login
// @access  Public
// TODO: Implement quickLogin functionality
// router.post('/quick-login', [
//   body('loginToken').notEmpty().withMessage('Login token is required'),
//   body('userType').isIn(['company', 'worker']).withMessage('User type must be company or worker')
// ], authController.quickLogin);

module.exports = router;