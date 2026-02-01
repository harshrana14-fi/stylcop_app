const express = require('express');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname || 'avatar'}.jpg`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const m = (file.mimetype || '').toLowerCase();
    if (m.startsWith('image/') || m === 'image') return cb(null, true);
    cb(new Error('Only images allowed'));
  },
});

function toUserJson(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    college: user.college,
    age: user.age,
    avatar: user.avatar || '',
    gender: user.gender || '',
    preferences: user.preferences || [],
  };
}

const updatePreferencesHandler = async (req, res) => {
  try {
    const { preferences, gender } = req.body || {};
    if (!Array.isArray(preferences)) {
      return res.status(400).json({ message: 'preferences must be an array' });
    }
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const update = { preferences: preferences.map(String).slice(0, 30) };
    if (gender === 'male' || gender === 'female' || gender === 'other' || gender === '') {
      update.gender = gender;
    }
    const user = await User.findOneAndUpdate(
      { _id: userId },
      update,
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: toUserJson(user) });
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Token validation endpoint (returns valid + user so app has latest preferences)
router.get('/validate-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ valid: false });
    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        age: user.age,
        avatar: user.avatar,
        gender: user.gender || '',
        preferences: user.preferences || []
      }
    });
  } catch (error) {
    res.status(500).json({ valid: false });
  }
});

// Update fashion preferences (onboarding) — PATCH and POST so all clients work
router.patch('/preferences', auth, updatePreferencesHandler);
router.post('/preferences', auth, updatePreferencesHandler);

// Update profile (name, college, age)
router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, college, age } = req.body || {};
    const update = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof college === 'string' && college.trim()) update.college = college.trim();
    if (typeof age !== 'undefined') {
      const n = parseInt(age, 10);
      if (!isNaN(n) && n >= 13 && n <= 100) update.age = n;
    }
    if (Object.keys(update).length === 0) {
      const user = await User.findById(req.userId).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json({ user: toUserJson(user) });
    }
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: toUserJson(user) });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
});
router.post('/profile', auth, async (req, res) => {
  try {
    const { name, college, age } = req.body || {};
    const update = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof college === 'string' && college.trim()) update.college = college.trim();
    if (typeof age !== 'undefined') {
      const n = parseInt(age, 10);
      if (!isNaN(n) && n >= 13 && n <= 100) update.age = n;
    }
    if (Object.keys(update).length === 0) {
      const user = await User.findById(req.userId).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json({ user: toUserJson(user) });
    }
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: toUserJson(user) });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update avatar only (multipart)
router.post('/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: toUserJson(user) });
  } catch (error) {
    console.error('Update avatar error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;