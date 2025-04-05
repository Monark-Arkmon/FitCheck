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
import LoginIcon from '@mui/icons-material/Login';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState({
    email: false,
    google: false
  });
  
  const { login, googleSignIn, resetPassword } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };
  
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    try {
      setLoading({...loading, email: true});
      await login(email, password);
      navigate('/feed');
    } catch (error) {
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Failed to log in. Please try again.');
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

  const handleResetPassword = async () => {
    if (!validateEmail(resetEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      setTimeout(() => {
        setForgotPasswordOpen(false);
        setResetSent(false);
        setResetEmail('');
      }, 3000);
    } catch (error) {
      setError('Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="auth-container">
        {/* Welcome/features section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Welcome to FitCheck</h1>
            <p>Track your fitness journey, set goals, and connect with others on the path to better health.</p>
            
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
            <h1>Sign In</h1>
            <p className="auth-subtitle">Access your FitCheck account</p>
            
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
                <span>Sign in with Google</span>
              </button>
            </div>
            
            <div className="auth-divider">
              <span>or sign in with email</span>
            </div>
            
            <form className="auth-form" onSubmit={handleEmailLogin}>
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-options">
                <div className="remember-me">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                
                <span 
                  className="forgot-password-link"
                  onClick={() => setForgotPasswordOpen(true)}
                >
                  Forgot password?
                </span>
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
                    <LoginIcon style={{ marginRight: '8px' }} />
                    Sign In
                  </>
                )}
              </button>
            </form>
            
            <div className="auth-links">
              <span>Don't have an account? </span>
              <Link to="/signup" className="auth-link">Sign Up</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="modal-overlay" onClick={() => !resetSent && setForgotPasswordOpen(false)}>
          <div className={`forgot-password-modal ${darkMode ? 'dark-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
            <h2>Reset Your Password</h2>
            
            {resetSent ? (
              <p>Reset link sent! Check your email to reset your password.</p>
            ) : (
              <>
                <p>Enter your email address and we'll send you a link to reset your password.</p>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => setForgotPasswordOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="reset-btn"
                    onClick={handleResetPassword}
                  >
                    Send Reset Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login; 