import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getFitnessAdvice, 
  getWorkoutSuggestions 
} from '../services/geminiService';
import '../styles/PageStyles.css';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';

const AiChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      content: "👋 Hi there! I'm your AI fitness coach. How can I help you today? You can ask me about workout routines, nutrition advice, or fitness tips!",
      formattedContent: "<p>👋 <strong>Hi there!</strong> I'm your AI fitness coach. How can I help you today?</p><p>You can ask me about:</p><ul><li>Workout routines</li><li>Nutrition advice</li><li>Fitness tips</li><li>Exercise techniques</li><li>Personalized plans</li></ul>",
      sender: 'assistant'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What's a good workout for beginners?",
    "How can I improve my running stamina?",
    "What should I eat before a workout?",
    "Can you create a weekly workout plan for me?"
  ]);
  
  const { currentUser, refreshUserData } = useAuth();
  const { darkMode } = useTheme();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus on input when component loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Format AI response with proper HTML markup
  const formatAiResponse = (text) => {
    if (!text) return '';
    
    // Remove any accidental ** markers around text (convert to regular text, not bold)
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Format main headings (## Heading)
    text = text.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>');
    
    // Format subheadings (### Heading)
    text = text.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
    
    // Format numbered lists with headers
    text = text.replace(/^(\d+\.\s*)(.*?)$/gm, 
      '<div class="list-item"><div class="list-number">$1</div><div class="list-content">$2</div></div>');
    
    // Format bullet lists
    text = text.replace(/^\*\s+(.*?)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
    
    // Format section headings (Title: Content)
    text = text.replace(/([A-Z][A-Za-z\s]+):(?=\s)/g, '<strong>$1:</strong>');
    
    // Add proper line breaks for paragraphs
    text = text.replace(/\n\n/g, '</p><p>');
    
    // Wrap the whole text in paragraphs
    text = `<p>${text}</p>`;
    
    return text;
  };
  
  // Send message function
  const sendMessage = async (content, isQuickQuestion = false) => {
    if (!content.trim() && !isQuickQuestion) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user'
    };
    
    // Update messages state with user's message
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Clear input field if it's not a quick question
    if (!isQuickQuestion) {
      setInputValue('');
    }
    
    // Show loading state
    setIsLoading(true);
    setError('');
    
    try {
      // Get user profile data for personalized responses
      let userProfile = null;
      if (currentUser) {
        const userData = await refreshUserData();
        if (userData) {
          userProfile = {
            fitnessLevel: 'intermediate', // Default value
            fitnessGoals: ['strength', 'endurance'], // Default values
            limitations: '',
            preferredWorkoutDuration: 30, // Default 30 minutes
            equipmentAvailable: ['bodyweight', 'dumbbells'] // Default equipment
          };
        }
      }
      
      // Analyze if the message contains specific workout plan request
      const isWorkoutPlanRequest = content.toLowerCase().includes('workout plan') || 
                                 content.toLowerCase().includes('exercise plan') ||
                                 content.toLowerCase().includes('training program');
      
      // Generate appropriate response based on message content
      let responseText;
      
      if (isWorkoutPlanRequest && userProfile) {
        responseText = await getWorkoutSuggestions(userProfile);
      } else {
        // For general fitness advice
        responseText = await getFitnessAdvice(
          content,
          userProfile?.fitnessLevel || 'intermediate',
          userProfile?.fitnessGoals || []
        );
      }
      
      // Update messages with AI response
      const aiMessage = {
        id: `ai-${Date.now()}`,
        content: responseText,
        formattedContent: formatAiResponse(responseText),
        sender: 'assistant'
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // Update suggested questions based on the context
      updateSuggestedQuestions(content);
      
    } catch (err) {
      console.error('Error getting AI response:', err);
      let errorMessage = 'Sorry, I had trouble responding. Please try again.';
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 500) {
          errorMessage = 'Server error: The AI service is currently unavailable. Please try again later.';
        } else if (err.response.data && err.response.data.error) {
          errorMessage = `Error: ${err.response.data.error}`;
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        errorMessage = 'Network error: Unable to connect to the AI service.';
      }
      
      setError(errorMessage);
      
      // Add an error message to the chat
      const errorAiMessage = {
        id: `ai-error-${Date.now()}`,
        content: errorMessage,
        formattedContent: `<p class="error-text">${errorMessage}</p>`,
        sender: 'assistant',
        isError: true
      };
      
      setMessages(prevMessages => [...prevMessages, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update suggested questions based on conversation context
  const updateSuggestedQuestions = (lastUserMessage) => {
    const lowercaseMessage = lastUserMessage.toLowerCase();
    
    if (lowercaseMessage.includes('workout') || lowercaseMessage.includes('exercise')) {
      setSuggestedQuestions([
        "Can you make the workout more challenging?",
        "What muscles does this target?",
        "How many calories will this burn?",
        "What's a good cool-down routine?"
      ]);
    } else if (lowercaseMessage.includes('diet') || lowercaseMessage.includes('nutrition') || lowercaseMessage.includes('eat')) {
      setSuggestedQuestions([
        "What should I eat for post-workout recovery?",
        "How much protein do I need daily?",
        "What foods should I avoid before working out?",
        "Can you suggest a meal plan for weight loss?"
      ]);
    } else if (lowercaseMessage.includes('cardio') || lowercaseMessage.includes('running') || lowercaseMessage.includes('stamina')) {
      setSuggestedQuestions([
        "How can I increase my endurance?",
        "What's the best way to avoid runner's knee?",
        "How often should I do cardio?",
        "Is HIIT better than steady-state cardio?"
      ]);
    } else {
      setSuggestedQuestions([
        "How can I stay motivated?",
        "What are signs of overtraining?",
        "How much rest do I need between workouts?",
        "What's the best time of day to exercise?"
      ]);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };
  
  // Handle quick question click
  const handleQuickQuestionClick = (question) => {
    sendMessage(question, true);
  };
  
  return (
    <div className={`page-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="page-header">
        <h1 className="page-title">
          <SmartToyIcon style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          AI Fitness Coach
        </h1>
        <div className="ai-subtitle">Powered by Gemini AI</div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className={`content-card ${darkMode ? 'dark-mode' : ''}`}>
        <div className="ai-chat-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`ai-message-bubble ${message.sender === 'user' ? 'ai-user-message' : 'ai-assistant-message'} ${message.isError ? 'ai-error-message' : ''}`}
            >
              <div className="ai-message-content">
                {message.sender === 'assistant' && message.formattedContent ? (
                  <div dangerouslySetInnerHTML={{ __html: message.formattedContent }} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="ai-message-bubble ai-assistant-message ai-loading">
              <div className="ai-loading-dots">
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="ai-suggested-questions">
          {suggestedQuestions.map((question, index) => (
            <button 
              key={index} 
              className="ai-question-chip"
              onClick={() => handleQuickQuestionClick(question)}
            >
              {question}
            </button>
          ))}
        </div>
        
        <form className="ai-input-form" onSubmit={handleSubmit}>
          <div className="ai-message-input-container">
            <input 
              ref={inputRef}
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about fitness..."
              disabled={isLoading}
              className="ai-message-input"
            />
            <button 
              type="submit" 
              className="ai-send-button"
              disabled={isLoading || !inputValue.trim()}
            >
              <SendIcon />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiChat; 