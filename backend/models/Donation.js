const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
  },
  { _id: false }
);

const contactInfoSchema = new mongoose.Schema(
  {
    email: { type: String },
    phone: { type: String },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    data: Buffer,
    contentType: String,
  },
  { _id: false }
);

const donationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 1 },

    // Provider details
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    providerName: { type: String },

    // Receiver details (optional, used when reserved/donated)
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Contact details
    contactInfo: contactInfoSchema,

    // Location
    location: locationSchema,

    // Item specifics
    isVeg: { type: Boolean },
    expiryDate: { type: Date },
    condition: { type: String },
    status: { type: String, enum: ['available', 'reserved', 'donated'], default: 'available' },

    // Image stored in MongoDB
    image: imageSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
