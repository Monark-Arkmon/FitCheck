import '../styles/LandingPage.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { useTheme } from '../contexts/ThemeContext';

import heroImage from "../assets/hero-image.jpg";
import activityImage1 from "../assets/yoga.jpg";
import activityImage2 from "../assets/running.jpg";
import activityImage3 from "../assets/bench.jpg";
import activityImage4 from "../assets/cycling.jpg";

const userImage1 = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80";
const userImage2 = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80";
const userImage3 = "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80";

function LandingPage() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  const goToAuth = () => {
    navigate('/login');
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const reviews = [
    {
      name: "Sarah K.",
      rating: 5,
      comment: "Fit Check transformed my workout routine!",
      avatar: userImage1
    },
    {
      name: "Mike T.",
      rating: 4,
      comment: "Great app!",
      avatar: userImage2
    },
    {
      name: "Priya M.",
      rating: 5,
      comment: "Motivated me to exercise more.",
      avatar: userImage3
    },
    {
      name: "Aditya G.",
      rating: 5,
      comment: "Loved this app!",
      avatar: userImage1
    }
  ];

  
  const features = [
    {
      icon: "📱",
      title: "Activity Feed",
      description: "Connect with friends, share your workouts, and stay motivated by seeing others' fitness journeys in real-time."
    },
    {
      icon: "📔",
      title: "Fitness Diary",
      description: "Track your workouts, set goals, and monitor your progress with detailed statistics and insights."
    },
    {
      icon: "🤖",
      title: "AI Coach",
      description: "Get personalized workout recommendations and real-time feedback based on your performance and goals."
    }
  ];

  // User success stories
  const successStories = [
    {
      name: "Alex J.",
      title: "Lost 15kg in 6 months",
      image: userImage1,
      story: "I've been using Fit Check for 6 months and it completely changed how I approach fitness. The personalized plans and community support kept me motivated.",
      stats: {
        workouts: 120,
        streak: 95,
        achievements: 15
      }
    },
    {
      name: "Maya P.",
      title: "Marathon Runner",
      image: userImage2,
      story: "Training for my first marathon was challenging until I found Fit Check. The AI Coach helped me optimize my training schedule and avoid injury.",
      stats: {
        workouts: 200,
        streak: 150,
        achievements: 22
      }
    },
    {
      name: "James L.",
      title: "Strength Gains",
      image: userImage3,
      story: "As someone new to strength training, the guidance from Fit Check has been invaluable. I've increased all my lifts by at least 30% in just 3 months.",
      stats: {
        workouts: 85,
        streak: 60,
        achievements: 12
      }
    }
  ];

  // Activity types
  const activities = [
    {
      name: 'Yoga',
      image: activityImage1
    },
    {
      name: 'Running',
      image: activityImage2
    },
    {
      name: 'Strength',
      image: activityImage3
    },
    {
      name: 'Cycling',
      image: activityImage4
    }
  ];

  return (
    <div className={`App ${!darkMode ? 'light-mode' : ''}`}>  
      <motion.nav 
        className="Navbar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <div className="logo-container">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >Fit Check</motion.h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <motion.button
            className="theme-toggle"
            onClick={toggleDarkMode}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {darkMode ? '☀️' : '🌙'}
          </motion.button>
          
          <motion.button 
            className="Button"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(78, 140, 255, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={goToAuth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Sign in
          </motion.button>
        </div>
      </motion.nav>
      
      <div className="content">
        <motion.div 
          className="image-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.img 
            src={heroImage}
            alt="Fitness Journey"
            className='content-image'
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, type: "tween" }}
          />
          <motion.div 
            className="image-overlay-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >Transform Your Fitness Journey</motion.h2>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >Start achieving your goals today</motion.p>
            <motion.button
              className="HeroButton"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(78, 140, 255, 0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={goToAuth}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              Get Started
            </motion.button>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className='content2'
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <motion.h2 variants={itemVariants}>Key Features</motion.h2>
          
          <div className='feature-row'>
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className='feature-card'
                variants={itemVariants}
                whileHover={{ y: -10 }}
                onClick={goToAuth}
                custom={index}
              >
                <motion.div 
                  className="feature-icon"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          
          
          <motion.h2 
            variants={itemVariants}
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Success Stories
          </motion.h2>
          
          <div className='success-stories-container'>
            {successStories.map((story, index) => (
              <motion.div 
                key={index}
                className='success-story-card'
                variants={itemVariants}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 30px rgba(0, 0, 0, 0.4)",
                }}
                transition={{ duration: 0.3 }}
                custom={index}
                onClick={goToAuth}
              >
                <div className="success-story-header">
                  <img src={story.image} alt={story.name} className="success-avatar" />
                  <div>
                    <h3 className="success-name">{story.name}</h3>
                    <p className="success-title">{story.title}</p>
                  </div>
                </div>
                <p className="success-text">{story.story}</p>
                <div className="success-stats">
                  <div className="stat-item">
                    <span className="stat-number">{story.stats.workouts}</span>
                    <span className="stat-label">Workouts</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{story.stats.streak}</span>
                    <span className="stat-label">Day Streak</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{story.stats.achievements}</span>
                    <span className="stat-label">Achievements</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          
          <motion.h2 
            variants={itemVariants}
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Popular Activities
          </motion.h2>
          
          <div className='image-row'>
            {activities.map((activity, index) => (
              <motion.div 
                key={index}
                className='image-card'
                variants={itemVariants}
                whileHover={{ 
                  y: -10,
                  scale: 1.03,
                  boxShadow: "0 20px 30px rgba(0, 0, 0, 0.4)",
                }}
                transition={{ duration: 0.3 }}
                custom={index}
                onClick={goToAuth}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img 
                    src={activity.image}
                    alt={activity.name} 
                    className='images'
                  />
                </motion.div>
                <motion.p className="image-caption">{activity.name}</motion.p>
              </motion.div>
            ))}
          </div>
          
          <motion.h2 
            variants={itemVariants}
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Personalized Insights
          </motion.h2>
          
          <div className="analysis-section">
            <motion.div 
              className="analysis-item"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ x: 5 }}
            >
              <div className="analysis-icon">📊</div>
              <div className="analysis-content">
                <h3>Smart Progress Tracking</h3>
                <p>Get comprehensive insights into your workout patterns, track multiple fitness metrics, and visualize your progress over time with interactive charts and dashboards.</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="analysis-item"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ x: 5 }}
            >
              <div className="analysis-icon">🧠</div>
              <div className="analysis-content">
                <h3>AI-Powered Recommendations</h3>
                <p>Our advanced AI analyzes your performance data to provide personalized recommendations, identify improvement areas, and suggest optimal workout routines tailored to your specific goals.</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="analysis-item"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ x: 5 }}
            >
              <div className="analysis-icon">👥</div>
              <div className="analysis-content">
                <h3>Supportive Community</h3>
                <p>Connect with like-minded fitness enthusiasts, join challenges, participate in group activities, and share your achievements with a supportive community that keeps you motivated.</p>
              </div>
            </motion.div>
          </div>
          
          <motion.button 
            className='Button'
            whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(78, 140, 255, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={goToAuth}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Start Your Journey
          </motion.button>
          
          <motion.h2 
            variants={itemVariants}
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            User Reviews
          </motion.h2>
          
          <motion.div 
            className="reviews-container"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {reviews.map((review, index) => (
              <motion.div 
                key={index} 
                className="review-card"
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  boxShadow: "0 15px 30px rgba(0, 0, 0, 0.4)",
                  transition: { duration: 0.3 }
                }}
              >
                <div className="review-header">
                  <motion.img 
                    src={review.avatar} 
                    alt={review.name} 
                    className="review-avatar"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div>
                    <h4>{review.name}</h4>
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <motion.span 
                          key={i} 
                          className={`star ${i < review.rating ? 'filled' : ''}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i }}
                        >
                          ★
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
                <motion.p
                  className="review-text"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  "{review.comment}"
                </motion.p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default LandingPage; 