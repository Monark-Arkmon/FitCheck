import React, { useState, useEffect, useRef } from 'react';
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

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' }
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
  const [visibility, setVisibility] = useState(VISIBILITY_OPTIONS[0].value);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);
  const photoUrlRef = useRef(null); // Reference to track the latest photoUrl value
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [photoStatus, setPhotoStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Keep photoUrlRef in sync with the latest photoUrl state
  useEffect(() => {
    photoUrlRef.current = photoUrl;
    console.log('photoUrl state updated:', photoUrl);
  }, [photoUrl]);
  
  // Ensure photoUrl stays in sync with photoStatus when complete
  useEffect(() => {
    if (photoStatus?.status === 'complete' && photoStatus?.url) {
      if (photoUrl !== photoStatus.url) {
        console.log('Synchronizing photoUrl from photoStatus:', photoStatus.url);
        setPhotoUrl(photoStatus.url);
      }
    }
  }, [photoStatus, photoUrl]);
  
  const handleModalClose = (e) => {
    if (photoStatus?.status === 'uploading') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    onClose();
  };
  
  const handlePhotoUploaded = (statusUpdate) => {
    console.log('Photo status update received:', statusUpdate);
    
    if (statusUpdate.status === 'uploading') {
      setPhotoStatus({status: 'uploading', progress: statusUpdate.progress});
      setUploadProgress(statusUpdate.progress);
    } 
    else if (statusUpdate.status === 'complete') {
      console.log('Photo upload complete. Setting URL:', statusUpdate.url);
      // Update both state variables
      setPhotoUrl(statusUpdate.url);
      setPhotoStatus({status: 'complete', url: statusUpdate.url});
      
      // Verify state was updated
      setTimeout(() => {
        console.log('Current photoUrl state after upload complete:', photoUrl);
        console.log('Current photoUrlRef value:', photoUrlRef.current);
      }, 100);
    }
    else if (statusUpdate.status === 'error') {
      setErrorMessage(`Photo upload error: ${statusUpdate.error}`);
      setPhotoStatus({status: 'error', error: statusUpdate.error});
      setPhotoUrl(null);
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
    
    console.log('Starting submission with current photoUrl state:', photoUrl);
    console.log('Photo status before submission:', photoStatus);
    console.log('PhotoUrlRef before submission:', photoUrlRef.current);
    
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      // Get the latest photoUrl using ref to avoid closure issues
      const currentPhotoUrl = photoUrlRef.current || (photoStatus?.status === 'complete' ? photoStatus.url : null);
      console.log('Using photoUrl for submission:', currentPhotoUrl);
      
      // Verify photoUrl is valid before submission
      let validatedPhotoUrl = null;
      if (currentPhotoUrl) {
        if (typeof currentPhotoUrl === 'string' && currentPhotoUrl.trim().startsWith('http')) {
          validatedPhotoUrl = currentPhotoUrl.trim();
          console.log('Using valid photo URL:', validatedPhotoUrl);
        } else {
          console.warn('Invalid photo URL detected:', currentPhotoUrl);
          setErrorMessage('Invalid photo URL format. Please try uploading again.');
          setStatus('error');
          return;
        }
      }
      
      const checkInData = {
        activityType,
        note: note.trim(),
        tags: [...tags],
        photoUrl: validatedPhotoUrl,
        visibility: visibility,
        timestamp: new Date()
      };
      
      console.log('Submitting check-in:', {
        ...checkInData,
        photoUrl: validatedPhotoUrl ? '[valid URL present]' : null
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
        
        <div className={`modal-body ${darkMode ? 'dark-mode' : ''}`}>
          {errorMessage && (
            <div className={`error-message ${darkMode ? 'dark-mode' : ''}`}>
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
                <label htmlFor="visibility" className={`form-label ${darkMode ? 'dark-mode' : ''}`}>Visibility</label>
                <select 
                  id="visibility" 
                  value={visibility}
                  onChange={e => setVisibility(e.target.value)}
                  required
                  className={`select-input ${darkMode ? 'dark-mode' : ''}`}
                  disabled={status === 'submitting' || photoStatus?.status === 'uploading'}
                >
                  {VISIBILITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className={`form-hint ${darkMode ? 'dark-mode' : ''}`}>
                  {visibility === 'private' ? 
                    'Private check-ins are only visible to you and don\'t increase your streak.' : 
                    'Public check-ins are visible to everyone and count towards your streak.'}
                </div>
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
                  style={{
                    "--placeholder-color": darkMode ? "#718096" : "#a0aec0"
                  }}
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