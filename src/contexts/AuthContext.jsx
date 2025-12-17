import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { authAPI } from '../services/api'; // For MongoDB user data

// Debug import
console.log('🔍 AuthContext - authAPI:', authAPI);

const AuthContext = createContext(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [userRole, setUserRole] = useState('receiver');
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    console.log('AuthContext: Setting up Firebase auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: Firebase auth state changed:', firebaseUser?.uid);
      
      if (firebaseUser) {
        // Store Firebase UID for API calls
        localStorage.setItem('firebaseUID', firebaseUser.uid);
        
        // Store complete Firebase user data for backend access
        const firebaseUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
          providerData: firebaseUser.providerData
        };
        localStorage.setItem('firebaseUser', JSON.stringify(firebaseUserData));
        
        try {
          // Get additional user data from MongoDB
          const mongoUser = await authAPI.getCurrentUser(firebaseUser.uid);
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || mongoUser.user?.displayName,
            photoURL: firebaseUser.photoURL,
            ...mongoUser.user // Include MongoDB user data
          };
          
          setCurrentUser(userData);
          setIsGuest(false);
          console.log('AuthContext: User authenticated:', userData);
        } catch (error) {
          console.error('AuthContext: Error fetching MongoDB user data:', error);
          
          // If user doesn't exist in MongoDB, create them
          try {
            console.log('AuthContext: Creating MongoDB user for existing Firebase user');
            await authAPI.register({ 
              email: firebaseUser.email, 
              displayName: firebaseUser.displayName || 'User',
              firebaseUid: firebaseUser.uid,
              isGoogleUser: !!firebaseUser.providerData.find(p => p.providerId === 'google.com')
            });
            console.log('AuthContext: MongoDB user created successfully');
            
            // Set user data with Firebase info
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            });
            setIsGuest(false);
          } catch (createError) {
            console.error('AuthContext: Failed to create MongoDB user:', createError);
            // Still set Firebase user data even if MongoDB fails
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            });
            setIsGuest(false);
          }
        }
      } else {
        setCurrentUser(null);
        setIsGuest(false);
        localStorage.removeItem('firebaseUID'); // Clear Firebase UID
        localStorage.removeItem('firebaseUser'); // Clear Firebase user data
        console.log('AuthContext: User signed out');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting Firebase login');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: Firebase login successful:', result.user.uid);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signup = async (email, password, displayName) => {
    try {
      console.log('AuthContext: Attempting Firebase signup');
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase profile
      await updateProfile(user, { displayName });
      
      // Create user in MongoDB
      try {
        await authAPI.register({ 
          email, 
          password, 
          displayName,
          firebaseUid: user.uid 
        });
        console.log('AuthContext: MongoDB user created successfully');
      } catch (mongoError) {
        console.error('AuthContext: MongoDB user creation failed:', mongoError);
        // Continue even if MongoDB fails
      }
      
      console.log('AuthContext: Firebase signup successful:', user.uid);
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Attempting Firebase logout');
      await signOut(auth);
      // Clear Firebase UID from localStorage
      localStorage.removeItem('firebaseUID');
      console.log('AuthContext: Firebase logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out');
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log('AuthContext: Attempting Google login');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create user in MongoDB if it doesn't exist
      try {
        await authAPI.register({ 
          email: user.email, 
          displayName: user.displayName,
          firebaseUid: user.uid,
          isGoogleUser: true
        });
        console.log('AuthContext: MongoDB user created for Google login');
      } catch (mongoError) {
        console.error('AuthContext: MongoDB user creation failed for Google:', mongoError);
        // Continue even if MongoDB fails
      }
      
      console.log('AuthContext: Google login successful:', user.uid);
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const skipAuth = () => {
    setIsGuest(true);
    setCurrentUser({
      uid: 'guest-user',
      email: 'guest@mealink.com',
      displayName: 'Guest User',
      isGuest: true
    });
    setLoading(false);
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    setCurrentUser(null);
  };

  const getAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  };



  const value = {
    currentUser,
    isGuest,
    userRole,
    setUserRole,
    login,
    signup,
    logout,
    loginWithGoogle,
    skipAuth,
    exitGuestMode,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};