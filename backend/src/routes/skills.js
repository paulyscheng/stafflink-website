const express = require('express');
const { protect } = require('../middleware/auth');
const skillController = require('../controllers/skillController');

const router = express.Router();

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
router.get('/', skillController.getSkills);

// @desc    Get skills by category
// @route   GET /api/skills/category/:category
// @access  Public
router.get('/category/:category', skillController.getSkillsByCategory);

// @desc    Get worker's skills
// @route   GET /api/skills/worker
// @access  Private (Worker only)
router.get('/worker', protect, skillController.getWorkerSkills);

// @desc    Update worker's skills
// @route   PUT /api/skills/worker
// @access  Private (Worker only)
router.put('/worker', protect, skillController.updateWorkerSkills);

module.exports = router;