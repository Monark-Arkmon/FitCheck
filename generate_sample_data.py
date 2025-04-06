import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import random
import time
import uuid
from google.cloud.firestore_v1.transforms import SERVER_TIMESTAMP

cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

# Expanded list of users with more variety (50+ users)
sample_users = [
    {"displayName": "Alex Johnson", "streak": 14, "fitnessLevel": "intermediate"},
    {"displayName": "Taylor Williams", "streak": 21, "fitnessLevel": "advanced"},
    {"displayName": "Jordan Smith", "streak": 7, "fitnessLevel": "beginner"},
    {"displayName": "Morgan Bailey", "streak": 30, "fitnessLevel": "advanced"},
    {"displayName": "Casey Parker", "streak": 5, "fitnessLevel": "beginner"},
    {"displayName": "Riley Thompson", "streak": 18, "fitnessLevel": "intermediate"},
    {"displayName": "Drew Wilson", "streak": 9, "fitnessLevel": "beginner"},
    {"displayName": "Jamie Davis", "streak": 12, "fitnessLevel": "intermediate"},
    {"displayName": "Avery Brown", "streak": 25, "fitnessLevel": "advanced"},
    {"displayName": "Quinn Martinez", "streak": 3, "fitnessLevel": "beginner"},
    {"displayName": "Reese Garcia", "streak": 16, "fitnessLevel": "intermediate"},
    {"displayName": "Skyler Rodriguez", "streak": 10, "fitnessLevel": "intermediate"},
    {"displayName": "Dakota Lee", "streak": 19, "fitnessLevel": "intermediate"},
    {"displayName": "Hayden Clark", "streak": 8, "fitnessLevel": "beginner"},
    {"displayName": "Finley Lewis", "streak": 22, "fitnessLevel": "advanced"},
    {"displayName": "Blake Turner", "streak": 4, "fitnessLevel": "beginner"},
    {"displayName": "Charlie Gonzalez", "streak": 27, "fitnessLevel": "advanced"},
    {"displayName": "Jesse Moore", "streak": 11, "fitnessLevel": "intermediate"},
    {"displayName": "Peyton Scott", "streak": 15, "fitnessLevel": "intermediate"},
    {"displayName": "Cameron White", "streak": 6, "fitnessLevel": "beginner"},
    {"displayName": "Elena Rodriguez", "streak": 42, "fitnessLevel": "expert"},
    {"displayName": "Michael Chen", "streak": 33, "fitnessLevel": "advanced"},
    {"displayName": "Zoe Patel", "streak": 19, "fitnessLevel": "intermediate"},
    {"displayName": "Liam O'Connor", "streak": 27, "fitnessLevel": "advanced"},
    {"displayName": "Sophia Kim", "streak": 8, "fitnessLevel": "beginner"},
    {"displayName": "Noah Washington", "streak": 15, "fitnessLevel": "intermediate"},
    {"displayName": "Isabella Jackson", "streak": 31, "fitnessLevel": "advanced"},
    {"displayName": "Ethan Perez", "streak": 5, "fitnessLevel": "beginner"},
    {"displayName": "Ava Gupta", "streak": 24, "fitnessLevel": "advanced"},
    {"displayName": "Oliver Singh", "streak": 13, "fitnessLevel": "intermediate"},
    {"displayName": "Charlotte Wong", "streak": 37, "fitnessLevel": "expert"},
    {"displayName": "William Ahmed", "streak": 9, "fitnessLevel": "beginner"},
    {"displayName": "Emma Nguyen", "streak": 22, "fitnessLevel": "advanced"},
    {"displayName": "James Kowalski", "streak": 16, "fitnessLevel": "intermediate"},
    {"displayName": "Amelia Santos", "streak": 45, "fitnessLevel": "expert"},
    {"displayName": "Benjamin Cohen", "streak": 11, "fitnessLevel": "intermediate"},
    {"displayName": "Mia Okafor", "streak": 28, "fitnessLevel": "advanced"},
    {"displayName": "Lucas Rivera", "streak": 7, "fitnessLevel": "beginner"},
    {"displayName": "Harper Ali", "streak": 18, "fitnessLevel": "intermediate"},
    {"displayName": "Mason Pham", "streak": 36, "fitnessLevel": "advanced"},
    {"displayName": "Evelyn Schmidt", "streak": 14, "fitnessLevel": "intermediate"},
    {"displayName": "Logan Murphy", "streak": 4, "fitnessLevel": "beginner"},
    {"displayName": "Abigail Kennedy", "streak": 29, "fitnessLevel": "advanced"},
    {"displayName": "Aiden O'Brien", "streak": 12, "fitnessLevel": "intermediate"},
    {"displayName": "Scarlett Yamamoto", "streak": 39, "fitnessLevel": "expert"},
    {"displayName": "Jacob Rossi", "streak": 17, "fitnessLevel": "intermediate"},
    {"displayName": "Aria Diaz", "streak": 23, "fitnessLevel": "advanced"},
    {"displayName": "Jackson Kumar", "streak": 8, "fitnessLevel": "beginner"},
    {"displayName": "Lily Hernandez", "streak": 26, "fitnessLevel": "advanced"},
    {"displayName": "Gabriel Sharma", "streak": 13, "fitnessLevel": "intermediate"},
    {"displayName": "Sofia Ivanova", "streak": 32, "fitnessLevel": "advanced"},
    {"displayName": "Ryan Tanaka", "streak": 6, "fitnessLevel": "beginner"},
    {"displayName": "Chloe Sato", "streak": 41, "fitnessLevel": "expert"},
    {"displayName": "Leo Martinez", "streak": 20, "fitnessLevel": "advanced"},
    {"displayName": "Layla Choi", "streak": 10, "fitnessLevel": "intermediate"},
    {"displayName": "Luke Fischer", "streak": 7, "fitnessLevel": "beginner"},
    {"displayName": "Hannah Petrov", "streak": 35, "fitnessLevel": "expert"},
    {"displayName": "David Navarro", "streak": 19, "fitnessLevel": "intermediate"},
    {"displayName": "Zara Malhotra", "streak": 28, "fitnessLevel": "advanced"},
    {"displayName": "Joseph Wu", "streak": 11, "fitnessLevel": "intermediate"}
]

# Expanded list of activities
activities = [
    'cardio',
    'strength training',
    'yoga',
    'hiking',
    'running',
    'swimming',
    'cycling',
    'HIIT',
    'pilates',
    'crossfit',
    'boxing',
    'climbing',
    'rowing',
    'martial arts',
    'tennis',
    'basketball',
    'soccer',
    'volleyball',
    'dance',
    'zumba',
    'barre',
    'spinning',
    'kickboxing',
    'tai chi',
    'functional training',
    'calisthenics',
    'trail running',
    'jump rope',
    'weight lifting',
    'circuit training',
    'gymnastics',
    'interval training',
    'power walking',
    'elliptical',
    'stair climber',
    'track workouts',
    'currently working out',
    'worked out earlier',
    'skipping today',
    'rest day',
    'recovery session',
    'stretching'
]

# Expanded list of tags
sample_tags = [
    'cardio',
    'strength',
    'flexibility',
    'hiit',
    'yoga',
    'running',
    'cycling',
    'swimming',
    'weightlifting',
    'crossfit',
    'fitness',
    'workout',
    'training',
    'motivation',
    'gym',
    'health',
    'wellness',
    'exercise',
    'gains',
    'fitnessmotivation',
    'personalrecord',
    'endurance',
    'mobility',
    'bodybuilding',
    'functionalfitness',
    'recovery',
    'nutrition',
    'strengthtraining',
    'core',
    'balance',
    'agility',
    'power',
    'speed',
    'coordination',
    'stretching',
    'mindfulness',
    'morningworkout',
    'eveningworkout',
    'outdoorfitness',
    'homeworkout',
    'gymmotivation',
    'fitnessjourney',
    'transformation',
    'progress',
    'fitlife',
    'activelifestyle',
    'healthyhabits',
    'fitspo',
    'strongnotskinny',
    'fitfam'
]

# Expanded list of notes with more variety
sample_notes = [
    'Great workout today! Feeling stronger than ever.',
    'Taking it easy today, focusing on recovery.',
    'Pushed myself harder than usual, feeling the burn!',
    'Trying a new routine, excited to see results.',
    'Not feeling 100% but showed up anyway.',
    'Personal best on deadlifts today!',
    'Quick session during lunch break.',
    'Morning workout to start the day right.',
    'Evening session to destress after work.',
    'Focusing on form over weight today.',
    'Group class was super motivating!',
    'Had to modify some exercises due to minor injury.',
    'Outdoor workout in the park, beautiful day!',
    'Feeling sore from yesterday but pushed through.',
    'Recovery day with light stretching.',
    'Trying to be more consistent this month.',
    'Partner workout was fun and challenging!',
    'Focusing on upper body strength today.',
    'Leg day! Might have trouble walking tomorrow.',
    'Core workout - building that strength from within!',
    'Increased my weights on all exercises today!',
    'Trying intermittent fasting with my workout routine.',
    'Hit a new PR on my 5k run time!',
    'First time doing Olympic lifts - challenging but fun.',
    'Taking progress photos today, seeing changes!',
    'Found a great new workout playlist that kept me going.',
    'Nutrition on point this week, feeling the difference in my workouts.',
    'Added an extra set to each exercise for progressive overload.',
    'Focusing on mind-muscle connection during strength training.',
    'Working on my flexibility to improve overall performance.',
    'Mixed cardio and strength today for a full-body burn.',
    'Training for my first half marathon, long run today!',
    'Tried a new HIIT class, way more intense than expected!',
    'Working on mastering pull-ups, almost there!',
    'Focusing on mobility work to prevent injuries.',
    'Hot yoga session - sweating out all the toxins!',
    'Feeling stronger each week, consistency is key.',
    'Got my friend to join me today, workout buddies make it better!',
    'Rest day but still getting steps in with a long walk.',
    'Working on my running cadence to improve efficiency.',
    'Experimenting with pre-workout nutrition to optimize energy levels.',
    'Did a fitness assessment today - seeing progress in all areas!',
    'Focusing on unilateral exercises to fix imbalances.',
    'Increased my protein intake this week, feeling more recovered.',
    'Working out at a new gym today, great equipment!',
    'Meditation before workout really improved my focus.',
    'Taking progress videos to check my form and make improvements.',
    'Tracking my heart rate during workouts to optimize intensity.',
    'Feeling grateful for my health and ability to exercise today.',
    'Added dynamic stretching to my warm-up, felt much better during my workout.'
]

# Expanded list of photo URLs
sample_photo_urls = [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1616279969862-90f1a62e4499?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1518609571773-39b7d303a87b?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1579126038374-6064e9370f0f?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1609899537878-88d5ba429bdf?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1598971639058-b106186a935e?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?auto=format&fit=crop&q=80&w=1000'
]

# Achievements list
sample_achievements = [
    "7-Day Streak", 
    "30-Day Streak", 
    "100 Workouts", 
    "Morning Warrior", 
    "Strength Master",
    "Cardio King", 
    "Yoga Guru", 
    "Consistency Champion", 
    "Progress Tracker",
    "Community Leader", 
    "First Post", 
    "Photo Master"
]

# Locations for workouts
sample_locations = [
    "Home Gym",
    "Local Fitness Center",
    "Outdoor Park",
    "Running Trail",
    "Beach",
    "Mountain Hike",
    "Community Center",
    "CrossFit Box",
    "Yoga Studio",
    "Swimming Pool",
    "Hotel Gym",
    "Basketball Court",
    "Tennis Court",
    "Rock Climbing Gym",
    "Track Field"
]

def get_random_date(days_back=30):
    """Generate a random date within the last X days"""
    now = datetime.datetime.now()
    random_days = random.randint(0, days_back)
    random_seconds = random.randint(0, 24 * 60 * 60)
    random_date = now - datetime.timedelta(days=random_days, seconds=random_seconds)
    return random_date

def get_random_item(array):
    """Get a random item from an array"""
    return random.choice(array)

def get_random_tags(min_tags=1, max_tags=5):
    """Create a random list of tags"""
    num_tags = random.randint(min_tags, max_tags)
    return random.sample(sample_tags, num_tags)

def get_random_achievements(min_achievements=0, max_achievements=5):
    """Create a random list of achievements"""
    num_achievements = random.randint(min_achievements, max_achievements)
    return random.sample(sample_achievements, num_achievements)

def generate_check_in(user_id, user_name, user_photo=None):
    """Create a random check-in with more detailed data"""
    # 70% chance to have a workout, 30% chance to be busy
    status = 'workout' if random.random() < 0.7 else 'busy'
    
    # Base check-in data
    check_in = {
        'userId': user_id,
        'userDisplayName': user_name,
        'userPhotoURL': user_photo,
        'status': status,
        'timestamp': get_random_date(),
        'likes': random.randint(0, 30),  # Random likes count
        'comments': random.randint(0, 10)  # Random comments count
    }
    
    # Add activity-specific data if it's a workout
    if status == 'workout':
        check_in['activityType'] = get_random_item(activities)
        check_in['notes'] = get_random_item(sample_notes)
        
        # Add tags to the check-in (1-5 random tags)
        check_in['tags'] = get_random_tags()
        
        # Add workout duration (15-120 minutes)
        check_in['duration'] = random.randint(15, 120)
        
        # Add workout intensity (1-10)
        check_in['intensity'] = random.randint(1, 10)
        
        # Add location (70% chance)
        if random.random() < 0.7:
            check_in['location'] = get_random_item(sample_locations)
        
        # Add mood (1-5 stars)
        check_in['mood'] = random.randint(1, 5)
        
        # 60% chance to have a photo
        if random.random() < 0.6:
            check_in['photoUrl'] = get_random_item(sample_photo_urls)
    
    return check_in

def generate_story(user_id, user_name, user_photo=None):
    """Create a random story with more details"""
    now = datetime.datetime.now()
    expires_at = now + datetime.timedelta(hours=24)
    
    story = {
        'userId': user_id,
        'userDisplayName': user_name,
        'userPhotoURL': user_photo,
        'photoUrl': get_random_item(sample_photo_urls),
        'caption': get_random_item(sample_notes) if random.random() < 0.7 else None,
        'timestamp': get_random_date(days_back=1),  # Stories are more recent
        'expiresAt': expires_at,
        # 50% chance to add tags to stories
        'tags': get_random_tags() if random.random() < 0.5 else [],
        # Add location (50% chance)
        'location': get_random_item(sample_locations) if random.random() < 0.5 else None,
        # Add mood (70% chance)
        'mood': random.randint(1, 5) if random.random() < 0.7 else None
    }
    
    return story

def generate_user():
    """Create a user and their check-ins with more detailed profile"""
    user_data = get_random_item(sample_users)
    
    # Create user avatar URL using ui-avatars.com or random profile pic
    if random.random() < 0.7:
        avatar_url = f"https://ui-avatars.com/api/?name={user_data['displayName'].replace(' ', '+')}&background=random&size=200"
    else:
        # Use a random photo from Unsplash as profile pic
        avatar_url = f"https://images.unsplash.com/photo-{1500000000 + random.randint(1, 999999)}?auto=format&fit=crop&w=200&h=200"
    
    # Create user document with expanded profile data
    user_ref = db.collection('users').document()
    user_id = user_ref.id
    
    # Additional user profile data
    bio = random.choice([
        f"Fitness enthusiast | {user_data['fitnessLevel'].capitalize()} level",
        f"Working on becoming my best self through fitness",
        f"Love {get_random_item(activities)} and {get_random_item(activities)}",
        f"{user_data['fitnessLevel'].capitalize()} fitness journey in progress",
        f"Passionate about health and wellness",
        f"Training for a {get_random_item(['marathon', 'triathlon', 'competition', 'race', 'tournament'])}",
        f"Fitness is my therapy",
        None  # Some users might not have a bio
    ])
    
    # User goals
    goals = random.sample([
        "Lose weight",
        "Build muscle",
        "Improve endurance",
        "Train for competition",
        "Stay active",
        "Develop healthy habits",
        "Reduce stress",
        "Increase flexibility",
        "Improve overall fitness"
    ], random.randint(1, 3))
    
    # User stats
    total_workouts = random.randint(user_data['streak'], user_data['streak'] * 3)
    
    user_ref.set({
        'displayName': user_data['displayName'],
        'streak': user_data['streak'],
        'photoURL': avatar_url,
        'fitnessLevel': user_data['fitnessLevel'],
        'bio': bio,
        'goals': goals,
        'totalWorkouts': total_workouts,
        'achievements': get_random_achievements(min_achievements=1, max_achievements=8),
        'favoriteActivities': random.sample(activities, random.randint(1, 5)),
        'joined': get_random_date(days_back=180),  # User joined in the last 180 days
        'lastLogin': SERVER_TIMESTAMP,
        'createdAt': SERVER_TIMESTAMP
    })
    
    print(f"Created user: {user_data['displayName']} (ID: {user_id})")
    
    # Generate 5-12 check-ins for this user (more data per user)
    num_check_ins = random.randint(5, 12)
    
    for i in range(num_check_ins):
        check_in_data = generate_check_in(user_id, user_data['displayName'], avatar_url)
        
        # Add to feed collection
        feed_ref = db.collection('feed').document()
        feed_ref.set(check_in_data)
        
        # Add to user's check-ins subcollection
        user_check_in_ref = db.collection(f'users/{user_id}/checkIns').document()
        user_check_in_ref.set(check_in_data)
        
        print(f"  Added check-in {i+1}/{num_check_ins} for {user_data['displayName']}")
    
    # Create a story for some users (50% chance, increased from 40%)
    if random.random() < 0.5:
        # Some users might have multiple stories
        num_stories = random.randint(1, 3)
        
        for j in range(num_stories):
            story_data = generate_story(user_id, user_data['displayName'], avatar_url)
            
            # Add to stories collection
            story_ref = db.collection('stories').document()
            story_id = story_ref.id
            story_ref.set(story_data)
            
            # Add to user's stories subcollection
            user_story_ref = db.collection(f'users/{user_id}/stories').document()
            user_story_ref.set({
                'storyId': story_id,
                'timestamp': SERVER_TIMESTAMP
            })
            
            # Also add to feed collection as a story-type entry
            feed_story_data = story_data.copy()
            feed_story_data['type'] = 'story'
            feed_story_data['likes'] = random.randint(0, 25)
            
            feed_story_ref = db.collection('feed').document()
            feed_story_ref.set(feed_story_data)
            
            print(f"  Added story {j+1}/{num_stories} for {user_data['displayName']}")
    
    # Add some followers and following relationships (social graph)
    return user_id

def generate_social_graph(user_ids):
    """Generate followers and following relationships between users"""
    print("Generating social connections between users...")
    
    for user_id in user_ids:
        # Each user follows 3-15 random other users
        num_following = random.randint(3, 15)
        following_users = random.sample([uid for uid in user_ids if uid != user_id], min(num_following, len(user_ids)-1))
        
        # Create following collection for this user
        for following_id in following_users:
            db.collection(f'users/{user_id}/following').document(following_id).set({
                'userId': following_id,
                'timestamp': SERVER_TIMESTAMP
            })
        
        # Create followers collection for the users being followed
        for following_id in following_users:
            db.collection(f'users/{following_id}/followers').document(user_id).set({
                'userId': user_id,
                'timestamp': SERVER_TIMESTAMP
            })
    
    print(f"Social graph generated with followers and following relationships")

def generate_metadata():
    """Generate metadata including available tags and activities"""
    print("Creating metadata documents...")
    
    # Create metadata/tags document
    tags_ref = db.collection('metadata').document('tags')
    tags_ref.set({
        'availableTags': sample_tags,
        'updatedAt': SERVER_TIMESTAMP
    })
    
    # Create metadata/activities document
    activities_ref = db.collection('metadata').document('activities')
    activities_ref.set({
        'availableActivities': activities,
        'updatedAt': SERVER_TIMESTAMP
    })
    
    # Create metadata/achievements document
    achievements_ref = db.collection('metadata').document('achievements')
    achievements_ref.set({
        'availableAchievements': sample_achievements,
        'updatedAt': SERVER_TIMESTAMP
    })
    
    print(f"Added {len(sample_tags)} tags, {len(activities)} activities, and {len(sample_achievements)} achievements to metadata")

def generate_all_sample_data():
    """Generate sample data for all users"""
    print("Starting sample data generation...")
    
    # First generate metadata
    generate_metadata()
    
    # Generate all users one by one
    user_ids = []
    for i in range(len(sample_users)):
        try:
            user_id = generate_user()
            user_ids.append(user_id)
            print(f"Successfully generated user {i+1}/{len(sample_users)}")
            # Small delay to avoid potential rate limiting
            time.sleep(0.5)
        except Exception as e:
            print(f"Error generating user: {e}")
    
    # Generate social connections between users
    generate_social_graph(user_ids)
    
    print("Sample data generation complete!")

def clear_sample_data():
    """This function would delete all sample data
    Not implemented for safety reasons as it's difficult to safely
    identify and remove only sample data"""
    print("Clearing sample data is not implemented for safety reasons.")
    print("It would be difficult to safely identify and remove only sample data without affecting real user data.")
    print("If you want to clear data, use the Firebase console or write a more specialized script.")

if __name__ == "__main__":
    choice = input("What would you like to do?\n1. Generate sample data\n2. Clear sample data (not implemented)\nEnter 1 or 2: ")
    
    if choice == "1":
        generate_all_sample_data()
    elif choice == "2":
        clear_sample_data()
    else:
        print("Invalid choice. Please run the script again and enter 1 or 2.") 