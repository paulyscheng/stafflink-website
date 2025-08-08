const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const workerController = require('../controllers/workerController');

const router = express.Router();

// @desc    Get all workers (for companies)
// @route   GET /api/workers
// @access  Private (Company only)
router.get('/', protect, authorize('company'), workerController.getWorkers);

// @desc    Get worker profile
// @route   GET /api/workers/profile
// @access  Private (Worker only)
router.get('/profile', protect, authorize('worker'), workerController.getProfile);

// @desc    Update worker profile
// @route   PUT /api/workers/profile
// @access  Private (Worker only)
router.put('/profile', protect, authorize('worker'), workerController.updateProfile);

// @desc    Update worker status (online/offline)
// @route   PUT /api/workers/status
// @access  Private (Worker only)
router.put('/status', protect, authorize('worker'), workerController.updateStatus);

module.exports = router;