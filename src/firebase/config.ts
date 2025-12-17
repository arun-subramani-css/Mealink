import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Production Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBzXPGOP5TGzatNCRnvKkYPB_n5W3BEteA",
  authDomain: "mealink-5b2c1.firebaseapp.com",
  projectId: "mealink-5b2c1",
  storageBucket: "mealink-5b2c1.appspot.com",
  messagingSenderId: "956133063458",
  appId: "1:956133063458:web:1af931f81a3f041baa437b",
  measurementId: "G-71VYLHFE3R"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);