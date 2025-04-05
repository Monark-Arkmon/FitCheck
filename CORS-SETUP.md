# Firebase Storage CORS Configuration Guide

To fix the CORS issues with Firebase Storage, follow these steps:

## Method 1: Using Google Cloud Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project "fitcheck-33a1a"
3. In the left sidebar, click on "Storage"
4. If you haven't set up Storage yet, click "Get Started" and follow the setup wizard
5. Once Storage is set up, click on the "Rules" tab at the top
6. Copy and paste the rules from the `storage.rules` file in your project
7. Click "Publish"

## Method 2: Using gsutil (Google Cloud CLI)

If you have access to Google Cloud SDK, you can apply the CORS configuration:

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Log in with: `gcloud auth login`
3. Set your project: `gcloud config set project fitcheck-33a1a`
4. Apply CORS configuration: 
   ```
   gsutil cors set cors.json gs://fitcheck-33a1a.appspot.com
   ```

## Debugging CORS Issues

If you continue to experience CORS issues:

1. Open browser developer tools (F12)
2. Go to the Network tab
3. Attempt to upload an image
4. Look for failed requests to Firebase Storage
5. Check the response headers for "Access-Control-Allow-Origin"

## Alternative Solution for Local Development

For local development, try one of these approaches:

1. Use a smaller image file (under 1MB)
2. Try a different image format (JPEG or PNG)
3. Install a CORS browser extension to bypass CORS for testing
4. Use a production build for testing uploads

## Fixing Permissions Issues

To fix permissions issues with Firestore:

1. Make sure the Firestore rules have been properly deployed
2. Ensure the user is authenticated before trying to add check-ins
3. Check that the user ID in the check-in data matches the authenticated user's ID 