// src/firebase.js
// Firebase configuration - Replace with your own config from Firebase Console
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// TODO: Replace this config with your own from Firebase Console
// Go to: console.firebase.google.com -> Your Project -> Project Settings -> Your Apps -> Web App
const firebaseConfig = {
  apiKey: "AIzaSyCygqkD4bqj4pN1A-_pa9PKJtg8vxTCZDc",
  authDomain: "rowing-tracker-c1e5e.firebaseapp.com",
  projectId: "rowing-tracker-c1e5e",
  storageBucket: "rowing-tracker-c1e5e.firebasestorage.app",
  messagingSenderId: "531303742676",
  appId: "1:531303742676:web:dc2ccfa3a69b37f09e8f41",
  measurementId: "G-VHPQQ902S3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Storage
export const storage = getStorage(app);

// Initialize Functions
export const functions = getFunctions(app);