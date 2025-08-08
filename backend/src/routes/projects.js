const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Company only)
router.post('/', authorize('company'), projectController.createProject);

// @desc    Get company's projects
// @route   GET /api/projects
// @access  Private (Company only)
router.get('/', authorize('company'), projectController.getCompanyProjects);

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', projectController.getProject);

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Company only)
router.put('/:id', authorize('company'), projectController.updateProject);

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Company only)
router.delete('/:id', authorize('company'), projectController.deleteProject);

module.exports = router;