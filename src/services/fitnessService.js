import { db, storage } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  setDoc,
  Timestamp,
  getFirestore
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';

// Submit a fitness check-in
export const submitCheckIn = async (userId, data) => {
  try {
    const { activityType, photoUrl, note } = data;
    
    // Create the check-in document
    const checkInRef = await addDoc(collection(db, 'checkIns'), {
      userId,
      activityType,
      photoUrl: photoUrl || null,
      note: note || '',
      timestamp: serverTimestamp(),
      likes: 0
    });
    
    // Update user stats
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }
    
    const userData = userDoc.data();
    
    // Check if this is a workout activity
    const isWorkout = ['Currently working out', 'Worked out earlier'].includes(activityType);
    
    // Get the date of the last check-in
    const lastCheckInDate = userData.lastCheckInDate || '';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calculate streak
    let newStreak = userData.fitnessStats?.streak || 0;
    
    if (isWorkout) {
      // If last check-in was yesterday, increment streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastCheckInDate === yesterdayStr) {
        newStreak += 1;
      } 
      // If last check-in was not yesterday and not today, reset streak to 1
      else if (lastCheckInDate !== today) {
        newStreak = 1;
      }
      // If already checked in today, don't change the streak
    } else if (activityType === 'Skipping today') {
      // If skipping, reset streak to 0
      newStreak = 0;
    }
    
    // Update user document
    await updateDoc(userRef, {
      'fitnessStats.streak': newStreak,
      'fitnessStats.totalCheckIns': increment(1),
      'fitnessStats.totalWorkouts': isWorkout ? increment(1) : increment(0),
      lastCheckInDate: today
    });
    
    return {
      id: checkInRef.id,
      ...data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error submitting check-in:', error);
    throw error;
  }
};

// Modified upload function with improved CORS handling
export const uploadCheckInPhoto = async (file, userId) => {
  if (!file || !userId) {
    throw new Error("File and user ID are required for upload");
  }
  
  try {
    console.log('Starting check-in photo upload:', { 
      fileType: file.type,
      fileSize: file.size,
      userId 
    });
    
    const storage = getStorage();
    
    // Create a unique filename with timestamp and random ID
    const timestamp = new Date().getTime();
    const randomId = Math.random().toString(36).substring(2, 8);
    
    // Handle case where file might be a Blob without a name property
    let extension = 'jpg';
    if (file.name) {
      extension = file.name.split('.').pop() || 'jpg';
    }
    
    // Updated path to be more structured and consistent
    const filename = `users/${userId}/check-ins/${timestamp}-${randomId}.${extension}`;
    
    console.log(`Uploading check-in photo to path: ${filename}`);
    
    // Create storage reference
    const storageRef = ref(storage, filename);
    
    // Apply metadata with CORS headers and cache control
    const metadata = {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000, no-transform',
      customMetadata: {
        'uploaded-by': userId,
        'timestamp': timestamp.toString(),
        'client-hostname': window.location.hostname
      }
    };
    
    // Create array buffer from file
    const buffer = await file.arrayBuffer();
    
    // Upload file with metadata
    console.log('Starting upload with metadata:', metadata);
    const uploadTask = await uploadBytes(storageRef, buffer, metadata);
    console.log('Upload complete, getting download URL');
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Successfully got download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    console.error("Error details:", JSON.stringify({
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    }));
    
    // If we encounter CORS errors, provide a more specific error message
    if (error.code === 'storage/unauthorized' || 
        error.message?.includes('CORS') || 
        error.message?.includes('access')) {
      console.error('This appears to be a CORS issue. Make sure Firebase Storage CORS settings are configured correctly.');
      throw new Error('Unable to upload image due to CORS restrictions. Please try again later.');
    }
    
    throw error;
  }
};

// Modified upload function with CORS handling
export const uploadImage = async (userId, file, path = 'check-ins') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Create a unique filename
    const extension = file.name.split('.').pop();
    const filename = `${Date.now()}.${extension}`;
    const fullPath = `users/${userId}/${path}/${filename}`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, fullPath);
    
    // Apply less restrictive metadata with CORS headers
    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        'uploaded-by': userId,
        'timestamp': Date.now().toString()
      }
    };
    
    // Upload file with metadata
    await uploadBytes(storageRef, file, metadata);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    
    // If we encounter CORS errors, provide a more specific error message
    if (error.code === 'storage/unauthorized' || 
        error.message?.includes('CORS') || 
        error.message?.includes('access')) {
      console.error('This appears to be a CORS issue. Make sure Firebase Storage CORS settings are configured correctly.');
      throw new Error('Unable to upload image due to CORS restrictions. Please try again later.');
    }
    
    throw error;
  }
};

// Get user's check-in history
export const getUserCheckIns = async (userId, limitCount) => {
  try {
    console.log(`Fetching check-ins for userId: ${userId}`);
    
    if (!userId) {
      console.error('No userId provided to getUserCheckIns');
      return { checkIns: [] };
    }

    // First ensure the user document exists
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    let userData = null;
    
    if (!userSnap.exists()) {
      console.log('User document does not exist, creating it first');
      userData = {
        displayName: "New User",
        streak: 0,
        totalCheckIns: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      await setDoc(userRef, userData);
    } else {
      userData = userSnap.data();
    }

    // Get check-ins from the root checkIns collection
    const checkInsRef = collection(db, 'checkIns');
    let q;
    
    if (limitCount) {
      q = query(
        checkInsRef, 
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        checkInsRef, 
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const checkIns = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamps to JavaScript dates
      const timestamp = data.timestamp instanceof Timestamp ? 
        data.timestamp.toDate() : 
        data.timestamp;
      
      checkIns.push({
        id: doc.id,
        ...data,
        timestamp
      });
    });
    
    console.log(`Found ${checkIns.length} check-ins for user ${userId}`);
    
    // Return both user stats and check-ins
    return {
      checkIns,
      streak: userData?.streak || 0,
      totalCheckIns: checkIns.length,
      lastCheckIn: checkIns.length > 0 ? checkIns[0].timestamp : null
    };
  } catch (error) {
    console.error("Error getting user check-ins:", error);
    throw error;
  }
};

// Get global feed
export const getGlobalFeed = async (limit = 20) => {
  try {
    const feedQuery = query(
      collection(db, 'checkIns'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(feedQuery);
    const checkIns = [];
    
    // Get all check-ins
    for (const doc of querySnapshot.docs) {
      const checkInData = doc.data();
      const userId = checkInData.userId;
      
      // Get user data for each check-in
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      checkIns.push({
        id: doc.id,
        ...checkInData,
        timestamp: checkInData.timestamp?.toDate().toISOString() || null,
        user: userData ? {
          id: userId,
          displayName: userData.displayName,
          streak: userData.fitnessStats?.streak || 0
        } : null
      });
    }
    
    return checkIns;
  } catch (error) {
    console.error('Error getting global feed:', error);
    throw error;
  }
};

// Like a check-in
export const likeCheckIn = async (userId, checkInId) => {
  try {
    // First, check if user already liked this check-in
    const likesQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('checkInId', '==', checkInId)
    );
    
    const likeSnapshot = await getDocs(likesQuery);
    
    if (!likeSnapshot.empty) {
      // User already liked this post, so unlike it
      const likeDoc = likeSnapshot.docs[0];
      await likeDoc.ref.delete();
      
      // Decrement the like count
      const checkInRef = doc(db, 'checkIns', checkInId);
      await updateDoc(checkInRef, {
        likes: increment(-1)
      });
      
      return { liked: false };
    } else {
      // User hasn't liked this post, so add the like
      await addDoc(collection(db, 'likes'), {
        userId,
        checkInId,
        timestamp: serverTimestamp()
      });
      
      // Increment the like count
      const checkInRef = doc(db, 'checkIns', checkInId);
      await updateDoc(checkInRef, {
        likes: increment(1)
      });
      
      return { liked: true };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Get trending users (users with highest streaks)
export const getTrendingUsers = async (limitCount = 10) => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('fitnessStats.streak', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      displayName: doc.data().displayName,
      streak: doc.data().fitnessStats?.streak || 0
    }));
  } catch (error) {
    console.error('Error getting trending users:', error);
    throw error;
  }
};

// Save a check-in 
export const saveCheckIn = async (userId, checkInData) => {
  try {
    const { status, activityType, notes, photo } = checkInData;
    
    // Create a new check-in document
    const checkInsRef = collection(db, 'users', userId, 'checkIns');
    
    let photoUrl = null;
    
    // If there's a photo, upload it to storage
    if (photo) {
      photoUrl = await uploadCheckInPhoto(photo, userId);
    }
    
    // Create the check-in data
    const newCheckIn = {
      status,
      activityType: activityType || null,
      notes: notes || '',
      photoUrl,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    // Add the check-in to the collection
    const checkInRef = await addDoc(checkInsRef, newCheckIn);
    
    // Update user's streak and last check-in
    await updateUserStats(userId);
    
    return {
      id: checkInRef.id,
      ...newCheckIn,
      timestamp: new Date().toISOString() // Return the local timestamp for immediate UI update
    };
  } catch (error) {
    console.error('Error saving check-in:', error);
    throw error;
  }
};

// Update user stats (streak, last check-in)
export const updateUserStats = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const checkInsRef = collection(db, 'users', userId, 'checkIns');
    
    // Get the user's check-ins
    const checkInsQuery = query(checkInsRef, orderBy('timestamp', 'desc'));
    const checkInsSnapshot = await getDocs(checkInsQuery);
    
    if (checkInsSnapshot.empty) {
      return;
    }
    
    // Get the most recent check-in
    const latestCheckIn = checkInsSnapshot.docs[0].data();
    
    // Calculate streak
    const checkIns = checkInsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    const streak = calculateStreak(checkIns);
    
    // Update the user document
    await updateDoc(userRef, {
      lastCheckIn: latestCheckIn.timestamp,
      streak
    });
    
    return { streak, lastCheckIn: latestCheckIn.timestamp };
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

// Calculate user's streak based on check-ins
export const calculateStreak = (checkIns) => {
  if (!checkIns || checkIns.length === 0) {
    return 0;
  }
  
  // Sort check-ins by timestamp in descending order
  const sortedCheckIns = [...checkIns].sort((a, b) => {
    const dateA = new Date(a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp);
    const dateB = new Date(b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp);
    return dateB - dateA;
  });
  
  let streak = 1;
  let currentDate = new Date(sortedCheckIns[0].timestamp?.toDate ? 
    sortedCheckIns[0].timestamp.toDate() : sortedCheckIns[0].timestamp);
  
  // Check if the most recent check-in is from today or yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkInDate = new Date(currentDate);
  checkInDate.setHours(0, 0, 0, 0);
  
  // If the most recent check-in is not from today or yesterday, reset streak
  if ((today - checkInDate) / (1000 * 60 * 60 * 24) > 1) {
    return 0;
  }
  
  // Loop through check-ins to calculate streak
  for (let i = 1; i < sortedCheckIns.length; i++) {
    const previousDate = new Date(sortedCheckIns[i].timestamp?.toDate ? 
      sortedCheckIns[i].timestamp.toDate() : sortedCheckIns[i].timestamp);
    
    // Set hours to 0 to compare dates only
    currentDate.setHours(0, 0, 0, 0);
    previousDate.setHours(0, 0, 0, 0);
    
    // Get the difference in days
    const diffTime = currentDate - previousDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If the check-in is from the previous day, increment streak
    if (diffDays === 1) {
      streak++;
      currentDate = previousDate;
    } else if (diffDays === 0) {
      // Same day, continue
      currentDate = previousDate;
    } else {
      // Streak broken
      break;
    }
  }
  
  return streak;
};

// Save user's check-in time preferences
export const saveCheckInPreferences = async (userId, preferences) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      checkInPreferences: preferences
    });
    
    return preferences;
  } catch (error) {
    console.error('Error saving check-in preferences:', error);
    throw error;
  }
};

// Get user's check-in time preferences
export const getCheckInPreferences = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return userDoc.data().checkInPreferences || null;
  } catch (error) {
    console.error('Error getting check-in preferences:', error);
    throw error;
  }
};

/**
 * Add a check-in to the database with improved photo handling
 * @param {Object} checkInData - Check-in data (activityType, note, tags, photoUrl)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} The created check-in with ID
 */
export const addCheckIn = async (checkInData, userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  console.log('Adding check-in for user:', userId);
  console.log('Check-in data:', {
    ...checkInData,
    photoUrl: checkInData.photoUrl ? '[URL exists]' : null
  });

  try {
    // Prepare check-in document
    const checkInDoc = {
      userId,
      activityType: checkInData.activityType || 'Other',
      note: checkInData.note || '',
      tags: checkInData.tags || [],
      photoUrl: checkInData.photoUrl || null,
      timestamp: serverTimestamp(),
      likes: 0,
      createdAt: serverTimestamp()
    };

    // Add to Firestore
    const checkInRef = await addDoc(collection(db, 'checkIns'), checkInDoc);
    const checkInId = checkInRef.id;
    
    console.log(`Check-in created with ID: ${checkInId}`);
    
    // Update user stats
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        'fitnessStats.totalCheckIns': increment(1),
        lastCheckInDate: new Date().toISOString().split('T')[0],
        lastActivity: serverTimestamp()
      });
    } else {
      // Create new user document if it doesn't exist
      await setDoc(userRef, {
        fitnessStats: {
          totalCheckIns: 1,
          streak: 0
        },
        lastCheckInDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
    }
    
    // Verify that photoUrl was saved correctly
    const savedCheckIn = await getDoc(checkInRef);
    if (savedCheckIn.exists()) {
      const savedData = savedCheckIn.data();
      console.log('Verified saved check-in photoUrl:', 
        savedData.photoUrl ? '[URL exists]' : 'null');
      
      // If there's a photoUrl mismatch, try to update it
      if (checkInData.photoUrl && !savedData.photoUrl) {
        console.warn('PhotoUrl not saved correctly, attempting to update');
        await updateDoc(checkInRef, { photoUrl: checkInData.photoUrl });
      }
    }

    // Return check-in data with ID
    return {
      id: checkInId,
      ...checkInDoc,
      timestamp: new Date().toISOString() // Convert for client use
    };
  } catch (error) {
    console.error('Error adding check-in:', error);
    
    // Handle specific error cases
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to add check-ins');
    } else if (error.name === 'FirebaseError' && error.code?.includes('unavailable')) {
      throw new Error('Network error. Please check your connection and try again');
    }
    
    throw error;
  }
};

// Get user document
export const getUserProfile = async (userId) => {
  try {
    // Add logging for debugging
    console.log(`Fetching user profile for userId: ${userId}`);
    
    if (!userId) {
      console.error('No userId provided to getUserProfile');
      return null;
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('User document exists');
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      console.log('No user document found, creating new user document');
      // Create user document if it doesn't exist
      const newUser = {
        displayName: "New User",
        streak: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      await setDoc(userRef, newUser);
      return { id: userId, ...newUser };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Get feed items
export const getFeedItems = async (limit = 20) => {
  try {
    console.log(`Fetching feed items, limit: ${limit}`);
    
    const feedRef = collection(db, 'feed');
    const q = query(feedRef, orderBy('timestamp', 'desc'), limit);
    const querySnapshot = await getDocs(q);
    
    const feedItems = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamps to JavaScript dates
      const timestamp = data.timestamp instanceof Timestamp ? 
        data.timestamp.toDate() : 
        data.timestamp;
      
      feedItems.push({
        id: doc.id,
        ...data,
        timestamp
      });
    });
    
    console.log(`Found ${feedItems.length} feed items`);
    return feedItems;
  } catch (error) {
    console.error("Error getting feed items:", error);
    throw error;
  }
};

// Get stories
export const getStories = async () => {
  try {
    console.log('Fetching stories');
    
    const storiesRef = collection(db, 'stories');
    const now = new Date();
    // Get stories that haven't expired
    const q = query(
      storiesRef, 
      where('expiresAt', '>', now),
      orderBy('expiresAt'),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const stories = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamps to JavaScript dates
      const timestamp = data.timestamp instanceof Timestamp ? 
        data.timestamp.toDate() : 
        data.timestamp;
      
      const expiresAt = data.expiresAt instanceof Timestamp ? 
        data.expiresAt.toDate() : 
        data.expiresAt;
      
      stories.push({
        id: doc.id,
        ...data,
        timestamp,
        expiresAt
      });
    });
    
    console.log(`Found ${stories.length} stories`);
    return stories;
  } catch (error) {
    console.error("Error getting stories:", error);
    throw error;
  }
};

// Create a story
export const createStory = async (userId, displayName, photoURL, storyData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Set expiration time (24 hours from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Create story object
    const story = {
      userId,
      userDisplayName: displayName,
      userPhotoURL: photoURL,
      ...storyData,
      timestamp: serverTimestamp(),
      expiresAt
    };
    
    // Add to stories collection
    const storiesRef = collection(db, 'stories');
    const storyDocRef = await addDoc(storiesRef, story);
    
    // Add reference to user's stories subcollection
    const userStoryRef = doc(db, 'users', userId, 'stories', storyDocRef.id);
    await setDoc(userStoryRef, {
      storyId: storyDocRef.id,
      timestamp: serverTimestamp()
    });
    
    return storyDocRef.id;
  } catch (error) {
    console.error("Error creating story:", error);
    throw error;
  }
};

// Like a feed item
export const likeFeedItem = async (userId, feedItemId) => {
  try {
    if (!userId || !feedItemId) {
      throw new Error('User ID and feed item ID are required');
    }
    
    // Add user to likes subcollection
    const likeRef = doc(db, 'feed', feedItemId, 'likes', userId);
    await setDoc(likeRef, {
      timestamp: serverTimestamp()
    });
    
    // Increment likes count on feed item
    const feedItemRef = doc(db, 'feed', feedItemId);
    const feedItemSnap = await getDoc(feedItemRef);
    
    if (feedItemSnap.exists()) {
      const currentLikes = feedItemSnap.data().likes || 0;
      await updateDoc(feedItemRef, {
        likes: currentLikes + 1
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error liking feed item:", error);
    throw error;
  }
};

// Unlike a feed item
export const unlikeFeedItem = async (userId, feedItemId) => {
  try {
    if (!userId || !feedItemId) {
      throw new Error('User ID and feed item ID are required');
    }
    
    // Remove user from likes subcollection
    const likeRef = doc(db, 'feed', feedItemId, 'likes', userId);
    await setDoc(likeRef, {
      deleted: true,
      timestamp: serverTimestamp()
    });
    
    // Decrement likes count on feed item
    const feedItemRef = doc(db, 'feed', feedItemId);
    const feedItemSnap = await getDoc(feedItemRef);
    
    if (feedItemSnap.exists()) {
      const currentLikes = feedItemSnap.data().likes || 0;
      if (currentLikes > 0) {
        await updateDoc(feedItemRef, {
          likes: currentLikes - 1
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error unliking feed item:", error);
    throw error;
  }
};

// Get tags for filter selection
export const getAvailableTags = async () => {
  try {
    const db = getFirestore();
    const tagsDoc = await getDoc(doc(db, 'metadata', 'tags'));
    
    if (tagsDoc.exists()) {
      return tagsDoc.data().availableTags || [];
    }
    
    // Default tags if none exist
    return ['cardio', 'strength', 'flexibility', 'hiit', 'yoga', 'running', 'cycling', 'swimming', 'weightlifting', 'crossfit'];
  } catch (error) {
    console.error('Error getting available tags:', error);
    return [];
  }
};

// Update available tags in the system
export const updateAvailableTags = async (tags) => {
  try {
    const db = getFirestore();
    await setDoc(doc(db, 'metadata', 'tags'), {
      availableTags: tags,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating available tags:', error);
    throw error;
  }
};

export default {
  getUserProfile,
  getUserCheckIns,
  addCheckIn,
  getFeedItems,
  getStories,
  uploadImage,
  createStory,
  likeFeedItem,
  unlikeFeedItem,
  getAvailableTags,
  updateAvailableTags
}; 