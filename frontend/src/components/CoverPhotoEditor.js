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
  IconButton,
  CircularProgress,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';
import { authService } from '../services/api';

const CoverPhotoEditor = ({ open, onClose, onSuccess, currentCoverImage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for image handling
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
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

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result;
        setImage(imageData);
        setPreview(imageData);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);

    try {
      // Convert data URL to Blob
      const response = await fetch(preview);
      const blob = await response.blob();

      // Check file size
      if (blob.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image file is too large. Please choose a smaller image or resize it (max 10MB).');
      }

      // Apply light compression to ensure consistent format
      const compressedBlob = await compressImage(blob, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85
      });

      // Create FormData
      const formData = new FormData();
      formData.append('coverImage', compressedBlob, 'cover-photo.jpg');
      
      // Add timestamp to prevent caching issues
      formData.append('timestamp', Date.now().toString());

      // Upload to server
      console.log('Uploading cover photo to server...');
      const result = await authService.updateCoverImage(formData);
      console.log('Cover photo update response:', result);

      if (result.data && result.data.user) {
        // Get the updated cover image URL from the response
        const updatedCoverImageUrl = result.data.user.coverImage || preview;
        console.log('Cover photo updated successfully:', updatedCoverImageUrl);
        
        // Add cache-busting parameter to the URL
        const cacheBustedUrl = updatedCoverImageUrl.includes('?') 
          ? `${updatedCoverImageUrl}&t=${Date.now()}` 
          : `${updatedCoverImageUrl}?t=${Date.now()}`;
        
        onSuccess(cacheBustedUrl);
        onClose();
      } else {
        throw new Error(result.data?.message || 'Failed to update cover photo');
      }
    } catch (err) {
      console.error('Error updating cover photo:', err);
      setError(err.message || 'Failed to update cover photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle remove cover photo
  const handleRemove = async () => {
    // Confirm before removing
    if (!window.confirm('Are you sure you want to remove your cover photo?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Removing cover photo...');

      // Create FormData with removeCoverImage flag
      const formData = new FormData();
      formData.append('removeCoverImage', 'true');

      // Send request to remove cover photo
      const result = await authService.updateProfile(formData);
      console.log('Cover photo removal response:', result);

      if (result.data && result.data.user) {
        console.log('Cover photo removed successfully');
        onSuccess(null);
        onClose();
      } else {
        throw new Error(result.data?.message || 'Failed to remove cover photo');
      }
    } catch (err) {
      console.error('Error removing cover photo:', err);
      setError(err.message || 'Failed to remove cover photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setImage(null);
    setPreview(null);
    setLoading(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
          Update Cover Photo
        </Typography>
        <IconButton edge="end" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          minHeight: 300
        }}>
          {/* Current cover image preview */}
          {(currentCoverImage || preview) && (
            <Box 
              sx={{ 
                width: '100%', 
                height: 200, 
                mb: 3,
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <img 
                src={preview || currentCoverImage} 
                alt="Cover preview" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  objectPosition: 'center'
                }} 
              />
            </Box>
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
              Upload New Cover Photo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click to select or drag and drop an image here
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Supports JPG, PNG (Max 10MB)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Recommended size: 1920 x 1080 pixels
            </Typography>
          </Paper>

          {currentCoverImage && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleRemove}
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Removing...' : 'Remove Current Cover Photo'}
            </Button>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {preview && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={loading || !preview}
            startIcon={loading ? <CircularProgress size={20} /> : <CameraIcon />}
          >
            {loading ? 'Uploading...' : 'Upload Cover Photo'}
          </Button>
        )}
      </DialogActions>
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

export default CoverPhotoEditor;
