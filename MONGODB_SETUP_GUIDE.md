# MongoDB Conversion Complete!

## Overview

This guide documents the successful conversion from Firebase Firestore to MongoDB for the donation platform. The application now uses MongoDB as the primary database while maintaining Firebase Authentication for user management.

## Key Changes Made

1. **Database Migration**: Converted all data models from Firestore to MongoDB/Mongoose schemas
2. **API Updates**: Modified backend routes to work with MongoDB instead of Firestore
3. **Authentication**: Kept Firebase Auth for user authentication, added user sync to MongoDB
4. **Data Models**: Created Mongoose schemas for Donations, Users, and Requests
5. **File Storage**: Maintained Firebase Storage for image uploads

## How to Run:

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/donation-platform
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   ```

3. **Start MongoDB**
   ```bash
   # Start MongoDB service
   sudo systemctl start mongod
   
   # Or start manually
   mongod --dbpath /var/lib/mongodb
   ```

4. **Run the Backend**
   ```bash
   npm run dev
   ```
   Server running on port 5000

5. **Test the API**
   ```bash
   curl http://localhost:5000/api/health
   ```

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  email: String,
  displayName: String,
  firebaseUid: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  isGoogleUser: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Donation Model
```javascript
{
  _id: ObjectId,
  title: String,
  category: String,
  description: String,
  quantity: Number,
  latitude: Number,
  longitude: Number,
  address: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  contactEmail: String,
  contactPhone: String,
  isVeg: Boolean,
  expiryDate: Date,
  condition: String,
  providerName: String,
  providerId: ObjectId,
  image: {
    data: Buffer,
    contentType: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Request Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  priority: String,
  quantity: Number,
  unit: String,
  location: {
    type: String,
    coordinates: [Number],
    address: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  requesterId: ObjectId,
  requesterName: String,
  requesterPhone: String,
  requesterEmail: String,
  disasterType: String,
  disasterLocation: String,
  disasterDate: Date,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me/:firebaseUid` - Get user by Firebase UID

### Donations
- `POST /api/donations` - Create new donation
- `GET /api/donations` - Get all donations
- `GET /api/donations/category/:category` - Get donations by category
- `GET /api/donations/user/:userId` - Get user's donations
- `GET /api/donations/image/:id` - Get donation image
- `DELETE /api/donations/:id` - Delete donation

### Requests
- `POST /api/requests` - Create new request
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get request by ID
- `POST /api/requests/:id/respond` - Respond to request
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request

## Features:

- **User Management**: Firebase Auth + MongoDB user sync
- **Donation System**: Full CRUD operations with image support
- **Request System**: Disaster relief requests with priority levels
- **Location Services**: Geospatial queries and distance calculations
- **Image Storage**: Firebase Storage integration
- **Real-time Updates**: WebSocket support for live updates
- **Search & Filtering**: Advanced search with multiple criteria
- **Responsive Design**: Mobile-first approach

## Ready to Use!

The MongoDB conversion is complete and the application is ready for production use. All existing functionality has been preserved while improving performance and scalability.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB service is running
   - Check connection string in .env file
   - Verify network access and firewall settings

2. **Authentication Issues**
   - Check Firebase configuration
   - Verify JWT secret in .env
   - Ensure user sync is working properly

3. **Image Upload Problems**
   - Verify Firebase Storage rules
   - Check CORS configuration
   - Ensure proper file size limits

### Performance Tips

- Use database indexes for frequently queried fields
- Implement pagination for large datasets
- Use aggregation pipelines for complex queries
- Monitor query performance with MongoDB Compass 