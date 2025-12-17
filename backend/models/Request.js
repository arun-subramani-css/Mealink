const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // Request details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['food', 'water', 'medicine', 'clothing', 'shelter', 'hygiene', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  
  // Location details
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  // Requester details
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: {
    type: String,
    required: true,
    trim: true
  },
  requesterPhone: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  requesterEmail: String,
  
  // Status and responses
  status: {
    type: String,
    required: true,
    enum: ['active', 'fulfilled', 'expired', 'cancelled'],
    default: 'active'
  },
  
  // Responses from donors
  responses: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    donorName: String,
    donorPhone: String,
    message: String,
    canProvide: {
      type: Boolean,
      required: true
    },
    estimatedDelivery: Date,
    responseDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Disaster context
  disasterType: {
    type: String,
    enum: ['flood', 'earthquake', 'hurricane', 'wildfire', 'pandemic', 'other'],
    default: 'other'
  },
  disasterLocation: String,
  disasterDate: Date,
  
  // Timestamps
  expiresAt: {
    type: Date,
    required: true
  },
  fulfilledAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
requestSchema.index({ status: 1, category: 1 });
requestSchema.index({ 'location.coordinates': '2dsphere' });
requestSchema.index({ expiresAt: 1 });
requestSchema.index({ requesterId: 1 });

// Virtual for checking if request is expired
requestSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for checking if request is urgent
requestSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' || this.priority === 'high';
});

// Method to check if request can be fulfilled
requestSchema.methods.canBeFulfilled = function() {
  return this.status === 'active' && !this.isExpired;
};

// Method to add response
requestSchema.methods.addResponse = function(responseData) {
  this.responses.push(responseData);
  return this.save();
};

// Method to mark as fulfilled
requestSchema.methods.markFulfilled = function() {
  this.status = 'fulfilled';
  this.fulfilledAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Request', requestSchema);
