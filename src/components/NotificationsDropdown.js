import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getUnreadNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  NOTIFICATION_TYPES
} from '../services/notificationService';
import '../styles/NotificationsDropdown.css';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import WarningIcon from '@mui/icons-material/Warning';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CommentIcon from '@mui/icons-material/Comment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

const NotificationsDropdown = ({ darkMode }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const notifs = await getUnreadNotifications(currentUser.uid, 10);
        setNotifications(notifs);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationAsRead(notification.id);
      setNotifications(notifications.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      setNotifications([]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.STREAK_MILESTONE:
        return <WhatshotIcon style={{ color: '#f1c40f' }} />;
      case NOTIFICATION_TYPES.STREAK_AT_RISK:
        return <WarningIcon style={{ color: '#e74c3c' }} />;
      case NOTIFICATION_TYPES.LIKE:
        return <FavoriteIcon style={{ color: '#e74c3c' }} />;
      case NOTIFICATION_TYPES.NEW_FOLLOWER:
        return <PersonAddIcon style={{ color: '#3498db' }} />;
      case NOTIFICATION_TYPES.COMMENT:
        return <CommentIcon style={{ color: '#2ecc71' }} />;
      case NOTIFICATION_TYPES.ACHIEVEMENT:
        return <EmojiEventsIcon style={{ color: '#f39c12' }} />;
      default:
        return <NotificationsActiveIcon style={{ color: '#7f8c8d' }} />;
    }
  };
  
  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button 
        className={`notification-bell-button ${darkMode ? 'dark-mode' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <NotificationsIcon />
        {notifications.length > 0 && (
          <div className="notification-badge">{notifications.length}</div>
        )}
      </button>
      
      {showDropdown && (
        <div className={`dropdown-menu ${darkMode ? 'dark-mode' : ''}`}>
          <div className={`dropdown-header ${darkMode ? 'dark-mode' : ''}`}>
            <div className="dropdown-title">Notifications</div>
            {notifications.length > 0 && (
              <button 
                className={`mark-all-read-button ${darkMode ? 'dark-mode' : ''}`}
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {loading ? (
              <div className={`loading-message ${darkMode ? 'dark-mode' : ''}`}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className={`empty-message ${darkMode ? 'dark-mode' : ''}`}>No new notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${darkMode ? 'dark-mode' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.link ? (
                    <Link 
                      to={notification.link}
                      className="notification-link"
                    >
                      <div className={`notification-icon ${darkMode ? 'dark-mode' : ''}`}>
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="notification-content">
                        <div className={`notification-title ${darkMode ? 'dark-mode' : ''}`}>
                          {notification.title}
                        </div>
                        <div className={`notification-message ${darkMode ? 'dark-mode' : ''}`}>
                          {notification.message}
                        </div>
                        <div className={`notification-time ${darkMode ? 'dark-mode' : ''}`}>
                          {notification.timestamp 
                            ? formatDistanceToNow(notification.timestamp, { addSuffix: true }) 
                            : 'Just now'}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <>
                      <div className={`notification-icon ${darkMode ? 'dark-mode' : ''}`}>
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="notification-content">
                        <div className={`notification-title ${darkMode ? 'dark-mode' : ''}`}>
                          {notification.title}
                        </div>
                        <div className={`notification-message ${darkMode ? 'dark-mode' : ''}`}>
                          {notification.message}
                        </div>
                        <div className={`notification-time ${darkMode ? 'dark-mode' : ''}`}>
                          {notification.timestamp 
                            ? formatDistanceToNow(notification.timestamp, { addSuffix: true }) 
                            : 'Just now'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className={`dropdown-footer ${darkMode ? 'dark-mode' : ''}`}>
            <Link to="/notifications">View all notifications</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown; 