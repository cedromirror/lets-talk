import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Switch,
  Chip,
  Grid,
  Divider,
  Snackbar,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Videocam as VideocamIcon,
  LocationOn as LocationIcon,
  Tag as TagIcon,
  MusicNote as MusicIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { storyService } from '../services/api';

const StoryCreator = ({ open, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  // State
  const [storyType, setStoryType] = useState('image');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mentions, setMentions] = useState([]);
  const [mentionInput, setMentionInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [allowedUserInput, setAllowedUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file type
    if (storyType === 'image' && !selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      setSnackbar({
        open: true,
        message: 'Please select an image file',
        severity: 'error'
      });
      return;
    }

    if (storyType === 'video' && !selectedFile.type.startsWith('video/')) {
      setError('Please select a video file');
      setSnackbar({
        open: true,
        message: 'Please select a video file',
        severity: 'error'
      });
      return;
    }

    // Check file size (max 100MB for videos, 10MB for images)
    const maxSize = storyType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const sizeInMB = Math.round(maxSize / (1024 * 1024));
      setError(`File size exceeds the maximum limit of ${sizeInMB}MB`);
      setSnackbar({
        open: true,
        message: `File size exceeds the maximum limit of ${sizeInMB}MB`,
        severity: 'error'
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);
    setError(null);
    setUploadStatus('idle');
    setUploadProgress(0);

    console.log('File selected:', selectedFile.name, 'Size:', (selectedFile.size / (1024 * 1024)).toFixed(2), 'MB');
  };

  // Handle file drop
  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];

      // Check if file type matches selected story type
      if (storyType === 'image' && droppedFile.type.startsWith('image/')) {
        handleFileSelection(droppedFile);
      } else if (storyType === 'video' && droppedFile.type.startsWith('video/')) {
        handleFileSelection(droppedFile);
      } else {
        setError(`Please drop a ${storyType} file`);
        setSnackbar({
          open: true,
          message: `Please drop a ${storyType} file`,
          severity: 'error'
        });
      }
    }
  }, [storyType]);

  // Handle file selection (shared between drop and input)
  const handleFileSelection = (selectedFile) => {
    // Check file size (max 100MB for videos, 10MB for images)
    const maxSize = storyType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const sizeInMB = Math.round(maxSize / (1024 * 1024));
      setError(`File size exceeds the maximum limit of ${sizeInMB}MB`);
      setSnackbar({
        open: true,
        message: `File size exceeds the maximum limit of ${sizeInMB}MB`,
        severity: 'error'
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);
    setError(null);
    setUploadStatus('idle');
    setUploadProgress(0);

    console.log('File selected:', selectedFile.name, 'Size:', (selectedFile.size / (1024 * 1024)).toFixed(2), 'MB');
  };

  // Handle hashtag input
  const handleHashtagKeyDown = (e) => {
    if (e.key === 'Enter' && hashtagInput.trim()) {
      e.preventDefault();
      const tag = hashtagInput.trim().startsWith('#')
        ? hashtagInput.trim()
        : `#${hashtagInput.trim()}`;

      if (!hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setHashtagInput('');
    }
  };

  // Handle mention input
  const handleMentionKeyDown = (e) => {
    if (e.key === 'Enter' && mentionInput.trim()) {
      e.preventDefault();
      const mention = mentionInput.trim().startsWith('@')
        ? mentionInput.trim()
        : `@${mentionInput.trim()}`;

      if (!mentions.includes(mention)) {
        setMentions([...mentions, mention]);
      }
      setMentionInput('');
    }
  };

  // Handle allowed users input
  const handleAllowedUserKeyDown = (e) => {
    if (e.key === 'Enter' && allowedUserInput.trim()) {
      e.preventDefault();
      const user = allowedUserInput.trim();

      if (!allowedUsers.includes(user)) {
        setAllowedUsers([...allowedUsers, user]);
      }
      setAllowedUserInput('');
    }
  };

  // Remove hashtag
  const removeHashtag = (tag) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  // Remove mention
  const removeMention = (mention) => {
    setMentions(mentions.filter(m => m !== mention));
  };

  // Remove allowed user
  const removeAllowedUser = (user) => {
    setAllowedUsers(allowedUsers.filter(u => u !== user));
  };

  // Create story
  const createStory = async () => {
    if (!file && storyType !== 'text') {
      setError('Please select a file');
      setSnackbar({
        open: true,
        message: 'Please select a file',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadStatus('uploading');
      setUploadProgress(10); // Start progress

      // Extract hashtags from caption if any
      const captionHashtags = caption.match(/#[\w\u0590-\u05ff]+/g) || [];
      const allHashtags = [...new Set([...hashtags, ...captionHashtags])];

      // Extract mentions from caption if any
      const captionMentions = caption.match(/@[\w\u0590-\u05ff]+/g) || [];
      const allMentions = [...new Set([...mentions, ...captionMentions])];

      const formData = new FormData();
      formData.append('type', storyType);
      formData.append('caption', caption);
      formData.append('location', location);
      formData.append('hashtags', JSON.stringify(allHashtags));
      formData.append('mentions', JSON.stringify(allMentions));
      formData.append('isPrivate', isPrivate);
      formData.append('allowedUsers', JSON.stringify(allowedUsers));

      if (file) {
        formData.append('media', file);
      }

      console.log('Creating story with data:', {
        type: storyType,
        caption,
        location,
        hashtags: allHashtags,
        mentions: allMentions,
        isPrivate,
        allowedUsers,
        fileSize: file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'No file'
      });

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Call the API to create the story
      const response = await storyService.createStory(formData);

      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');

      console.log('Story created successfully:', response.data);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Story created successfully!',
        severity: 'success'
      });

      // Reset form after a short delay to show the success state
      setTimeout(() => {
        setStoryType('image');
        setFile(null);
        setPreview(null);
        setCaption('');
        setLocation('');
        setHashtags([]);
        setHashtagInput('');
        setMentions([]);
        setMentionInput('');
        setIsPrivate(false);
        setAllowedUsers([]);
        setAllowedUserInput('');
        setUploadStatus('idle');
        setUploadProgress(0);

        // Close dialog and notify parent
        onClose();
        if (onSuccess) {
          onSuccess(response.data);
        }
      }, 1000);
    } catch (err) {
      console.error('Error creating story:', err);
      setUploadStatus('error');

      // Extract error message
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          'Failed to create story. Please try again.';

      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(loading || uploadStatus === 'uploading') ? null : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Create Story
        <IconButton
          aria-label="close"
          onClick={onClose}
          disabled={loading || uploadStatus === 'uploading'}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Upload Progress */}
        {uploadStatus === 'uploading' && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} color="primary" />
            <Typography variant="caption" align="center" display="block" sx={{ mt: 0.5 }}>
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}

        {/* Success Message */}
        {uploadStatus === 'success' && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: 'success.main' }}>
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="body2" color="success.main">
              Story created successfully!
            </Typography>
          </Box>
        )}

        {/* Story Type Selection */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant={storyType === 'image' ? 'contained' : 'outlined'}
            startIcon={<AddPhotoIcon />}
            onClick={() => setStoryType('image')}
            disabled={loading || uploadStatus === 'uploading'}
          >
            Image
          </Button>
          <Button
            variant={storyType === 'video' ? 'contained' : 'outlined'}
            startIcon={<VideocamIcon />}
            onClick={() => setStoryType('video')}
            disabled={loading || uploadStatus === 'uploading'}
          >
            Video
          </Button>
        </Box>

        {/* File Upload */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {preview ? (
            <Box sx={{ position: 'relative', mb: 2 }}>
              {storyType === 'image' ? (
                <img
                  src={preview}
                  alt="Story preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <video
                  src={preview}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px'
                  }}
                />
              )}
              <IconButton
                aria-label="remove"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                disabled={loading || uploadStatus === 'uploading'}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                mb: 2,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="body1" align="center" gutterBottom>
                Drag & drop your {storyType} here, or click to browse
              </Typography>
              <Typography variant="caption" align="center" color="text.secondary">
                {storyType === 'image' ? 'JPG, PNG or GIF up to 10MB' : 'MP4 or MOV up to 100MB'}
              </Typography>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept={storyType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                disabled={loading || uploadStatus === 'uploading'}
              />
            </Box>
          )}
        </Box>

        {/* Caption */}
        <TextField
          label="Caption"
          fullWidth
          multiline
          rows={2}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={loading || uploadStatus === 'uploading'}
          placeholder="Write a caption... Use #hashtags and @mentions"
          sx={{ mb: 2 }}
          helperText="Add #hashtags and @mentions directly in your caption or use the fields below"
        />

        {/* Location */}
        <TextField
          label="Location"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={loading || uploadStatus === 'uploading'}
          placeholder="Add a location"
          InputProps={{
            startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
          }}
          sx={{ mb: 2 }}
        />

        {/* Hashtags */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Add Hashtags"
            fullWidth
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleHashtagKeyDown}
            disabled={loading || uploadStatus === 'uploading'}
            placeholder="Type and press Enter"
            InputProps={{
              startAdornment: <TagIcon color="action" sx={{ mr: 1 }} />
            }}
          />
          {hashtags.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {hashtags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => removeHashtag(tag)}
                  disabled={loading || uploadStatus === 'uploading'}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Mentions */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Mention Users"
            fullWidth
            value={mentionInput}
            onChange={(e) => setMentionInput(e.target.value)}
            onKeyDown={handleMentionKeyDown}
            disabled={loading || uploadStatus === 'uploading'}
            placeholder="Type username and press Enter"
            InputProps={{
              startAdornment: <TagIcon color="action" sx={{ mr: 1 }} />
            }}
          />
          {mentions.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {mentions.map(mention => (
                <Chip
                  key={mention}
                  label={mention}
                  onDelete={() => removeMention(mention)}
                  disabled={loading || uploadStatus === 'uploading'}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Privacy Settings */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={loading || uploadStatus === 'uploading'}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isPrivate ? <LockIcon color="action" sx={{ mr: 1 }} /> : <PublicIcon color="action" sx={{ mr: 1 }} />}
                <Typography>{isPrivate ? 'Private Story' : 'Public Story'}</Typography>
              </Box>
            }
          />

          {isPrivate && (
            <Box sx={{ mt: 1 }}>
              <TextField
                label="Allow Specific Users"
                fullWidth
                value={allowedUserInput}
                onChange={(e) => setAllowedUserInput(e.target.value)}
                onKeyDown={handleAllowedUserKeyDown}
                disabled={loading || uploadStatus === 'uploading'}
                placeholder="Type username and press Enter"
                size="small"
                sx={{ mb: 1 }}
              />
              {allowedUsers.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {allowedUsers.map(user => (
                    <Chip
                      key={user}
                      label={user}
                      onDelete={() => removeAllowedUser(user)}
                      disabled={loading || uploadStatus === 'uploading'}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Error Message */}
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading || uploadStatus === 'uploading'}
        >
          Cancel
        </Button>
        <Button
          onClick={createStory}
          variant="contained"
          disabled={loading || uploadStatus === 'uploading' || (!file && storyType !== 'text')}
          startIcon={loading && <CircularProgress size={20} />}
          color={uploadStatus === 'success' ? 'success' : 'primary'}
        >
          {loading ? 'Creating...' : uploadStatus === 'success' ? 'Created!' : 'Create Story'}
        </Button>
      </DialogActions>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default StoryCreator;
