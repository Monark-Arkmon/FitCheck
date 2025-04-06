import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { likeCheckIn } from '../../services/fitnessService';
import { formatDistanceToNow } from 'date-fns';
import '../../styles/CheckInCard.css';
import PhotoIcon from '@mui/icons-material/Photo';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

const CheckInCard = ({ checkIn, isInFeed = false }) => {
  const [likes, setLikes] = useState(checkIn.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();
  
  // Format the timestamp
  const formattedTime = checkIn.timestamp 
    ? formatDistanceToNow(new Date(checkIn.timestamp), { addSuffix: true })
    : 'recently';
  
  // Handle like button click
  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      setError('');
      const result = await likeCheckIn(currentUser.uid, checkIn.id);
      
      if (result.liked) {
        setLikes(prev => prev + 1);
        setIsLiked(true);
      } else {
        setLikes(prev => prev - 1);
        setIsLiked(false);
      }
    } catch (err) {
      console.error('Error liking check-in:', err);
      setError('Failed to like. Please try again.');
    }
  };

  const getActivityColor = (activityType) => {
    switch (activityType) {
      case 'Currently working out':
        return '#4caf50';
      case 'Worked out earlier':
        return '#2196f3';
      case 'Planning to workout':
        return '#9c27b0';
      case 'Rest day':
        return '#ff9800';
      case 'Other':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  };
  
  // Determine if check-in is private
  const isPrivate = checkIn.visibility === 'private';
  
  return (
    <div className="card-container">
      {error && <div className="error-text">{error}</div>}
      
      <div className="card-header">
        {isInFeed && checkIn.user && (
          <div className="user-info">
            <div className="user-avatar">
              {checkIn.user.displayName?.[0] || 'U'}
            </div>
            <span className="user-name">{checkIn.user.displayName}</span>
            {checkIn.user.streak > 0 && (
              <span className="streak-badge">
                🔥 {checkIn.user.streak}
              </span>
            )}
          </div>
        )}
        
        <div className="header-right">
          {/* Visibility indicator */}
          {currentUser && currentUser.uid === checkIn.userId && (
            <div className={`visibility-badge ${isPrivate ? 'private' : 'public'}`} title={isPrivate ? 'Private check-in (only visible to you)' : 'Public check-in'}>
              {isPrivate ? <LockIcon fontSize="small" /> : <PublicIcon fontSize="small" />}
              <span className="visibility-text">{isPrivate ? 'Private' : 'Public'}</span>
            </div>
          )}
          
          <div 
            className="activity-badge" 
            style={{ backgroundColor: getActivityColor(checkIn.activityType) }}
          >
            {checkIn.activityType}
          </div>
        </div>
      </div>
      
      {checkIn.note && (
        <p className="note-text">{checkIn.note}</p>
      )}
      
      <div className="card-footer">
        <span className="time-stamp">
          {formattedTime}
          {checkIn.photoUrl && (
            <span className="photo-indicator">
              <PhotoIcon fontSize="small" style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            </span>
          )}
        </span>
        
        {isInFeed && (
          <div className="action-buttons">
            <button className={`like-button ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
              {isLiked ? '❤️' : '🤍'} {likes > 0 && likes}
            </button>
            <button className="share-button">🔗</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInCard; 