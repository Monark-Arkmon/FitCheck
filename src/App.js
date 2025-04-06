import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import AiChat from './pages/AiChat';
import CheckInSettings from './pages/CheckInSettings';
import Notifications from './pages/Notifications';
import LandingPage from './pages/LandingPage';
import './styles/App.css';

const AppLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

const AppContent = () => {
  const { darkMode } = useTheme();
  
  // Add or remove dark-mode class on body based on theme
  React.useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);
  
  return (
    <div className="global-container">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/chat" element={<AiChat />} />
              <Route path="/settings/check-in" element={<CheckInSettings />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>
          
          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Router>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </AuthProvider>
  );
}

export default App;
