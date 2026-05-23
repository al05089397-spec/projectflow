// routes/users.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');

router.use(authMiddleware);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
