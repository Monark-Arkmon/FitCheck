import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addCheckIn } from '../../services/fitnessService';
import PhotoUploader from './PhotoUploader';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import '../../styles/ManualCheckInModal.css';

const ACTIVITY_TYPES = [
  'Currently working out',
  'Worked out earlier',
  'Planning to workout',
  'Rest day',
  'Other'
];

const PREDEFINED_TAGS = [
  'cardio', 'strength', 'flexibility', 'hiit', 'yoga', 'running',
  'cycling', 'swimming', 'weightlifting', 'crossfit', 'fitness',
  'workout', 'training', 'motivation', 'gym', 'health', 'wellness',
  'exercise', 'gains', 'fitnessmotivation'
];

const ManualCheckInModal = ({ onClose, darkMode, onCheckInComplete }) => {
  const { currentUser } = useAuth();
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [photoStatus, setPhotoStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleModalClose = (e) => {
    if (photoStatus?.status === 'uploading') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    onClose();
  };
  
  const handlePhotoUploaded = (statusUpdate) => {
    console.log('Photo status update:', statusUpdate);
    
    if (statusUpdate.status === 'uploading') {
      setPhotoStatus({status: 'uploading', progress: statusUpdate.progress});
      setUploadProgress(statusUpdate.progress);
    } 
    else if (statusUpdate.status === 'complete') {
      setPhotoUrl(statusUpdate.url);
      setPhotoStatus({status: 'complete', url: statusUpdate.url});
    }
    else if (statusUpdate.status === 'error') {
      setErrorMessage(`Photo upload error: ${statusUpdate.error}`);
      setPhotoStatus({status: 'error', error: statusUpdate.error});
    }
    else if (statusUpdate.status === 'removed') {
      setPhotoUrl(null);
      setPhotoStatus(null);
      setUploadProgress(0);
    }
  };
  
  const handleTagToggle = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };
  
  const canSubmit = () => {
    if (status === 'submitting' || status === 'success') return false;
    if (photoStatus?.status === 'uploading') return false;
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (photoStatus?.status === 'uploading') {
      console.log('Preventing submission during upload');
      setErrorMessage('Please wait for the photo to finish uploading');
      return;
    }
    
    if (!currentUser) {
      setErrorMessage('You must be logged in to check in');
      setStatus('error');
      return;
    }
    
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const checkInData = {
        activityType,
        note: note.trim(),
        tags: [...tags],
        photoUrl,
        timestamp: new Date()
      };
      
      console.log('Submitting check-in:', {
        ...checkInData,
        photoUrl: photoUrl ? '[URL present]' : null
      });
      const result = await addCheckIn(checkInData, currentUser.uid);
      
      console.log('Check-in added successfully:', result);
      setStatus('success');
      if (onCheckInComplete) {
        onCheckInComplete(result);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting check-in:', error);
      setErrorMessage(`Failed to submit check-in: ${error.message || 'Please try again'}`);
      setStatus('error');
    }
  };
  const getButtonText = () => {
    if (status === 'submitting') {
      return (
        <CircularProgress size={24} style={{ color: 'inherit' }} />
      );
    }
    else if (photoStatus?.status === 'uploading') {
      return `Uploading Photo... ${Math.round(uploadProgress)}%`;
    }
    return 'Submit Check-in';
  };
  
  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div 
        className={`modal-content ${darkMode ? 'dark-mode' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
        }} 
      >
        <div className={`modal-header ${darkMode ? 'dark-mode' : ''}`}>
          <h2 className="modal-title">
            <FitnessCenterIcon style={{ marginRight: '8px' }} />
            Manual Check-in
          </h2>
          {photoStatus?.status !== 'uploading' && (
            <button 
              className={`close-button ${darkMode ? 'dark-mode' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleModalClose(e);
              }}
              type="button"
            >
              <CloseIcon />
            </button>
          )}
        </div>
        
        <div className="modal-body">
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
          
          {photoStatus?.status === 'uploading' && (
            <div className={`upload-message ${darkMode ? 'dark-mode' : ''}`}>
              <CircularProgress 
                size={20} 
                variant="determinate" 
                value={uploadProgress} 
                style={{ color: '#6A6AE3', marginRight: '10px' }} 
              />
              <span>Uploading photo: {Math.round(uploadProgress)}%</span>
              <span>Please wait</span>
            </div>
          )}
          
          {status === 'success' ? (
            <div className={`success-message ${darkMode ? 'dark-mode' : ''}`}>
              <CheckIcon style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>Check-in submitted successfully!</div>
            </div>
          ) : (
            <form 
              className="check-in-form"
              onSubmit={handleSubmit} 
              id="check-in-form"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="form-group">
                <label htmlFor="activityType" className={`form-label ${darkMode ? 'dark-mode' : ''}`}>Activity Type</label>
                <select 
                  id="activityType" 
                  value={activityType}
                  onChange={e => setActivityType(e.target.value)}
                  required
                  className={`select-input ${darkMode ? 'dark-mode' : ''}`}
                  disabled={status === 'submitting' || photoStatus?.status === 'uploading'}
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="note" className={`form-label ${darkMode ? 'dark-mode' : ''}`}>Note (optional)</label>
                <textarea 
                  id="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="How was your workout?"
                  rows={3}
                  className={`text-area ${darkMode ? 'dark-mode' : ''}`}
                  disabled={status === 'submitting' || photoStatus?.status === 'uploading'}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="tags" className={`form-label ${darkMode ? 'dark-mode' : ''}`}>Tags (optional)</label>
                <div className={`tag-selector ${darkMode ? 'dark-mode' : ''}`}>
                  {PREDEFINED_TAGS.map((tag) => (
                    <div 
                      key={tag} 
                      className={`tag-chip ${tags.includes(tag) ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''} ${
                        status === 'submitting' || photoStatus?.status === 'uploading' ? 'disabled' : ''
                      }`}
                      onClick={() => {
                        if (status !== 'submitting' && photoStatus?.status !== 'uploading') {
                          handleTagToggle(tag);
                        }
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="photo" className={`form-label ${darkMode ? 'dark-mode' : ''}`}>Photo (optional)</label>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <PhotoUploader 
                    onPhotoUploaded={handlePhotoUploaded}
                    darkMode={darkMode}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={!canSubmit()}
                className={`submit-button ${darkMode ? 'dark-mode' : ''}`}
                form="check-in-form"
              >
                {getButtonText()}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualCheckInModal; 