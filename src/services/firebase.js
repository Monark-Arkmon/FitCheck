import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3YAG7wkOuemf-Nxga0rrPAWXAvqZgDqw",
  authDomain: "fitcheck-33a1a.firebaseapp.com",
  projectId: "fitcheck-33a1a",
  storageBucket: "fitcheck-33a1a.firebasestorage.app",
  messagingSenderId: "517901925209",
  appId: "1:517901925209:web:fb3db98f6afb81c410aa48",
  measurementId: "G-6G5XFPPPMV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize messaging conditionally (only in browser environments that support it)
let messaging = null;

// Set up messaging if supported
const setupMessaging = async () => {
  try {
    if (await isSupported()) {
      messaging = getMessaging(app);
      return messaging;
    }
    console.log('Firebase messaging is not supported in this environment');
    return null;
  } catch (error) {
    console.error('Error setting up Firebase messaging:', error);
    return null;
  }
};

// Enable offline persistence (this can help with some permission issues)
// Note: This can only be called before any other Firestore calls
try {
  // This is commented out because it requires additional setup
  // const { enableIndexedDbPersistence } = require("firebase/firestore");
  // enableIndexedDbPersistence(db)
  //   .then(() => console.log("Offline persistence enabled"))
  //   .catch((err) => {
  //     if (err.code === 'failed-precondition') {
  //       console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  //     } else if (err.code === 'unimplemented') {
  //       console.warn("The current browser does not support all of the features required to enable persistence.");
  //     }
  //   });
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Export the initialized services
export { app, auth, db, storage, setupMessaging, messaging }; 