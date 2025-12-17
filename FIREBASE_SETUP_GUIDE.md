# Firebase Setup Guide for Donation App

## Overview

This guide provides step-by-step instructions for setting up Firebase services for the donation platform. The app uses Firebase Authentication for user management and Firebase Storage for image uploads, while using MongoDB as the primary database.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Google Cloud project

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "donation-platform")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" authentication
3. Enable "Google" authentication
4. Add your domain to authorized domains if needed

## Step 3: Enable Storage

1. Go to "Storage" in Firebase Console
2. Click "Get started"
3. Choose security rules (start with test mode for development)
4. Select storage location (choose closest to your users)

## Step 4: Configure Storage Rules

Update your Firebase Storage rules in the Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow authenticated users to read and write
      allow read, write: if request.auth != null;
      
      // Allow public read access to images
      allow read: if true;
      
      // Allow authenticated users to upload images
      allow write: if request.auth != null 
        && request.resource.size < 5 * 1024 * 1024 // 5MB limit
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Step 5: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → "Web"
4. Register app with a nickname
5. Copy the configuration object

## Step 6: Update Frontend Configuration

Create or update `src/firebase/config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

## Step 7: Update Environment Variables

Create `.env.local` in your frontend directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Step 8: Install Dependencies

```bash
npm install firebase
```

## Step 9: Test Configuration

1. Start your development server
2. Try to sign up/sign in
3. Test image upload functionality
4. Check Firebase Console for new users and files

## Security Best Practices

### Authentication
- Use strong password policies
- Enable email verification
- Set up password reset functionality
- Monitor authentication attempts

### Storage
- Implement file size limits
- Validate file types
- Use secure download URLs
- Set up proper CORS rules

### Database
- Use Firebase Security Rules
- Implement proper indexing
- Monitor usage and costs
- Set up backup strategies

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Firebase configuration
   - Verify domain authorization
   - Check authentication methods enabled

2. **Storage Upload Failures**
   - Verify storage rules
   - Check file size limits
   - Ensure proper authentication

3. **CORS Issues**
   - Update storage CORS configuration
   - Check domain authorization
   - Verify Firebase project settings

### Performance Optimization

- Use Firebase CDN for images
- Implement lazy loading
- Optimize image sizes
- Use Firebase Hosting for static assets

## Quick Test

1. **Test Authentication**
   ```javascript
   import { auth } from './firebase/config';
   import { signInWithEmailAndPassword } from 'firebase/auth';
   
   // Test sign in
   signInWithEmailAndPassword(auth, 'test@example.com', 'password')
     .then((userCredential) => {
       console.log('Signed in:', userCredential.user);
     })
     .catch((error) => {
       console.error('Sign in error:', error);
     });
   ```

2. **Test Storage**
   ```javascript
   import { storage } from './firebase/config';
   import { ref, uploadBytes } from 'firebase/storage';
   
   // Test file upload
   const file = new File(['test'], 'test.txt', { type: 'text/plain' });
   const storageRef = ref(storage, 'test/test.txt');
   
   uploadBytes(storageRef, file)
     .then((snapshot) => {
       console.log('Uploaded:', snapshot);
     })
     .catch((error) => {
       console.error('Upload error:', error);
     });
   ```

## Next Steps

1. Set up Firebase Analytics for user tracking
2. Configure Firebase Performance Monitoring
3. Set up Firebase Cloud Functions for backend logic
4. Implement Firebase Cloud Messaging for notifications
5. Set up Firebase Crashlytics for error reporting

Your Firebase setup is now complete and ready for production use! 