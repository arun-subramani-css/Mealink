const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const firebaseUid = req.header('X-Firebase-UID');
    console.log('🔐 Auth middleware - Firebase UID:', firebaseUid);
    console.log('🔐 Auth middleware - All headers:', req.headers);

    if (!firebaseUid) {
      console.log('❌ Auth middleware - No Firebase UID provided');
      return res.status(401).json({ 
        error: 'Access denied. No Firebase UID provided.',
        details: 'Please ensure you are logged in and the Firebase UID is being sent in the X-Firebase-UID header.'
      });
    }

    if (typeof firebaseUid !== 'string' || firebaseUid.trim().length === 0) {
      console.log('❌ Auth middleware - Invalid Firebase UID format:', firebaseUid);
      return res.status(401).json({ 
        error: 'Invalid Firebase UID format.',
        details: 'The Firebase UID must be a non-empty string.'
      });
    }

    console.log('🔍 Auth middleware - Looking for user with Firebase UID:', firebaseUid);
    const user = await User.findOne({ firebaseUid: firebaseUid.trim() }).select('-password');
    console.log('🔍 Auth middleware - Found user:', user ? user._id : 'NOT FOUND');
    console.log('🔍 Auth middleware - User details:', {
      _id: user?._id,
      email: user?.email,
      displayName: user?.displayName,
      firebaseUid: user?.firebaseUid
    });

    if (!user) {
      console.log('❌ Auth middleware - User not found for Firebase UID:', firebaseUid);
      return res.status(401).json({ 
        error: 'User not found.',
        details: `No user found with Firebase UID: ${firebaseUid}. Please ensure you have registered in the backend system.`,
        firebaseUid: firebaseUid
      });
    }

    req.user = user;
    console.log('✅ Auth middleware - User authenticated:', user._id);
    console.log('✅ Auth middleware - Full user object:', {
      _id: req.user._id,
      email: req.user.email,
      displayName: req.user.displayName,
      firebaseUid: req.user.firebaseUid
    });
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication failed.',
      details: error.message
    });
  }
};

module.exports = auth;