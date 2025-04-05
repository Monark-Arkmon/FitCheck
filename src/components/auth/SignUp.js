import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/Auth.css';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GoogleIcon from '@mui/icons-material/Google';
import Email from '@mui/icons-material/Email';
import Lock from '@mui/icons-material/Lock';
import AccountCircle from '@mui/icons-material/AccountCircle';
import PersonAdd from '@mui/icons-material/PersonAdd';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({
    email: false,
    google: false
  });

  const { signup, googleSignIn } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };
  
  const validateDisplayName = (name) => {
    return name.trim().length >= 3;
  };
  
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateDisplayName(displayName)) {
      setError('Please enter your name (at least 3 characters)');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading({...loading, email: true});
      await signup(email, password, displayName);
      navigate('/feed');
    } catch (error) {
      
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please use a different email or try logging in.');
      } else {
        setError('Failed to create account. Please try again.');
      }
      
      setLoading({...loading, email: false});
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading({...loading, google: true});
      await googleSignIn();
      navigate('/feed');
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setError('Failed to sign in with Google: ' + error.message);
      setLoading({...loading, google: false});
    }
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="auth-container">
        {/* Welcome/features section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Join FitCheck Today</h1>
            <p>Create an account to track your fitness journey and connect with others.</p>
            
            <div className="app-features">
              <div className="feature">
                <div className="feature-icon">
                  <FitnessCenterIcon />
                </div>
                <div className="feature-text">
                  <h3>Daily Check-ins</h3>
                  <p>Log your workouts and track your fitness streak</p>
                </div>
              </div>
              
              <div className="feature">
                <div className="feature-icon">
                  <DirectionsRunIcon />
                </div>
                <div className="feature-text">
                  <h3>Workout Goals</h3>
                  <p>Set personal fitness goals and track your progress</p>
                </div>
              </div>
              
              <div className="feature">
                <div className="feature-icon">
                  <EmojiEventsIcon />
                </div>
                <div className="feature-text">
                  <h3>Fitness Feed</h3>
                  <p>Connect with friends and share your fitness journey</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Auth form section */}
        <div className="auth-form-section">
          <div className="auth-card">
            <h1>Create Account</h1>
            <p className="auth-subtitle">Join the fitness community today</p>
            
            {error && <div className="auth-error">{error}</div>}
            
            <div className="social-auth-buttons">
              <button 
                className="social-button google-button"
                onClick={handleGoogleSignIn}
                disabled={loading.google}
              >
                {loading.google ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <GoogleIcon />
                )}
                <span>Sign up with Google</span>
              </button>
            </div>
            
            <div className="auth-divider">
              <span>or sign up with email</span>
            </div>
            
            <form className="auth-form" onSubmit={handleEmailRegister}>
              <div className="form-group">
                <label htmlFor="displayName">Full Name</label>
                <div className="input-with-icon">
                  <AccountCircle className="input-icon" />
                  <input
                    type="text"
                    id="displayName"
                    placeholder="Enter your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <Email className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" />
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading.email}
              >
                {loading.email ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <PersonAdd style={{ marginRight: '8px' }} />
                    Create Account
                  </>
                )}
              </button>
            </form>
            
            <div className="auth-links">
              <span>Already have an account? </span>
              <Link to="/login" className="auth-link">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 