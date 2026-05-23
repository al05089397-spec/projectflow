// routes/tasks.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { authMiddleware } = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } = require('../controllers/taskController');

router.use(authMiddleware);

// Rutas anidadas bajo /api/projects/:projectId/tasks
router.get('/', getTasks);
router.post('/', createTask);

// Rutas independientes bajo /api/tasks/:id
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
