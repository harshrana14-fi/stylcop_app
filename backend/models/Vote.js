const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  battleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  side: { type: String, enum: ['left', 'right'], required: true },
}, { timestamps: true });

VoteSchema.index({ battleId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
