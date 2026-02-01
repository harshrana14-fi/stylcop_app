const mongoose = require('mongoose');

const BattleCommentSchema = new mongoose.Schema({
  battleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BattleComment', BattleCommentSchema);
