#!/usr/bin/env python3
import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import random
import time
import uuid
from google.cloud.firestore_v1.transforms import SERVER_TIMESTAMP

"""
Python script to generate and push sample data to Firebase Firestore
for the FitCheck fitness social media app
"""

# Initialize Firebase Admin SDK (you'll need to download your service account key)
# Download from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# Save as 'serviceAccountKey.json' in the same directory as this script
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()

# Sample user data
sample_users = [
    {"displayName": "Alex Johnson", "streak": 14},
    {"displayName": "Taylor Williams", "streak": 21},
    {"displayName": "Jordan Smith", "streak": 7},
    {"displayName": "Morgan Bailey", "streak": 30},
    {"displayName": "Casey Parker", "streak": 5},
    {"displayName": "Riley Thompson", "streak": 18},
    {"displayName": "Drew Wilson", "streak": 9},
    {"displayName": "Jamie Davis", "streak": 12},
    {"displayName": "Avery Brown", "streak": 25},
    {"displayName": "Quinn Martinez", "streak": 3},
    {"displayName": "Reese Garcia", "streak": 16},
    {"displayName": "Skyler Rodriguez", "streak": 10},
    {"displayName": "Dakota Lee", "streak": 19},
    {"displayName": "Hayden Clark", "streak": 8},
    {"displayName": "Finley Lewis", "streak": 22},
    {"displayName": "Blake Turner", "streak": 4},
    {"displayName": "Charlie Gonzalez", "streak": 27},
    {"displayName": "Jesse Moore", "streak": 11},
    {"displayName": "Peyton Scott", "streak": 15},
    {"displayName": "Cameron White", "streak": 6}
]

# Sample activity types
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
    'currently working out',
    'worked out earlier',
    'skipping today'
]

# Sample tags for fitness posts
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
    'fitnessmotivation'
]

# Sample notes
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
    'Core workout - building that strength from within!'
]

# Sample fitness photo URLs from Unsplash
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
    'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&q=80&w=1000'
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

def get_random_tags(min_tags=1, max_tags=4):
    """Create a random list of tags"""
    num_tags = random.randint(min_tags, max_tags)
    return random.sample(sample_tags, num_tags)

def generate_check_in(user_id, user_name, user_photo=None):
    """Create a random check-in"""
    # 70% chance to have a workout, 30% chance to be busy
    status = 'workout' if random.random() < 0.7 else 'busy'
    
    # Base check-in data
    check_in = {
        'userId': user_id,
        'userDisplayName': user_name,
        'userPhotoURL': user_photo,
        'status': status,
        'timestamp': get_random_date(),
        'likes': random.randint(0, 15)  # Random likes count
    }
    
    # Add activity-specific data if it's a workout
    if status == 'workout':
        check_in['activityType'] = get_random_item(activities)
        check_in['notes'] = get_random_item(sample_notes)
        
        # Add tags to the check-in (1-4 random tags)
        check_in['tags'] = get_random_tags()
        
        # 60% chance to have a photo
        if random.random() < 0.6:
            check_in['photoUrl'] = get_random_item(sample_photo_urls)
    
    return check_in

def generate_story(user_id, user_name, user_photo=None):
    """Create a random story"""
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
        'tags': get_random_tags() if random.random() < 0.5 else []
    }
    
    return story

def generate_user():
    """Create a user and their check-ins"""
    user_data = get_random_item(sample_users)
    
    # Create user avatar URL using ui-avatars.com
    avatar_url = f"https://ui-avatars.com/api/?name={user_data['displayName'].replace(' ', '+')}&background=random&size=200"
    
    # Create user document
    user_ref = db.collection('users').document()
    user_id = user_ref.id
    
    user_ref.set({
        'displayName': user_data['displayName'],
        'streak': user_data['streak'],
        'photoURL': avatar_url,
        'lastLogin': SERVER_TIMESTAMP,
        'createdAt': SERVER_TIMESTAMP
    })
    
    print(f"Created user: {user_data['displayName']} (ID: {user_id})")
    
    # Generate 3-7 check-ins for this user
    num_check_ins = random.randint(3, 7)
    
    for i in range(num_check_ins):
        check_in_data = generate_check_in(user_id, user_data['displayName'], avatar_url)
        
        # Add to feed collection
        feed_ref = db.collection('feed').document()
        feed_ref.set(check_in_data)
        
        # Add to user's check-ins subcollection
        user_check_in_ref = db.collection(f'users/{user_id}/checkIns').document()
        user_check_in_ref.set(check_in_data)
        
        print(f"  Added check-in {i+1}/{num_check_ins} for {user_data['displayName']}")
    
    # Also create a story for some users (40% chance)
    if random.random() < 0.4:
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
        feed_story_data['likes'] = random.randint(0, 15)
        
        feed_story_ref = db.collection('feed').document()
        feed_story_ref.set(feed_story_data)
        
        print(f"  Added story for {user_data['displayName']}")
    
    return user_id

def generate_metadata():
    """Generate metadata including available tags"""
    print("Creating metadata document with available tags...")
    
    # Create metadata/tags document
    tags_ref = db.collection('metadata').document('tags')
    tags_ref.set({
        'availableTags': sample_tags,
        'updatedAt': SERVER_TIMESTAMP
    })
    
    print(f"Added {len(sample_tags)} tags to metadata")

def generate_all_sample_data():
    """Generate sample data for all users"""
    print("Starting sample data generation...")
    
    # First generate metadata
    generate_metadata()
    
    # Generate all users one by one
    for i in range(len(sample_users)):
        try:
            user_id = generate_user()
            print(f"Successfully generated user {i+1}/{len(sample_users)}")
            # Small delay to avoid potential rate limiting
            time.sleep(0.5)
        except Exception as e:
            print(f"Error generating user: {e}")
    
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