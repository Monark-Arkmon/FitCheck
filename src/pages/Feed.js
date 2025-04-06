import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getFeedItems, getTrendingUsers, togglePostLike, hasUserLikedPost } from '../services/socialService';
import { getAvailableTags, getUserProfileImage } from '../services/fitnessService';
import CommentSection from '../components/social/CommentSection';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CommentIcon from '@mui/icons-material/Comment';
import FilterListIcon from '@mui/icons-material/FilterList';
import { formatDistanceToNow } from 'date-fns';
import '../styles/PageStyles.css';
import '../styles/Feed.css';

// Material UI Icons
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';

const Feed = () => {
  const { currentUser } = useAuth();
  const { darkMode, theme } = useTheme();
  
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewedStory, setViewedStory] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [likedPosts, setLikedPosts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Story carousel specific states
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progressState, setProgressState] = useState([]);
  const scrollRef = useRef(null);
  const progressInterval = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  const [newTagInput, setNewTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [tagError, setTagError] = useState('');
  
  // Define fetchFeedData function
  const fetchFeedData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Get posts for feed
      const feedPosts = await getFeedItems(20, forceRefresh);
      
      // Sort posts by timestamp in descending order
      const sortedPosts = [...feedPosts].sort((a, b) => {
        // Handle potential null/undefined timestamps
        if (!a.timestamp) return 1;  // null timestamps go to the end
        if (!b.timestamp) return -1;
        
        // Sort by timestamp descending (newest first)
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      console.log(`Sorted ${sortedPosts.length} feed posts by timestamp`);
      
      setPosts(sortedPosts);
      setFilteredPosts(sortedPosts);
      
      // Get recent users with stories - use a simpler query to avoid index requirements
      try {
        // Try a simpler query without the composite index
        const storiesQuery = query(
          collection(db, 'stories'),
          orderBy('timestamp', 'desc'),
          limit(15)
        );
        
        const storiesSnapshot = await getDocs(storiesQuery);
        const recentStories = storiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        
        // Process stories into user format for carousel
        const userMap = new Map();
        
        // Group stories by users
        recentStories.forEach(story => {
          // Make sure to use processed userPhotoURL from the story data
          const photoURL = story.userPhotoURL || getUserProfileImage({
            photoURL: story.userPhotoURL,
            displayName: story.userDisplayName || 'User'
          });
          
          if (!userMap.has(story.userId)) {
            userMap.set(story.userId, {
              id: story.userId,
              displayName: story.userDisplayName || 'User',
              photoURL: photoURL,
              hasUnseenStory: true,
              stories: []
            });
          }
          
          userMap.get(story.userId).stories.push({
            ...story,
            userPhotoURL: photoURL // Ensure each individual story has the processed photoURL
          });
        });
        
        // Convert Map to Array
        setStories(Array.from(userMap.values()));
      } catch (storyError) {
        console.error('Error getting stories:', storyError);
        // Continue without stories if there's an error
        setStories([]);
      }
      
      // Get trending users based on streak
      try {
        const trendingData = await getTrendingUsers(5);
        setTrendingUsers(trendingData);
      } catch (trendingError) {
        console.error('Error getting trending users:', trendingError);
        setTrendingUsers([]);
      }
      
      // Fetch available tags
      const tags = await getAvailableTags();
      setAvailableTags(tags);
      
      // If no posts, show message
      if (sortedPosts.length === 0) {
        setError('No posts found in your feed yet.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error fetching feed data:', err);
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get feed data
  useEffect(() => {
    fetchFeedData();
  }, []);
  
  // Filter posts when selected tags change
  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => {
        // If post has no tags, don't include in filtered results when tags are selected
        if (!post.tags || post.tags.length === 0) return false;
        
        // Check if any of the post's tags match the selected tags
        return post.tags.some(tag => selectedTags.includes(tag));
      });
      setFilteredPosts(filtered);
    }
  }, [selectedTags, posts]);
  
  // Story carousel specific functions
  useEffect(() => {
    if (viewedStory && viewedStory.stories && viewedStory.stories.length > 0) {
      // Initialize progress state when story is opened
      setProgressState(viewedStory.stories.map((_, i) => i === 0 ? 0 : -1));
      
      // Start progress animation for first story
      startProgressAnimation(0);
    }
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [viewedStory]);
  
  // Add drag event handlers for the carousel
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;
    
    const handleMouseDown = (e) => {
      isDragging.current = true;
      startX.current = e.pageX - slider.offsetLeft;
      scrollLeft.current = slider.scrollLeft;
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    
    const handleMouseLeave = () => {
      isDragging.current = false;
    };
    
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX.current) * 2; // Scroll speed multiplier
      slider.scrollLeft = scrollLeft.current - walk;
    };
    
    // Touch events
    const handleTouchStart = (e) => {
      isDragging.current = true;
      startX.current = e.touches[0].pageX - slider.offsetLeft;
      scrollLeft.current = slider.scrollLeft;
    };
    
    const handleTouchMove = (e) => {
      if (!isDragging.current) return;
      const x = e.touches[0].pageX - slider.offsetLeft;
      const walk = (x - startX.current) * 2;
      slider.scrollLeft = scrollLeft.current - walk;
    };
    
    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mouseleave', handleMouseLeave);
    slider.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mousemove', handleMouseMove);
    
    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchend', handleMouseUp);
    slider.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mousemove', handleMouseMove);
      
      slider.removeEventListener('touchstart', handleTouchStart);
      slider.removeEventListener('touchend', handleMouseUp);
      slider.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
  
  const startProgressAnimation = (index) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    let progress = 0;
    setCurrentStoryIndex(index);
    
    setProgressState(prev => 
      prev.map((p, i) => i === index ? 0 : i < index ? 100 : -1)
    );
    
    progressInterval.current = setInterval(() => {
      progress += 1;
      
      setProgressState(prev => 
        prev.map((p, i) => i === index ? progress : p)
      );
      
      if (progress >= 100) {
        clearInterval(progressInterval.current);
        
        // Go to next story if available
        if (viewedStory?.stories && index < viewedStory.stories.length - 1) {
          startProgressAnimation(index + 1);
        } else {
          // Close the story view when all stories are viewed
          setTimeout(() => closeStory(), 300);
        }
      }
    }, 30); // ~3 seconds for full progress
  };
  
  const handleStoryClick = (storyUser) => {
    setStoryLoading(true);
    
    // Simulate loading a story
    setTimeout(() => {
      setViewedStory(storyUser);
      setStoryLoading(false);
      
      // Mark as seen after viewing
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === storyUser.id 
            ? { ...story, hasUnseenStory: false }
            : story
        )
      );
    }, 800);
  };
  
  const closeStory = () => {
    setViewedStory(null);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };
  
  const navigateToPrevStory = (e) => {
    e.stopPropagation();
    if (currentStoryIndex > 0) {
      startProgressAnimation(currentStoryIndex - 1);
    }
  };
  
  const navigateToNextStory = (e) => {
    e.stopPropagation();
    if (viewedStory?.stories && currentStoryIndex < viewedStory.stories.length - 1) {
      startProgressAnimation(currentStoryIndex + 1);
    } else {
      closeStory();
    }
  };
  
  const formatStoryTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const storyTime = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const diffMinutes = Math.floor((now - storyTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };
  
  const handleLikePost = async (postId) => {
    if (!currentUser) return;
    
    try {
      const result = await togglePostLike(currentUser.uid, postId);
      
      // Update the UI state
      setLikedPosts(prev => ({
        ...prev,
        [postId]: result.liked
      }));
      
      // Update the post like count in the UI
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes: result.liked 
                  ? (post.likes || 0) + 1 
                  : Math.max(0, (post.likes || 0) - 1)
              }
            : post
        )
      );
      
      // Also update filtered posts
      setFilteredPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes: result.liked 
                  ? (post.likes || 0) + 1 
                  : Math.max(0, (post.likes || 0) - 1)
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return `${diffSec}s`;
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    
    return date.toLocaleDateString();
  };
  
  const refreshData = () => {
    setLoading(true);
    setError('');
    
    // Refetch data with force refresh option
    fetchFeedData(true);
  };
  
  // Toggle comment section visibility
  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  
  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };
  
  // Add this useEffect to load initial like status for all posts
  useEffect(() => {
    const loadLikeStatus = async () => {
      if (!currentUser || posts.length === 0) return;
      
      const likeStatusPromises = posts.map(post => 
        hasUserLikedPost(currentUser.uid, post.id)
      );
      
      try {
        const likeResults = await Promise.all(likeStatusPromises);
        
        const newLikedPosts = {};
        posts.forEach((post, index) => {
          newLikedPosts[post.id] = likeResults[index];
        });
        
        setLikedPosts(newLikedPosts);
      } catch (error) {
        console.error('Error loading like status:', error);
      }
    };
    
    loadLikeStatus();
  }, [currentUser, posts]);
  
  // Handle adding a custom tag
  const handleAddCustomTag = async (e) => {
    e.preventDefault();
    
    if (!newTagInput.trim()) {
      setTagError('Tag cannot be empty');
      return;
    }
    
    setAddingTag(true);
    setTagError('');
    
    try {
      // Custom tag functionality has been removed in the new version
      setTagError('Adding custom tags is not available in this version');
      setTimeout(() => setTagError(''), 3000);
      setNewTagInput('');
    } catch (error) {
      console.error('Error handling tag:', error);
      setTagError('Failed to process tag request.');
    } finally {
      setAddingTag(false);
    }
  };
  
  const getActivityDescription = (activityType) => {
    const activityMap = {
      'cardio': 'completed a cardio session',
      'strength training': 'crushed a strength training workout',
      'yoga': 'finished a yoga session',
      'hiking': 'went on a hike',
      'running': 'went for a run',
      'swimming': 'completed a swim session',
      'cycling': 'went cycling',
      'HIIT': 'completed a high-intensity interval training',
      'pilates': 'finished a pilates session',
      'crossfit': 'crushed a crossfit workout',
      'boxing': 'completed a boxing session',
      'climbing': 'went rock climbing',
      'currently working out': 'is currently working out',
      'worked out earlier': 'worked out earlier today',
      'skipping today': 'is taking a rest day'
    };
    
    return activityMap[activityType.toLowerCase()] || `did some ${activityType.toLowerCase()}`;
  };
  
  return (
    <div className={`page-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="page-header">
        <h1 className="page-title">Feed</h1>
        <button className="primary-button" onClick={refreshData}>
          <RefreshIcon />
          Refresh
        </button>
      </div>
      
      <div className="two-column-layout">
        <div className="scrollable-posts main-content">
          {/* Stories */}
          <div className={`content-card ${darkMode ? 'dark-mode' : ''}`}>
            {/* Inline Stories Carousel */}
            <div className="stories-container">
              <div className="stories-scroll-container drag-scroll" ref={scrollRef}>
                {/* Story Items */}
                {stories && stories.length > 0 ? (
                  stories.map(story => (
                    <div 
                      key={story.id} 
                      className="story-item"
                      onClick={() => handleStoryClick(story)}
                    >
                      <div className={`story-border ${story.hasUnseenStory ? 'active' : ''} ${darkMode ? 'dark-mode' : ''}`}>
                        <div className={`story-avatar ${darkMode ? 'dark-mode' : ''}`}>
                          <img 
                            src={story.photoURL || getUserProfileImage(story)} 
                            alt={story.displayName} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.displayName || 'User')}&background=6A6AE3&color=fff`;
                            }}
                          />
                        </div>
                      </div>
                      <div className={`story-username ${darkMode ? 'dark-mode' : ''}`}>{story.displayName}</div>
                    </div>
                  ))
                ) : (
                  <div className={`empty-stories ${darkMode ? 'dark-mode' : ''}`}>
                    No stories yet
                  </div>
                )}
              </div>
            </div>
            {/* End of Inline Stories Carousel */}
          </div>
        
          {/* Feed Posts - now directly using post-card class instead of styled component */}
          {loading ? (
            <div className={`loading-container ${darkMode ? 'dark-mode' : ''}`}>
              <CircularProgress style={{ color: darkMode ? '#e0e8ff' : '#6A6AE3' }} />
              <div className="loading-text">Loading feed...</div>
            </div>
          ) : error ? (
            <div className={`post-card ${darkMode ? 'dark-mode' : ''}`}>
              <div className="error-message">{error}</div>
              <button className="primary-button" onClick={refreshData}>
                Try Again
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className={`post-card ${darkMode ? 'dark-mode' : ''}`}>
              <div className="empty-state">
                <div className="empty-state-icon">
                  <AccessTimeIcon fontSize="inherit" />
                </div>
                <div className="empty-state-text">No posts yet.</div>
                <p className="section-subtitle">
                  {selectedTags.length > 0 
                    ? 'No posts match the selected tags. Try selecting different tags or clear the filter.'
                    : 'Follow users or create your first check-in!'
                  }
                </p>
              </div>
            </div>
          ) : (
            filteredPosts.map(post => (
              <div className={`post-card ${darkMode ? 'dark-mode' : ''}`} key={post.id}>
                <div className="post-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      <img 
                        src={getUserProfileImage(post)} 
                        alt={post.userDisplayName || 'User'} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userDisplayName || 'User')}&background=6A6AE3&color=fff`;
                        }}
                      />
                    </div>
                    <div className="user-details">
                      <div className="username">{post.userDisplayName || post.userId || 'User'}</div>
                      <div className="post-time">
                        <AccessTimeIcon style={{ fontSize: '12px', marginRight: '4px' }} />
                        {post.timestamp ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true }) : 'Recently'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {post.photoUrl && (
                  <div className="post-image">
                    <img src={post.photoUrl} alt="Post" />
                  </div>
                )}
                
                <div className="post-content">
                  <div className="activity-tag">{post.activityType || 'Activity'}</div>
                  <div className="post-description">
                    {post.note || post.description || post.content || 
                      (post.activityType ? 
                        `${post.userDisplayName || 'User'} ${getActivityDescription(post.activityType)}` : 
                        `${post.userDisplayName || 'User'} shared a fitness update`)}
                  </div>
                  
                  {/* Post tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map(tag => (
                        <span key={tag} className="post-tag" onClick={() => toggleTag(tag)}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="post-actions">
                  <button 
                    className={`action-button like-button ${likedPosts[post.id] ? 'liked' : ''}`}
                    onClick={() => handleLikePost(post.id)}
                  >
                    {likedPosts[post.id] ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    {post.likes > 0 && post.likes}
                  </button>
                  <button 
                    className="action-button"
                    onClick={() => toggleComments(post.id)}
                  >
                    <CommentIcon />
                    {post.commentCount > 0 && post.commentCount}
                  </button>
                </div>
                
                {/* Comment section - only shown when expanded */}
                {expandedComments[post.id] && (
                  <CommentSection 
                    postId={post.id}
                    darkMode={darkMode}
                  />
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Trending sidebar - now fixed when scrolling */}
        <div className="fixed-sidebar sidebar">
          <div className={`content-card ${darkMode ? 'dark-mode' : ''}`}>
            <div className="section-title">
              <WhatshotIcon style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Trending
            </div>
            
            {trendingUsers.length > 0 ? (
              <div className="trending-list">
                {trendingUsers.map(user => (
                  <div key={user.id} className="trending-user">
                    <div className="user-avatar small">
                      <img 
                        src={getUserProfileImage(user)} 
                        alt={user.displayName} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=6A6AE3&color=fff`;
                        }}
                      />
                      {user.streak >= 7}
                    </div>
                    <div className="user-details">
                      <div className="username small">{user.displayName}</div>
                      <div className="streak-info">
                        <EmojiEventsIcon style={{ fontSize: '14px', color: '#f1c40f', marginRight: '4px' }} />
                        {user.streak} day streak
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-trending">
                No trending users yet.
              </div>
            )}
          </div>
          
          {/* Filter section moved below trending */}
          <div className={`content-card filter-card ${darkMode ? 'dark-mode' : ''}`}>
            <div className="filter-header" onClick={toggleFilters}>
              <div className="section-title">
                <FilterListIcon style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Filters
              </div>
              <div className={`filter-toggle ${showFilters ? 'active' : ''}`}>
                {selectedTags.length > 0 && <span className="tag-count">{selectedTags.length}</span>}
              </div>
            </div>
            
            {showFilters && (
              <>
                {availableTags.length > 0 && (
                  <div className={`animated-tag-filters show`}>
                    {availableTags.map(tag => (
                      <button 
                        key={tag}
                        className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                    {selectedTags.length > 0 && (
                      <button 
                        className="tag-filter clear-all"
                        onClick={() => setSelectedTags([])}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
                
                {/* Add custom tag section */}
                <div className="add-custom-tag-section">
                  <form onSubmit={handleAddCustomTag}>
                    <div className="custom-tag-input-container">
                      <input
                        type="text"
                        placeholder="Add a custom tag..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        className={`custom-tag-input ${darkMode ? 'dark-mode' : ''}`}
                        disabled={addingTag}
                      />
                      <button 
                        type="submit" 
                        className={`add-tag-button ${darkMode ? 'dark-mode' : ''}`}
                        disabled={addingTag || !newTagInput.trim()}
                      >
                        {addingTag ? (
                          <CircularProgress size={16} style={{ color: 'inherit' }} />
                        ) : (
                          'Add'
                        )}
                      </button>
                    </div>
                    {tagError && (
                      <div className={`tag-error ${tagError.includes('success') ? 'success' : 'error'}`}>
                        {tagError}
                      </div>
                    )}
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Story Viewer Modal */}
      {viewedStory && (
        <div className="story-modal-overlay" onClick={closeStory}>
          <div className={`story-content ${darkMode ? 'dark-mode' : ''}`} onClick={e => e.stopPropagation()}>
            {/* Progress indicators */}
            <div className="story-progress-container">
              {viewedStory.stories && viewedStory.stories.map((_, index) => (
                <div key={index} className="story-progress-bar">
                  <div 
                    className="story-progress-fill" 
                    style={{ 
                      width: `${progressState[index] > 0 ? progressState[index] : 0}%`,
                      backgroundColor: progressState[index] === 100 ? 'white' : 'white'
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Story header */}
            <div className="story-header">
              <div className="story-user-info">
                <div className="story-user-avatar">
                  <img 
                    src={viewedStory.photoURL || getUserProfileImage(viewedStory)} 
                    alt={viewedStory.displayName} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewedStory.displayName || 'User')}&background=6A6AE3&color=fff`;
                    }}
                  />
                </div>
                <div>
                  <div className="story-user-name">{viewedStory.displayName}</div>
                  {viewedStory.stories && viewedStory.stories[currentStoryIndex] && (
                    <div className="story-time">
                      {formatStoryTime(viewedStory.stories[currentStoryIndex].timestamp)}
                    </div>
                  )}
                </div>
              </div>
              <button className="story-close-button" onClick={closeStory}>
                <CloseIcon />
              </button>
            </div>
            
            {/* Story image container */}
            <div className="story-image-container">
              {viewedStory.stories && viewedStory.stories.length > 0 ? (
                <>
                  <img 
                    className="story-image"
                    src={viewedStory.stories[currentStoryIndex]?.photoUrl || 'https://via.placeholder.com/600x900?text=Story'} 
                    alt="Story" 
                  />
                  {viewedStory.stories[currentStoryIndex]?.caption && (
                    <div className="story-caption">
                      {viewedStory.stories[currentStoryIndex].caption}
                    </div>
                  )}
                  
                  {/* Navigation overlay */}
                  <div className="story-navigation">
                    <div className="story-prev" onClick={navigateToPrevStory}></div>
                    <div className="story-next" onClick={navigateToNextStory}></div>
                  </div>
                </>
              ) : (
                <div className="story-caption">
                  No stories available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {storyLoading && (
        <div className="story-loading-overlay">
          <CircularProgress color="inherit" />
        </div>
      )}
    </div>
  );
};

export default Feed; 