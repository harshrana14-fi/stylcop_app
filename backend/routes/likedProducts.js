const express = require('express');
const mongoose = require('mongoose');
const LikedProduct = require('../models/LikedProduct');
const jwt = require('jsonwebtoken');

const router = express.Router();

const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database not available. Try again later.' });
  }
  next();
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all liked products for user
router.get('/', auth, requireDb, async (req, res) => {
  try {
    console.log('[LikedProducts API] Fetching for userId:', req.userId);
    const products = await LikedProduct.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    console.log('[LikedProducts API] Found', products.length, 'products');
    res.json(products.map(p => ({
      id: p._id.toString(),
      title: p.title,
      price: p.price,
      link: p.link,
      image: p.image,
      source: p.source,
      createdAt: p.createdAt,
    })));
  } catch (error) {
    console.error('[LikedProducts API] Get error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Add liked product
router.post('/', auth, requireDb, async (req, res) => {
  try {
    const { title, price, link, image, source } = req.body || {};
    console.log('[LikedProducts API] Received:', { title, price, link, image, source, userId: req.userId });
    if (!title || !price || !link || !image || !source) {
      console.log('[LikedProducts API] Missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await LikedProduct.findOne({ userId: req.userId, link });
    if (existing) {
      console.log('[LikedProducts API] Already exists');
      return res.json({
        id: existing._id.toString(),
        title: existing.title,
        price: existing.price,
        link: existing.link,
        image: existing.image,
        source: existing.source,
        createdAt: existing.createdAt,
      });
    }
    const product = await LikedProduct.create({
      userId: req.userId,
      title,
      price,
      link,
      image,
      source,
    });
    console.log('[LikedProducts API] Created:', product._id);
    res.status(201).json({
      id: product._id.toString(),
      title: product.title,
      price: product.price,
      link: product.link,
      image: product.image,
      source: product.source,
      createdAt: product.createdAt,
    });
  } catch (error) {
    console.error('[LikedProducts API] Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product already liked' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Remove liked product
router.delete('/:id', auth, requireDb, async (req, res) => {
  try {
    const product = await LikedProduct.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product removed from likes' });
  } catch (error) {
    console.error('Remove liked product error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
