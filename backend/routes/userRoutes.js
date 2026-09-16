const express = require('express');
const router = express.Router();
const { updateProfile, searchUsers, uploadAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.put('/profile', protect, updateProfile);
router.get('/search', protect, searchUsers);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
