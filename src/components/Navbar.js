import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/Navbar.css';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const Navbar = () => {
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  const handleLogout = async () => {
    setError('');
    
    try {
      await logout();
      navigate('/login');
    } catch {
      setError('Failed to log out');
    }
  };
  
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowSettingsDropdown(false);
    }
  };
  
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Don't show navbar on auth pages
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }
  
  return (
    <nav className={`nav-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="nav-header">
        <Link to="/feed" className="logo-link">
          <h1 className={`logo-text ${darkMode ? 'dark-mode' : ''}`}>FitCheck</h1>
        </Link>
        
        {currentUser && (
          <ul className="nav-links">
            <li className={`nav-item ${location.pathname === '/feed' ? 'active' : ''}`}>
              <Link to="/feed" className={`nav-link ${darkMode ? 'dark-mode' : ''}`}>Feed</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <Link to="/dashboard" className={`nav-link ${darkMode ? 'dark-mode' : ''}`}>My Diary</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/chat' ? 'active' : ''}`}>
              <Link to="/chat" className={`nav-link ${darkMode ? 'dark-mode' : ''}`}>AI Coach</Link>
            </li>
            
            <li className="nav-item right-section">
              <button className="icon-button" onClick={toggleDarkMode}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </button>
              
              <button 
                className="icon-button"
                onClick={() => navigate('/settings/check-in')}
                title="Notification Settings"
              >
                <NotificationsIcon />
              </button>
              
              <div className="settings-dropdown" ref={dropdownRef}>
                <button 
                  className="settings-button"
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                >
                  <div className={`user-avatar ${darkMode ? 'dark-mode' : ''}`}>
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                  <ArrowDropDownIcon />
                </button>
                
                {showSettingsDropdown && (
                  <div className={`dropdown-menu ${darkMode ? 'dark-mode' : ''}`}>
                    <Link to="/settings/check-in" className={`dropdown-item ${darkMode ? 'dark-mode' : ''}`}>
                      <SettingsIcon style={{ marginRight: '8px', fontSize: '18px' }} />
                      Check-in Settings
                    </Link>
                    <div className={`dropdown-divider ${darkMode ? 'dark-mode' : ''}`}></div>
                    <button className="dropdown-button" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </li>
          </ul>
        )}
      </div>
      
      {error && <div className="error-text">{error}</div>}
    </nav>
  );
};

export default Navbar; 