import React, { useState, useRef, useCallback } from 'react';
import { getResponsiveImageUrl } from '../utils/cloudinaryHelper';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  IconButton,
  CircularProgress,
  Avatar,
  Paper,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Rotate90DegreesCcw as RotateIcon,
  PhotoCamera as CameraIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  CropFree as CropIcon
} from '@mui/icons-material';
import { authService } from '../services/api';

const ProfilePictureEditor = ({ open, onClose, onSuccess, currentAvatar }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for image handling
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload', 'edit', 'preview'

  // Refs
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file (jpg, png, etc.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result;
        setImage(imageData);
        setError(null);

        // Show dialog asking if user wants to edit or use original
        if (window.confirm('Would you like to edit this image before using it as your profile picture?\n\nClick OK to edit, or Cancel to use the original image directly.')) {
          setStep('edit');
        } else {
          // Use original image directly
          handleDirectUpload(imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image load
  const onImageLoad = useCallback((img) => {
    imgRef.current = img.target;
  }, []);

  // Generate preview
  const generatePreview = useCallback(() => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to desired output size (e.g., 300x300)
    const outputSize = 300;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Apply background color (for transparent images)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Move to center of canvas
    ctx.translate(canvas.width/2, canvas.height/2);

    // Rotate around center
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    // Scale (zoom)
    ctx.scale(zoom, zoom);

    // Calculate dimensions to maintain aspect ratio
    const imgWidth = imgRef.current.naturalWidth;
    const imgHeight = imgRef.current.naturalHeight;
    const scale = Math.max(canvas.width / imgWidth, canvas.height / imgHeight);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    // Draw the image centered
    ctx.drawImage(
      imgRef.current,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Restore context state
    ctx.restore();

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    setStep('preview');
  }, [rotation, zoom]);

  // Handle zoom change
  const handleZoomChange = (event, newValue) => {
    setZoom(newValue);
  };

  // Handle rotation
  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  // Handle save
  const handleSave = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);

    try {
      // Add image quality and size validation
      const maxSize = 5 * 1024 * 1024; // 5MB
      const response = await fetch(preview);
      const blob = await response.blob();

      if (blob.size > maxSize) {
        throw new Error('Image file is too large (max 5MB)');
      }

      // Ensure correct image format and compression
      const compressedBlob = await compressImage(blob, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.85
      });

      const formData = new FormData();
      formData.append('avatar', compressedBlob, 'profile-picture.jpg');

      // Add timestamp to prevent caching issues
      formData.append('timestamp', Date.now().toString());

      console.log('Uploading edited profile picture to server...');
      const result = await authService.updateProfile(formData);
      console.log('Profile picture update response:', result);

      if (result.data?.user?.avatar) {
        const uploadedImageUrl = result.data.user.avatar;
        console.log('Profile picture updated successfully:', uploadedImageUrl);

        // Add cache-busting parameter to the URL
        const cacheBustedUrl = uploadedImageUrl.includes('?')
          ? `${uploadedImageUrl}&t=${Date.now()}`
          : `${uploadedImageUrl}?t=${Date.now()}`;

        onSuccess(cacheBustedUrl);
        onClose();
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err) {
      console.error('Error updating profile picture:', err);
      setError(err.message || 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle direct upload without editing
  const handleDirectUpload = async (dataUrl) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Directly uploading original profile picture...');

      // Convert data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Check file size
      if (blob.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image file is too large. Please choose a smaller image or resize it (max 5MB).');
      }

      // Apply light compression to ensure consistent format
      const compressedBlob = await compressImage(blob, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9
      });

      // Create FormData
      const formData = new FormData();
      formData.append('avatar', compressedBlob, 'profile-picture.jpg');

      // Add timestamp to prevent caching issues
      formData.append('timestamp', Date.now().toString());

      // Upload to server
      console.log('Uploading original profile picture to server...');
      const result = await authService.updateProfile(formData);
      console.log('Profile picture update response:', result);

      if (result.data && result.data.user) {
        // Get the updated avatar URL from the response
        const updatedAvatarUrl = result.data.user.avatar || dataUrl;
        console.log('Profile picture updated successfully:', updatedAvatarUrl);

        // Add cache-busting parameter to the URL
        const cacheBustedUrl = updatedAvatarUrl.includes('?')
          ? `${updatedAvatarUrl}&t=${Date.now()}`
          : `${updatedAvatarUrl}?t=${Date.now()}`;

        onSuccess(cacheBustedUrl);
        onClose();
      } else {
        throw new Error(result.data?.message || 'Failed to update profile picture');
      }
    } catch (err) {
      console.error('Error updating profile picture:', err);
      setError(err.message || 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle remove profile picture
  const handleRemove = async () => {
    // Confirm before removing
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Removing profile picture...');

      // Create FormData with removeAvatar flag
      const formData = new FormData();
      formData.append('removeAvatar', 'true');

      // Send request to remove profile picture
      const result = await authService.updateProfile(formData);
      console.log('Profile picture removal response:', result);

      if (result.data && result.data.user) {
        console.log('Profile picture removed successfully');
        onSuccess(null);
        onClose();
      } else {
        throw new Error(result.data?.message || 'Failed to remove profile picture');
      }
    } catch (err) {
      console.error('Error removing profile picture:', err);
      setError(err.message || 'Failed to remove profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setImage(null);
    setPreview(null);
    setZoom(1);
    setRotation(0);
    setLoading(false);
    setError(null);
    setStep('upload');
    onClose();
  };

  // Render different steps
  const renderContent = () => {
    switch (step) {
      case 'upload':
        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            minHeight: 300
          }}>
            {currentAvatar && (
              <Avatar
                src={getResponsiveImageUrl(currentAvatar, 'medium')}
                alt="Current profile picture"
                sx={{
                  width: 120,
                  height: 120,
                  mb: 3,
                  border: '4px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
            )}

            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                textAlign: 'center',
                width: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <UploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload New Profile Picture
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click to select or drag and drop an image here
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Supports JPG, PNG (Max 5MB)
              </Typography>
              <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                You can choose to use the original image or edit it after selection
              </Typography>
            </Paper>

            {currentAvatar && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRemove}
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? 'Removing...' : 'Remove Current Picture'}
              </Button>
            )}
          </Box>
        );

      case 'edit':
        return (
          <Box sx={{ p: 2 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
              position: 'relative',
              overflow: 'hidden',
              maxHeight: isMobile ? 300 : 400,
              borderRadius: '50%',
              width: 250,
              height: 250,
              mx: 'auto',
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}>
              <Box sx={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={image}
                  alt="Upload"
                  ref={imgRef}
                  onLoad={onImageLoad}
                  style={{
                    maxWidth: 'none',
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </Box>

              <IconButton
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
                size="small"
              >
                <CropIcon fontSize="small" />
              </IconButton>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Zoom
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                  <ZoomOutIcon />
                </IconButton>
                <Slider
                  value={zoom}
                  min={0.5}
                  max={3}
                  step={0.1}
                  onChange={handleZoomChange}
                  sx={{ mx: 2, flexGrow: 1 }}
                />
                <IconButton onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
                  <ZoomInIcon />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RotateIcon />}
                onClick={handleRotate}
                sx={{ mr: 1 }}
              >
                Rotate
              </Button>
              <Button
                variant="outlined"
                color="success"
                onClick={() => handleDirectUpload(image)}
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Use Original'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={generatePreview}
                sx={{ ml: 1 }}
              >
                Preview & Edit
              </Button>
            </Box>
          </Box>
        );

      case 'preview':
        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3
          }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>

            <Box sx={{ position: 'relative', mb: 3 }}>
              <Avatar
                src={preview}
                alt="Preview"
                sx={{
                  width: 150,
                  height: 150,
                  border: '4px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
              This is how your profile picture will look like
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setStep('edit')}
                sx={{ mr: 2 }}
              >
                Edit Again
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Saving...
                  </>
                ) : (
                  'Save & Apply'
                )}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: 2
      }}>
        <Typography variant="h6">
          {step === 'upload' ? 'Update Profile Picture' :
           step === 'edit' ? 'Edit Profile Picture (Optional)' :
           'Preview Profile Picture'}
        </Typography>
        <IconButton edge="end" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Box sx={{
            bgcolor: 'error.light',
            color: 'error.contrastText',
            p: 2,
            textAlign: 'center'
          }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        {renderContent()}
      </DialogContent>

      {step === 'upload' && (
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CameraIcon />}
            onClick={() => fileInputRef.current.click()}
          >
            Choose Photo
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

// Add helper functions
const compressImage = async (blob, options) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.src = URL.createObjectURL(blob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let { width, height } = img;

          // Calculate new dimensions while preserving aspect ratio
          if (width > options.maxWidth) {
            height = Math.round((options.maxWidth / width) * height);
            width = options.maxWidth;
          }

          if (height > options.maxHeight) {
            width = Math.round((options.maxHeight / height) * width);
            height = options.maxHeight;
          }

          // Ensure dimensions are integers
          width = Math.floor(width);
          height = Math.floor(height);

          canvas.width = width;
          canvas.height = height;

          // Fill with white background (for transparent images)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw image with high quality settings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with specified quality
          canvas.toBlob(
            (compressedBlob) => {
              if (compressedBlob) {
                console.log(`Image compressed: ${blob.size} bytes → ${compressedBlob.size} bytes`);
                resolve(compressedBlob);
              } else {
                console.error('Failed to compress image: toBlob returned null');
                resolve(blob); // Fallback to original blob
              }
            },
            'image/jpeg',
            options.quality
          );
        } catch (canvasError) {
          console.error('Error in canvas processing:', canvasError);
          resolve(blob); // Fallback to original blob
        }
      };

      img.onerror = (error) => {
        console.error('Error loading image for compression:', error);
        resolve(blob); // Fallback to original blob
      };
    } catch (error) {
      console.error('Error in image compression:', error);
      resolve(blob); // Fallback to original blob
    }
  });
};

// Helper function to add cache-busting parameter to image URLs
const addCacheBuster = (url) => {
  if (!url) return url;

  try {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  } catch (error) {
    console.error('Error adding cache buster to URL:', error);
    return url;
  }
};

export default ProfilePictureEditor;


