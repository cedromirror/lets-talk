import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postService, reelService, storyService } from '../services/api';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Container,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Image as ImageIcon,
  Videocam as VideocamIcon,
  AutoStories as StoryIcon
} from '@mui/icons-material';

// Basic styling
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px'
  },
  subheader: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontWeight: 'bold',
    fontSize: '14px'
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  textarea: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical'
  },
  button: {
    backgroundColor: '#0095f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonHover: {
    backgroundColor: '#0074cc'
  },
  dropZone: {
    border: '2px dashed #ddd',
    borderRadius: '4px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  dropZoneActive: {
    borderColor: '#0095f6',
    backgroundColor: 'rgba(0, 149, 246, 0.1)'
  },
  imagePreview: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    marginBottom: '10px',
    borderRadius: '4px'
  },
  imageControls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  iconButton: {
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  iconButtonHover: {
    backgroundColor: '#e0e0e0'
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px'
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    padding: '5px 10px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  tagText: {
    color: '#0095f6'
  },
  tagRemove: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  charCount: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'right',
    marginTop: '5px'
  },
  charCountExceeded: {
    color: '#d32f2f'
  },
  loadingSpinner: {
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTop: '3px solid white',
    width: '20px',
    height: '20px',
    animation: 'spin 1s linear infinite'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  videoPreview: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '8px',
    marginBottom: '10px'
  },
  audioSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    cursor: 'pointer'
  },
  durationSlider: {
    width: '100%',
    height: '20px',
    marginTop: '10px'
  }
};

const Create = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Post form state
  const [postCaption, setPostCaption] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [postTags, setPostTags] = useState([]);
  const [postLocation, setPostLocation] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [postMultipleImages, setPostMultipleImages] = useState([]);
  const [postMultipleImagePreviews, setPostMultipleImagePreviews] = useState([]);

  // Reel form state
  const [reelCaption, setReelCaption] = useState('');
  const [reelVideo, setReelVideo] = useState(null);
  const [reelVideoPreview, setReelVideoPreview] = useState(null);
  const [reelTags, setReelTags] = useState([]);
  const [reelLocation, setReelLocation] = useState('');
  const [reelAudio, setReelAudio] = useState('Original Audio');
  const [reelDuration, setReelDuration] = useState(15); // Default 15 seconds
  const [reelThumbnail, setReelThumbnail] = useState(null); // Thumbnail for the reel

  // Story form state
  const [storyMedia, setStoryMedia] = useState(null);
  const [storyMediaPreview, setStoryMediaPreview] = useState(null);
  const [storyMediaType, setStoryMediaType] = useState(null); // 'image' or 'video'
  const [storyCaption, setStoryCaption] = useState('');
  const [storyLocation, setStoryLocation] = useState('');
  const [storyDuration, setStoryDuration] = useState(0);
  const [storyIsPrivate, setStoryIsPrivate] = useState(false);
  const [storyAllowedUsers, setStoryAllowedUsers] = useState([]);

  // Draft state
  const [hasDraft, setHasDraft] = useState(false);
  const [draftType, setDraftType] = useState(null); // 'post' or 'reel'

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs
  const tagInputRef = useRef(null);

  // Check URL query params for initial tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    if (tab === 'reel') {
      setActiveTab(1);
    } else if (tab === 'story') {
      setActiveTab(2);
    } else {
      setActiveTab(0); // Default to post tab
    }
  }, [location.search]);

  // Load drafts on component mount
  useEffect(() => {
    loadDrafts();
  }, []);

  // Check for unsaved changes
  useEffect(() => {
    // For post tab
    if (activeTab === 0) {
      setHasUnsavedChanges(
        postCaption.trim().length > 0 ||
        postImage !== null ||
        postTags.length > 0 ||
        postLocation.trim().length > 0
      );
    }
    // For reel tab
    else if (activeTab === 1) {
      setHasUnsavedChanges(
        reelCaption.trim().length > 0 ||
        reelVideo !== null ||
        reelAudio !== 'Original Audio'
      );
    }
    // For story tab
    else if (activeTab === 2) {
      setHasUnsavedChanges(
        storyCaption.trim().length > 0 ||
        storyMedia !== null ||
        storyLocation.trim().length > 0
      );
    }
  }, [activeTab, postCaption, postImage, postTags, postLocation, reelCaption, reelVideo, reelAudio, storyCaption, storyMedia, storyLocation]);

  // Prevent accidental navigation away
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !isSubmitting) {
        // Standard for most browsers
        e.preventDefault();
        // For older browsers
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  // Save post draft
  const savePostDraft = () => {
    // Don't save if there's nothing to save
    if (!postCaption && !postImage && postTags.length === 0 && !postLocation) {
      return;
    }

    const draft = {
      type: 'post',
      timestamp: Date.now(),
      data: {
        caption: postCaption,
        tags: postTags,
        location: postLocation,
        imagePreview: postImagePreview
      }
    };

    localStorage.setItem('createDraft', JSON.stringify(draft));
    setHasDraft(true);
    setDraftType('post');
    setSuccess('Draft saved successfully!');
  };

  // Save reel draft
  const saveReelDraft = () => {
    // Don't save if there's nothing to save
    if (!reelCaption && !reelVideo && !reelAudio) {
      return;
    }

    const draft = {
      type: 'reel',
      timestamp: Date.now(),
      data: {
        caption: reelCaption,
        audio: reelAudio,
        videoPreview: reelVideoPreview
      }
    };

    localStorage.setItem('createDraft', JSON.stringify(draft));
    setHasDraft(true);
    setDraftType('reel');
    setSuccess('Draft saved successfully!');
  };

  // Load drafts
  const loadDrafts = () => {
    try {
      const draftJson = localStorage.getItem('createDraft');
      if (!draftJson) return;

      const draft = JSON.parse(draftJson);

      // Check if draft is valid and not too old (7 days)
      const now = Date.now();
      const draftAge = now - draft.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      if (draftAge > maxAge) {
        // Draft is too old, remove it
        localStorage.removeItem('createDraft');
        return;
      }

      setHasDraft(true);
      setDraftType(draft.type);

      // Switch to the appropriate tab
      if (draft.type === 'post') {
        setActiveTab(0);
      } else if (draft.type === 'reel') {
        setActiveTab(1);
      } else if (draft.type === 'story') {
        setActiveTab(2);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      // If there's an error, clear the draft
      localStorage.removeItem('createDraft');
    }
  };

  // Load post draft
  const loadPostDraft = () => {
    try {
      const draftJson = localStorage.getItem('createDraft');
      if (!draftJson) return;

      const draft = JSON.parse(draftJson);
      if (draft.type !== 'post') return;

      const { caption, tags, location, imagePreview } = draft.data;

      setPostCaption(caption || '');
      setPostTags(tags || []);
      setPostLocation(location || '');
      setPostImagePreview(imagePreview || null);

      setSuccess('Draft loaded successfully!');
    } catch (error) {
      console.error('Error loading post draft:', error);
      setError('Failed to load draft');
    }
  };

  // Load reel draft
  const loadReelDraft = () => {
    try {
      const draftJson = localStorage.getItem('createDraft');
      if (!draftJson) return;

      const draft = JSON.parse(draftJson);
      if (draft.type !== 'reel') return;

      const { caption, audio, videoPreview } = draft.data;

      setReelCaption(caption || '');
      setReelAudio(audio || 'Original Audio');
      setReelVideoPreview(videoPreview || null);

      setSuccess('Draft loaded successfully!');
    } catch (error) {
      console.error('Error loading reel draft:', error);
      setError('Failed to load draft');
    }
  };

  // Discard draft
  const discardDraft = () => {
    localStorage.removeItem('createDraft');
    setHasDraft(false);
    setDraftType(null);
    setSuccess('Draft discarded!');
  };

  // Save story draft
  const saveStoryDraft = () => {
    // Don't save if there's nothing to save
    if (!storyCaption && !storyMedia && !storyLocation) {
      return;
    }

    const draft = {
      type: 'story',
      timestamp: Date.now(),
      data: {
        caption: storyCaption,
        location: storyLocation,
        mediaPreview: storyMediaPreview,
        mediaType: storyMediaType,
        isPrivate: storyIsPrivate
      }
    };

    localStorage.setItem('createDraft', JSON.stringify(draft));
    setHasDraft(true);
    setDraftType('story');
    setSuccess('Draft saved successfully!');
  };

  // Load story draft
  const loadStoryDraft = () => {
    try {
      const draftJson = localStorage.getItem('createDraft');
      if (!draftJson) return;

      const draft = JSON.parse(draftJson);
      if (draft.type !== 'story') return;

      const { caption, location, mediaPreview, mediaType, isPrivate } = draft.data;

      setStoryCaption(caption || '');
      setStoryLocation(location || '');
      setStoryMediaPreview(mediaPreview || null);
      setStoryMediaType(mediaType || null);
      setStoryIsPrivate(isPrivate || false);

      setSuccess('Draft loaded successfully!');
    } catch (error) {
      console.error('Error loading story draft:', error);
      setError('Failed to load draft');
    }
  };


  // Optimize image before upload
  const optimizeImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      // Create a FileReader to read the file
      const reader = new FileReader();

      // Set up FileReader onload handler
      reader.onload = (readerEvent) => {
        // Create an image object from the loaded data
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * maxHeight / height);
              height = maxHeight;
            }
          }

          // Create a canvas and draw the resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            // Create a new File object from the blob
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });

            resolve({
              file: optimizedFile,
              dataUrl: canvas.toDataURL(file.type, quality)
            });
          }, file.type, quality);
        };

        // Handle image load error
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        // Set image source to the FileReader result
        img.src = readerEvent.target.result;
      };

      // Handle FileReader error
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      // Read the file as a data URL
      reader.readAsDataURL(file);
    });
  };

  // Handle post image selection
  const handlePostImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 20MB for original file)
      if (file.size > 20 * 1024 * 1024) {
        setError('Image size should be less than 20MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Log file details for debugging
      console.log('Selected image file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });

      try {
        // Show loading state
        setIsSubmitting(true);

        // Optimize image
        const { file: optimizedFile, dataUrl } = await optimizeImage(file);

        // Update state with optimized image
        setPostImage(optimizedFile);
        setPostImagePreview(dataUrl);

        // Log optimization results
        console.log(`Image optimized: ${file.size} bytes → ${optimizedFile.size} bytes`);
        console.log('Optimized image details:', {
          name: optimizedFile.name,
          type: optimizedFile.type,
          size: optimizedFile.size
        });
      } catch (error) {
        console.error('Image optimization failed:', error);

        // Fallback to original file
        setPostImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPostImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Popular hashtags for suggestions
  const popularHashtags = [
    'photography', 'nature', 'travel', 'food', 'fitness', 'fashion', 'art',
    'beauty', 'music', 'love', 'instagood', 'photooftheday', 'style', 'happy',
    'cute', 'tbt', 'beautiful', 'me', 'followme', 'summer', 'instadaily', 'friends',
    'family', 'life', 'likeforlike', 'selfie', 'repost', 'motivation', 'follow', 'like'
  ];

  // Get hashtag suggestions based on input
  const getHashtagSuggestions = (input) => {
    if (!input || input.length < 2) {
      setHashtagSuggestions([]);
      setShowHashtagSuggestions(false);
      return;
    }

    const inputLower = input.toLowerCase();
    const suggestions = popularHashtags
      .filter(tag => tag.toLowerCase().includes(inputLower))
      .slice(0, 5); // Limit to 5 suggestions

    setHashtagSuggestions(suggestions);
    setShowHashtagSuggestions(suggestions.length > 0);
  };

  // Handle tag input
  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    getHashtagSuggestions(value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
      setShowHashtagSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowHashtagSuggestions(false);
    } else if (e.key === 'ArrowDown' && showHashtagSuggestions && hashtagSuggestions.length > 0) {
      // Navigate through suggestions
      e.preventDefault();
      const currentIndex = hashtagSuggestions.findIndex(tag => tag === tagInput);
      const nextIndex = currentIndex < hashtagSuggestions.length - 1 ? currentIndex + 1 : 0;
      setTagInput(hashtagSuggestions[nextIndex]);
    } else if (e.key === 'ArrowUp' && showHashtagSuggestions && hashtagSuggestions.length > 0) {
      // Navigate through suggestions
      e.preventDefault();
      const currentIndex = hashtagSuggestions.findIndex(tag => tag === tagInput);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : hashtagSuggestions.length - 1;
      setTagInput(hashtagSuggestions[prevIndex]);
    }
  };

  // Select a hashtag suggestion
  const selectHashtagSuggestion = (tag) => {
    addTag(tag);
    setTagInput('');
    setShowHashtagSuggestions(false);
  };

  // Add tag from input
  const addTag = (tagText) => {
    const newTag = tagText.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (newTag && !postTags.includes(newTag)) {
      if (postTags.length >= 30) {
        setError('Maximum 30 tags allowed');
        return;
      }
      setPostTags([...postTags, newTag]);
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setPostTags(postTags.filter(tag => tag !== tagToRemove));
  };

  // Image rotation functions
  const rotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Handle drag and drop for image upload
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        // Check file size (limit to 20MB for original file)
        if (file.size > 20 * 1024 * 1024) {
          setError('Image size should be less than 20MB');
          return;
        }

        // Log file details for debugging
        console.log('Dropped image file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        });

        try {
          // Show loading state
          setIsSubmitting(true);

          // Optimize image
          const { file: optimizedFile, dataUrl } = await optimizeImage(file);

          // Update state with optimized image
          setPostImage(optimizedFile);
          setPostImagePreview(dataUrl);

          // Log optimization results
          console.log(`Image optimized: ${file.size} bytes → ${optimizedFile.size} bytes`);
          console.log('Optimized image details:', {
            name: optimizedFile.name,
            type: optimizedFile.type,
            size: optimizedFile.size
          });
        } catch (error) {
          console.error('Image optimization failed:', error);

          // Fallback to original file
          setPostImage(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setPostImagePreview(reader.result);
          };
          reader.readAsDataURL(file);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setError('Please drop an image file');
      }
    }
  };

  // Handle reel video drop
  const handleReelDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        // Check file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
          setError('Video size should be less than 100MB');
          return;
        }

        // Log file details for debugging
        console.log('Dropped video file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        });

        // Store the file in state
        setReelVideo(file);

        // Create object URL for preview
        const videoURL = URL.createObjectURL(file);
        setReelVideoPreview(videoURL);

        // Get video duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          const duration = Math.round(video.duration);
          setReelDuration(duration > 60 ? 60 : duration); // Cap at 60 seconds
          console.log('Video duration:', duration, 'seconds');
        };
        video.onerror = (e) => {
          console.error('Error loading video metadata:', e);
          setError('Error processing video. Please try another file.');
        };
        video.src = videoURL;
      } else {
        setError('Please drop a video file');
      }
    }
  };

  // Handle story media drop
  const handleStoryDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Check if it's an image or video
      if (file.type.startsWith('image/')) {
        // Handle image file
        // Check file size (limit to 20MB)
        if (file.size > 20 * 1024 * 1024) {
          setError('Image size should be less than 20MB');
          return;
        }

        // Log file details for debugging
        console.log('Dropped story image file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        });

        // Process image
        processStoryImage(file);
      } else if (file.type.startsWith('video/')) {
        // Handle video file
        // Check file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
          setError('Video size should be less than 100MB');
          return;
        }

        // Log file details for debugging
        console.log('Dropped story video file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        });

        // Process video
        processStoryVideo(file);
      } else {
        setError('Please drop an image or video file');
      }
    }
  };

  // Handle reel video selection
  const handleReelVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('Video size should be less than 100MB');
        return;
      }

      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }

      // Log file details for debugging
      console.log('Selected video file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });

      // Store the file in state
      setReelVideo(file);

      // Create object URL for preview
      const videoURL = URL.createObjectURL(file);
      setReelVideoPreview(videoURL);

      // Get video duration and generate thumbnail
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration);
        setReelDuration(duration > 60 ? 60 : duration); // Cap at 60 seconds
        console.log('Video duration:', duration, 'seconds');

        // Generate thumbnail from video
        setTimeout(() => {
          video.currentTime = 1; // Set to 1 second to avoid black frame
          video.onseeked = () => {
            // Create canvas and draw video frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            canvas.toBlob((blob) => {
              // Create a new File object from the blob
              const thumbnailFile = new File([blob], 'thumbnail.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              setReelThumbnail(thumbnailFile);
              console.log('Thumbnail generated:', thumbnailFile.size, 'bytes');
            }, 'image/jpeg', 0.8);
          };
        }, 500);
      };
      video.onerror = (e) => {
        console.error('Error loading video metadata:', e);
        setError('Error processing video. Please try another file.');
      };
      video.src = videoURL;
    }
  };

  // Handle story media selection
  const handleStoryMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image or video
      if (file.type.startsWith('image/')) {
        // Handle image file
        // Check file size (limit to 20MB)
        if (file.size > 20 * 1024 * 1024) {
          setError('Image size should be less than 20MB');
          return;
        }

        // Log file details for debugging
        console.log('Selected story image file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        });

        // Process image
        processStoryImage(file);
      } else if (file.type.startsWith('video/')) {
        // Handle video file
        // Check file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
          setError('Video size should be less than 100MB');
          return;
        }

        // Log file details for debugging
        console.log('Selected story video file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        });

        // Process video
        processStoryVideo(file);
      } else {
        setError('Please select an image or video file');
      }
    }
  };

  // Process story image
  const processStoryImage = async (file) => {
    try {
      // Show loading state
      setIsSubmitting(true);

      // Optimize image
      const { file: optimizedFile, dataUrl } = await optimizeImage(file);

      // Update state with optimized image
      setStoryMedia(optimizedFile);
      setStoryMediaPreview(dataUrl);
      setStoryMediaType('image');

      // Log optimization results
      console.log(`Image optimized: ${file.size} bytes → ${optimizedFile.size} bytes`);
      console.log('Optimized image details:', {
        name: optimizedFile.name,
        type: optimizedFile.type,
        size: optimizedFile.size
      });
    } catch (error) {
      console.error('Image optimization failed:', error);

      // Fallback to original file
      setStoryMedia(file);
      setStoryMediaType('image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process story video
  const processStoryVideo = (file) => {
    // Store the file in state
    setStoryMedia(file);
    setStoryMediaType('video');

    // Create object URL for preview
    const videoURL = URL.createObjectURL(file);
    setStoryMediaPreview(videoURL);

    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.round(video.duration);
      setStoryDuration(duration > 60 ? 60 : duration); // Cap at 60 seconds
      console.log('Story video duration:', duration, 'seconds');
    };
    video.onerror = (e) => {
      console.error('Error loading video metadata:', e);
      setError('Error processing video. Please try another file.');
    };
    video.src = videoURL;
  };

  // Validate reel form
  const validateReelForm = () => {
    // Check if video is selected
    if (!reelVideo) {
      setError('Please select a video for your reel');
      return false;
    }

    // Check if caption is provided
    if (!reelCaption.trim()) {
      setError('Please add a caption to your reel');
      return false;
    }

    // Check caption length
    if (reelCaption.length > 2200) {
      setError('Caption is too long. Maximum 2200 characters allowed.');
      return false;
    }

    // Check if audio name is provided
    if (!reelAudio.trim()) {
      setError('Please provide an audio name');
      return false;
    }

    return true;
  };

  // Validate story form
  const validateStoryForm = () => {
    // Check if media is selected
    if (!storyMedia) {
      setError('Please select an image or video for your story');
      return false;
    }

    // Check caption length if provided
    if (storyCaption.length > 2200) {
      setError('Caption is too long. Maximum 2200 characters allowed.');
      return false;
    }

    return true;
  };

  // Handle story submission
  const handleStorySubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateStoryForm()) {
      return;
    }

    let progressInterval;
    try {
      setIsSubmitting(true);
      setError(null);

      // Start progress simulation
      progressInterval = simulateUploadProgress();

      // Create form data
      const formData = new FormData();

      // Check if storyMedia is a valid file before appending
      if (storyMedia instanceof File) {
        console.log('Appending media file to FormData:', storyMedia.name, storyMedia.type, storyMedia.size);
        formData.append('media', storyMedia);
      } else {
        console.error('Invalid media file:', storyMedia);
        setError('Please select a valid image or video file');
        clearInterval(progressInterval);
        setUploadProgress(0);
        setIsSubmitting(false);
        return;
      }

      formData.append('caption', storyCaption);
      formData.append('location', storyLocation);
      formData.append('type', storyMediaType);
      formData.append('isPrivate', storyIsPrivate.toString());

      // Add allowed users if story is private
      if (storyIsPrivate && storyAllowedUsers.length > 0) {
        formData.append('allowedUsers', JSON.stringify(storyAllowedUsers));
      }

      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      }

      // Submit to API
      await storyService.createStory(formData);

      // Complete progress
      setUploadProgress(100);
      clearInterval(progressInterval);

      // Show success message
      setSuccess('Story created successfully!');

      // Reset form
      setStoryMedia(null);
      setStoryMediaPreview(null);
      setStoryMediaType(null);
      setStoryCaption('');
      setStoryLocation('');
      setStoryIsPrivate(false);
      setStoryAllowedUsers([]);
      setStoryDuration(0);

      // Remove draft if it exists
      if (hasDraft && draftType === 'story') {
        localStorage.removeItem('createDraft');
        setHasDraft(false);
        setDraftType(null);
      }

      // Redirect to home after a delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error creating story:', err);
      setError(err.response?.data?.message || 'Failed to create story. Please try again.');
      clearInterval(progressInterval);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit reel
  const handleReelSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!validateReelForm()) {
      return;
    }

    let progressInterval;
    try {
      setIsSubmitting(true);
      setError(null);

      // Start progress simulation
      progressInterval = simulateUploadProgress();

      // Create form data
      const formData = new FormData();

      // Check if reelVideo is a valid file before appending
      if (reelVideo instanceof File) {
        console.log('Appending video file to FormData:', reelVideo.name, reelVideo.type, reelVideo.size);
        formData.append('video', reelVideo);
      } else {
        console.error('Invalid video file:', reelVideo);
        setError('Please select a valid video file');
        clearInterval(progressInterval);
        setUploadProgress(0);
        setIsSubmitting(false);
        return;
      }

      formData.append('caption', reelCaption);
      formData.append('audio', reelAudio);
      formData.append('duration', reelDuration.toString());

      // Add thumbnail if available
      if (reelThumbnail instanceof File) {
        console.log('Appending thumbnail to FormData:', reelThumbnail.name, reelThumbnail.type, reelThumbnail.size);
        formData.append('thumbnail', reelThumbnail);
      }

      // Add visibility settings
      formData.append('isPrivate', 'false'); // Public by default
      formData.append('allowComments', 'true'); // Allow comments by default
      formData.append('showLikes', 'true'); // Show likes by default

      // Add hashtags if available
      if (reelTags && reelTags.length > 0) {
        formData.append('tags', JSON.stringify(reelTags));
      }

      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      }

      // Submit to API with better error handling
      try {
        console.log('Submitting reel to API...');
        const response = await reelService.createReel(formData);
        console.log('Reel creation successful:', response.data);

        // Complete progress
        setUploadProgress(100);
        clearInterval(progressInterval);

        // Extract reel ID from response for viewing
        const reelId = response.data?.reel?._id || response.data?._id;
        const viewUrl = reelId ? `/reel/${reelId}` : '/';

        // Show success message with view option
        setSuccess(
          <div>
            Reel created successfully!
            <a href={viewUrl} style={{ color: '#0095f6', textDecoration: 'underline', marginLeft: '5px' }}>
              View your reel
            </a>
          </div>
        );

        // Trigger refresh-feed event to update the home page
        window.dispatchEvent(new CustomEvent('refresh-feed'));

        // Reset form
        setReelCaption('');
        setReelVideo(null);
        setReelVideoPreview(null);
        setReelAudio('Original Audio');
        setReelThumbnail(null);
        setReelTags([]);

        // Remove draft if it exists
        if (hasDraft && draftType === 'reel') {
          localStorage.removeItem('createDraft');
          setHasDraft(false);
          setDraftType(null);
        }

        // Redirect to home after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (apiError) {
        console.error('API error during reel creation:', apiError);
        throw new Error(`Failed to create reel: ${apiError.message}`);
      }
    } catch (err) {
      console.error('Error creating reel:', err);

      // Extract detailed error information
      let errorMessage = 'Failed to create reel. Please try again.';

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);

        errorMessage = err.response.data?.message ||
                      `Server error: ${err.response.status} ${err.response.statusText}`;

        if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.response.status === 404) {
          errorMessage = 'API endpoint not found. Please check your connection.';
        } else if (err.response.status === 413) {
          errorMessage = 'Video file is too large. Please use a smaller video.';
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
      clearInterval(progressInterval);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate post form
  const validatePostForm = () => {
    // Check if image is selected
    if (!postImage) {
      setError('Please select an image for your post');
      return false;
    }

    // Check if caption is provided
    if (!postCaption.trim()) {
      setError('Please add a caption to your post');
      return false;
    }

    // Check caption length
    if (postCaption.length > 2200) {
      setError('Caption is too long. Maximum 2200 characters allowed.');
      return false;
    }

    // Check if tags are valid
    if (postTags.some(tag => tag.length > 30)) {
      setError('Tags should be less than 30 characters each');
      return false;
    }

    return true;
  };

  // Simulate upload progress
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95; // Hold at 95% until the actual upload completes
        }
        return prev + Math.random() * 10;
      });
    }, 300);
    return interval;
  };

  // Submit post
  const handlePostSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!validatePostForm()) {
      return;
    }

    let progressInterval;
    try {
      setIsSubmitting(true);
      setError(null);

      // Start progress simulation
      progressInterval = simulateUploadProgress();

      // Create form data
      const formData = new FormData();

      // Check if postImage is a valid file before appending
      if (postImage instanceof File) {
        console.log('Appending image file to FormData:', postImage.name, postImage.type, postImage.size);
        formData.append('image', postImage);
      } else {
        console.error('Invalid image file:', postImage);
        setError('Please select a valid image file');
        clearInterval(progressInterval);
        setUploadProgress(0);
        setIsSubmitting(false);
        return;
      }

      // Add multiple images if available
      if (postMultipleImages && postMultipleImages.length > 0) {
        postMultipleImages.forEach((image, index) => {
          if (image instanceof File) {
            console.log(`Appending additional image ${index} to FormData:`, image.name, image.type, image.size);
            formData.append('additionalImages', image);
          }
        });
      }

      formData.append('caption', postCaption || '');
      formData.append('tags', JSON.stringify(postTags));

      // Add location if provided
      if (postLocation.trim()) {
        formData.append('location', postLocation.trim());
      }

      // Add rotation if needed
      if (rotation !== 0) {
        formData.append('rotation', rotation.toString());
      }

      // Add user ID if available
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData && userData._id) {
        formData.append('userId', userData._id);
      }

      // Add visibility settings
      formData.append('isPrivate', 'false'); // Public by default
      formData.append('allowComments', 'true'); // Allow comments by default

      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      }

      // Submit to API with better error handling
      try {
        console.log('Submitting post to API...');
        const response = await postService.createPost(formData);
        console.log('Post creation successful:', response.data);

        // Complete progress
        setUploadProgress(100);
        clearInterval(progressInterval);

        // Extract post ID from response for viewing
        const postId = response.data?.post?._id || response.data?._id;
        const viewUrl = postId ? `/post/${postId}` : '/';

        // Show success message with view option
        setSuccess(
          <div>
            Post created successfully!
            <a href={viewUrl} style={{ color: '#0095f6', textDecoration: 'underline', marginLeft: '5px' }}>
              View your post
            </a>
          </div>
        );

        // Trigger refresh-feed event to update the home page
        window.dispatchEvent(new CustomEvent('refresh-feed'));

        // Reset form
        setPostCaption('');
        setPostImage(null);
        setPostImagePreview(null);
        setPostTags([]);
        setPostLocation('');
        setRotation(0);
        setPostMultipleImages([]);
        setPostMultipleImagePreviews([]);

        // Remove draft if it exists
        if (hasDraft && draftType === 'post') {
          localStorage.removeItem('createDraft');
          setHasDraft(false);
          setDraftType(null);
        }

        // Redirect to home after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (apiError) {
        console.error('API error during post creation:', apiError);
        throw new Error(`Failed to create post: ${apiError.message}`);
      }
    } catch (err) {
      console.error('Error creating post:', err);

      // Extract detailed error information
      let errorMessage = 'Failed to create post. Please try again.';

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);

        errorMessage = err.response.data?.message ||
                      `Server error: ${err.response.status} ${err.response.statusText}`;

        if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.response.status === 404) {
          errorMessage = 'API endpoint not found. Please check your connection.';
        } else if (err.response.status === 413) {
          errorMessage = 'Image file is too large. Please use a smaller image.';
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
      clearInterval(progressInterval);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    // If there are unsaved changes, show confirmation dialog
    if (hasUnsavedChanges && !isSubmitting) {
      // Save current tab to switch to after confirmation
      const targetTab = newValue;

      // Show confirmation dialog
      if (window.confirm('You have unsaved changes. Are you sure you want to leave this tab?')) {
        // User confirmed, proceed with tab change
        proceedWithTabChange(targetTab);
      }
      // If user cancels, do nothing and stay on current tab
      return;
    }

    // No unsaved changes, proceed with tab change
    proceedWithTabChange(newValue);
  };

  // Helper function to change tabs
  const proceedWithTabChange = (newValue) => {
    setActiveTab(newValue);

    // Update URL without reloading the page
    const tabNames = ['post', 'reel', 'story'];
    navigate(`/create?tab=${tabNames[newValue]}`, { replace: true });

    // Reset error and success messages
    setError(null);
    setSuccess(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
              backgroundSize: 'cover'
            }}
          />
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Create Content
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
            Share your moments with the world and connect with your followers
          </Typography>
          {hasUnsavedChanges && (
            <Box sx={{ mt: 2, display: 'inline-block', bgcolor: 'rgba(255,255,255,0.2)', px: 2, py: 1, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: '1.2em' }}>💾</span> You have unsaved changes
              </Typography>
            </Box>
          )}
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              py: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              }
            },
            '& .Mui-selected': {
              fontWeight: 'bold',
              color: '#0095f6 !important'
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab
            icon={<ImageIcon />}
            label="Post"
            iconPosition="start"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              fontSize: '1rem'
            }}
          />
          <Tab
            icon={<VideocamIcon />}
            label="Reel"
            iconPosition="start"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              fontSize: '1rem'
            }}
          />
          <Tab
            icon={<StoryIcon />}
            label="Story"
            iconPosition="start"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              fontSize: '1rem'
            }}
          />
        </Tabs>

        {/* Error and Success Messages */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>

        {/* Content based on active tab */}
        <Box sx={{ p: 3 }}>
          {/* Post Tab */}
          {activeTab === 0 && (
            <>
              {/* Draft notification */}
              {hasDraft && draftType === 'post' && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    You have a saved draft. Would you like to continue editing it?
                  </Typography>
                  <Box>
                    <button
                      type="button"
                      style={{ ...styles.button, marginRight: '10px', backgroundColor: '#4CAF50' }}
                      onClick={loadPostDraft}
                    >
                      Load Draft
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.button, backgroundColor: '#f44336' }}
                      onClick={discardDraft}
                    >
                      Discard
                    </button>
                  </Box>
                </Box>
              )}

              <form onSubmit={handlePostSubmit}>
          {/* Image Upload Section */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Upload Image</label>

            {postImagePreview ? (
              <div>
                <img
                  src={postImagePreview}
                  alt="Preview"
                  style={{
                    ...styles.imagePreview,
                    transform: `rotate(${rotation}deg)`
                  }}
                />

                {/* Image file info */}
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  textAlign: 'left'
                }}>
                  {postImage && (
                    <>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        File: {postImage.name}
                      </div>
                      <div style={{ marginBottom: '5px' }}>
                        Size: {(postImage.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                      <div>
                        Type: {postImage.type}
                      </div>
                    </>
                  )}
                </div>

                <div style={styles.imageControls}>
                  <button
                    type="button"
                    style={styles.iconButton}
                    onClick={rotateLeft}
                    title="Rotate Left"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    style={styles.iconButton}
                    onClick={rotateRight}
                    title="Rotate Right"
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    style={{...styles.iconButton, backgroundColor: '#f44336', color: 'white'}}
                    onClick={() => {
                      setPostImage(null);
                      setPostImagePreview(null);
                      setRotation(0);
                    }}
                    title="Remove Image"
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    ...styles.dropZone,
                    ...(isDragging ? styles.dropZoneActive : {})
                  }}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('post-image-input').click()}
                >
                  <p>Drag & drop an image here, or click to select</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>JPG, PNG, GIF (Max 10MB)</p>
                  <input
                    id="post-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePostImageChange}
                    style={{ display: 'none' }}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Image upload requirements */}
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    Image Requirements:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                    <li>File formats: JPG, PNG, GIF</li>
                    <li>Maximum file size: 10MB</li>
                    <li>Recommended aspect ratio: 1:1 (square) or 4:5 (portrait)</li>
                    <li>Minimum resolution: 600x600 pixels</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Caption Section */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Caption</label>
            <textarea
              style={styles.textarea}
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              placeholder="Write a caption..."
              disabled={isSubmitting}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
              <div
                style={{
                  ...styles.charCount,
                  ...(postCaption.length > 2200 ? styles.charCountExceeded : {})
                }}
              >
                {postCaption.length}/2200 characters
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Location (optional)</label>
            <input
              type="text"
              style={styles.input}
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
              placeholder="Add a location to your post"
              disabled={isSubmitting}
            />
          </div>

          {/* Tags Section */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Tags (press Enter after each tag)</label>
            <div style={{ position: 'relative' }}>
              <input
                ref={tagInputRef}
                type="text"
                style={styles.input}
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                onBlur={() => setTimeout(() => setShowHashtagSuggestions(false), 200)}
                onFocus={() => tagInput.length >= 2 && setShowHashtagSuggestions(true)}
                placeholder="Add tags"
                disabled={isSubmitting}
              />

              {/* Hashtag suggestions */}
              {showHashtagSuggestions && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  marginTop: '5px'
                }}>
                  {hashtagSuggestions.map(tag => (
                    <div
                      key={tag}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        transition: 'background-color 0.2s ease',
                        backgroundColor: tagInput === tag ? '#f0f0f0' : 'transparent'
                      }}
                      onMouseDown={() => selectHashtagSuggestion(tag)}
                      onMouseEnter={() => setTagInput(tag)}
                    >
                      #{tag}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.tagContainer}>
              {postTags.map(tag => (
                <div key={tag} style={styles.tag}>
                  <span style={styles.tagText}>#{tag}</span>
                  <button
                    type="button"
                    style={styles.tagRemove}
                    onClick={() => removeTag(tag)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {postTags.length === 0 && (
                <p style={{ color: '#666', fontSize: '14px' }}>No tags added yet</p>
              )}
            </div>

            {/* Popular hashtags */}
            <div style={{ marginTop: '10px' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Popular hashtags:
              </Typography>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {popularHashtags.slice(0, 10).map(tag => (
                  <div
                    key={tag}
                    style={{
                      backgroundColor: '#f0f0f0',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: '#0095f6'
                    }}
                    onClick={() => selectHashtagSuggestion(tag)}
                  >
                    #{tag}
                  </div>
                ))}
              </div>
            </div>
          </div>

              {/* Upload Progress */}
              {isSubmitting && (
                <Box sx={{ width: '100%', mt: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                    Uploading... {Math.round(uploadProgress)}%
                  </Typography>
                  <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${uploadProgress}%`,
                        bgcolor: '#0095f6',
                        height: '100%',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* Submit Buttons */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <button
                  type="button"
                  style={{ ...styles.button, backgroundColor: '#757575' }}
                  disabled={isSubmitting}
                  onClick={savePostDraft}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#616161'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#757575'}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  style={styles.button}
                  disabled={isSubmitting}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
                >
                  {isSubmitting ? (
                    <div style={styles.loadingSpinner}></div>
                  ) : (
                    'Share Post'
                  )}
                </button>
              </Box>
            </form>
            </>
          )}

          {/* Reel Tab */}
          {activeTab === 1 && (
            <>
              {/* Draft notification */}
              {hasDraft && draftType === 'reel' && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    You have a saved draft. Would you like to continue editing it?
                  </Typography>
                  <Box>
                    <button
                      type="button"
                      style={{ ...styles.button, marginRight: '10px', backgroundColor: '#4CAF50' }}
                      onClick={loadReelDraft}
                    >
                      Load Draft
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.button, backgroundColor: '#f44336' }}
                      onClick={discardDraft}
                    >
                      Discard
                    </button>
                  </Box>
                </Box>
              )}

              <form onSubmit={handleReelSubmit}>
              {/* Video Upload Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Upload Video
                </Typography>

                {reelVideoPreview ? (
                  <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, mx: 'auto' }}>
                    <video
                      src={reelVideoPreview}
                      controls
                      style={{ width: '100%', borderRadius: 8, maxHeight: 500 }}
                    />

                    {/* Video file info */}
                    <Box sx={{
                      mt: 1,
                      p: 2,
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: 1,
                      fontSize: '14px',
                      textAlign: 'left'
                    }}>
                      {reelVideo && (
                        <>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                            File: {reelVideo.name}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            Size: {(reelVideo.size / (1024 * 1024)).toFixed(2)} MB
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            Duration: {reelDuration} seconds
                          </Typography>
                        </>
                      )}
                    </Box>

                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <button
                        type="button"
                        style={styles.iconButton}
                        onClick={() => {
                          setReelVideo(null);
                          setReelVideoPreview(null);
                        }}
                        title="Remove Video"
                      >
                        ✕ Remove Video
                      </button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': { borderColor: theme.palette.primary.main },
                      bgcolor: isDragging ? 'rgba(0, 0, 0, 0.05)' : 'transparent'
                    }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleReelDrop}
                    onClick={() => document.getElementById('reel-video-input').click()}
                  >
                    <VideocamIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1">Drag & drop a video here, or click to select</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      MP4, MOV, AVI (Max 100MB, up to 60 seconds)
                    </Typography>
                    <input
                      id="reel-video-input"
                      type="file"
                      accept="video/*"
                      onChange={handleReelVideoChange}
                      style={{ display: 'none' }}
                      disabled={isSubmitting}
                    />
                  </Box>
                )}

                {/* Video upload requirements */}
                {!reelVideoPreview && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 1 }}>
                      Video Requirements:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                      <li>File formats: MP4, MOV, AVI</li>
                      <li>Maximum file size: 100MB</li>
                      <li>Maximum duration: 60 seconds</li>
                      <li>Recommended aspect ratio: 9:16 (vertical)</li>
                    </ul>
                  </Box>
                )}
              </Box>

              {/* Caption Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Caption
                </Typography>
                <textarea
                  placeholder="Write a caption..."
                  value={reelCaption}
                  onChange={(e) => setReelCaption(e.target.value)}
                  style={styles.textarea}
                  disabled={isSubmitting}
                  maxLength={2200}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {reelCaption.length}/2200
                  </Typography>
                </Box>
              </Box>

              {/* Audio Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Audio
                </Typography>
                <input
                  type="text"
                  placeholder="Audio name"
                  value={reelAudio}
                  onChange={(e) => setReelAudio(e.target.value)}
                  style={styles.input}
                  disabled={isSubmitting}
                />
              </Box>

              {/* Upload Progress */}
              {isSubmitting && (
                <Box sx={{ width: '100%', mt: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                    Uploading... {Math.round(uploadProgress)}%
                  </Typography>
                  <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${uploadProgress}%`,
                        bgcolor: '#0095f6',
                        height: '100%',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* Submit Buttons */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <button
                  type="button"
                  style={{ ...styles.button, backgroundColor: '#757575' }}
                  disabled={isSubmitting}
                  onClick={saveReelDraft}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#616161'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#757575'}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  style={styles.button}
                  disabled={isSubmitting}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
                >
                  {isSubmitting ? (
                    <div style={styles.loadingSpinner}></div>
                  ) : (
                    'Share Reel'
                  )}
                </button>
              </Box>
            </form>
            </>
          )}

          {/* Story Tab */}
          {activeTab === 2 && (
            <>
              {/* Draft notification */}
              {hasDraft && draftType === 'story' && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    You have a saved draft. Would you like to continue editing it?
                  </Typography>
                  <Box>
                    <button
                      type="button"
                      style={{ ...styles.button, marginRight: '10px', backgroundColor: '#4CAF50' }}
                      onClick={loadStoryDraft}
                    >
                      Load Draft
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.button, backgroundColor: '#f44336' }}
                      onClick={discardDraft}
                    >
                      Discard
                    </button>
                  </Box>
                </Box>
              )}

              <form onSubmit={handleStorySubmit}>
                {/* Media Upload Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Upload Media
                  </Typography>

                  {storyMediaPreview ? (
                    <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, mx: 'auto' }}>
                      {storyMediaType === 'image' ? (
                        <img
                          src={storyMediaPreview}
                          alt="Story Preview"
                          style={{ width: '100%', borderRadius: 8, maxHeight: 500 }}
                        />
                      ) : (
                        <video
                          src={storyMediaPreview}
                          controls
                          style={{ width: '100%', borderRadius: 8, maxHeight: 500 }}
                        />
                      )}

                      {/* Media file info */}
                      <Box sx={{
                        mt: 1,
                        p: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: 1,
                        fontSize: '14px',
                        textAlign: 'left'
                      }}>
                        {storyMedia && (
                          <>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                              File: {storyMedia.name}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              Size: {(storyMedia.size / (1024 * 1024)).toFixed(2)} MB
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              Type: {storyMedia.type}
                            </Typography>
                            {storyMediaType === 'video' && storyDuration && (
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                Duration: {storyDuration} seconds
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>

                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <button
                          type="button"
                          style={{...styles.iconButton, backgroundColor: '#f44336', color: 'white'}}
                          onClick={() => {
                            setStoryMedia(null);
                            setStoryMediaPreview(null);
                            setStoryMediaType(null);
                            setStoryDuration(0);
                          }}
                          title="Remove Media"
                        >
                          ✕ Remove Media
                        </button>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Box
                        sx={{
                          border: '2px dashed #ccc',
                          borderRadius: 2,
                          p: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          '&:hover': { borderColor: theme.palette.primary.main },
                          bgcolor: isDragging ? 'rgba(0, 0, 0, 0.05)' : 'transparent'
                        }}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleStoryDrop}
                        onClick={() => document.getElementById('story-media-input').click()}
                      >
                        <Box sx={{ mb: 2 }}>
                          <span style={{ fontSize: '48px' }}>📷</span>
                        </Box>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Drag and drop your media here or click to browse
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Images (JPG, PNG) or Videos (MP4, MOV) up to 100MB
                        </Typography>
                        <input
                          id="story-media-input"
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleStoryMediaChange}
                          style={{ display: 'none' }}
                          disabled={isSubmitting}
                        />
                      </Box>

                      {/* Media upload requirements */}
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 1 }}>
                          Story Requirements:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                          <li>Image formats: JPG, PNG, GIF</li>
                          <li>Video formats: MP4, MOV, AVI</li>
                          <li>Maximum file size: 100MB</li>
                          <li>Maximum video duration: 60 seconds</li>
                          <li>Recommended aspect ratio: 9:16 (vertical)</li>
                          <li>Stories expire after 24 hours</li>
                        </ul>
                      </Box>
                    </>
                  )}
                </Box>

                {/* Caption Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Caption
                  </Typography>
                  <textarea
                    placeholder="Write a caption..."
                    value={storyCaption}
                    onChange={(e) => setStoryCaption(e.target.value)}
                    style={styles.textarea}
                    disabled={isSubmitting}
                    maxLength={2200}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {storyCaption.length}/2200
                    </Typography>
                  </Box>
                </Box>

                {/* Location Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Location (optional)
                  </Typography>
                  <input
                    type="text"
                    placeholder="Add a location"
                    value={storyLocation}
                    onChange={(e) => setStoryLocation(e.target.value)}
                    style={styles.input}
                    disabled={isSubmitting}
                  />
                </Box>

                {/* Privacy Settings */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Privacy Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={storyIsPrivate}
                        onChange={(e) => setStoryIsPrivate(e.target.checked)}
                        disabled={isSubmitting}
                      />
                    }
                    label="Private Story (only visible to selected followers)"
                  />

                  {storyIsPrivate && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Select followers who can see this story:
                      </Typography>
                      <Box sx={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                        {/* This would be populated with actual followers in a real app */}
                        <FormControlLabel
                          control={<Checkbox />}
                          label="Close Friends"
                        />
                        <FormControlLabel
                          control={<Checkbox />}
                          label="Family"
                        />
                        <FormControlLabel
                          control={<Checkbox />}
                          label="Work Friends"
                        />
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Upload Progress */}
                {isSubmitting && (
                  <Box sx={{ width: '100%', mt: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                      Uploading... {Math.round(uploadProgress)}%
                    </Typography>
                    <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          width: `${uploadProgress}%`,
                          bgcolor: '#0095f6',
                          height: '100%',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                  </Box>
                )}

                {/* Submit Buttons */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <button
                    type="button"
                    style={{ ...styles.button, backgroundColor: '#757575' }}
                    disabled={isSubmitting}
                    onClick={saveStoryDraft}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#616161'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#757575'}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    style={styles.button}
                    disabled={isSubmitting || !storyMedia}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
                  >
                    {isSubmitting ? (
                      <div style={styles.loadingSpinner}></div>
                    ) : (
                      'Share Story'
                    )}
                  </button>
                </Box>
              </form>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Create;
