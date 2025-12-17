const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET: Get all active requests (excluding expired)
router.get('/', async (req, res) => {
  try {
    const currentDate = new Date();
    
    const requests = await Request.find({
      status: 'active',
      expiresAt: { $gt: currentDate }
    })
    .populate('requesterId', 'displayName email')
    .sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({ 
      requests,
      count: requests.length,
      message: `Found ${requests.length} active requests`
    });
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET: Get requests by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const currentDate = new Date();
    
    const requests = await Request.find({
      category,
      status: 'active',
      expiresAt: { $gt: currentDate }
    })
    .populate('requesterId', 'displayName email')
    .sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({ 
      requests,
      category,
      count: requests.length
    });
  } catch (error) {
    console.error('❌ Error fetching requests by category:', error);
    res.status(500).json({ error: 'Failed to fetch requests by category' });
  }
});

// GET: Get urgent requests
router.get('/urgent', async (req, res) => {
  try {
    const currentDate = new Date();
    
    const urgentRequests = await Request.find({
      priority: { $in: ['urgent', 'high'] },
      status: 'active',
      expiresAt: { $gt: currentDate }
    })
    .populate('requesterId', 'displayName email')
    .sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({ 
      requests: urgentRequests,
      count: urgentRequests.length,
      message: `Found ${urgentRequests.length} urgent requests`
    });
  } catch (error) {
    console.error('❌ Error fetching urgent requests:', error);
    res.status(500).json({ error: 'Failed to fetch urgent requests' });
  }
});

// GET: Get user's own requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await Request.find({ requesterId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      requests,
      count: requests.length
    });
  } catch (error) {
    console.error('❌ Error fetching user requests:', error);
    res.status(500).json({ error: 'Failed to fetch user requests' });
  }
});

// GET: Get request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requesterId', 'displayName email phone')
      .populate('responses.donorId', 'displayName email phone');
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.status(200).json({ request });
  } catch (error) {
    console.error('❌ Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// POST: Create new request
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received new request creation');
    console.log('User:', req.user._id);
    console.log('User details:', {
      _id: req.user._id,
      displayName: req.user.displayName,
      email: req.user.email,
      phone: req.user.phone
    });
    console.log('Request data:', req.body);
    console.log('Request headers:', req.headers);
    
    const {
      title,
      description,
      category,
      priority,
      quantity,
      unit,
      address,
      latitude,
      longitude,
      city,
      state,
      disasterType,
      disasterLocation,
      disasterDate,
      expiresInDays = 7, // Default to 7 days
      phone
    } = req.body;
    
    // Validate required fields
    console.log('Validating required fields:', {
      title: !!title,
      description: !!description,
      category: !!category,
      quantity: !!quantity,
      unit: !!unit,
      address: !!address
    });
    
    if (!title || !description || !category || !quantity || !unit || !address) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!category) missingFields.push('category');
      if (!quantity) missingFields.push('quantity');
      if (!unit) missingFields.push('unit');
      if (!address) missingFields.push('address');
      
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields,
        received: req.body
      });
    }
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    
    const requestData = {
      title,
      description,
      category,
      priority: priority || 'medium',
      quantity: Number(quantity),
      unit,
      location: {
        type: 'Point',
        coordinates: latitude && longitude ? [Number(longitude), Number(latitude)] : undefined,
        address,
        city,
        state,
        postalCode: req.body.postalCode || '',
        country: req.body.country || ''
      },
      requesterId: req.user._id,
      requesterName: req.user.displayName,
      requesterPhone: phone || req.user.phone || '',
      requesterEmail: req.user.email,
      disasterType: disasterType || 'other',
      disasterLocation,
      disasterDate: disasterDate ? new Date(disasterDate) : null,
      expiresAt
    };
    
    console.log('Creating request with data:', requestData);
    
    const request = new Request(requestData);
    await request.save();
    
    console.log('Request created successfully:', request._id);
    
    // TODO: Send notification to all users about new urgent request
    if (priority === 'urgent' || priority === 'high') {
      console.log('Urgent request created - should notify all users');
    }
    
    // Populate the created request with user details
    const populatedRequest = await Request.findById(request._id)
      .populate('requesterId', 'displayName email phone');
    
    console.log('Request created successfully:', populatedRequest);
    
    res.status(201).json({ 
      message: 'Request created successfully',
      request: populatedRequest
    });
    
  } catch (error) {
    console.error('❌ Error creating request:', error);
    res.status(500).json({ 
      error: 'Failed to create request',
      details: error.message
    });
  }
});

// POST: Respond to a request
router.post('/:id/respond', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, canProvide, estimatedDelivery } = req.body;
    
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'active') {
      return res.status(400).json({ error: 'Request is no longer active' });
    }
    
    if (request.requesterId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot respond to your own request' });
    }
    
    const responseData = {
      donorId: req.user._id,
      donorName: req.user.displayName,
      donorPhone: req.user.phone || '',
      message: message || '',
      canProvide: Boolean(canProvide),
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      responseDate: new Date()
    };
    
    await request.addResponse(responseData);
    
    console.log(`User ${req.user.displayName} responded to request ${id}`);
    
    res.status(200).json({ 
      message: 'Response added successfully',
      response: responseData
    });
    
  } catch (error) {
    console.error('❌ Error responding to request:', error);
    res.status(500).json({ 
      error: 'Failed to respond to request',
      details: error.message
    });
  }
});

// PUT: Update request status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }
    
    request.status = status;
    if (status === 'fulfilled') {
      request.fulfilledAt = new Date();
    }
    
    await request.save();
    
    res.status(200).json({ 
      message: 'Request status updated successfully',
      request: {
        _id: request._id,
        status: request.status,
        fulfilledAt: request.fulfilledAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating request status:', error);
    res.status(500).json({ 
      error: 'Failed to update request status',
      details: error.message
    });
  }
});

// DELETE: Cancel request
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this request' });
    }
    
    request.status = 'cancelled';
    await request.save();
    
    res.status(200).json({ 
      message: 'Request cancelled successfully'
    });
    
  } catch (error) {
    console.error('❌ Error cancelling request:', error);
    res.status(500).json({ 
      error: 'Failed to cancel request',
      details: error.message
    });
  }
});

// GET: Get expired requests count (for cleanup)
router.get('/expired/count', async (req, res) => {
  try {
    const currentDate = new Date();
    const expiredCount = await Request.countDocuments({
      status: 'active',
      expiresAt: { $lt: currentDate }
    });
    
    res.status(200).json({ 
      expiredCount,
      currentDate
    });
  } catch (error) {
    console.error('❌ Error getting expired requests count:', error);
    res.status(500).json({ error: 'Failed to get expired count' });
  }
});

// DELETE: Clean up expired requests
router.delete('/cleanup/expired', async (req, res) => {
  try {
    const currentDate = new Date();
    
    const result = await Request.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: currentDate }
      },
      {
        $set: { status: 'expired' }
      }
    );
    
    console.log(`Cleaned up ${result.modifiedCount} expired requests`);
    
    res.status(200).json({ 
      message: 'Cleanup completed successfully',
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({ 
      error: 'Cleanup failed',
      details: error.message
    });
  }
});

module.exports = router;
