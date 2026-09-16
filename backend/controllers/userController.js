const User = require('../models/User');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users by username or email for team invitation
// @route   GET /api/users/search?q=query
// @access  Private
exports.searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    if (!query || query.length < 2) {
      return res.status(200).json({ success: true, users: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name username email avatar')
      .limit(10);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture file
// @route   POST /api/users/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded and updated successfully!',
      avatar: avatarUrl,
      user,
    });
  } catch (error) {
    next(error);
  }
};
