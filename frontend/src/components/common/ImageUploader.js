import React, { useState, useRef, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  IconButton, 
  Paper,
  Slider,
  FormControlLabel,
  Switch,
  Tooltip,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon,
  Crop as CropIcon,
  Tune as TuneIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { compressImage } from '../../utils/imageCompression';

/**
 * Image uploader component with client-side compression
 * 
 * @param {Object} props Component props
 * @param {Function} props.onImageSelect Callback when image is selected and processed
 * @param {Function} props.onError Callback when error occurs
 * @param {string} props.accept File types to accept (e.g. 'image/*')
 * @param {number} props.maxSize Maximum file size in bytes
 * @param {number} props.maxWidth Maximum width for compression
 * @param {number} props.maxHeight Maximum height for compression
 * @param {number} props.quality JPEG quality (0-1)
 * @param {boolean} props.showPreview Whether to show image preview
 * @param {boolean} props.showCompressionOptions Whether to show compression options
 * @param {string} props.previewHeight Height of the preview container
 * @param {Object} props.sx Additional styles
 */
const ImageUploader = ({
  onImageSelect,
  onError,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8,
  showPreview = true,
  showCompressionOptions = true,
  previewHeight = '300px',
  sx = {}
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  
  // Compression options
  const [compressionQuality, setCompressionQuality] = useState(quality * 100);
  const [maxImageWidth, setMaxImageWidth] = useState(maxWidth);
  const [useWebP, setUseWebP] = useState(true);
  
  // Handle file selection
  const handleFileSelect = useCallback(async (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) return;
    
    // Check file size
    if (selectedFile.size > maxSize) {
      const errorMsg = `File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(1)}MB`;
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }
    
    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      const errorMsg = 'Only image files are allowed';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
      
      // Compress image
      const result = await compressImage(selectedFile, {
        maxWidth: maxImageWidth,
        maxHeight: maxHeight,
        quality: compressionQuality / 100,
        format: useWebP ? 'webp' : 'jpeg'
      });
      
      // Set compression stats
      setCompressionStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio
      });
      
      // Set file and call onImageSelect
      setFile(result.file);
      if (onImageSelect) onImageSelect(result.file, result.dataUrl);
      
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Error processing image. Please try another file.');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [maxSize, maxImageWidth, maxHeight, compressionQuality, useWebP, onImageSelect, onError]);
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  // Clear selected file
  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setCompressionStats(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Toggle compression options
  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };
  
  // Apply new compression settings
  const applyCompressionSettings = async () => {
    if (!file) return;
    
    setLoading(true);
    
    try {
      // Compress image with new settings
      const result = await compressImage(file, {
        maxWidth: maxImageWidth,
        maxHeight: maxHeight,
        quality: compressionQuality / 100,
        format: useWebP ? 'webp' : 'jpeg'
      });
      
      // Update compression stats
      setCompressionStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio
      });
      
      // Update preview
      setPreview(result.dataUrl);
      
      // Update file and call onImageSelect
      setFile(result.file);
      if (onImageSelect) onImageSelect(result.file, result.dataUrl);
      
    } catch (err) {
      console.error('Error recompressing image:', err);
      setError('Error recompressing image. Please try again.');
      if (onError) onError(err);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };
  
  return (
    <Box sx={{ width: '100%', ...sx }}>
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {/* Image preview */}
      {showPreview && preview ? (
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Paper
            elevation={1}
            sx={{
              height: previewHeight,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              borderRadius: 1,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'
            }}
          >
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
            
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  zIndex: 1
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}
            
            {/* Action buttons */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 1
              }}
            >
              {showCompressionOptions && (
                <Tooltip title="Compression options">
                  <IconButton
                    size="small"
                    onClick={toggleOptions}
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      '&:hover': { bgcolor: theme.palette.action.hover }
                    }}
                  >
                    <TuneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Remove image">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    '&:hover': { bgcolor: theme.palette.action.hover }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
          
          {/* Compression stats */}
          {compressionStats && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                fontSize: '0.75rem'
              }}
            >
              <Typography variant="caption" component="div" sx={{ fontWeight: 500 }}>
                Compression: {compressionStats.compressionRatio}% reduction
              </Typography>
              <Typography variant="caption" component="div" color="text.secondary">
                Original: {(compressionStats.originalSize / 1024).toFixed(1)} KB → 
                Compressed: {(compressionStats.compressedSize / 1024).toFixed(1)} KB
              </Typography>
            </Box>
          )}
          
          {/* Compression options panel */}
          {showOptions && (
            <Paper
              elevation={3}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1,
                width: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">Compression Options</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" color="primary" onClick={applyCompressionSettings}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setShowOptions(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              
              <Typography variant="caption" gutterBottom>Quality: {compressionQuality}%</Typography>
              <Slider
                value={compressionQuality}
                onChange={(_, value) => setCompressionQuality(value)}
                min={10}
                max={100}
                step={5}
                valueLabelDisplay="auto"
                size="small"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="caption" gutterBottom>Max Width: {maxImageWidth}px</Typography>
              <Slider
                value={maxImageWidth}
                onChange={(_, value) => setMaxImageWidth(value)}
                min={320}
                max={2000}
                step={100}
                valueLabelDisplay="auto"
                size="small"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={useWebP}
                    onChange={(e) => setUseWebP(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="caption">Use WebP format (better compression)</Typography>}
              />
              
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={applyCompressionSettings}
                sx={{ mt: 2 }}
              >
                Apply Settings
              </Button>
            </Paper>
          )}
        </Box>
      ) : (
        /* Upload button when no image is selected */
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleUploadClick}
          disabled={loading}
          fullWidth
          sx={{
            py: 5,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 2
          }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Typography variant="subtitle1">Upload Image</Typography>
              <Typography variant="caption" color="text.secondary">
                Click to select or drop an image here
              </Typography>
            </>
          )}
        </Button>
      )}
    </Box>
  );
};

export default ImageUploader;
