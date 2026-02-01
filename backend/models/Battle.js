const mongoose = require('mongoose');

const BattleSchema = new mongoose.Schema({
  leftUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leftImageUrl: { type: String, required: true },
  leftUserName: { type: String, required: true },
  leftOutfitDetails: { type: String, default: '' },
  rightUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rightImageUrl: { type: String, default: null },
  rightUserName: { type: String, default: null },
  rightOutfitDetails: { type: String, default: '' },
  status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'waiting' },
  leftVotes: { type: Number, default: 0 },
  rightVotes: { type: Number, default: 0 },
  winner: { type: String, enum: ['left', 'right', null], default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Battle', BattleSchema);
