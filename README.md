# Total number of members in the team - 
4

# Name of your project - 
FitCheck

# Have you used any Google technologies? (Please mention the names) - 
Firebase

# Have you used the Google Gemini API? (Yes/No) - 
Yes

# Describe the problem you identified that could exist in the year 2080. (Max 300 words) - 
By the year 2080, automation and AI advancements may drastically reduce physical activity in daily life. With most jobs becoming desk-based or fully remote, and virtual environments replacing real-world interaction, humans risk entering a prolonged state of sedentary behavior. This lifestyle shift could result in declining baseline fitness, rising chronic illnesses, and deteriorating mental health. As movement becomes optional, motivation to stay active may vanish, especially without daily structure or in-person encouragement. The future's convenience could ironically come at the cost of our health—unless we rethink how to naturally embed fitness into an increasingly digital lifestyle.

# Describe your proposed solution to that problem. (Max 300 words) - 
Our web app, FitCheck, inspires users to move more—even if it’s just a stretch or a walk. It sends random daily “fit check-ins” nudging people to log any movement, reinforcing that every step counts. A community-driven feed of real, unfiltered moments replaces the pressure of perfection, boosting motivation through relatability. With seamless integration into wearables or AR lenses, posting is instant and low-effort. FitCheck includes offline modes, small-space workouts, and health-based rewards, making it inclusive. It also supports mental wellness by celebrating rest days equally. In 2080, FitCheck redefines fitness—not as performance, but as presence, consistency, and connection.

# Give a brief summary of your code. (Max 300 words) - 

## Features

- **User Authentication**: Sign up, login with Firebase Auth
- **Random Daily Check-in System**: Receive notifications at random times within preferred time slots
- **Fitness Capture**: Take photos, tag activities, and submit check-ins
- **Diary Dashboard**: View your personal check-in history and stats
- **Social Feed**: Browse global check-ins from other users
- **Streak Feature**: Track consecutive days of fitness activity
- **Trending**: See trending users with the longest streaks
- **AI Assistant**: Chat with Gemini-powered fitness coach
- **Social Interactions**: Like posts and comment on other users posts

## Tech Stack

### Frontend
- React
- React Router
- Styled Components
- Firebase SDK (Auth, Firestore, Storage)

### Backend
- Node.js
- Express
- Firebase Admin SDK
- Gemini AI API

## Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase account
- Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Monark-Arkmon/fitcheck.git
cd fitcheck
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and fill in your credentials.

4. Create a Firebase service account key file:
   - Create a `serviceAccountKey.json` file based on `serviceAccountKey.example.json`
   - Fill in your Firebase service account credentials

5. Set up Firebase:
   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Create a web app and copy the configuration
   - Generate a service account key for admin access

6. Set up Gemini API:
   - Get an API key from [Google AI Studio](https://makersuite.google.com/)


### Running the Application

For development :
```bash
nodeserver.js
npm start
```

For production:
```bash
npm run build
npm run server
```


### Firebase Deployment

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login and initialize:
```bash
firebase login
firebase init
```

3. Deploy:
```bash
npm run build
firebase deploy
```

## Project Structure

```
fitcheck/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── social/      # like/comment components
│   │   ├── fitness/     # Fitness check-in components
|   │   ├── profile/     # Profile drop down components
│   │   └── navbar/      # navbar components
│   ├── context/         # React context providers
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── utils/           # Utility functions
├── server.js            # Express backend server
└── .env                 # Environment variables
```

## License

This project is licensed under the MIT License

## Acknowledgements

- [Firebase](https://firebase.google.com/)
- [Gemini AI](https://ai.google.dev/)
- [React](https://reactjs.org/)




