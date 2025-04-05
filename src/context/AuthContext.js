import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';


const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function signup(email, password, displayName) {
    try {
      setError('');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User signed up:", user.uid);
      
      // Create a user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        displayName: displayName || email.split('@')[0],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        streak: 0
      });

      console.log("User document created in Firestore");
      return user;
    } catch (error) {
      console.error("Error in signup:", error.message);
      setError(error.message);
      throw error;
    }
  }

  // Sign in function
  async function login(email, password) {
    try {
      setError('');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("User logged in:", user.uid);
      
      // Update the lastLogin timestamp
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
      
      console.log("User last login updated");
      return user;
    } catch (error) {
      console.error("Error in login:", error.message);
      setError(error.message);
      throw error;
    }
  }

  // Google sign in function
  async function googleSignIn() {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log("User signed in with Google:", user.uid);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          streak: 0
        });
        console.log("New Google user document created");
      } else {
        // Update lastLogin
        await setDoc(userDocRef, { 
          lastLogin: serverTimestamp(),
          photoURL: user.photoURL
        }, { merge: true });
        console.log("Existing Google user document updated");
      }
      
      return user;
    } catch (error) {
      console.error("Error in Google sign-in:", error.message);
      setError(error.message);
      throw error;
    }
  }

  // Sign out function
  async function signOut() {
    try {
      setError('');
      await firebaseSignOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out:", error.message);
      setError(error.message);
      throw error;
    }
  }

  // Password reset function
  async function resetPassword(email) {
    try {
      setError('');
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent");
      return true;
    } catch (error) {
      console.error("Error in password reset:", error.message);
      setError(error.message);
      throw error;
    }
  }

  // Update user profile
  async function updateUserProfile(userData) {
    try {
      setError('');
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { ...userData, updatedAt: serverTimestamp() }, { merge: true });
      
      console.log("User profile updated");
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error.message);
      setError(error.message);
      throw error;
    }
  }

  // Refresh user data from Firestore
  async function refreshUserData() {
    try {
      if (!currentUser) return null;
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data refreshed from Firestore");
        return { uid: currentUser.uid, ...userData };
      }
      
      return null;
    } catch (error) {
      console.error("Error refreshing user data:", error.message);
      return null;
    }
  }

  // Check if the user is logged in
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user logged in");
      
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // Combine auth user with Firestore data
            setCurrentUser({
              ...user,
              ...userDoc.data()
            });
            console.log("User document exists, combined with auth data");
          } else {
            // If no Firestore document exists, create one
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              streak: 0
            });
            
            setCurrentUser({
              ...user,
              displayName: user.displayName || user.email.split('@')[0],
              streak: 0,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
            
            console.log("Created new user document for existing auth user");
          }
        } catch (error) {
          console.error("Error setting current user:", error);
          // Still set the user even if there's an error getting Firestore data
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    signOut,
    googleSignIn,
    resetPassword,
    updateUserProfile,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext; 