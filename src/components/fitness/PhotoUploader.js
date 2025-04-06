import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';

const PhotoUploader = ({ onPhotoUploaded, darkMode }) => {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [cameraSupported, setCameraSupported] = useState(true);
  
  React.useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('Camera API not supported in this browser');
      setCameraSupported(false);
    }
  }, []);

  const handleFileChange = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (!currentUser) {
      setError('You must be logged in to upload photos');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    if (onPhotoUploaded) {
      onPhotoUploaded({status: 'uploading', progress: 0});
    }

    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const extension = file.name?.split('.').pop() || 'jpg';
      const isCameraPhoto = file.name.includes('camera');
      
      // Use a more consistent path for camera photos vs uploaded photos
      const storageFolder = isCameraPhoto ? 'camera-photos' : 'uploaded-photos';
      const filename = `users/${currentUser.uid}/check-ins/${storageFolder}/${timestamp}-${randomId}.${extension}`;
      
      console.log(`Uploading file '${file.name}' to path: ${filename}`);
      console.log(`File details: type=${file.type}, size=${file.size}, lastModified=${new Date(file.lastModified).toISOString()}`);
      
      const storage = getStorage();
      const storageRef = ref(storage, filename);
      
      // Add detailed metadata for improved handling
      const metadata = {
        contentType: file.type || 'image/jpeg',
        customMetadata: {
          'source': isCameraPhoto ? 'camera' : 'upload',
          'timestamp': timestamp.toString(),
          'userId': currentUser.uid,
          'filename': file.name,
          'client-timestamp': new Date().toISOString()
        }
      };

      console.log('Uploading with metadata:', metadata);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload progress: ${Math.round(progress)}%`);
          
          if (onPhotoUploaded) {
            onPhotoUploaded({status: 'uploading', progress});
          }
        },
        (error) => {
          console.error('Upload failed:', error);
          setError('Failed to upload image. Please try again.');
          setIsUploading(false);
          
          if (onPhotoUploaded) {
            onPhotoUploaded({status: 'error', error: error.message});
          }
        },
        async () => {
          try {
            console.log('Upload completed successfully, getting download URL...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Upload successful, received URL:', downloadURL);
            
            // Verify URL validity before returning
            if (!downloadURL || typeof downloadURL !== 'string' || !downloadURL.startsWith('http')) {
              throw new Error('Invalid download URL received');
            }
            
            // Ensure consistent URL format
            const finalUrl = downloadURL.trim();
            console.log('Final URL to be sent to parent:', finalUrl);
            
            // Update local state first
            setPreviewUrl(finalUrl);
            
            // Then notify parent component
            if (onPhotoUploaded) {
              console.log('Notifying parent of completed upload with URL:', finalUrl);
              // Use setTimeout to ensure state updates have propagated
              setTimeout(() => {
                onPhotoUploaded({status: 'complete', url: finalUrl});
              }, 0);
            }
            
            setIsUploading(false);
            setUploadProgress(100);
          } catch (error) {
            console.error('Failed to get download URL:', error);
            setError('Failed to process uploaded image');
            setIsUploading(false);
            
            if (onPhotoUploaded) {
              onPhotoUploaded({status: 'error', error: 'Failed to get download URL'});
            }
          }
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setError('An error occurred during upload');
      setIsUploading(false);
      
      if (onPhotoUploaded) {
        onPhotoUploaded({status: 'error', error: error.message});
      }
    }
  };

  const startCapture = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setError(null);
    
    setIsCapturing(true);
    
    setTimeout(async () => {
      try {
        if (!videoRef.current) {
          console.error('Video element not available after render');
          setError('Camera initialization failed. Please try again.');
          setIsCapturing(false);
          return;
        }
        
        setIsCameraReady(false);
        
        const constraints = {
          video: { 
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera API is not supported in this browser or device.');
          setIsCapturing(false);
          setCameraSupported(false);
          return;
        }
        
        console.log('Requesting camera access with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!stream || !stream.active) {
          throw new Error('Stream is not active');
        }
        
        mediaStreamRef.current = stream;
        
        console.log('Setting video source to stream');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, playing video');
          videoRef.current.play()
            .then(() => {
              console.log('Video playing successfully');
              setIsCameraReady(true);
            })
            .catch(err => {
              console.error('Error playing video:', err);
              setError('Could not start camera preview. Please try again.');
              stopCapture();
            });
        };
        
        videoRef.current.onerror = (err) => {
          console.error('Video element error:', err);
          setError('Error with camera preview. Please try again.');
          stopCapture();
        };
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please check permissions and try again. You may need to adjust your browser settings or enable camera access for this site.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device. Please ensure your camera is properly connected and not in use by another application.');
        } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
          setError('Camera is already in use by another application or hardware error occurred.');
        } else if (err.name === 'SecurityError') {
          setError('Camera access blocked by browser security policy. Try using HTTPS.');
        } else if (err.name === 'OverconstrainedError') {
          setError('Camera cannot satisfy the requested constraints. Try with different settings.');
        } else {
          setError(`Could not access camera: ${err.message || 'Unknown error'}. Try reloading the page or using a different browser.`);
        }
        stopCapture();
      }
    }, 100); // Small delay to ensure the component has rendered
  };

  const toggleCameraFacing = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    stopCapture();
    
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);
    
    setTimeout(() => {
      startCapture();
    }, 300);
  };

  const capturePhoto = () => {
    if (!canvasRef.current || !videoRef.current) {
      setError('Camera components not ready. Please try again.');
      return;
    }
    
    if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      console.error('Video dimensions not available:', {
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight
      });
      setError('Camera stream not ready. Please wait or try again.');
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      console.log('Capturing photo with dimensions:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Use higher quality and proper mime type
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('Photo captured successfully, blob size:', blob.size);
          
          // Create a more descriptive filename to identify camera photos
          const timestamp = Date.now();
          const fileName = `camera-capture-${timestamp}.jpg`;
          console.log('Creating file with name:', fileName);
          
          // Create a properly typed File object
          const file = new File([blob], fileName, { 
            type: 'image/jpeg',
            lastModified: timestamp
          });
          
          // Create preview URL
          const objectUrl = URL.createObjectURL(blob);
          console.log('Created object URL for preview:', objectUrl);
          setPreviewUrl(objectUrl);
          
          // Stop video capture before uploading
          stopCapture();
          
          // Log before upload
          console.log('Starting upload for captured camera photo with filename:', fileName);
          
          // Upload the file
          uploadFile(file);
        } else {
          console.error('Failed to create blob from canvas');
          setError('Failed to process captured photo. Please try again.');
        }
      }, 'image/jpeg', 0.92); // Slightly increased quality
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError(`Error capturing photo: ${err.message}`);
    }
  };

  const stopCapture = () => {
    console.log('Stopping camera capture');
    
    if (mediaStreamRef.current) {
      try {
        const tracks = mediaStreamRef.current.getTracks();
        console.log(`Stopping ${tracks.length} media tracks`);
        tracks.forEach(track => track.stop());
        mediaStreamRef.current = null;
      } catch (err) {
        console.error('Error stopping media tracks:', err);
      }
    }
    
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (err) {
        console.error('Error clearing video source:', err);
      }
    }
    
    setIsCapturing(false);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (onPhotoUploaded) {
      onPhotoUploaded({status: 'removed'});
    }
  };

  return (
    <UploaderContainer 
      darkMode={darkMode}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {error && <ErrorMessage darkMode={darkMode}>{error}</ErrorMessage>}

      {isCapturing ? (
        <CameraContainer>
          <Video ref={videoRef} autoPlay playsInline muted />
          
          {!isCameraReady && (
            <CameraLoadingOverlay>
              <CircularProgress size={40} style={{ color: '#ffffff' }} />
              <span>Starting camera...</span>
            </CameraLoadingOverlay>
          )}
          
          <CameraControls>
            <CameraButton 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                capturePhoto();
              }} 
              darkMode={darkMode}
              type="button"
              disabled={!isCameraReady}
            >
              <PhotoCameraIcon />
            </CameraButton>
            
            <CameraButton 
              onClick={toggleCameraFacing} 
              darkMode={darkMode}
              type="button"
              disabled={!isCameraReady}
            >
              <CameraswitchIcon />
            </CameraButton>
            
            <CameraButton 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stopCapture();
              }} 
              darkMode={darkMode}
              type="button"
            >
              <CloseIcon />
            </CameraButton>
          </CameraControls>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </CameraContainer>
      ) : previewUrl ? (
        <PreviewContainer>
          <PreviewImage src={previewUrl} alt="Upload preview" />
          
          {/* Show progress overlay during upload */}
          {isUploading && (
            <UploadProgressOverlay>
              <CircularProgress 
                variant="determinate" 
                value={uploadProgress} 
                size={60}
                thickness={4}
                style={{ color: '#6A6AE3' }}
              />
              <ProgressText>{Math.round(uploadProgress)}%</ProgressText>
            </UploadProgressOverlay>
          )}
          
          {/* Show remove button when not uploading */}
          {!isUploading && (
            <RemoveButton 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemovePhoto();
              }} 
              darkMode={darkMode}
              type="button"
            >
              <CloseIcon />
            </RemoveButton>
          )}
        </PreviewContainer>
      ) : (
        <ButtonsContainer>
          <UploadButton 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current.click();
            }}
            darkMode={darkMode}
            disabled={isUploading}
            type="button"
          >
            <AddAPhotoIcon />
            <span>Upload Photo</span>
          </UploadButton>
          
          <CaptureButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startCapture(e);
            }}
            darkMode={darkMode}
            disabled={isUploading || !cameraSupported}
            type="button"
          >
            <PhotoCameraIcon />
            <span>{cameraSupported ? 'Take Photo' : 'Camera Not Supported'}</span>
          </CaptureButton>
        </ButtonsContainer>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        onClick={(e) => {
          // Prevent default behavior to avoid form submission
          e.stopPropagation();
        }}
      />
      
      {/* Upload status text */}
      {isUploading && !previewUrl && (
        <UploadStatus darkMode={darkMode}>
          <CircularProgress size={24} style={{ color: darkMode ? '#8b8bf4' : '#6A6AE3' }} />
          <span>Uploading... {Math.round(uploadProgress)}%</span>
        </UploadStatus>
      )}

      {!cameraSupported && !previewUrl && !isCapturing && (
        <BrowserNote darkMode={darkMode}>
          Camera functionality may not be available in this browser. You can still upload photos.
        </BrowserNote>
      )}
    </UploaderContainer>
  );
};

// Styled components
const UploaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

const UploadButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px dashed ${props => props.darkMode ? '#4a5568' : '#cbd5e0'};
  border-radius: 8px;
  background: ${props => props.darkMode ? 'rgba(45, 55, 72, 0.3)' : 'rgba(226, 232, 240, 0.3)'};
  color: ${props => props.darkMode ? '#a0aec0' : '#4a5568'};
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  height: 140px;
  gap: 10px;

  &:hover:not(:disabled) {
    border-color: #6A6AE3;
    color: #6A6AE3;
    background: ${props => props.darkMode ? 'rgba(106, 106, 227, 0.1)' : 'rgba(106, 106, 227, 0.05)'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  svg {
    font-size: 32px;
  }
`;

const CaptureButton = styled(UploadButton)`
  border-style: solid;
  background: ${props => props.darkMode ? 'rgba(74, 85, 104, 0.3)' : 'rgba(226, 232, 240, 0.5)'};
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  height: 200px;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  svg {
    font-size: 18px;
  }
`;

const UploadProgressOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const ProgressText = styled.div`
  color: white;
  font-weight: 600;
  margin-top: 8px;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  color: ${props => props.darkMode ? '#f8a8a0' : '#e74c3c'};
  padding: 8px 12px;
  background: ${props => props.darkMode ? 'rgba(231, 76, 60, 0.2)' : 'rgba(231, 76, 60, 0.1)'};
  border-radius: 4px;
  font-size: 14px;
`;

const UploadStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${props => props.darkMode ? '#8b8bf4' : '#6A6AE3'};
  font-size: 14px;
`;

const CameraContainer = styled.div`
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  height: 200px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CameraControls = styled.div`
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
`;

const CameraButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background 0.2s ease, opacity 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.7);
  }

  &:disabled {
    background: rgba(0, 0, 0, 0.3);
  }

  svg {
    font-size: 24px;
  }
`;

const CameraLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: white;
  font-size: 14px;
`;

const BrowserNote = styled.div`
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 13px;
  background-color: ${props => props.darkMode ? 'rgba(255, 166, 0, 0.1)' : 'rgba(255, 166, 0, 0.08)'};
  border-left: 3px solid orange;
  color: ${props => props.darkMode ? '#ffa500' : '#b37400'};
  border-radius: 4px;
`;

export default PhotoUploader; 