import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';


const firebaseConfig = {
  apiKey: "AIzaSyA3YAG7wkOuemf-Nxga0rrPAWXAvqZgDqw",
  authDomain: "fitcheck-33a1a.firebaseapp.com",
  projectId: "fitcheck-33a1a",
  storageBucket: "fitcheck-33a1a.firebasestorage.app",
  messagingSenderId: "517901925209",
  appId: "1:517901925209:web:fb3db98f6afb81c410aa48",
  measurementId: "G-6G5XFPPPMV"
};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


let messaging = null;


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


try {
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}


export { app, auth, db, storage, setupMessaging, messaging }; 