const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// POST: Submit donation with image (store image in MongoDB)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Received donation upload request');
    console.log('User:', req.user?._id || 'No user (auth disabled for testing)');
    console.log('User details:', {
      _id: req.user?._id,
      email: req.user?.email,
      displayName: req.user?.displayName,
      firebaseUid: req.user?.firebaseUid
    });
    console.log('Form data (req.body):', req.body);
    console.log('Form data keys:', Object.keys(req.body));
    console.log('Form data values:', Object.values(req.body));
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    console.log('File details:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'No buffer'
    } : 'No file');

    // Ensure user exists in database
    if (!req.user || !req.user._id) {
      console.error('No valid user found in request');
      return res.status(401).json({ error: 'User not authenticated properly' });
    }

    const {
      title,
      category,
      description,
      quantity,
      latitude,
      longitude,
      address,
      contactEmail,
      contactPhone,
      isVeg,
      expiryDate,
      condition,
      providerName,
      providerId,
    } = req.body;

    console.log('Received form data:', {
      category,
      expiryDate,
      condition,
      isVeg
    });

    // Process expiry date only for food items
    let processedExpiryDate = undefined;
    if (category === 'food' && expiryDate && expiryDate.trim() !== '') {
      const date = new Date(expiryDate);
      if (!isNaN(date.getTime())) {
        processedExpiryDate = date;
        console.log('Processed expiry date for food item:', processedExpiryDate);
      } else {
        console.log('Invalid expiry date received, setting to undefined');
      }
    } else {
      console.log('No expiry date needed for category:', category);
    }

    console.log('Form data validation:');
    console.log('  - title:', title ? 'Present' : 'Missing');
    console.log('  - category:', category ? 'Present' : 'Missing');
    console.log('  - description:', description ? 'Present' : 'Missing');
    console.log('  - quantity:', quantity ? 'Present' : 'Missing');
    console.log('  - address:', address ? 'Present' : 'Missing');
    console.log('  - contactPhone:', contactPhone ? 'Present' : 'Missing');
    console.log('  - isVeg:', isVeg !== undefined ? 'Present' : 'Missing');
    console.log('  - expiryDate:', expiryDate ? 'Present' : 'Missing');
    console.log('  - condition:', condition ? 'Present' : 'Missing');
    console.log('  - image file:', req.file ? 'Present' : 'Missing');

    // Validate required fields
    if (!title || !title.trim()) {
      console.error('Title is required');
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!category || !category.trim()) {
      console.error('Category is required');
      return res.status(400).json({ error: 'Category is required' });
    }
    
    if (!description || !description.trim()) {
      console.error('Description is required');
      return res.status(400).json({ error: 'Description is required' });
    }
    
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1) {
      console.error('Valid quantity is required');
      return res.status(400).json({ error: 'Valid quantity is required' });
    }
    
    if (!address || !address.trim()) {
      console.error('Address is required');
      return res.status(400).json({ error: 'Address is required' });
    }
    
    if (!contactPhone || !contactPhone.trim()) {
      console.error('Contact phone is required');
      return res.status(400).json({ error: 'Contact phone is required' });
    }
    
    if (!req.file) {
      console.error('Image is required');
      return res.status(400).json({ error: 'Image is required' });
    }
    
    console.log('All required fields are present');

    const donationData = {
      title,
      category,
      description,
      quantity: quantity ? Number(quantity) : 1,
      providerName: req.user.displayName,
      providerId: req.user._id,
      contactInfo: {
        email: contactEmail || req.user.email || '',
        phone: contactPhone || '',
      },
      location: {
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        address: address || '',
      },
      isVeg: isVeg === 'true' || isVeg === true,
      expiryDate: processedExpiryDate,
      condition: condition || '',
    };

    if (req.file) {
      try {
        donationData.image = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
        console.log('Image stored in donation data:', {
          size: req.file.size,
          type: req.file.mimetype,
          originalName: req.file.originalname
        });
      } catch (imageError) {
        console.error('Error processing image:', imageError);
        throw new Error(`Image processing failed: ${imageError.message}`);
      }
    } else {
      console.log('No image file provided in donation upload');
    }

    console.log('Final donation data structure:');
    console.log('  - title:', donationData.title);
    console.log('  - category:', donationData.category);
    console.log('  - description:', donationData.description);
    console.log('  - quantity:', donationData.quantity);
    console.log('  - providerName:', donationData.providerName);
    console.log('  - providerId:', donationData.providerId);
    console.log('  - contactInfo:', donationData.contactInfo);
    console.log('  - location:', donationData.location);
    console.log('  - isVeg:', donationData.isVeg);
    console.log('  - expiryDate:', donationData.expiryDate);
    console.log('  - condition:', donationData.condition);
    console.log('  - hasImage:', !!donationData.image);

    console.log('Saving donation to MongoDB...');
    
    // Log donation data without image buffer to avoid JSON.stringify issues
    const logData = { ...donationData };
    if (logData.image) {
      logData.image = {
        size: logData.image.data ? logData.image.data.length : 'unknown',
        type: logData.image.contentType || 'unknown'
      };
    }
    console.log('Donation data (without image buffer):', logData);
    
    let donation;
    try {
      console.log('Creating Donation model instance...');
      donation = new Donation(donationData);
      console.log('Donation model created, attempting to save...');
      
      // Check if the donation object is valid
      console.log('Donation model validation:', donation.validateSync ? 'Has validation' : 'No validation');
      
      await donation.save();
      console.log('Donation saved successfully with ID:', donation._id);
      
      // Verify the donation was actually saved
      const savedDonation = await Donation.findById(donation._id);
      if (savedDonation) {
        console.log('Donation verified in database:', savedDonation._id);
      } else {
        console.error('Donation not found in database after save!');
        throw new Error('Donation was not actually saved to database');
      }
    } catch (saveError) {
      console.error('Error saving donation to database:', saveError);
      console.error('Save error details:', {
        name: saveError.name,
        message: saveError.message,
        code: saveError.code
      });
      
      if (saveError.errors) {
        console.error('Validation errors:', saveError.errors);
      }
      
      throw new Error(`Database save failed: ${saveError.message}`);
    }

    // Send response without image data to avoid serialization issues
    if (!donation || !donation._id) {
      console.error('Donation object is invalid after save');
      throw new Error('Donation object is invalid after save');
    }
    
    console.log('Preparing response for donation:', donation._id);
    
    // Send a simple success response to avoid any serialization issues
    res.status(201).json({ 
      message: 'Donation saved successfully', 
      donationId: donation._id,
      title: donation.title,
      category: donation.category
    });
    
    console.log('Simple response sent successfully');
  } catch (error) {
    console.error('Error saving donation:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Failed to save donation',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint to verify backend is working
router.get('/test', (req, res) => {
  res.status(200).json({ 
    message: 'Donations backend is working!', 
    timestamp: new Date().toISOString(),
    mongoose: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    database: mongoose.connection.db ? mongoose.connection.db.databaseName : 'Unknown'
  });
});

// Test endpoint without authentication
router.get('/test-no-auth', (req, res) => {
  res.status(200).json({ 
    message: 'Donations backend is working without auth!', 
    timestamp: new Date().toISOString(),
    mongoose: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    database: mongoose.connection.db ? mongoose.connection.db.databaseName : 'Unknown'
  });
});

// Test donation creation endpoint (without auth for testing)
router.post('/test-create', upload.single('image'), async (req, res) => {
  try {
    console.log('Test donation creation - Form data:', req.body);
    console.log('Test donation creation - File:', req.file);
    
    // Create a simple test donation
    const testDonation = new Donation({
      title: 'Test Item',
      category: 'products',
      description: 'Test description',
      quantity: 1,
      providerName: 'Test User',
      providerId: new mongoose.Types.ObjectId(), // Create a fake ObjectId
      contactInfo: {
        email: 'test@example.com',
        phone: '1234567890'
      },
      location: {
        address: 'Test Address'
      },
      condition: 'Good',
      status: 'available'
    });
    
    console.log('Test donation object created:', testDonation);
    
    const savedDonation = await testDonation.save();
    console.log('Test donation saved successfully:', savedDonation._id);
    
    res.status(201).json({ 
      message: 'Test donation created successfully', 
      donationId: savedDonation._id 
    });
  } catch (error) {
    console.error('Test donation creation failed:', error);
    res.status(500).json({ 
      error: 'Test donation creation failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Get count of expired food items (for monitoring)
router.get('/expired-count', async (req, res) => {
  try {
    const currentDate = new Date();
    const expiredCount = await Donation.countDocuments({
      category: 'food',
      expiryDate: { $lt: currentDate }
    });
    
    res.status(200).json({ 
      expiredCount,
      currentDate,
      message: `Found ${expiredCount} expired food items`
    });
  } catch (error) {
    console.error('Error getting expired count:', error);
    res.status(500).json({ 
      error: 'Failed to get expired count',
      details: error.message
    });
  }
});

// Get items expiring soon (within next 24 hours)
router.get('/expiring-soon', async (req, res) => {
  try {
    const currentDate = new Date();
    const tomorrow = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const expiringSoon = await Donation.find({
      category: 'food',
      expiryDate: { 
        $gte: currentDate, 
        $lte: tomorrow 
      }
    }, '-image.data').sort({ expiryDate: 1 });
    
    res.status(200).json({ 
      expiringSoon,
      count: expiringSoon.length,
      currentDate,
      tomorrow,
      message: `Found ${expiringSoon.length} food items expiring within 24 hours`
    });
  } catch (error) {
    console.error('Error getting expiring soon items:', error);
    res.status(500).json({ 
      error: 'Failed to get expiring soon items',
      details: error.message
    });
  }
});

// Clean up expired food items (admin endpoint)
router.delete('/cleanup-expired', async (req, res) => {
  try {
    const currentDate = new Date();
    console.log('Starting cleanup of expired food items at:', currentDate);
    
    // Find and delete expired food items
    const result = await Donation.deleteMany({
      category: 'food',
      expiryDate: { $lt: currentDate }
    });
    
    console.log(`Cleanup completed: ${result.deletedCount} expired food items removed`);
    
    res.status(200).json({ 
      message: 'Cleanup completed successfully',
      deletedCount: result.deletedCount,
      timestamp: currentDate
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ 
      error: 'Cleanup failed',
      details: error.message
    });
  }
});

// GET: Retrieve all donations (excluding full image data for performance and expired items)
router.get('/', async (req, res) => {
  try {
    const currentDate = new Date();
    console.log('Current date for filtering:', currentDate);
    
    // Find all donations and filter out expired food items
    const allDonations = await Donation.find({}, '-image.data').sort({ createdAt: -1 });
    
    // Filter out expired food items
    const activeDonations = allDonations.filter(donation => {
      // If it's not food, keep it
      if (donation.category !== 'food') {
        return true;
      }
      
      // If it's food but has no expiry date, keep it
      if (!donation.expiryDate) {
        return true;
      }
      
      // If it's food with expiry date, check if expired
      const isExpired = donation.expiryDate < currentDate;
      if (isExpired) {
        console.log(`Filtering out expired food item: ${donation.title} (expired: ${donation.expiryDate})`);
      }
      
      return !isExpired;
    });
    
    console.log(`Donations: ${allDonations.length} total, ${activeDonations.length} active (non-expired)`);
    
    res.status(200).json({ 
      donations: activeDonations,
      stats: {
        total: allDonations.length,
        active: activeDonations.length,
        expired: allDonations.length - activeDonations.length
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// GET: Retrieve donations by category (excluding expired food items)
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const currentDate = new Date();
    
    let query = { category };
    
    // For food category, exclude expired items
    if (category === 'food') {
      query.expiryDate = { $gte: currentDate };
    }
    
    const donations = await Donation.find(query, '-image.data').sort({ createdAt: -1 });
    
    res.status(200).json({ 
      donations,
      category,
      count: donations.length,
      message: `Found ${donations.length} ${category} items`
    });
  } catch (error) {
    console.error('Error fetching donations by category:', error);
    res.status(500).json({ error: 'Failed to fetch donations by category' });
  }
});

// GET: Retrieve a donation by ID (excluding image buffer)
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).select('-image.data');
    if (!donation) return res.status(404).json({ error: 'Donation not found' });
    res.status(200).json({ donation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch donation' });
  }
});

// GET: Retrieve user's donations (excluding expired food items)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentDate = new Date();
    
    // Get user's donations, but filter out expired food items
    const allUserDonations = await Donation.find({ providerId: userId }, '-image.data').sort({ createdAt: -1 });
    
    const activeUserDonations = allUserDonations.filter(donation => {
      // If it's not food, keep it
      if (donation.category !== 'food') {
        return true;
      }
      
      // If it's food but has no expiry date, keep it
      if (!donation.expiryDate) {
        return true;
      }
      
      // If it's food with expiry date, check if expired
      return donation.expiryDate >= currentDate;
    });
    
    res.status(200).json({ 
      donations: activeUserDonations,
      stats: {
        total: allUserDonations.length,
        active: activeUserDonations.length,
        expired: allUserDonations.length - activeUserDonations.length
      }
    });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({ error: 'Failed to fetch user donations' });
  }
});

// GET image by donation ID
router.get('/image/:id', async (req, res) => {
  try {
    console.log('Image request for donation ID:', req.params.id);
    
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      console.log('Donation not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    if (!donation.image || !donation.image.data) {
      console.log('No image data found for donation ID:', req.params.id);
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set appropriate headers for image serving
    res.set({
      'Content-Type': donation.image.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Length': donation.image.data.length
    });
    
    console.log('Serving image for donation ID:', req.params.id, 'Size:', donation.image.data.length, 'bytes');
    res.send(donation.image.data);
  } catch (summary) {
    console.error('Error serving image for donation ID:', req.params.id, error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

module.exports = router;
