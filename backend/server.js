const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env from config.env if present
const envPath = path.join(__dirname, 'config.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}


const app = express();

// Middleware
app.use(cors());
// Enable JSON parsing for API requests
app.use(express.json());

// Serve static files from 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
const providedMongoUri = process.env.MONGO_URI;
const mongoUri = providedMongoUri && !/</.test(providedMongoUri)
  ? providedMongoUri
  : 'mongodb+srv://divyasreen31_db_user:DBMS123@mealink.onreljf.mongodb.net/?appName=mealink';

console.log('🔍 MongoDB URI:', mongoUri);
console.log('🔍 Environment MONGO_URI:', process.env.MONGO_URI);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Routes
const donationRoutes = require('./routes/donations');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');

app.use('/api/donations', donationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/requests', requestRoutes);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Test image endpoint
app.get('/api/test-image', (req, res) => {
  res.json({ 
    message: 'Image serving is working!',
    endpoints: {
      'GET /api/donations/image/:id': 'Serve donation image by ID',
      'POST /api/donations': 'Create donation with image upload'
    }
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.db.databaseName
  });
});

// Debug endpoint for troubleshooting
app.get('/api/debug', async (req, res) => {
  try {
    const User = require('./models/User');
    const Request = require('./models/Request');
    
    const userCount = await User.countDocuments();
    const requestCount = await Request.countDocuments();
    
    res.json({
      message: 'Debug information',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.db.databaseName,
      collections: {
        users: userCount,
        requests: requestCount
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || 8000,
        mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/donation-app'
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Debug endpoint failed', details: error.message });
  }
});

// Start server with automatic fallback if the port is busy
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



// Schedule automatic cleanup of expired food items and requests every hour
function scheduleCleanup() {
  setInterval(async () => {
    try {
      console.log('🧹 Running scheduled cleanup...');
      
      const Donation = require('./models/Donation');
      const Request = require('./models/Request');
      const currentDate = new Date();
      
      // Clean up expired food items
      const donationResult = await Donation.deleteMany({
        category: 'food',
        expiryDate: { $lt: currentDate }
      });
      
      // Clean up expired requests
      const requestResult = await Request.updateMany(
        {
          status: 'active',
          expiresAt: { $lt: currentDate }
        },
        {
          $set: { status: 'expired' }
        }
      );
      
      if (donationResult.deletedCount > 0 || requestResult.modifiedCount > 0) {
        console.log(`🧹 Scheduled cleanup completed: ${donationResult.deletedCount} expired food items removed, ${requestResult.modifiedCount} expired requests marked`);
      } else {
        console.log('🧹 Scheduled cleanup: No expired items found');
      }
    } catch (error) {
      console.error('❌ Error during scheduled cleanup:', error);
    }
  }, 60 * 60 * 1000); // Run every hour (60 minutes * 60 seconds * 1000 milliseconds)
}

// Start the cleanup scheduler
scheduleCleanup();
console.log('⏰ Automatic cleanup scheduler started (runs every hour)');
