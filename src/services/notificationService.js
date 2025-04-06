import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getFirestore
} from 'firebase/firestore';
import { db } from './firebase';
import axios from 'axios';

// Notification types
export const NOTIFICATION_TYPES = {
  STREAK_MILESTONE: 'streak_milestone',
  NEW_FOLLOWER: 'new_follower',
  CHECK_IN_REMINDER: 'check_in_reminder',
  LIKE: 'like',
  COMMENT: 'comment',
  ACHIEVEMENT: 'achievement',
  STREAK_AT_RISK: 'streak_at_risk',
  SYSTEM: 'system'
};

/**
 * Create a notification for a user
 * @param {string} userId - The user ID to create the notification for
 * @param {Object} data - Notification data
 * @returns {Promise<string>} - The ID of the created notification
 */
export const createNotification = async (userId, data) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const db = getFirestore();
    const notification = {
      userId,
      ...data,
      read: false,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get unread notifications for a user
 * @param {string} userId - The user ID
 * @param {number} limitCount - Maximum number of notifications to retrieve
 * @returns {Promise<Array>} - Array of notification objects
 */
export const getUnreadNotifications = async (userId, limitCount = 10) => {
  if (!userId) return [];
  
  try {
    const db = getFirestore();
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    return [];
  }
};

/**
 * Get all notifications for a user
 * @param {string} userId - The user ID
 * @param {number} limitCount - Maximum number of notifications to retrieve
 * @returns {Promise<Array>} - Array of notification objects
 */
export const getAllNotifications = async (userId, limitCount = 30) => {
  if (!userId) return [];
  
  try {
    const db = getFirestore();
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting all notifications:', error);
    return [];
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) {
    throw new Error('Notification ID is required');
  }
  
  try {
    const db = getFirestore();
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const unreadNotifications = await getUnreadNotifications(userId, 100);
    const db = getFirestore();
    
    const updatePromises = unreadNotifications.map(notification => {
      const notificationRef = doc(db, 'notifications', notification.id);
      return updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Create a streak milestone notification
 * @param {string} userId - The user ID
 * @param {number} streakCount - The streak count reached
 * @returns {Promise<string>} - The ID of the created notification
 */
export const createStreakMilestoneNotification = async (userId, streakCount) => {
  if (!userId || !streakCount) {
    throw new Error('User ID and streak count are required');
  }
  
  // Only create milestone notifications for specific streaks
  if (![3, 5, 7, 10, 14, 21, 30, 50, 100, 200, 365].includes(streakCount)) {
    return null;
  }
  
  const notificationData = {
    type: NOTIFICATION_TYPES.STREAK_MILESTONE,
    title: 'Streak Milestone Reached!',
    message: `Congratulations! You've reached a ${streakCount}-day streak.`,
    streakCount,
    iconType: 'streak',
    link: '/dashboard'
  };
  
  return await createNotification(userId, notificationData);
};

/**
 * Create a streak at risk notification
 * @param {string} userId - The user ID
 * @param {number} currentStreak - The current streak count
 * @returns {Promise<string>} - The ID of the created notification
 */
export const createStreakAtRiskNotification = async (userId, currentStreak) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const notificationData = {
    type: NOTIFICATION_TYPES.STREAK_AT_RISK,
    title: 'Streak at Risk!',
    message: `Your ${currentStreak}-day streak will be lost if you don't check in today.`,
    streakCount: currentStreak,
    iconType: 'warning',
    link: '/dashboard',
    priority: 'high'
  };
  
  return await createNotification(userId, notificationData);
};

/**
 * Create a like notification
 * @param {string} userId - The user ID to notify
 * @param {string} likerId - The user ID who liked
 * @param {string} likerName - The name of the user who liked
 * @param {string} postId - The post ID that was liked
 * @returns {Promise<string>} - The ID of the created notification
 */
export const createLikeNotification = async (userId, likerId, likerName, postId) => {
  if (!userId || !likerId || !postId) {
    throw new Error('User ID, liker ID, and post ID are required');
  }
  
  const notificationData = {
    type: NOTIFICATION_TYPES.LIKE,
    title: 'New Like',
    message: `${likerName} liked your post.`,
    likerId,
    likerName,
    postId,
    iconType: 'like',
    link: `/post/${postId}`
  };
  
  return await createNotification(userId, notificationData);
};

/**
 * Create a comment notification
 * @param {string} userId - The user ID to notify
 * @param {string} commenterId - The user ID who commented
 * @param {string} commenterName - The name of the user who commented
 * @param {string} postId - The post ID that was commented on
 * @param {string} commentText - Preview of the comment text
 * @returns {Promise<string>} - The ID of the created notification
 */
export const createCommentNotification = async (userId, commenterId, commenterName, postId, commentText) => {
  if (!userId || !commenterId || !postId) {
    throw new Error('User ID, commenter ID, and post ID are required');
  }
  
  // Truncate comment text if it's too long
  const truncatedComment = commentText && commentText.length > 50 
    ? `${commentText.substring(0, 50)}...` 
    : commentText;
  
  const notificationData = {
    type: NOTIFICATION_TYPES.COMMENT,
    title: 'New Comment',
    message: `${commenterName} commented: "${truncatedComment || 'on your post'}"`,
    commenterId,
    commenterName,
    postId,
    commentText: truncatedComment,
    iconType: 'comment',
    link: `/post/${postId}`
  };
  
  return await createNotification(userId, notificationData);
};

// Function to request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get the FCM token
      const token = await getFCMToken();
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};


export const saveUserToken = async (userId, token) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        fcmToken: token,
        notificationsEnabled: true,
        tokenLastUpdated: new Date().toISOString()
      });
    } else {
      await updateDoc(userRef, {
        fcmToken: token,
        notificationsEnabled: true,
        tokenLastUpdated: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user token:', error);
    return false;
  }
};


export const scheduleRandomNotification = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User document not found');
    }
    
    const userData = userSnap.data();
    const { notificationStartTime, notificationEndTime } = userData.preferences;
    
    
    const [startHour, startMinute] = notificationStartTime.split(':').map(Number);
    const [endHour, endMinute] = notificationEndTime.split(':').map(Number);
    
    
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    
    const randomTimeInMinutes = Math.floor(
      Math.random() * (endTimeInMinutes - startTimeInMinutes) + startTimeInMinutes
    );
    
    
    const randomHour = Math.floor(randomTimeInMinutes / 60);
    const randomMinute = randomTimeInMinutes % 60;
    
    
    const formattedRandomTime = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}`;
    
    
    await updateDoc(userRef, {
      nextCheckInTime: formattedRandomTime,
      lastScheduledDate: new Date().toISOString().split('T')[0] 
    });
    
    return formattedRandomTime;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

// Function to check if it's time to send notification
export const checkNotificationTime = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }
    
    const userData = userSnap.data();
    const { nextCheckInTime, lastScheduledDate } = userData;
    
    // Check if we need to schedule for today
    const today = new Date().toISOString().split('T')[0];
    if (lastScheduledDate !== today) {
      await scheduleRandomNotification(userId);
      return false; // Just scheduled, so don't notify yet
    }
    
    // Check if it's time to notify
    const [scheduledHour, scheduledMinute] = nextCheckInTime.split(':').map(Number);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Compare current time with scheduled time
    if (
      (currentHour > scheduledHour) || 
      (currentHour === scheduledHour && currentMinute >= scheduledMinute)
    ) {
      // It's time to notify!
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking notification time:', error);
    return false;
  }
};

// Function to send local browser notification
export const sendLocalNotification = (title, body, onClick) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/logo192.png' // Make sure this exists in your public folder
    });
    
    if (onClick) {
      notification.onclick = onClick;
    }
  }
};

// Get FCM token
const getFCMToken = async () => {
  try {
    // Mock function for demo - in a real app, this would use Firebase Messaging
    // return await messaging.getToken();
    
    // For this example, we'll return a mock token
    return `token-${Math.random().toString(36).substring(2, 15)}`;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Enable notifications for a user
export const enableNotifications = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      notificationsEnabled: true
    });
    
    return true;
  } catch (error) {
    console.error('Error enabling notifications:', error);
    return false;
  }
};

// Disable notifications for a user
export const disableNotifications = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      notificationsEnabled: false
    });
    
    return true;
  } catch (error) {
    console.error('Error disabling notifications:', error);
    return false;
  }
};

// Schedule check-in notifications based on user preferences
export const scheduleCheckInNotification = async (userId, preferences) => {
  try {
    // In a real app, you would call your backend API
    const response = await axios.post('/api/notifications/schedule-check-ins', {
      userId,
      preferences
    });
    
    return response.data;
  } catch (error) {
    console.error('Error scheduling check-in notification:', error);
    throw error;
  }
};

// Get a user's notification preferences
export const getNotificationPreferences = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    return {
      enabled: userData.notificationsEnabled || false,
      checkInPreferences: userData.checkInPreferences || null
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
};

// Display a local notification (for testing without a server)
export const showLocalNotification = (title, options) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else {
    console.log('Notification permission not granted');
  }
};

// Handle incoming check-in notification
export const handleCheckInNotification = async (data) => {
  try {
    if (data && data.type === 'check-in') {
      // Navigate to check-in page or open modal
      return {
        type: 'check-in',
        timestamp: data.timestamp,
        expiresAt: data.expiresAt
      };
    }
    return null;
  } catch (error) {
    console.error('Error handling check-in notification:', error);
    return null;
  }
};

export default {
  createNotification,
  getUnreadNotifications,
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createStreakMilestoneNotification,
  createStreakAtRiskNotification,
  createLikeNotification,
  createCommentNotification,
  NOTIFICATION_TYPES
}; 