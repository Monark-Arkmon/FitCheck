import { collection, addDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

// Sample user data
const sampleUsers = [
  { displayName: 'Alex Johnson', streak: 14 },
  { displayName: 'Taylor Williams', streak: 21 },
  { displayName: 'Jordan Smith', streak: 7 },
  { displayName: 'Morgan Bailey', streak: 30 },
  { displayName: 'Casey Parker', streak: 5 },
  { displayName: 'Riley Thompson', streak: 18 },
  { displayName: 'Drew Wilson', streak: 9 },
  { displayName: 'Jamie Davis', streak: 12 },
  { displayName: 'Avery Brown', streak: 25 },
  { displayName: 'Quinn Martinez', streak: 3 },
  { displayName: 'Reese Garcia', streak: 16 },
  { displayName: 'Skyler Rodriguez', streak: 10 },
  { displayName: 'Dakota Lee', streak: 19 },
  { displayName: 'Hayden Clark', streak: 8 },
  { displayName: 'Finley Lewis', streak: 22 },
  { displayName: 'Blake Turner', streak: 4 },
  { displayName: 'Charlie Gonzalez', streak: 27 },
  { displayName: 'Jesse Moore', streak: 11 },
  { displayName: 'Peyton Scott', streak: 15 },
  { displayName: 'Cameron White', streak: 6 }
];

// Sample activity types
const activities = [
  'cardio',
  'strength training',
  'yoga',
  'hiking',
  'running',
  'swimming',
  'cycling',
  'HIIT',
  'pilates',
  'crossfit',
  'boxing',
  'climbing',
  'currently working out',
  'worked out earlier',
  'skipping today'
];

// Sample notes
const sampleNotes = [
  'Great workout today! Feeling stronger than ever.',
  'Taking it easy today, focusing on recovery.',
  'Pushed myself harder than usual, feeling the burn!',
  'Trying a new routine, excited to see results.',
  'Not feeling 100% but showed up anyway.',
  'Personal best on deadlifts today!',
  'Quick session during lunch break.',
  'Morning workout to start the day right.',
  'Evening session to destress after work.',
  'Focusing on form over weight today.',
  'Group class was super motivating!',
  'Had to modify some exercises due to minor injury.',
  'Outdoor workout in the park, beautiful day!',
  'Feeling sore from yesterday but pushed through.',
  'Recovery day with light stretching.',
  'Trying to be more consistent this month.',
  'Partner workout was fun and challenging!',
  'Focusing on upper body strength today.',
  'Leg day! Might have trouble walking tomorrow.',
  'Core workout - building that strength from within!'
];

// Sample fitness photo URLs from Unsplash
const samplePhotoUrls = [
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&q=80&w=1000'
];

// Helper function to get a random date within the last 30 days
const getRandomDate = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime);
};

// Helper function to get a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Create a random check-in
const generateCheckIn = (userId, userName, userPhoto = null) => {
  // 70% chance to have a workout, 30% chance to be busy
  const status = Math.random() < 0.7 ? 'workout' : 'busy';
  
  // Base check-in data
  const checkIn = {
    userId,
    userDisplayName: userName,
    userPhotoURL: userPhoto,
    status,
    timestamp: getRandomDate(),
    likes: Math.floor(Math.random() * 15) // Random likes count
  };
  
  // Add activity-specific data if it's a workout
  if (status === 'workout') {
    checkIn.activityType = getRandomItem(activities);
    checkIn.notes = getRandomItem(sampleNotes);
    
    // 60% chance to have a photo
    if (Math.random() < 0.6) {
      checkIn.photoUrl = getRandomItem(samplePhotoUrls);
    }
  }
  
  return checkIn;
};

// Create a user and their check-ins
const generateUser = async (userData) => {
  try {
    // Create user avatar URL
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=random&size=200`;
    
    // Create user document
    const userDocRef = await addDoc(collection(db, 'users'), {
      displayName: userData.displayName,
      streak: userData.streak,
      photoURL: avatarUrl,
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    // Generate 3-7 check-ins for this user
    const numCheckIns = 3 + Math.floor(Math.random() * 5);
    const checkInPromises = [];
    
    for (let i = 0; i < numCheckIns; i++) {
      const checkInData = generateCheckIn(userDocRef.id, userData.displayName, avatarUrl);
      
      // Add to feed collection
      const checkInPromise = addDoc(collection(db, 'feed'), checkInData);
      checkInPromises.push(checkInPromise);
      
      // Add to user's check-ins subcollection
      const userCheckInPromise = addDoc(collection(db, `users/${userDocRef.id}/checkIns`), checkInData);
      checkInPromises.push(userCheckInPromise);
    }
    
    // Also create a story for some users (40% chance)
    if (Math.random() < 0.4) {
      const storyData = {
        userId: userDocRef.id,
        userDisplayName: userData.displayName,
        userPhotoURL: avatarUrl,
        photoUrl: getRandomItem(samplePhotoUrls),
        caption: Math.random() < 0.7 ? getRandomItem(sampleNotes) : null,
        timestamp: getRandomDate(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires after 24 hours
      };
      
      // Add to stories collection
      const storyPromise = addDoc(collection(db, 'stories'), storyData);
      checkInPromises.push(storyPromise);
      
      // Also add to feed collection
      const feedStoryData = {
        ...storyData,
        type: 'story',
        likes: Math.floor(Math.random() * 15) // Random likes count
      };
      const feedStoryPromise = addDoc(collection(db, 'feed'), feedStoryData);
      checkInPromises.push(feedStoryPromise);
    }
    
    await Promise.all(checkInPromises);
    return userDocRef.id;
  } catch (error) {
    console.error('Error generating user:', error);
    throw error;
  }
};

// Generate all sample data
export const generateAllSampleData = async () => {
  try {
    console.log('Generating sample data for 20 users...');
    
    // Generate users one by one
    for (const userData of sampleUsers) {
      await generateUser(userData);
    }
    
    console.log('Sample data generation complete!');
    return true;
  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  }
};

// Clear sample data (not implemented - would be complex to safely remove)
export const clearSampleData = () => {
  console.log('Clearing sample data is not implemented for safety reasons.');
  alert('For safety reasons, clearing sample data is not implemented. It would be difficult to safely identify and remove only sample data without affecting real user data.');
  return false;
}; 