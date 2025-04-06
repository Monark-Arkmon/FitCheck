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
  deleteDoc,
  serverTimestamp,
  setDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { getFirestore } from 'firebase/firestore';

/**
 * Add a new story
 * @param {Object} storyData - Story data
 * @returns {Promise<Object>} - The created story with ID
 */
export const addStory = async (storyData) => {
  try {
    // Add story to stories collection
    const storyRef = await addDoc(collection(db, 'stories'), {
      ...storyData,
      timestamp: serverTimestamp()
    });
    
    // Add to user's stories subcollection
    await addDoc(collection(db, `users/${storyData.userId}/stories`), {
      storyId: storyRef.id,
      timestamp: serverTimestamp()
    });
    
    // Also add to feed collection for discovery
    await addDoc(collection(db, 'feed'), {
      type: 'story',
      storyId: storyRef.id,
      userId: storyData.userId,
      displayName: storyData.userDisplayName,
      photoUrl: storyData.photoUrl,
      userPhotoURL: storyData.userPhotoURL,
      caption: storyData.caption,
      timestamp: serverTimestamp(),
      likes: 0
    });
    
    return { id: storyRef.id, ...storyData };
  } catch (error) {
    console.error('Error adding story:', error);
    throw error;
  }
};

/**
 * Get stories for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of stories
 */
export const getUserStories = async (userId) => {
  try {
    const storiesQuery = query(
      collection(db, 'stories'),
      where('userId', '==', userId),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt'),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(storiesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting user stories:', error);
    throw error;
  }
};

/**
 * Get recent stories from all users
 * @param {number} limitCount - Number of stories to return
 * @returns {Promise<Array>} - Array of stories
 */
export const getRecentStories = async (limitCount = 20) => {
  try {
    const storiesQuery = query(
      collection(db, 'stories'),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(storiesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting recent stories:', error);
    throw error;
  }
};

/**
 * Delete a story
 * @param {string} storyId - Story ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<void>}
 */
export const deleteStory = async (storyId, userId) => {
  try {
    
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);
    
    if (!storySnap.exists()) {
      throw new Error('Story not found');
    }
    
    const storyData = storySnap.data();
    
   
    if (storyData.userId !== userId) {
      throw new Error('Unauthorized to delete this story');
    }
    
    
    await deleteDoc(storyRef);
    
   
    const feedQuery = query(
      collection(db, 'feed'),
      where('storyId', '==', storyId)
    );
    
    const feedSnapshot = await getDocs(feedQuery);
    
    
    const deletePromises = feedSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    
    const userStoryQuery = query(
      collection(db, `users/${userId}/stories`),
      where('storyId', '==', storyId)
    );
    
    const userStorySnapshot = await getDocs(userStoryQuery);
    
    
    const deleteUserStoryPromises = userStorySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteUserStoryPromises);
    
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

/**
 * Get feed items
 * @param {number} limitCount - Number of items to return
 * @returns {Promise<Array>} - Array of feed items
 */
export const getFeedItems = async (limitCount = 20) => {
  try {
    const feedQuery = query(
      collection(db, 'feed'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(feedQuery);
    
    const feedItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    
    const enrichedPosts = await Promise.all(feedItems.map(async (post) => {
      if (!post.userId) return post;
      
      try {
        
        const userDoc = await getDoc(doc(db, 'users', post.userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            ...post,
            userDisplayName: post.userDisplayName || userData.displayName || 'User',
            userPhotoURL: post.userPhotoURL || userData.photoURL,
            streak: userData.streak || 0
          };
        }
      } catch (err) {
        console.error(`Error getting user data for post ${post.id}:`, err);
      }
      
      return post;
    }));
    
    return enrichedPosts;
  } catch (error) {
    console.error('Error getting feed items:', error);
    throw error;
  }
};

/**
 * Toggle like on a feed item
 * @param {string} feedItemId - Feed item ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether the item is liked after toggle
 */
export const toggleLike = async (feedItemId, userId) => {
  try {
    
    const likeRef = doc(db, `feed/${feedItemId}/likes`, userId);
    const likeSnap = await getDoc(likeRef);
    
    const feedItemRef = doc(db, 'feed', feedItemId);
    const feedItemSnap = await getDoc(feedItemRef);
    
    if (!feedItemSnap.exists()) {
      throw new Error('Feed item not found');
    }
    
    const currentLikes = feedItemSnap.data().likes || 0;
    
    if (likeSnap.exists()) {
      
      await deleteDoc(likeRef);
      
      
      await updateDoc(feedItemRef, {
        likes: Math.max(0, currentLikes - 1)
      });
      
      return false;
    } else {
     
      await setDoc(likeRef, {
        userId,
        timestamp: serverTimestamp()
      });
      
      
      await updateDoc(feedItemRef, {
        likes: currentLikes + 1
      });
      
      return true;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

/**
 * Check if user has liked a feed item
 * @param {string} feedItemId - Feed item ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether the user has liked the item
 */
export const checkIfLiked = async (feedItemId, userId) => {
  try {
    const likeRef = doc(db, `feed/${feedItemId}/likes`, userId);
    const likeSnap = await getDoc(likeRef);
    
    return likeSnap.exists();
  } catch (error) {
    console.error('Error checking if liked:', error);
    throw error;
  }
};

/**
 * Get trending users based on streak or like count
 * @param {number} limitCount - Number of users to return
 * @returns {Promise<Array>} - Array of trending users
 */
export const getTrendingUsers = async (limitCount = 5) => {
  try {
    // Query all users
    const usersQuery = query(
      collection(db, 'users'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(usersQuery);
    
    // For development/testing, assign random streaks to make UI more interesting
    const streakValues = [53, 34, 21, 13, 8, 5];
    
    // Map users and assign random streak values
    const users = snapshot.docs.map((doc, index) => ({
      id: doc.id,
      displayName: doc.data().displayName || 'User',
      photoURL: doc.data().photoURL,
      // Use assigned streak values or fallback to actual data
      streak: streakValues[index] || doc.data().fitnessStats?.streak || 0
    })).sort((a, b) => b.streak - a.streak);
    
    return users;
  } catch (error) {
    console.error('Error getting trending users:', error);
    throw error;
  }
};

/**
 * Like or unlike a post
 * @param {string} userId - The ID of the user liking/unliking the post
 * @param {string} postId - The ID of the post being liked/unliked
 * @returns {Promise<{liked: boolean}>} - Whether the post is now liked or unliked
 */
export const togglePostLike = async (userId, postId) => {
  if (!userId || !postId) {
    throw new Error('User ID and Post ID are required');
  }

  const db = getFirestore();
  const postRef = doc(db, 'feed', postId);
  const likeRef = doc(db, 'postLikes', `${userId}_${postId}`);

  try {
  
    const likeDoc = await getDoc(likeRef);
    
    
    return await runTransaction(db, async (transaction) => {
     
      const postDoc = await transaction.get(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const currentLikes = postDoc.data().likes || 0;
      
      if (likeDoc.exists()) {
       
        transaction.delete(likeRef);
        transaction.update(postRef, { 
          likes: Math.max(0, currentLikes - 1)
        });
        return { liked: false };
      } else {
      
        transaction.set(likeRef, { 
          userId,
          postId,
          timestamp: serverTimestamp() 
        });
        transaction.update(postRef, { 
          likes: currentLikes + 1
        });
        return { liked: true };
      }
    });
  } catch (error) {
    console.error("Error toggling post like:", error);
    throw error;
  }
};

/**
 * Check if a user has liked a post
 * @param {string} userId - The ID of the user
 * @param {string} postId - The ID of the post
 * @returns {Promise<boolean>} - Whether the user has liked the post
 */
export const hasUserLikedPost = async (userId, postId) => {
  if (!userId || !postId) return false;
  
  const db = getFirestore();
  const likeRef = doc(db, 'postLikes', `${userId}_${postId}`);
  
  try {
    const likeDoc = await getDoc(likeRef);
    return likeDoc.exists();
  } catch (error) {
    console.error("Error checking if user liked post:", error);
    return false;
  }
};

/**
 * Get users who liked a post
 * @param {string} postId - The ID of the post
 * @param {number} limit - Maximum number of users to retrieve
 * @returns {Promise<Array>} - Array of user data who liked the post
 */
export const getPostLikes = async (postId, limit = 10) => {
  if (!postId) return [];
  
  const db = getFirestore();
  const likesRef = collection(db, 'postLikes');
  const q = query(
    likesRef,
    where('postId', '==', postId),
    orderBy('timestamp', 'desc'),
    limit(limit)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    const userIds = querySnapshot.docs.map(doc => doc.data().userId);
    
    
    const userPromises = userIds.map(userId => {
      const userRef = doc(db, 'users', userId);
      return getDoc(userRef);
    });
    
    const userDocs = await Promise.all(userPromises);
    
    return userDocs
      .filter(userDoc => userDoc.exists())
      .map(userDoc => ({
        id: userDoc.id,
        ...userDoc.data()
      }));
  } catch (error) {
    console.error("Error getting post likes:", error);
    return [];
  }
};

/**
 * Add a comment to a post
 * @param {string} userId - The ID of the user adding the comment
 * @param {string} postId - The ID of the post being commented on
 * @param {string} content - The comment content
 * @returns {Promise<Object>} - The newly created comment
 */
export const addComment = async (userId, postId, content) => {
  if (!userId || !postId || !content.trim()) {
    throw new Error('User ID, Post ID, and comment content are required');
  }

  const db = getFirestore();
  const commentsRef = collection(db, 'postComments');
  
  try {
   
    const newCommentRef = doc(commentsRef);
    const commentData = {
      id: newCommentRef.id,
      postId,
      userId,
      content,
      timestamp: serverTimestamp(),
      likes: 0
    };
    
    
    await setDoc(newCommentRef, commentData);
    
   
    try {
      const postRef = doc(db, 'feed', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const currentCommentCount = postDoc.data().commentCount || 0;
        await updateDoc(postRef, { 
          commentCount: currentCommentCount + 1 
        });
      }
    } catch (updateError) {
      console.error("Error updating comment count:", updateError);
      
    }
    
    return {
      ...commentData,
      timestamp: new Date() 
    };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

/**
 * Get comments for a post
 * @param {string} postId - The ID of the post
 * @param {number} limitCount - Maximum number of comments to retrieve
 * @returns {Promise<Array>} - Array of comments with user data
 */
export const getPostComments = async (postId, limitCount = 10) => {
  if (!postId) return [];
  
  const db = getFirestore();
  const commentsRef = collection(db, 'postComments');
  
  
  const q = query(
    commentsRef,
    where('postId', '==', postId),
    limit(limitCount)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    
   
    const comments = querySnapshot.docs
      .map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
      .sort((a, b) => {
       
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB - timeA;
      });
    
    
    const userIds = [...new Set(comments.map(comment => comment.userId))];
    const userPromises = userIds.map(userId => {
      const userRef = doc(db, 'users', userId);
      return getDoc(userRef);
    });
    
    const userDocs = await Promise.all(userPromises);
    const users = {};
    
    userDocs.forEach(userDoc => {
      if (userDoc.exists()) {
        users[userDoc.id] = {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
    });
    
    
    return comments.map(comment => ({
      ...comment,
      user: users[comment.userId] || null
    }));
  } catch (error) {
    console.error("Error getting post comments:", error);
    return [];
  }
};

/**
 * Delete a comment
 * @param {string} userId - The ID of the user deleting the comment
 * @param {string} commentId - The ID of the comment to delete
 * @param {string} postId - The ID of the post the comment belongs to
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export const deleteComment = async (userId, commentId, postId) => {
  if (!userId || !commentId || !postId) {
    throw new Error('User ID, Comment ID, and Post ID are required');
  }

  const db = getFirestore();
  const commentRef = doc(db, 'postComments', commentId);
  const postRef = doc(db, 'feed', postId);
  
  try {
    
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = commentDoc.data();
    
    
    if (commentData.userId !== userId) {
      throw new Error('You do not have permission to delete this comment');
    }
    
    return await runTransaction(db, async (transaction) => {
      
      const postDoc = await transaction.get(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const currentCommentCount = postDoc.data().commentCount || 0;
      
      
      transaction.delete(commentRef);
      transaction.update(postRef, { 
        commentCount: Math.max(0, currentCommentCount - 1) 
      });
      
      return true;
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}; 