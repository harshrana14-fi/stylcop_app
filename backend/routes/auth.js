const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Return 503 immediately if DB not connected (avoids 10s buffer timeout and client AbortError)
function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database not available. Add your IP to MongoDB Atlas Network Access (whitelist), then restart the server.',
    });
  }
  next();
}

// Resolve avatar upload path relative to backend root
const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${file.originalname || 'avatar'}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // React Native may send type "image" or "image/jpeg"; accept any image type
    const mimetype = (file.mimetype || '').toLowerCase();
    const isImage = mimetype === 'image' || mimetype.startsWith('image/') || /jpeg|jpg|png|gif|webp/.test(mimetype);
    const ext = (path.extname(file.originalname || '') || '').toLowerCase();
    const hasImageExt = /\.(jpe?g|png|gif|webp)$/i.test(ext) || !ext;
    if (isImage || hasImageExt) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});

// Parse multipart with no file (for login FormData)
const uploadNone = multer();

// Signup route — use multer so FormData (multipart) is parsed; req.body gets fields, req.file gets avatar
router.post('/signup', upload.single('avatar'), requireDb, async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET missing' });
    }
    const { name, email, password, college, age } = req.body || {};
    
    // Validation
    if (!name || !email || !password || !college || !age) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate age is a number
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      return res.status(400).json({ message: 'Age must be a number between 13 and 100' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : '';
    const user = new User({
      name,
      email,
      password,
      college,
      age: ageNum,
      avatar: avatarPath
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(201).json({
      token,
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
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Login route — client sends FormData too, so parse multipart with no file
router.post('/login', uploadNone.none(), requireDb, async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET missing' });
    }
    const { email, password } = req.body || {};
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      token,
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
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Multer/upload errors → 400 with message (must be after routes so next(err) from multer is caught)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message || 'Upload error' });
  }
  if (err && err.message) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;