const mongoose = require('mongoose');

const LikedProductSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate likes (same user + same link)
LikedProductSchema.index({ userId: 1, link: 1 }, { unique: true });

module.exports = mongoose.model('LikedProduct', LikedProductSchema);
