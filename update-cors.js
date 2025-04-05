const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function setCors() {
  try {
    // Initialize storage
    const storage = new Storage();
    
    // Your bucket name (should match your Firebase project)
    const bucketName = 'fitcheck-33a1a.appspot.com';
    
    // Get bucket
    const bucket = storage.bucket(bucketName);
    
    // Read CORS configuration
    const corsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'cors.json'), 'utf8'));
    
    // Set CORS configuration
    await bucket.setCorsConfiguration(corsConfig);
    
    console.log(`CORS configuration updated for bucket ${bucketName}`);
  } catch (error) {
    console.error('Error updating CORS configuration:', error);
  }
}

setCors(); 