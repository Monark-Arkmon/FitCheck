const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const path = require("path");
const os = require("os");
const fs = require("fs");

const Busboy = require("busboy");

admin.initializeApp();

exports.uploadProfileImage = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({error: "Method not allowed"});
      }
      const busboyInstance = Busboy({headers: req.headers});
      const tmpdir = os.tmpdir();
      const fields = {};
      const uploads = {};
      busboyInstance.on("field", (fieldname, val) => {
        fields[fieldname] = val;
      });
      busboyInstance.on("file", (fieldname, file, filename, encoding, mimetype) => {
        const filenameToUse =
        typeof filename==="object"?filename.filename:filename;
        const filepath = path.join(tmpdir, filenameToUse);
        uploads[fieldname] = filepath;
        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);
      });
      busboyInstance.on("finish", async () => {
        try {
          // Verify Firebase auth ID token
          const idToken = req.headers.authorization.split("Bearer ")[1];
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          const uid = decodedToken.uid;
          // Upload file to Firebase Storage
          const filePath = uploads["profileImage"];
          if (!filePath) {
            return res.status(400).json({error: "No profile image found"});
          }
          const bucket = admin.storage().bucket();
          // Upload to storage with user's UID in the path
          const destination = `profile_images/${uid}`;
          await bucket.upload(filePath, {
            destination,
            metadata: {
              contentType: "image/jpeg",
            },
            // Make the file publicly readable
            public: true,
          });
          const downloadURL = `https://storage.googleapis.com/${bucket.name}/${destination}`;
          await admin.auth().updateUser(uid, {
            photoURL: downloadURL,
          });
          // Return the download URL
          return res.status(200).json({photoURL: downloadURL});
        } catch (error) {
          console.error("Error:", error);
          return res.status(500).json({error: error.message});
        }
      });
      busboyInstance.end(req.rawBody);
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({error: error.message});
    }
  });
});

// Generic image upload function for all application needs
exports.uploadImage = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({error: "Method not allowed"});
      }
      
      // Fix variable name to match the imported module
      const busboyInstance = Busboy({headers: req.headers});
      
      const tmpdir = os.tmpdir();
      const fields = {};
      const uploads = {};
      
      busboyInstance.on("field", (fieldname, val) => {
        fields[fieldname] = val;
      });
      
      busboyInstance.on("file", (fieldname, file, filename, encoding, mimetype) => {
        const filenameToUse = typeof filename === "object" ? filename.filename : filename;
        const filepath = path.join(tmpdir, filenameToUse);
        uploads[fieldname] = { 
          filepath, 
          mimetype: mimetype || "image/jpeg" 
        };
        
        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);
      });
      
      busboyInstance.on("finish", async () => {
        try {
          // Verify Firebase auth ID token
          const idToken = req.headers.authorization.split("Bearer ")[1];
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          const uid = decodedToken.uid;
          
          // Get file info
          const fileInfo = uploads["image"];
          if (!fileInfo) {
            return res.status(400).json({error: "No image found in request"});
          }
          
          // Get folder from request or use default
          const folder = fields.folder || "images";
          
          // Generate unique filename with timestamp
          const timestamp = fields.timestamp || Date.now();
          const randomId = Math.random().toString(36).substring(2, 8);
          const extension = path.extname(fileInfo.filepath) || ".jpg";
          
          // Set destination path in storage
          const destination = `${folder}/${uid}/${timestamp}-${randomId}${extension}`;
          
          // Get bucket reference
          const bucket = admin.storage().bucket();
          
          // Upload to storage
          await bucket.upload(fileInfo.filepath, {
            destination,
            metadata: {
              contentType: fileInfo.mimetype,
              metadata: {
                firebaseStorageDownloadTokens: randomId,
                uploadedBy: uid,
                timestamp: timestamp
              }
            },
            public: true,
          });
          
          // Generate download URL
          const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
          
          // Clean up temporary file
          fs.unlinkSync(fileInfo.filepath);
          
          // Return success with the image URL
          return res.status(200).json({
            imageUrl,
            success: true
          });
        } catch (error) {
          console.error("Error processing image upload:", error);
          return res.status(500).json({error: error.message});
        }
      });
      
      busboyInstance.end(req.rawBody);
    } catch (error) {
      console.error("Error in image upload handler:", error);
      return res.status(500).json({error: error.message});
    }
  });
}); 