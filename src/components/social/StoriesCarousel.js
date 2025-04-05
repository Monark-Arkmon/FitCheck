import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import '../../styles/StoriesCarousel.css';

/**
 * A reusable Instagram-like stories carousel component
 * 
 * @param {Object} props
 * @param {Array} props.stories - Array of story objects with id, displayName, photoURL, hasUnseenStory
 * @param {Function} props.onStoryClick - Function called when a story is clicked
 * @param {Function} props.onAddStoryClick - Function called when the "Add Story" button is clicked
 * @param {boolean} props.showAddStory - Whether to show the "Add Story" button
 */
const StoriesCarousel = ({ 
  stories, 
  onStoryClick,
  onAddStoryClick,
  showAddStory = true
}) => {
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  const [viewedStory, setViewedStory] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progressState, setProgressState] = useState([]);
  const scrollRef = useRef(null);
  const progressInterval = useRef(null);
  
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
    if (onStoryClick) {
      onStoryClick(storyUser);
    } else {
      // Default handling if no custom handler provided
      setStoryLoading(true);
      
      // Simulate loading a story
      setTimeout(() => {
        setViewedStory(storyUser);
        setStoryLoading(false);
        
        // Mark as seen (this would be handled by your app logic in a real app)
        storyUser.hasUnseenStory = false;
      }, 800);
    }
  };
  
  const handleAddStoryClick = () => {
    if (onAddStoryClick) {
      onAddStoryClick();
    } else {
      console.log("Add story clicked - implement your handler");
    }
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
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -200 : 200;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
  
  return (
    <div className={`stories-container ${darkMode ? 'dark-mode' : ''}`}>      
      <div className="stories-scroll-container" ref={scrollRef}>
        {/* Add Story Item - conditionally rendered */}
        {showAddStory && (
          <div className="add-story-item" onClick={handleAddStoryClick}>
            <div className={`add-story-border ${darkMode ? 'dark-mode' : ''}`}>
              <div className={`add-story-avatar ${darkMode ? 'dark-mode' : ''}`}>
                <img 
                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'U')}&background=random`} 
                  alt={currentUser?.displayName} 
                />
                <div className={`add-story-icon ${darkMode ? 'dark-mode' : ''}`}>
                  <AddIcon style={{ fontSize: '16px' }}/>
                </div>
              </div>
            </div>
            <div className={`add-story-label ${darkMode ? 'dark-mode' : ''}`}>Add story</div>
          </div>
        )}
        
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
                    src={story.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.displayName)}&background=random`} 
                    alt={story.displayName} 
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
        
        {/* Scroll navigation buttons - only show if overflowing */}
        {stories && stories.length > 5 && (
          <>
            <button 
              className={`stories-nav-button stories-nav-prev ${darkMode ? 'dark-mode' : ''}`}
              onClick={() => scroll('left')}
            >
              <ArrowBackIosNewIcon style={{ fontSize: '14px' }} />
            </button>
            <button 
              className={`stories-nav-button stories-nav-next ${darkMode ? 'dark-mode' : ''}`}
              onClick={() => scroll('right')}
            >
              <ArrowForwardIosIcon style={{ fontSize: '14px' }} />
            </button>
          </>
        )}
      </div>
      
      {/* Story viewing modal - only shown if no custom handler */}
      {viewedStory && !onStoryClick && (
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
                    src={viewedStory.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewedStory.displayName)}&background=random`} 
                    alt={viewedStory.displayName} 
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
      
      {/* Loading overlay - only shown if no custom handler */}
      {!onStoryClick && storyLoading && (
        <div className="story-loading-overlay">
          <CircularProgress color="inherit" />
        </div>
      )}
    </div>
  );
};

export default StoriesCarousel; 