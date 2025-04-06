import axios from 'axios';

const SERVER_API_URL = '/api/ai/chat';

export const generateChatResponse = async (messages, model = 'gemini-2.0-flash') => {
  try {
    console.log('Sending request to', SERVER_API_URL);
    const response = await axios.post(SERVER_API_URL, {
      messages,
      model
    });
    
  
    if (response.data && response.data.text) {
      return response.data.text;
    } else {
      throw new Error('Invalid response structure from AI service');
    }
  } catch (error) {
    console.error('Error generating response from Gemini API:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};


const getFormattedPrompt = (query, contextInfo = {}) => {
  
  const contextSection = Object.entries(contextInfo)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `- ${key}: ${value.join(', ')}`;
      }
      return `- ${key}: ${value}`;
    })
    .join('\n');

  return `${query}${contextSection ? '\n\nContext:\n' + contextSection : ''}

IMPORTANT: Format your response using ONLY the following style rules - DO NOT use double asterisks (**) anywhere:
- Use "##" at the start of lines for main headings (e.g., ## Strength Training)
- Use "###" at the start of lines for subheadings (e.g., ### Beginner Plan)
- Use numbered lists with "1." format for steps or instructions
- Use "* " for bullet points in lists
- DO NOT use ** for bold or emphasis - use headings instead
- Create clear sections with headings and subheadings
- Keep your advice personalized, concise and actionable
- Include safety precautions where relevant`;
};


export const getFitnessAdvice = async (query, fitnessLevel = 'intermediate', fitnessGoals = []) => {
  try {
    
    if (query.toLowerCase().match(/^(hi|hello|hey|greetings|howdy).{0,5}$/)) {
      const greeting = `Hello! I'm your AI fitness coach. How can I help you with your fitness journey today? You can ask me about workout routines, nutrition advice, exercise techniques, or specific fitness goals.`;
      return greeting;
    }
    
    
    const enhancedQuery = getFormattedPrompt(`As a fitness expert, please provide advice on: ${query}`, {
      'Fitness level': fitnessLevel,
      'Fitness goals': fitnessGoals
    });
    
    const messages = [
      { 
        sender: 'system', 
        content: 'You are a professional fitness coach with expertise in workout routines, nutrition, and general fitness advice. Provide helpful, accurate, and safe fitness guidance. Always respond directly to the user query, even if it\'s a simple greeting.'
      },
      { sender: 'user', content: enhancedQuery }
    ];
    
    return await generateChatResponse(messages);
  } catch (error) {
    console.error('Error getting fitness advice:', error);
    throw error;
  }
};


export const analyzeWorkoutPhoto = async (photoDescription, exerciseType) => {
  try {
    
    const prompt = getFormattedPrompt(`Based on this workout photo showing ${photoDescription} for ${exerciseType}, analyze the form and provide feedback.`);
    
    const messages = [
      { 
        sender: 'system', 
        content: 'You are a professional fitness coach specialized in analyzing workout form and providing constructive feedback to improve safety and effectiveness.'
      },
      { sender: 'user', content: prompt }
    ];
    
    return await generateChatResponse(messages);
  } catch (error) {
    console.error('Error analyzing workout photo:', error);
    throw error;
  }
};


export const getWorkoutSuggestions = async (userProfile) => {
  try {
    const { fitnessLevel, fitnessGoals, limitations, preferredWorkoutDuration, equipmentAvailable } = userProfile;
    
    const prompt = getFormattedPrompt('Create a personalized workout plan based on the following user profile:', {
      'Fitness level': fitnessLevel,
      'Fitness goals': fitnessGoals,
      'Physical limitations or conditions': limitations || 'None',
      'Preferred workout duration': `${preferredWorkoutDuration} minutes`,
      'Available equipment': equipmentAvailable
    });
    
    const messages = [
      { 
        sender: 'system', 
        content: 'You are a professional fitness coach specializing in creating personalized workout plans tailored to individual needs and goals.'
      },
      { sender: 'user', content: prompt }
    ];
    
    return await generateChatResponse(messages);
  } catch (error) {
    console.error('Error getting workout suggestions:', error);
    throw error;
  }
}; 