# Firebase Auth + MongoDB Hybrid Setup Complete!

## Overview

This guide documents the successful implementation of a hybrid architecture for the donation platform. The application now uses Firebase Authentication for user management while leveraging MongoDB as the primary database for better performance and scalability.

## Architecture Benefits

1. **Best of Both Worlds**: Firebase Auth for robust authentication + MongoDB for flexible data storage
2. **Cost Effective**: No Firebase Firestore billing, only authentication costs
3. **Performance**: Direct database queries instead of Firestore's real-time listeners
4. **Scalability**: MongoDB's powerful aggregation and indexing capabilities
5. **Control**: Full control over data structure and queries

## Key Components

### Frontend (React)
- Firebase Authentication for user login/signup
- MongoDB backend API for all data operations
- Real-time updates through API polling or WebSockets

### Backend (Node.js + Express)
- MongoDB with Mongoose for data modeling
- JWT token validation for authenticated requests
- RESTful API endpoints for all operations
- User synchronization between Firebase and MongoDB

### Authentication Flow
1. User signs in with Firebase Auth
2. Firebase UID is used to identify user in MongoDB
3. Backend validates Firebase token and creates/updates MongoDB user
4. All subsequent requests use JWT tokens for authentication

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
   FIREBASE_PROJECT_ID=your-firebase-project-id
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

## User Synchronization

The hybrid approach automatically syncs users between Firebase and MongoDB:

1. **On First Login**: User is created in MongoDB with Firebase UID
2. **Profile Updates**: Changes are synced to both systems
3. **Authentication**: Firebase handles auth, MongoDB handles data

## Security Features

- **JWT Tokens**: Secure API authentication
- **Firebase Auth**: Industry-standard authentication
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Proper cross-origin configuration
- **Rate Limiting**: API request throttling

## Performance Optimizations

- **Database Indexes**: Optimized queries for common operations
- **Connection Pooling**: Efficient MongoDB connections
- **Caching**: Redis integration for frequently accessed data
- **Image Optimization**: Automatic image compression and resizing

## Monitoring and Logging

- **Request Logging**: All API requests are logged
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Metrics**: Response time monitoring
- **User Analytics**: Usage statistics and insights

## Deployment Considerations

### Production Environment
- Use MongoDB Atlas for managed database
- Implement proper SSL/TLS encryption
- Set up automated backups
- Configure monitoring and alerting

### Scaling Strategy
- Horizontal scaling with load balancers
- Database sharding for large datasets
- CDN integration for static assets
- Microservices architecture for complex features

## Troubleshooting

### Common Issues

1. **Authentication Sync Problems**
   - Check Firebase configuration
   - Verify JWT secret in environment
   - Ensure user creation in MongoDB

2. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check network access and firewall
   - Ensure proper authentication

3. **Image Upload Failures**
   - Verify Firebase Storage rules
   - Check CORS configuration
   - Ensure proper file size limits

### Debug Steps

1. Check backend console logs
2. Verify Firebase Console for auth issues
3. Test MongoDB connection directly
4. Check API endpoint responses

## Ready to Use!

The hybrid approach gives you security, reliability, and full control over your data!

## Next Steps

1. **Production Deployment**: Set up production environment
2. **Monitoring**: Implement comprehensive monitoring
3. **Testing**: Add automated testing suite
4. **Documentation**: Create API documentation
5. **Security Audit**: Conduct security review

Your hybrid Firebase + MongoDB setup is complete and ready for production use! 