const express = require('express');
const mongoose = require('mongoose');
const Battle = require('../models/Battle');
const BattleComment = require('../models/BattleComment');
const Vote = require('../models/Vote');
const User = require('../models/User');
const ClosetItem = require('../models/ClosetItem');
const jwt = require('jsonwebtoken');
const { matchOpponents } = require('../services/opponentMatching');

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

const PLACEHOLDER_OPPONENT_IMAGE = 'https://picsum.photos/seed/stylcop-opponent/400/600';
const PLACEHOLDER_OPPONENT_NAME = 'Stylcop';

// List battles (waiting for opponent + active + recent ended)
router.get('/', auth, requireDb, async (req, res) => {
  try {
    // Backfill old waiting battles with placeholder opponent so they show two sides
    await Battle.updateMany(
      { status: 'waiting', rightUserId: null },
      { $set: { rightImageUrl: PLACEHOLDER_OPPONENT_IMAGE, rightUserName: PLACEHOLDER_OPPONENT_NAME, status: 'active' } }
    );
    const list = await Battle.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const battles = list.map(b => ({
      id: b._id.toString(),
      leftUserId: b.leftUserId,
      leftImageUrl: b.leftImageUrl,
      leftUserName: b.leftUserName,
      leftOutfitDetails: b.leftOutfitDetails || '',
      rightUserId: b.rightUserId,
      rightImageUrl: b.rightImageUrl,
      rightUserName: b.rightUserName,
      rightOutfitDetails: b.rightOutfitDetails || '',
      status: b.status,
      leftVotes: b.leftVotes || 0,
      rightVotes: b.rightVotes || 0,
      winner: b.winner,
      createdAt: b.createdAt,
    }));
    res.json(battles);
  } catch (error) {
    console.error('List battles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create battle (user's outfit = left side). Auto-match opponent via KNN (gender, age, style).
// Accept imageUrl (path or full URL) or closetItemId.
router.post('/', auth, requireDb, async (req, res) => {
  try {
    const { imageUrl, closetItemId } = req.body || {};
    let url = typeof imageUrl === 'string' ? imageUrl.trim() : null;
    if (!url && closetItemId) {
      const item = await ClosetItem.findOne({ _id: closetItemId, userId: req.userId }).lean();
      if (!item || !item.imageUrl) return res.status(404).json({ message: 'Closet item not found' });
      url = item.imageUrl;
    }
    if (!url) return res.status(400).json({ message: 'imageUrl or closetItemId required' });
    const user = await User.findById(req.userId).select('name').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const displayName = (user.name || 'Anonymous').trim() || 'Anonymous';
    const battle = await Battle.create({
      leftUserId: req.userId,
      leftImageUrl: url,
      leftUserName: displayName,
      status: 'waiting',
    });

    // Automatic opponent matching: fetch all users, pick nearest by gender/age/style (weighted KNN)
    const currentIdStr = String(req.userId);
    const allUsers = await User.find()
      .select('_id name gender age preferences avatar')
      .lean();
    const opponentIds = matchOpponents(currentIdStr, allUsers, 5); // try up to 5 candidates

    for (const opponentId of opponentIds) {
      const opponentUser = await User.findById(opponentId).select('name avatar').lean();
      const opponentClosetItem = await ClosetItem.findOne({ userId: opponentId }).sort({ createdAt: -1 }).lean();
      const rightImageUrl = (opponentClosetItem && opponentClosetItem.imageUrl)
        ? opponentClosetItem.imageUrl
        : (opponentUser && opponentUser.avatar) ? opponentUser.avatar : null;
      if (opponentUser && rightImageUrl) {
        battle.rightUserId = opponentId;
        battle.rightImageUrl = rightImageUrl;
        battle.rightUserName = (opponentUser.name || 'Anonymous').trim() || 'Anonymous';
        battle.status = 'active';
        await battle.save();
        break;
      }
    }

    // If no other users or none with an outfit/avatar: use placeholder so battle still shows two sides
    if (battle.status === 'waiting' && battle.rightUserId == null) {
      battle.rightUserId = null;
      battle.rightImageUrl = PLACEHOLDER_OPPONENT_IMAGE;
      battle.rightUserName = PLACEHOLDER_OPPONENT_NAME;
      battle.status = 'active';
      await battle.save();
    }

    return res.status(201).json({
      id: battle._id.toString(),
      leftUserId: battle.leftUserId,
      leftImageUrl: battle.leftImageUrl,
      leftUserName: battle.leftUserName,
      leftOutfitDetails: battle.leftOutfitDetails || '',
      rightUserId: battle.rightUserId,
      rightImageUrl: battle.rightImageUrl,
      rightUserName: battle.rightUserName,
      rightOutfitDetails: battle.rightOutfitDetails || '',
      status: battle.status,
      leftVotes: battle.leftVotes || 0,
      rightVotes: battle.rightVotes || 0,
      winner: battle.winner,
      createdAt: battle.createdAt,
    });
  } catch (error) {
    console.error('Create battle error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Join battle as opponent (right side)
router.post('/:id/join', auth, async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ message: 'Battle not found' });
    if (battle.status !== 'waiting') return res.status(400).json({ message: 'Battle is not open to join' });
    if (battle.leftUserId.toString() === req.userId.toString()) return res.status(400).json({ message: 'Cannot join your own battle' });
    const { imageUrl, closetItemId } = req.body || {};
    let url = imageUrl;
    if (!url && closetItemId) {
      const item = await ClosetItem.findOne({ _id: closetItemId, userId: req.userId });
      if (!item) return res.status(404).json({ message: 'Closet item not found' });
      url = item.imageUrl;
    }
    if (!url || typeof url !== 'string') return res.status(400).json({ message: 'imageUrl or closetItemId required' });
    const user = await User.findById(req.userId).select('name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const displayName = user.name || 'Anonymous';
    battle.rightUserId = req.userId;
    battle.rightImageUrl = url;
    battle.rightUserName = displayName;
    battle.status = 'active';
    await battle.save();
    res.json({
      id: battle._id,
      leftUserId: battle.leftUserId,
      leftImageUrl: battle.leftImageUrl,
      leftUserName: battle.leftUserName,
      leftOutfitDetails: battle.leftOutfitDetails || '',
      rightUserId: battle.rightUserId,
      rightImageUrl: battle.rightImageUrl,
      rightUserName: battle.rightUserName,
      rightOutfitDetails: battle.rightOutfitDetails || '',
      status: battle.status,
      leftVotes: battle.leftVotes,
      rightVotes: battle.rightVotes,
      winner: battle.winner,
      createdAt: battle.createdAt,
    });
  } catch (error) {
    console.error('Join battle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { side } = req.body || {};
    if (side !== 'left' && side !== 'right') return res.status(400).json({ message: 'side must be "left" or "right"' });
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ message: 'Battle not found' });
    if (battle.status !== 'active') return res.status(400).json({ message: 'Battle is not active' });
    const existing = await Vote.findOne({ battleId: battle._id, userId: req.userId });
    if (existing) return res.status(400).json({ message: 'Already voted in this battle' });
    await Vote.create({ battleId: battle._id, userId: req.userId, side });
    if (side === 'left') {
      battle.leftVotes = (battle.leftVotes || 0) + 1;
    } else {
      battle.rightVotes = (battle.rightVotes || 0) + 1;
    }
    await battle.save();
    res.json({
      battleId: battle._id,
      side,
      leftVotes: battle.leftVotes,
      rightVotes: battle.rightVotes,
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single battle
router.get('/:id', auth, async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id).lean();
    if (!battle) return res.status(404).json({ message: 'Battle not found' });
    const voted = await Vote.findOne({ battleId: battle._id, userId: req.userId }).lean();
    res.json({
      id: battle._id,
      leftUserId: battle.leftUserId,
      leftImageUrl: battle.leftImageUrl,
      leftUserName: battle.leftUserName,
      leftOutfitDetails: battle.leftOutfitDetails || '',
      rightUserId: battle.rightUserId,
      rightImageUrl: battle.rightImageUrl,
      rightUserName: battle.rightUserName,
      rightOutfitDetails: battle.rightOutfitDetails || '',
      status: battle.status,
      leftVotes: battle.leftVotes || 0,
      rightVotes: battle.rightVotes || 0,
      winner: battle.winner,
      createdAt: battle.createdAt,
      myVote: voted ? voted.side : null,
    });
  } catch (error) {
    console.error('Get battle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update outfit details (only the participant for that side can update)
router.patch('/:id/outfit-details', auth, async (req, res) => {
  try {
    const { side, details } = req.body || {};
    if (side !== 'left' && side !== 'right') return res.status(400).json({ message: 'side must be "left" or "right"' });
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ message: 'Battle not found' });
    const userIdStr = req.userId.toString();
    if (side === 'left') {
      if (battle.leftUserId.toString() !== userIdStr) return res.status(403).json({ message: 'Only left participant can update left outfit details' });
      battle.leftOutfitDetails = typeof details === 'string' ? details.trim().slice(0, 500) : '';
    } else {
      if (!battle.rightUserId || battle.rightUserId.toString() !== userIdStr) return res.status(403).json({ message: 'Only right participant can update right outfit details' });
      battle.rightOutfitDetails = typeof details === 'string' ? details.trim().slice(0, 500) : '';
    }
    await battle.save();
    res.json({
      id: battle._id,
      leftOutfitDetails: battle.leftOutfitDetails,
      rightOutfitDetails: battle.rightOutfitDetails,
    });
  } catch (error) {
    console.error('Outfit details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get battle comments (for chat)
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ message: 'Battle not found' });
    const comments = await BattleComment.find({ battleId: battle._id })
      .sort({ createdAt: 1 })
      .lean();
    res.json(comments.map(c => ({
      id: c._id.toString(),
      userId: c.userId.toString(),
      userName: c.userName,
      text: c.text,
      createdAt: c.createdAt,
    })));
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Post battle comment (voters / anyone can chat)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body || {};
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) return res.status(400).json({ message: 'text is required' });
    if (trimmed.length > 300) return res.status(400).json({ message: 'Comment too long' });
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ message: 'Battle not found' });
    const user = await User.findById(req.userId).select('name').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const comment = await BattleComment.create({
      battleId: battle._id,
      userId: req.userId,
      userName: (user.name || 'Anonymous').trim() || 'Anonymous',
      text: trimmed,
    });
    res.status(201).json({
      id: comment._id.toString(),
      userId: comment.userId.toString(),
      userName: comment.userName,
      text: comment.text,
      createdAt: comment.createdAt,
    });
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End battle (set winner by vote count) - can be called when viewing or on a timer
router.post('/:id/end', auth, async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ message: 'Battle not found' });
    if (battle.status !== 'active') return res.status(400).json({ message: 'Battle not active' });
    const left = battle.leftVotes || 0;
    const right = battle.rightVotes || 0;
    battle.status = 'ended';
    battle.winner = left > right ? 'left' : right > left ? 'right' : null;
    await battle.save();
    res.json({
      id: battle._id,
      status: battle.status,
      winner: battle.winner,
      leftVotes: battle.leftVotes,
      rightVotes: battle.rightVotes,
    });
  } catch (error) {
    console.error('End battle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
