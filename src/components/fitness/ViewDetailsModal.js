import React, { useState } from 'react';
import { format } from 'date-fns';
import CloseIcon from '@mui/icons-material/Close';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EventIcon from '@mui/icons-material/Event';
import NotesIcon from '@mui/icons-material/Notes';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import CircularProgress from '@mui/material/CircularProgress';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import '../../styles/ViewDetailsModal.css';

const ViewDetailsModal = ({ isOpen, onClose, checkIn, darkMode }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageStatus, setImageStatus] = useState('loading');
  if (!isOpen || !checkIn) {
    return null;
  }
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp instanceof Date 
        ? timestamp 
        : new Date(timestamp);
      
      return format(date, 'MMMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  const toggleFullscreen = (e) => {
    if (e) e.stopPropagation();
    setIsFullscreen(prev => !prev);
  };
  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setImageStatus('loaded');
  };
  const handleImageError = () => {
    console.error('Failed to load image:', checkIn.photoUrl);
    setImageStatus('error');
  };
  
  const notes = checkIn.notes || checkIn.note || '';
  const hasDetails = notes.trim() !== '' || 
                    !!checkIn.photoUrl || 
                    (checkIn.tags && checkIn.tags.length > 0);
  
  // Determine visibility status
  const isPrivate = checkIn.visibility === 'private';
  const visibilityLabel = isPrivate ? 'Private' : 'Public';
  const streakImpact = isPrivate ? 'Does not count towards streak' : 'Counts towards streak';
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${darkMode ? 'dark-mode' : ''}`} onClick={e => e.stopPropagation()}>
        <div className={`modal-header ${darkMode ? 'dark-mode' : ''}`}>
          <h2 className="modal-title">
            <FitnessCenterIcon style={{ marginRight: '8px' }} />
            Check-in Details
          </h2>
          <button className={`close-button ${darkMode ? 'dark-mode' : ''}`} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className={`modal-body ${darkMode ? 'dark-mode' : ''}`}>
          {/* Activity Type */}
          <div className="detail-row">
            <div className={`detail-label ${darkMode ? 'dark-mode' : ''}`}>
              <FitnessCenterIcon />
              Activity
            </div>
            <div className={`detail-value ${darkMode ? 'dark-mode' : ''}`}>
              {checkIn.activityType || 'Not specified'}
            </div>
          </div>
          
          {/* Visibility Status */}
          <div className="detail-row">
            <div className={`detail-label ${darkMode ? 'dark-mode' : ''}`}>
              <VisibilityIcon />
              Visibility
            </div>
            <div className={`detail-value ${darkMode ? 'dark-mode' : ''}`}>
              <div className={`visibility-indicator ${isPrivate ? 'private' : 'public'}`}>
                {isPrivate ? <LockIcon fontSize="small" /> : <PublicIcon fontSize="small" />}
                <span>{visibilityLabel}</span>
              </div>
              <div className="visibility-note">{streakImpact}</div>
            </div>
          </div>
          
          {/* Timestamp */}
          <div className="detail-row">
            <div className={`detail-label ${darkMode ? 'dark-mode' : ''}`}>
              <EventIcon />
              Time
            </div>
            <div className={`detail-value ${darkMode ? 'dark-mode' : ''}`}>
              {formatDate(checkIn.timestamp)}
            </div>
          </div>
          
          {/* Photo */}
          {checkIn.photoUrl ? (
            <div className="photo-section">
              <div className="photo-container">
                {/* Expand button */}
                <button onClick={toggleFullscreen} className={`expand-button ${darkMode ? 'dark-mode' : ''}`}>
                  <ZoomOutMapIcon />
                </button>
                
                {/* Photo with loading/error states */}
                <img 
                  className="check-in-photo"
                  src={checkIn.photoUrl} 
                  alt="Check-in" 
                  onClick={toggleFullscreen}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: imageStatus === 'loaded' ? 'block' : 'none' }}
                />
                
                {/* Loading indicator */}
                {imageStatus === 'loading' && (
                  <div className={`image-loading-state ${darkMode ? 'dark-mode' : ''}`}>
                    <CircularProgress size={40} style={{ color: '#6A6AE3' }} />
                    <div className="loading-text">Loading image...</div>
                  </div>
                )}
                
                {/* Error state */}
                {imageStatus === 'error' && (
                  <div className={`image-error-state ${darkMode ? 'dark-mode' : ''}`}>
                    <BrokenImageIcon style={{ fontSize: 48, marginBottom: 16 }} />
                    <div className="error-text">Failed to load image</div>
                    <div className="error-subtext">The image may be unavailable or the URL is invalid.</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`no-photo-message ${darkMode ? 'dark-mode' : ''}`}>
              No photo available for this check-in
            </div>
          )}
          
          {/* Notes */}
          {notes.trim() !== '' && (
            <div className="detail-row">
              <div className={`detail-label ${darkMode ? 'dark-mode' : ''}`}>
                <NotesIcon />
                Notes
              </div>
              <div className={`detail-value ${darkMode ? 'dark-mode' : ''}`}>{notes}</div>
            </div>
          )}
          
          {/* Tags */}
          {checkIn.tags && checkIn.tags.length > 0 && (
            <div className="detail-row">
              <div className={`detail-label ${darkMode ? 'dark-mode' : ''}`}>
                <LocalOfferIcon />
                Tags
              </div>
              <div className="tags-container">
                {checkIn.tags.map((tag, index) => (
                  <span key={index} className={`tag ${darkMode ? 'dark-mode' : ''}`}>{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          {/* Empty state message if no details */}
          {!hasDetails && (
            <div className={`empty-details ${darkMode ? 'dark-mode' : ''}`}>
              No details were added to this check-in.
            </div>
          )}
        </div>
      </div>
      
      {/* Fullscreen image overlay */}
      {isFullscreen && checkIn.photoUrl && (
        <div className="fullscreen-overlay" onClick={toggleFullscreen}>
          <button onClick={toggleFullscreen} className={`fullscreen-close ${darkMode ? 'dark-mode' : ''}`}>
            <FullscreenExitIcon />
          </button>
          <img 
            className="fullscreen-image"
            src={checkIn.photoUrl} 
            alt="Check-in" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ViewDetailsModal; 