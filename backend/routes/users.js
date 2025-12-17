const express = require('express');
const Donation = require('../models/Donation');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's donations (donated items)
router.get('/donations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const donations = await Donation.find({ providerId: req.user._id })
      .populate('receiverId', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Donation.countDocuments({ providerId: req.user._id });
    
    res.json({
      donations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: skip + donations.length < total
      }
    });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({ error: 'Server error fetching donations' });
  }
});

// Get user's reserved items
router.get('/reservations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reservations = await Donation.find({ 
      receiverId: req.user._id,
      status: { $in: ['reserved', 'donated'] }
    })
      .populate('providerId', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Donation.countDocuments({ 
      receiverId: req.user._id,
      status: { $in: ['reserved', 'donated'] }
    });
    
    res.json({
      reservations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: skip + reservations.length < total
      }
    });
  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({ error: 'Server error fetching reservations' });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const donatedCount = await Donation.countDocuments({ 
      providerId: req.user._id,
      status: 'donated'
    });
    
    const reservedCount = await Donation.countDocuments({ 
      receiverId: req.user._id,
      status: 'reserved'
    });
    
    const receivedCount = await Donation.countDocuments({ 
      receiverId: req.user._id,
      status: 'donated'
    });
    
    const activeDonations = await Donation.countDocuments({ 
      providerId: req.user._id,
      status: 'available'
    });
    
    res.json({
      stats: {
        donated: donatedCount,
        reserved: reservedCount,
        received: receivedCount,
        active: activeDonations
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

module.exports = router; 