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
  getFirestore,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';

// Submit a fitness check-in
export const submitCheckIn = async (userId, data) => {
  try {
    const { activityType, photoUrl, note, visibility } = data;
    
    // Create the check-in document
    const checkInRef = await addDoc(collection(db, 'checkIns'), {
      userId,
      activityType,
      photoUrl: photoUrl || null,
      note: note || '',
      timestamp: serverTimestamp(),
      likes: 0,
      visibility: visibility || 'public'
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
    
    // Add to feed collection if the check-in is public - default to public if not specified
    if (visibility !== 'private') {
      console.log('Adding check-in to feed:', { checkInId: checkInRef.id, photoUrl });
      
      // Get user data for feed item
      const displayName = userData.displayName || 'User';
      
      // Use getUserProfileImage for consistent user photo handling
      let userPhotoURL = userData.photoURL;
      
      // If no photo URL, generate one
      if (!userPhotoURL) {
        userPhotoURL = getUserProfileImage({displayName});
        
        // Also update the user's document with this photo
        await updateDoc(userRef, {
          photoURL: userPhotoURL,
          photoGenerated: true
        });
      }
      
      // Use current timestamp for immediate feed display
      const currentTimestamp = new Date();
      
      // Add to feed collection
      await addDoc(collection(db, 'feed'), {
        type: 'check-in',
        checkInId: checkInRef.id,
        userId,
        userDisplayName: displayName,
        userPhotoURL,
        activityType,
        note: note || '',
        photoUrl: photoUrl || null,
        timestamp: currentTimestamp,
        created: serverTimestamp(),
        likes: 0
      });
    }
    
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

// Get user's check-ins - both public and private for the current user
export const getUserCheckIns = async (userId, limitCount = 20) => {
  try {
    console.log(`Fetching check-ins for userId: ${userId}`);
    
    if (!userId) {
      console.error('No userId provided to getUserCheckIns');
      return { checkIns: [] };
    }

    // Get check-ins from the collection
    const checkInsRef = collection(db, 'checkIns');
    const q = query(
      checkInsRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
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
    
    // Get user document to include streak and stats information
    const userDoc = await getDoc(doc(db, 'users', userId));
    let streak = 0;
    let totalCheckIns = 0;
    let lastCheckIn = null;
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      streak = userData.fitnessStats?.streak || 0;
      totalCheckIns = userData.fitnessStats?.totalCheckIns || 0;
      
      // Set last check-in to the most recent one if available
      if (checkIns.length > 0 && checkIns[0].timestamp) {
        lastCheckIn = checkIns[0].timestamp;
      }
    }
    
    return {
      checkIns,
      streak,
      totalCheckIns,
      lastCheckIn,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
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
    await updateUserStats(userId, activityType);
    
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

// Update user stats based on check-in
const updateUserStats = async (userId, activityType) => {
  try {
    // Update user stats
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn(`User document not found for stats update: ${userId}`);
      return;
    }
    
    const userData = userDoc.data();
    const userStats = userData.fitnessStats || { totalCheckIns: 0, streak: 0 };
    
    // Get current date for streak calculation
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const lastCheckInDate = userData.lastCheckInDate || '';
    
    // Calculate streak
    let newStreak = userStats.streak || 0;
    
    // Check if activity type is workout related
    const isWorkout = ['Currently working out', 'Worked out earlier'].includes(activityType);
    
    if (isWorkout) {
      // Calculate streak based on last check-in date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastCheckInDate === yesterdayStr) {
        // Last check-in was yesterday, increment streak
        newStreak += 1;
        console.log(`Incrementing streak from ${userStats.streak} to ${newStreak}`);
      } else if (lastCheckInDate !== today) {
        // Last check-in was not yesterday and not today, reset streak to 1
        newStreak = 1;
        console.log(`Resetting streak to 1 (last check-in was on ${lastCheckInDate})`);
      } else {
        // Already checked in today, no change to streak
        console.log(`Maintaining streak at ${newStreak} (already checked in today)`);
      }
    } else if (activityType === 'Skipping today') {
      // If explicitly skipping, reset streak
      newStreak = 0;
      console.log('Resetting streak to 0 (skipping today)');
    }
    
    // Update user document with streak and check-in info
    await updateDoc(userRef, {
      'fitnessStats.totalCheckIns': increment(1),
      'fitnessStats.streak': newStreak,
      lastCheckInDate: today,
      lastActivity: serverTimestamp()
    });
    
    console.log(`Updated user stats - Total check-ins: ${userStats.totalCheckIns + 1}, Streak: ${newStreak}`);
    
    return { streak: newStreak, totalCheckIns: userStats.totalCheckIns + 1 };
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
export const addCheckIn = async (checkInData, userId = null) => {
  try {
    // Use provided userId or get it from checkInData
    const userIdToUse = userId || checkInData.userId;
    
    if (!userIdToUse) {
      throw new Error('User ID is required for check-in');
    }
    
    const { activityType, note, tags, photoUrl, visibility = 'public' } = checkInData;
    
    // Create the check-in document
    const checkInRef = await addDoc(collection(db, 'checkIns'), {
      userId: userIdToUse,
      activityType: activityType || null,
      photoUrl: photoUrl || null,
      note: note || '',
      tags: Array.isArray(tags) ? tags : [],
      timestamp: serverTimestamp(),
      created: new Date(),
      likes: 0,
      visibility
    });
    
    console.log(`Check-in added with ID: ${checkInRef.id}`);
    
    // Get user data to properly add to feed
    const userRef = doc(db, 'users', userIdToUse);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn(`User document not found for ID: ${userIdToUse}`);
    }
    
    const userData = userDoc.exists() ? userDoc.data() : null;
    const displayName = userData?.displayName || checkInData.userDisplayName || 'User';
    
    // Get profile image using fallback function
    const userPhotoURL = getUserProfileImage({
      photoURL: userData?.photoURL || checkInData.userPhotoURL,
      displayName
    });
    
    // Add to feed if this is a public check-in
    if (visibility !== 'private') {
      console.log('Adding check-in to feed');
      
      // Use current Date object for immediate display in feed
      const now = new Date();
      
      // Add to feed collection
      await addDoc(collection(db, 'feed'), {
        type: 'check-in',
        checkInId: checkInRef.id,
        userId: userIdToUse,
        userDisplayName: displayName,
        userPhotoURL,
        activityType,
        note: note || '',
        tags: Array.isArray(tags) ? tags : [],
        photoUrl: photoUrl || null,
        timestamp: now,
        created: serverTimestamp(),
        likes: 0
      });
      
      console.log('Check-in added to feed with timestamp:', now);
    }
    
    // Update user streak/stats
    try {
      await updateUserStats(userIdToUse, activityType);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
    
    // Return the new check-in with a current timestamp for UI updating
    return {
      id: checkInRef.id,
      ...checkInData,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error adding check-in:', error);
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
      const userData = userSnap.data();
      
      // Check if user doesn't have a profile photo
      if (!userData.photoURL) {
        console.log('User has no profile photo, generating one');
        const displayName = userData.displayName || "User";
        
        // Generate a consistent avatar URL (not random background to ensure consistency)
        const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6A6AE3&color=fff&size=256`;
        
        // Update the user document with the generated avatar
        await updateDoc(userRef, {
          photoURL: avatarURL,
          photoGenerated: true,
          photoUpdatedAt: serverTimestamp()
        });
        
        // Return updated user data
        return { 
          id: userSnap.id, 
          ...userData, 
          photoURL: avatarURL 
        };
      }
      
      return { id: userSnap.id, ...userData };
    } else {
      console.log('No user document found, creating new user document');
      
      // Create a default display name from user ID (first 5 chars)
      const defaultName = `User ${userId.substring(0, 5)}`;
      
      // Generate avatar URL
      const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=6A6AE3&color=fff&size=256`;
      
      // Create user document if it doesn't exist
      const newUser = {
        displayName: defaultName,
        photoURL: avatarURL,
        photoGenerated: true,
        streak: 0,
        fitnessStats: {
          streak: 0,
          totalCheckIns: 0
        },
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

// Get feed items - only public check-ins from all users
export const getFeedItems = async (limit = 20) => {
  try {
    console.log(`Fetching public feed items, limit: ${limit}`);
    
    const feedRef = collection(db, 'feed');
    const q = query(
      feedRef, 
      orderBy('timestamp', 'desc'), 
      limit
    );
    
    const querySnapshot = await getDocs(q);
    
    const feedItems = [];
    const now = new Date();
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      // Convert Firestore timestamps to JavaScript dates
      const timestamp = data.timestamp instanceof Timestamp ? 
        data.timestamp.toDate() : 
        data.timestamp;
      
      // Skip posts with future timestamps
      if (timestamp && timestamp > now) {
        console.log(`Skipping future post with timestamp: ${timestamp}`);
        continue;
      }
      
      // Process user photo URL with getUserProfileImage
      const userPhotoURL = getUserProfileImage({
        photoURL: data.userPhotoURL,
        displayName: data.userDisplayName || 'User'
      });
      
      // If the processed URL is different, update the feed item
      if (userPhotoURL !== data.userPhotoURL) {
        try {
          await updateDoc(doc.ref, {
            userPhotoURL: userPhotoURL,
            photoGenerated: true
          });
          
          // Also update the user document if possible
          if (data.userId) {
            const userRef = doc(db, 'users', data.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && (!userSnap.data().photoURL || userSnap.data().photoURL !== userPhotoURL)) {
              await updateDoc(userRef, {
                photoURL: userPhotoURL,
                photoGenerated: true
              });
            }
          }
        } catch (err) {
          console.error('Error updating feed item with photo URL:', err);
        }
      }
      
      // Add processed feed item to result array
      feedItems.push({
        id: doc.id,
        ...data,
        userPhotoURL, // Always use the processed photo URL
        timestamp
      });
    }
    
    console.log(`Found ${feedItems.length} feed items`);
    
    return feedItems;
  } catch (error) {
    console.error('Error getting feed items:', error);
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
      
      // Apply profile image fallback if needed
      const userPhotoURL = getUserProfileImage({
        photoURL: data.userPhotoURL,
        displayName: data.userDisplayName || 'User'
      });
      
      stories.push({
        id: doc.id,
        ...data,
        userPhotoURL, // Use the processed photo URL
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
    
    // Apply profile image fallback
    const userPhotoURL = getUserProfileImage({
      photoURL,
      displayName: displayName || 'User'
    });
    
    // Create story object
    const story = {
      userId,
      userDisplayName: displayName,
      userPhotoURL,
      ...storyData,
      timestamp: serverTimestamp(),
      expiresAt,
      created: now // Add client-side timestamp for immediate display
    };
    
    // Add to stories collection
    const storiesRef = collection(db, 'stories');
    const storyDocRef = await addDoc(storiesRef, story);
    
    // Add reference to user's stories subcollection
    const userStoryRef = doc(db, 'users', userId, 'stories', storyDocRef.id);
    await setDoc(userStoryRef, {
      storyId: storyDocRef.id,
      timestamp: serverTimestamp(),
      userPhotoURL,  // Include the processed photo URL here too
      created: now
    });
    
    return {
      id: storyDocRef.id,
      ...story,
      timestamp: now // Return the client timestamp for immediate display
    };
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

// Delete a check-in and recalculate streak if needed
export const deleteCheckIn = async (checkInId, userId) => {
  if (!checkInId || !userId) {
    throw new Error('Check-in ID and user ID are required');
  }

  try {
    console.log(`Deleting check-in ${checkInId} for user ${userId}`);
    
    // Get the check-in to see if it's public (affects streak)
    const checkInRef = doc(db, 'checkIns', checkInId);
    const checkInDoc = await getDoc(checkInRef);
    
    if (!checkInDoc.exists()) {
      throw new Error('Check-in not found');
    }
    
    const checkInData = checkInDoc.data();
    
    // Verify ownership
    if (checkInData.userId !== userId) {
      throw new Error('You do not have permission to delete this check-in');
    }
    
    // Check if this was a public check-in that might affect streak
    const isPublic = checkInData.visibility === 'public';
    const checkInDate = checkInData.timestamp instanceof Timestamp 
      ? checkInData.timestamp.toDate() 
      : new Date(checkInData.timestamp);
    
    // Delete the check-in
    await deleteDoc(checkInRef);
    console.log(`Check-in ${checkInId} deleted`);
    
    // If it was a public check-in, we need to recalculate streak
    if (isPublic) {
      await recalculateUserStreak(userId);
    }
    
    return { success: true, message: 'Check-in deleted successfully' };
  } catch (error) {
    console.error('Error deleting check-in:', error);
    throw error;
  }
};

// Recalculate a user's streak based on their public check-ins
const recalculateUserStreak = async (userId) => {
  if (!userId) return;
  
  try {
    console.log(`Recalculating streak for user ${userId}`);
    
    // Get the user's public check-ins, ordered by date
    const checkInsRef = collection(db, 'checkIns');
    const q = query(
      checkInsRef,
      where('userId', '==', userId),
      where('visibility', '==', 'public'),
      where('activityType', 'in', ['Currently working out', 'Worked out earlier']),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Convert to array of dates
    const checkInDates = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp instanceof Timestamp 
        ? data.timestamp.toDate() 
        : new Date(data.timestamp);
      
      // Format as YYYY-MM-DD
      const dateStr = timestamp.toISOString().split('T')[0];
      checkInDates.push(dateStr);
    });
    
    console.log(`Found ${checkInDates.length} public workout check-ins`);
    
    // If no check-ins, reset streak to 0
    if (checkInDates.length === 0) {
      console.log('No public check-ins found, resetting streak to 0');
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'fitnessStats.streak': 0,
        lastCheckInDate: '' // Reset last check-in date
      });
      return;
    }
    
    // Sort dates from newest to oldest
    checkInDates.sort((a, b) => new Date(b) - new Date(a));
    
    // Remove duplicates (only count one check-in per day)
    const uniqueDates = [...new Set(checkInDates)];
    
    // Calculate streak
    let streak = 1; // Start with the most recent check-in
    let lastDate = new Date(uniqueDates[0]);
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      
      // Check if current date is exactly one day before lastDate
      const daysBetween = Math.round((lastDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        // Consecutive day, increment streak
        streak++;
        lastDate = currentDate;
      } else {
        // Break in streak, stop counting
        break;
      }
    }
    
    console.log(`Recalculated streak: ${streak}`);
    
    // Update user document with new streak
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'fitnessStats.streak': streak,
      lastCheckInDate: uniqueDates[0] // Most recent check-in date
    });
    
    console.log(`Updated user streak to ${streak}`);
  } catch (error) {
    console.error('Error recalculating streak:', error);
  }
};

// Get user profile image with fallback
export const getUserProfileImage = (user) => {
  if (!user) return `https://ui-avatars.com/api/?name=User&background=6A6AE3&color=fff`;
  
  // For user objects with different property structures
  const photoURL = user.photoURL || user.userPhotoURL || null;
  const displayName = user.displayName || user.userDisplayName || (typeof user === 'string' ? user : 'User');
  
  // If user has a photoURL and it's not empty, validate and use it
  if (photoURL && typeof photoURL === 'string' && photoURL.trim() !== '') {
    // Basic URL validity check
    if (photoURL.startsWith('http://') || photoURL.startsWith('https://')) {
      return photoURL;
    }
    
    // More detailed check with try/catch
    try {
      new URL(photoURL);
      return photoURL;
    } catch (e) {
      console.warn('Invalid photo URL format, falling back to UI Avatar:', photoURL);
    }
  }
  
  // Generate a UI Avatar with the display name
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6A6AE3&color=fff`;
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
  updateAvailableTags,
  deleteCheckIn,
  getUserProfileImage
}; 