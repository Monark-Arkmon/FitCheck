import React, { useState, useEffect } from 'react';
import { format, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getUserCheckIns } from '../services/fitnessService';
import CheckInModal from '../components/fitness/CheckInModal';
import ManualCheckInModal from '../components/fitness/ManualCheckInModal';
import ViewDetailsModal from '../components/fitness/ViewDetailsModal';
import '../styles/PageStyles.css';
import '../styles/Dashboard.css';

// Material UI Icons
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import TodayIcon from '@mui/icons-material/Today';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoIcon from '@mui/icons-material/Photo';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState({
    streak: 0,
    totalCheckIns: 0,
    lastCheckIn: null,
  });
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showFirstCheckInModal, setShowFirstCheckInModal] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  
  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const data = await getUserCheckIns(currentUser.uid);
      
      if (data && data.checkIns) {
        // Sort by timestamp in descending order by default
        const sortedCheckIns = data.checkIns.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        
        setCheckIns(sortedCheckIns);
        
        // Extract user stats from the data
        setUserStats({
          streak: data.streak || 0,
          totalCheckIns: data.totalCheckIns || 0,
          lastCheckIn: data.lastCheckIn ? new Date(data.lastCheckIn) : null,
        });
      }
    } catch (err) {
      console.error('Error fetching check-ins:', err);
      setError('Failed to load your fitness history. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCheckIns();
  }, [currentUser.uid, sortOrder]);
  
  // Function to handle when a new check-in is completed
  const handleCheckInComplete = (newCheckIn) => {
    console.log('New check-in completed:', newCheckIn);
    fetchCheckIns(); // Refresh the data
  };
  
  // Function to check if user has made their first check-in
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!currentUser) return;
      
      try {
        const userCheckInsData = await getUserCheckIns(currentUser.uid, 1);
        if (userCheckInsData.checkIns.length === 0) {
          setShowFirstCheckInModal(true);
        }
      } catch (error) {
        console.error("Error checking first-time user:", error);
      }
    };
    
    checkFirstTimeUser();
  }, [currentUser]);
  
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };
  
  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };
  
  const filteredCheckIns = checkIns.filter(checkIn => {
    if (filter === 'all') return true;
    
    const checkInDate = new Date(checkIn.timestamp);
    
    switch (filter) {
      case 'today':
        return isToday(checkInDate);
      case 'yesterday':
        return isYesterday(checkInDate);
      case 'thisWeek':
        return isThisWeek(checkInDate);
      case 'workout':
        return checkIn.activityType && checkIn.activityType !== 'busy';
      case 'photos':
        return checkIn.photoUrl;
      default:
        return true;
    }
  });
  
  const getTimeLabel = (timestamp) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };
  
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'cardio':
        return <LocalFireDepartmentIcon style={{ color: '#FF5722' }} />;
      case 'strength':
        return <FitnessCenterIcon style={{ color: '#4CAF50' }} />;
      case 'flexibility':
        return <WhatshotIcon style={{ color: '#2196F3' }} />;
      case 'sports':
        return <EmojiEventsIcon style={{ color: '#FF9800' }} />;
      default:
        return <FitnessCenterIcon style={{ color: '#757575' }} />;
    }
  };
  
  // Handle view details button click
  const handleViewDetails = (checkIn) => {
    console.log('Opening check-in details:', checkIn);
    console.log('Photo URL:', checkIn.photoUrl);
    setSelectedCheckIn(checkIn);
    setShowViewDetailsModal(true);
  };
  
  return (
    <div className={`page-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="page-header">
        <h1 className="page-title">
          <FitnessCenterIcon style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Fitness Dashboard
        </h1>
        <button className="primary-button" onClick={() => setShowCheckInModal(true)}>
          <AddIcon />
          Manual Check-in
        </button>
      </div>
      
      <div className="stats-grid">
        <div className={`content-card ${darkMode ? 'dark-mode' : ''}`}>
          <div className="stat-icon streak">
            <WhatshotIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userStats.streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>
        
        <div className={`content-card ${darkMode ? 'dark-mode' : ''}`}>
          <div className="stat-icon total">
            <EventAvailableIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userStats.totalCheckIns}</div>
            <div className="stat-label">Total Check-ins</div>
          </div>
        </div>
        
        <div className={`content-card ${darkMode ? 'dark-mode' : ''}`}>
          <div className="stat-icon last">
            <TodayIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {userStats.lastCheckIn ? (
                isToday(userStats.lastCheckIn) ? 'Today' : format(userStats.lastCheckIn, 'MMM d')
              ) : 'None'}
            </div>
            <div className="stat-label">Last Check-in</div>
          </div>
        </div>
      </div>
      
      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">Your Fitness Diary</h2>
          <div className="controls-container">
            <div className="filter-dropdown">
              <button className={`secondary-button ${darkMode ? 'dark-mode' : ''}`}>
                <FilterListIcon />
                Filter
              </button>
              <div className="dropdown-content">
                <div 
                  className={`dropdown-item ${filter === 'all' ? 'selected' : ''}`} 
                  onClick={() => handleFilterChange('all')}
                >
                  All Check-ins
                </div>
                <div 
                  className={`dropdown-item ${filter === 'today' ? 'selected' : ''}`} 
                  onClick={() => handleFilterChange('today')}
                >
                  Today
                </div>
                <div 
                  className={`dropdown-item ${filter === 'yesterday' ? 'selected' : ''}`} 
                  onClick={() => handleFilterChange('yesterday')}
                >
                  Yesterday
                </div>
                <div 
                  className={`dropdown-item ${filter === 'thisWeek' ? 'selected' : ''}`} 
                  onClick={() => handleFilterChange('thisWeek')}
                >
                  This Week
                </div>
                <div 
                  className={`dropdown-item ${filter === 'workout' ? 'selected' : ''}`} 
                  onClick={() => handleFilterChange('workout')}
                >
                  Workouts Only
                </div>
                <div 
                  className={`dropdown-item ${filter === 'photos' ? 'selected' : ''}`} 
                  onClick={() => handleFilterChange('photos')}
                >
                  With Photos
                </div>
              </div>
            </div>
            
            <button 
              className={`secondary-button ${darkMode ? 'dark-mode' : ''}`}
              onClick={handleSortOrderChange}
              title={sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            >
              <SortIcon />
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading your fitness history...</div>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredCheckIns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FitnessCenterIcon style={{ fontSize: 48 }} />
            </div>
            <div className="empty-state-text">
              {filter === 'all' 
                ? "You haven't logged any fitness activities yet. Ready to start tracking?" 
                : "No check-ins found with the current filter."}
            </div>
            {filter === 'all' && (
              <button 
                className="primary-button"
                onClick={() => setShowCheckInModal(true)}
                style={{ marginTop: '15px' }}
              >
                <AddIcon />
                Add Your First Check-in
              </button>
            )}
          </div>
        ) : (
          <div className="checkins-list">
            {filteredCheckIns.map((checkIn, index) => (
              <div key={checkIn.id || index} className={`checkin-card ${darkMode ? 'dark-mode' : ''}`}>
                <div className="checkin-header">
                  <div className="checkin-type">
                    {getActivityIcon(checkIn.activityType)}
                    <span>{checkIn.activityType || 'Check-in'}</span>
                    
                    {checkIn.visibility && (
                      <span className={`visibility-badge ${checkIn.visibility === 'private' ? 'private' : 'public'}`} title={`${checkIn.visibility === 'private' ? 'Private' : 'Public'} check-in`}>
                        {checkIn.visibility === 'private' ? '🔒' : '🌐'}
                      </span>
                    )}
                  </div>
                  <div className="checkin-time">
                    {getTimeLabel(checkIn.timestamp)}
                    {checkIn.photoUrl && (
                      <span className="photo-indicator">
                        <PhotoIcon fontSize="small" style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                      </span>
                    )}
                  </div>
                </div>
                
                {checkIn.notes ? (
                  <div className="checkin-notes">{checkIn.notes}</div>
                ) : checkIn.note ? (
                  <div className="checkin-notes">{checkIn.note}</div>
                ) : (
                  <div className="checkin-empty-content">No notes for this check-in</div>
                )}
                
                <div className="checkin-actions">
                  <button 
                    className={`secondary-button small ${darkMode ? 'dark-mode' : ''}`}
                    onClick={() => handleViewDetails(checkIn)}
                  >
                    <VisibilityIcon />
                    {checkIn.photoUrl ? 'View Photo & Details' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showCheckInModal && (
        <ManualCheckInModal 
          onClose={() => setShowCheckInModal(false)}
          darkMode={darkMode}
          isFirstCheckIn={false}
          onCheckInComplete={handleCheckInComplete}
        />
      )}
      
      {showFirstCheckInModal && (
        <ManualCheckInModal 
          onClose={() => setShowFirstCheckInModal(false)}
          darkMode={darkMode}
          isFirstCheckIn={true}
          onCheckInComplete={handleCheckInComplete}
        />
      )}
      
      <ViewDetailsModal
        isOpen={showViewDetailsModal}
        onClose={() => setShowViewDetailsModal(false)}
        checkIn={selectedCheckIn}
        darkMode={darkMode}
      />
    </div>
  );
};

export default Dashboard; 