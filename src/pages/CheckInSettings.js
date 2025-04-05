import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  saveCheckInPreferences, 
  getCheckInPreferences 
} from '../services/fitnessService';
import { 
  enableNotifications, 
  disableNotifications, 
  requestNotificationPermission, 
  getNotificationPreferences 
} from '../services/notificationService';
import '../styles/PageStyles.css';
import '../styles/CheckInSettings.css';

// Material UI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';
import ReplayIcon from '@mui/icons-material/Replay';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';

const CheckInSettings = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState({
    permission: null,
    enabled: false
  });
  
  const [preferences, setPreferences] = useState({
    startTime: '09:00',
    endTime: '21:00',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Sunday to Saturday
    responseWindow: 30 // Minutes to respond to check-in
  });
  
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        
        // Get notification permissions
        const permissionStatus = Notification.permission;
        
        // Get user preferences
        const userPrefs = await getCheckInPreferences(currentUser.uid);
        const notificationPrefs = await getNotificationPreferences(currentUser.uid);
        
        if (userPrefs) {
          setPreferences(prev => ({
            ...prev,
            ...userPrefs
          }));
        }
        
        setNotificationStatus({
          permission: permissionStatus,
          enabled: notificationPrefs?.enabled || false
        });
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError('Failed to load your preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      loadPreferences();
    }
  }, [currentUser]);
  
  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset saved status if changes are made
    if (saved) setSaved(false);
  };
  
  const handleDayToggle = (day) => {
    setPreferences(prev => {
      const newDays = [...prev.daysOfWeek];
      
      if (newDays.includes(day)) {
        // Remove the day
        return {
          ...prev,
          daysOfWeek: newDays.filter(d => d !== day)
        };
      } else {
        // Add the day
        return {
          ...prev,
          daysOfWeek: [...newDays, day].sort()
        };
      }
    });
    
    // Reset saved status if changes are made
    if (saved) setSaved(false);
  };
  
  const requestPermission = async () => {
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        setNotificationStatus(prev => ({
          ...prev,
          permission: 'granted'
        }));
        
        // Enable notifications
        await enableNotifications(currentUser.uid);
        
        setNotificationStatus(prev => ({
          ...prev,
          enabled: true
        }));
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to enable notifications. Please check your browser settings.');
    }
  };
  
  const toggleNotifications = async () => {
    try {
      if (notificationStatus.enabled) {
        // Disable notifications
        await disableNotifications(currentUser.uid);
        
        setNotificationStatus(prev => ({
          ...prev,
          enabled: false
        }));
      } else {
        // Enable notifications
        if (notificationStatus.permission !== 'granted') {
          await requestPermission();
        } else {
          await enableNotifications(currentUser.uid);
          
          setNotificationStatus(prev => ({
            ...prev,
            enabled: true
          }));
        }
      }
    } catch (err) {
      console.error('Error toggling notifications:', err);
      setError('Failed to update notification settings. Please try again.');
    }
  };
  
  const validatePreferences = () => {
    // Check if start time is before end time
    const start = new Date(`2000-01-01T${preferences.startTime}`);
    const end = new Date(`2000-01-01T${preferences.endTime}`);
    
    if (start >= end) {
      setError('Start time must be before end time.');
      return false;
    }
    
    // Check if at least one day is selected
    if (preferences.daysOfWeek.length === 0) {
      setError('Please select at least one day for check-ins.');
      return false;
    }
    
    return true;
  };
  
  const savePreferences = async () => {
    if (!validatePreferences()) {
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Save preferences to Firestore
      await saveCheckInPreferences(currentUser.uid, preferences);
      
      // Show success message
      setSaved(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const getDayName = (day) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
  };
  
  if (loading) {
    return (
      <div className={`page-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your preferences...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`page-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="page-header">
        <button 
          className="secondary-button back-button" 
          onClick={() => navigate('/dashboard')}
        >
          <ArrowBackIcon />
          Back
        </button>
        <h1 className="page-title">
          <SettingsIcon style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Check-in Settings
        </h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {saved && (
        <div className="success-message">
          <CheckCircleOutlineIcon style={{ marginRight: '8px' }} />
          <span>Your preferences have been saved!</span>
        </div>
      )}
      
      <div className={`content-card ${darkMode ? 'dark-mode' : ''}`}>
        <h2 className="section-title">Notification Preferences</h2>
        <p className="section-subtitle">
          Control when and how you receive check-in reminders
        </p>
        
        <div className="notification-toggle">
          <div className="notification-status">
            {notificationStatus.enabled ? (
              <>
                <NotificationsActiveIcon className="icon active" />
                <span>Notifications are enabled</span>
              </>
            ) : (
              <>
                <NotificationsOffIcon className="icon inactive" />
                <span>Notifications are disabled</span>
              </>
            )}
          </div>
          
          <button 
            className={`${notificationStatus.enabled ? 'secondary-button' : 'primary-button'}`}
            onClick={toggleNotifications}
          >
            {notificationStatus.enabled ? 'Disable Notifications' : 'Enable Notifications'}
          </button>
        </div>
        
        <div className="form-section">
          <h3 className="subsection-title">Check-in Window</h3>
          
          <div className="form-group">
            <label htmlFor="startTime">Start Time</label>
            <div className="input-with-icon">
              <AccessTimeIcon className="input-icon" />
              <input 
                type="time" 
                id="startTime"
                name="startTime"
                value={preferences.startTime}
                onChange={handlePreferenceChange}
                className="time-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="endTime">End Time</label>
            <div className="input-with-icon">
              <AccessTimeIcon className="input-icon" />
              <input 
                type="time" 
                id="endTime"
                name="endTime"
                value={preferences.endTime}
                onChange={handlePreferenceChange}
                className="time-input"
              />
            </div>
            <div className="input-help">
              <HelpOutlineIcon style={{ fontSize: '16px', marginRight: '4px' }} />
              <span>We'll remind you to check in between these hours</span>
            </div>
          </div>
          
          <div className="form-group">
            <label>Check-in Days</label>
            <div className="days-selector">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <button
                  key={day}
                  type="button"
                  className={`day-button ${preferences.daysOfWeek.includes(day) ? 'selected' : ''}`}
                  onClick={() => handleDayToggle(day)}
                >
                  {getDayName(day)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="responseWindow">Response Window (minutes)</label>
            <select
              id="responseWindow"
              name="responseWindow"
              value={preferences.responseWindow}
              onChange={handlePreferenceChange}
              className="select-input"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </select>
            <div className="input-help">
              <HelpOutlineIcon style={{ fontSize: '16px', marginRight: '4px' }} />
              <span>How long you have to respond to a check-in notification</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="action-buttons">
        <button 
          className="secondary-button"
          onClick={() => navigate('/dashboard')}
        >
          <ReplayIcon />
          Cancel
        </button>
        <button 
          className="primary-button"
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <span className="loading-spinner"></span>
          ) : (
            <SaveIcon style={{ marginRight: '8px' }} />
          )}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default CheckInSettings; 