const express = require('express');
const ClosetItem = require('../models/ClosetItem');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const closetDir = path.join(__dirname, '..', 'uploads', 'closet');

// Multer configuration for closet item uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, closetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.jpg';
    cb(null, `${Date.now()}-${file.originalname || 'closet-item'}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
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
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Add item to closet
router.post('/add', auth, upload.single('image'), async (req, res) => {
  try {
    const { category, style, description, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    const imageUrl = `/uploads/closet/${req.file.filename}`;
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    const closetItem = new ClosetItem({
      userId: req.userId,
      imageUrl,
      category,
      style,
      description,
      tags: tagArray
    });
    
    await closetItem.save();
    
    res.status(201).json(closetItem);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's closet items
router.get('/items', auth, async (req, res) => {
  try {
    const items = await ClosetItem.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete closet item
router.delete('/items/:id', auth, async (req, res) => {
  try {
    const item = await ClosetItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;