const mongoose = require('mongoose');

const ClosetItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['TOP', 'BOTTOM', 'SHOES', 'ACCESSORY', 'OUTERWEAR']
  },
  style: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ClosetItem', ClosetItemSchema);