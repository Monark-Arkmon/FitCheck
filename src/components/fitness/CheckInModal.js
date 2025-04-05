import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addCheckIn } from '../../services/fitnessService';
import { useTheme } from '../../contexts/ThemeContext';
import PhotoUploader from './PhotoUploader';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; 
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import '../../styles/CheckInModal.css';

const CheckInModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [selectedOption, setSelectedOption] = useState(null);
  const [activityType, setActivityType] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  if (!isOpen) return null;
  
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    
    setError('');
    if (option === 'busy') {
      setActivityType('');
    }
  };
  
  const handleActivitySelect = (activity) => {
    setActivityType(activity);
    setError('');
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      if (!selectedOption) {
        setError('Please select an option');
        setLoading(false);
        return;
      }
      
      if (selectedOption !== 'busy' && !activityType) {
        setError('Please select an activity type');
        setLoading(false);
        return;
      }
      
      // Create check-in object
      const checkInData = {
        userId: currentUser.uid,
        status: selectedOption,
        activityType: activityType || null,
        notes: notes || null,
        photoUrl: photoUrl || null,
        timestamp: new Date(),
        userDisplayName: currentUser.displayName || 'User',
        userPhotoURL: currentUser.photoURL || null
      };
      await addCheckIn(checkInData);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSelectedOption(null);
        setActivityType('');
        setNotes('');
        setPhotoUrl(null);
        setError('');
        setSuccess(false);
      }, 1500);
      
    } catch (err) {
      console.error('Error submitting check-in:', err);
      setError('Failed to submit check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    onClose();
  };
  
  const handlePhotoSelected = (url) => {
    setPhotoUrl(url);
  };
  
  const handlePhotoError = (errorMsg) => {
    setError(`Photo error: ${errorMsg}`);
  };
  
  return (
    <div className={`modal-overlay ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`modal-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className={`modal-header ${darkMode ? 'dark-mode' : ''}`}>
          <h2 className="modal-title">Daily Check-In</h2>
          <button className={`close-button ${darkMode ? 'dark-mode' : ''}`} onClick={handleCancel}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Status options */}
          <h3 className="section-title">What's your status today?</h3>
          <div className="options-container">
            <div 
              className={`option ${selectedOption === 'busy' ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''}`}
              onClick={() => handleOptionSelect('busy')}
            >
              <div className={`option-icon ${darkMode ? 'dark-mode' : ''}`}>
                <DoNotDisturbIcon />
              </div>
              <div className="option-text">Busy now</div>
            </div>
            
            <div 
              className={`option ${selectedOption === 'workout' ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''}`}
              onClick={() => handleOptionSelect('workout')}
            >
              <div className={`option-icon ${darkMode ? 'dark-mode' : ''}`}>
                <FitnessCenterIcon />
              </div>
              <div className="option-text">Log a workout</div>
            </div>
          </div>
          
          {/* Conditionally render based on selection */}
          {selectedOption === 'workout' && (
            <>
              <h3 className="section-title">What type of activity?</h3>
              <div className="options-container">
                <div 
                  className={`option small ${activityType === 'currently working out' ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''}`}
                  onClick={() => handleActivitySelect('currently working out')}
                >
                  <div className={`option-icon small ${darkMode ? 'dark-mode' : ''}`}>
                    <TrendingUpIcon />
                  </div>
                  <div className="option-text">Currently working out</div>
                </div>
                
                <div 
                  className={`option small ${activityType === 'worked out earlier' ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''}`}
                  onClick={() => handleActivitySelect('worked out earlier')}
                >
                  <div className={`option-icon small ${darkMode ? 'dark-mode' : ''}`}>
                    <AccessTimeIcon />
                  </div>
                  <div className="option-text">Worked out earlier</div>
                </div>
                
                <div 
                  className={`option small ${activityType === 'skipping today' ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''}`}
                  onClick={() => handleActivitySelect('skipping today')}
                >
                  <div className={`option-icon small ${darkMode ? 'dark-mode' : ''}`}>
                    <SkipNextIcon />
                  </div>
                  <div className="option-text">Skipping today</div>
                </div>
                
                <div 
                  className={`option small ${activityType === 'cardio' ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''}`}
                  onClick={() => handleActivitySelect('cardio')}
                >
                  <div className={`option-icon small ${darkMode ? 'dark-mode' : ''}`}>
                    <DirectionsRunIcon />
                  </div>
                  <div className="option-text">Cardio</div>
                </div>
                
                <div 
                  className={`option small ${activityType === 'strength training' ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''}`}
                  onClick={() => handleActivitySelect('strength training')}
                >
                  <div className={`option-icon small ${darkMode ? 'dark-mode' : ''}`}>
                    <FitnessCenterIcon />
                  </div>
                  <div className="option-text">Strength Training</div>
                </div>
              </div>
              
              {/* Add photo option */}
              <h3 className="section-title">Add a photo (optional)</h3>
              <PhotoUploader 
                onPhotoSelected={handlePhotoSelected}
                onError={handlePhotoError}
                initialPhotoUrl={photoUrl}
                storagePath={`users/${currentUser.uid}/check-ins`}
                darkMode={darkMode}
              />
              
              {/* Notes */}
              <h3 className="section-title">Notes (optional)</h3>
              <textarea 
                className={`notes-textarea ${darkMode ? 'dark-mode' : ''}`}
                placeholder="How was your workout? Add any notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </>
          )}
          
          {/* Error message */}
          {error && <div className={`error-message ${darkMode ? 'dark-mode' : ''}`}>{error}</div>}
          
          {/* Success message */}
          {success && (
            <div className={`success-message ${darkMode ? 'dark-mode' : ''}`}>
              Check-in submitted successfully!
            </div>
          )}
        </div>
        
        <div className={`modal-footer ${darkMode ? 'dark-mode' : ''}`}>
          <button 
            className={`cancel-button ${darkMode ? 'dark-mode' : ''}`}
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          
          <button 
            className={`submit-button ${darkMode ? 'dark-mode' : ''}`}
            onClick={handleSubmit}
            disabled={loading || !selectedOption}
          >
            {loading ? 'Submitting...' : 'Submit Check-In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal; 