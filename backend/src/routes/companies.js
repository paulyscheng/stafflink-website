const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const companyController = require('../controllers/companyController');

const router = express.Router();

// All routes are protected and only for companies
router.use(protect);
router.use(authorize('company'));

// @desc    Get company profile
// @route   GET /api/companies/profile
// @access  Private (Company only)
router.get('/profile', companyController.getProfile);

// @desc    Update company profile
// @route   PUT /api/companies/profile
// @access  Private (Company only)
router.put('/profile', companyController.updateProfile);

module.exports = router;