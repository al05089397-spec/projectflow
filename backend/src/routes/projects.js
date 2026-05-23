// routes/projects.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getProjects, getProjectById, createProject,
  updateProject, deleteProject, addMember
} = require('../controllers/projectController');

router.use(authMiddleware);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', addMember);

module.exports = router;
