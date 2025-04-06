import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { 
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NOTIFICATION_TYPES
} from '../services/notificationService';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import WarningIcon from '@mui/icons-material/Warning';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CommentIcon from '@mui/icons-material/Comment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CircularProgress from '@mui/material/CircularProgress';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import '../styles/Notifications.css';

const Notifications = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const allNotifications = await getAllNotifications(currentUser.uid, 100);
        setNotifications(allNotifications);
        setError('');
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [currentUser]);
  
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  
  const handleMarkAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
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
  
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className={`page-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        
        {unreadCount > 0 && (
          <button 
            className={`mark-all-read-button ${darkMode ? 'dark-mode' : ''}`}
            onClick={handleMarkAllAsRead}
          >
            <DoneAllIcon style={{ marginRight: '5px' }} /> 
            Mark all as read
          </button>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className={`notifications-container ${darkMode ? 'dark-mode' : ''}`}>
        {loading ? (
          <div className="loading-container">
            <CircularProgress size={40} style={{ color: darkMode ? '#6A6AE3' : '#6A6AE3' }} />
            <div className="loading-text">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className={`empty-container ${darkMode ? 'dark-mode' : ''}`}>
            <NotificationsOffIcon style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.7 }} />
            <div className="empty-text">You don't have any notifications yet</div>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => {
              const itemProps = notification.link ? {
                as: Link,
                to: notification.link,
                className: `notification-item ${!notification.read ? 'unread' : ''} ${darkMode ? 'dark-mode' : ''} clickable`
              } : {
                className: `notification-item ${!notification.read ? 'unread' : ''} ${darkMode ? 'dark-mode' : ''}`
              };
              
              return (
                <div 
                  key={notification.id}
                  {...itemProps}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
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
                        : 'Just now'
                      }
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="unread-indicator" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 