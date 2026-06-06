const express = require('express');
const router = express.Router();
const { register, login, getProfile, getUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.get('/users', verifyToken, getUsers);

module.exports = router;