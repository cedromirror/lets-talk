import React, { useState, useRef, useEffect } from 'react';
import { Box, Skeleton, Typography, IconButton, LinearProgress, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  BrokenImage as BrokenImageIcon,
  Fullscreen as FullscreenIcon,
  HighQuality as HighQualityIcon,
  TuneRounded as LowQualityIcon
} from '@mui/icons-material';
import { formatCloudinaryUrl, getResponsiveVideoUrl } from '../../utils/cloudinaryHelper';
import { handleVideoError } from '../../utils/imageErrorHandler';
import { getProperFileUrl, getMimeType, isVideoFile, getFileExtension } from '../../utils/fileUtils';

// Helper function to format time (seconds to MM:SS)
const formatTime = (seconds) => {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Enhanced Video component with loading states, error handling, custom controls,
 * and optimized loading with adaptive quality
 *
 * @param {Object} props Component props
 * @param {string} props.src Video source URL
 * @param {string} props.thumbnail Thumbnail image URL
 * @param {string} props.alt Video alt text
 * @param {Object} props.sx Additional styles
 * @param {string} props.aspectRatio Aspect ratio (e.g., '1/1', '4/3', '16/9')
 * @param {string} props.objectFit Object fit style (cover, contain, etc.)
 * @param {Function} props.onLoad Callback when video loads
 * @param {Function} props.onError Callback when video fails to load
 * @param {Function} props.onEnded Callback when video ends
 * @param {boolean} props.autoPlay Whether to autoplay the video
 * @param {boolean} props.loop Whether to loop the video
 * @param {boolean} props.muted Whether to mute the video
 * @param {boolean} props.controls Whether to show native controls
 * @param {boolean} props.customControls Whether to show custom controls
 * @param {React.ReactNode} props.overlay Overlay content
 * @param {boolean} props.preload Whether to preload the video ('auto', 'metadata', 'none')
 * @param {boolean} props.adaptiveQuality Whether to use adaptive quality based on network
 * @param {boolean} props.lowQualityThumbnail Whether to use a low-quality thumbnail
 * @param {number} props.lowQualityWidth Width for low-quality version
 * @param {number} props.highQualityWidth Width for high-quality version
 * @param {boolean} props.lazyLoad Whether to lazy load the video
 */
const EnhancedVideo = ({
  src,
  thumbnail = null,
  alt = '',
  sx = {},
  aspectRatio = '16/9',
  objectFit = 'cover',
  onLoad,
  onError,
  onEnded,
  autoPlay = false,
  loop = true,
  muted = true,
  controls = false,
  customControls = true,
  overlay = null,
  preload = 'metadata',
  adaptiveQuality = true,
  lowQualityThumbnail = true,
  lowQualityWidth = 480,
  highQualityWidth = 1280,
  lazyLoad = true,
  ...props
}) => {
  const theme = useTheme();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState('');
  const [optimizedThumbnail, setOptimizedThumbnail] = useState('');
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const controlsTimeoutRef = useRef(null);
  const intersectionObserverRef = useRef(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (lazyLoad && containerRef.current) {
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );

      intersectionObserverRef.current.observe(containerRef.current);
    }

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [lazyLoad]);

  // Optimize video source and thumbnail based on quality settings
  useEffect(() => {
    if (!src) return;

    try {
      // First, ensure we have proper URLs that can be loaded by the browser
      const properSrc = getProperFileUrl(src);
      const properThumbnail = thumbnail ? getProperFileUrl(thumbnail) : null;

      // Set initial quality based on network and device
      const initialQuality = adaptiveQuality ? detectOptimalQuality() : true;
      setIsHighQuality(initialQuality);

      // Handle different URL types
      if (properSrc.includes('cloudinary.com')) {
        // For Cloudinary URLs, use the formatCloudinaryUrl helper
        const qualityWidth = initialQuality ? highQualityWidth : lowQualityWidth;
        const optimized = formatCloudinaryUrl(properSrc, 'video', {
          width: qualityWidth,
          quality: initialQuality ? 90 : 70
        });
        setOptimizedSrc(optimized);
      } else if (properSrc.startsWith('http') || properSrc.startsWith('/')) {
        // For non-Cloudinary URLs, use as is
        setOptimizedSrc(properSrc);
      } else {
        // For what might be just a public ID, try to construct a Cloudinary URL
        const cloudName = 'droja6ntk';
        const qualityWidth = initialQuality ? highQualityWidth : lowQualityWidth;
        const optimized = `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_${initialQuality ? 90 : 70},w_${qualityWidth}/${properSrc}`;
        setOptimizedSrc(optimized);
      }

      // Optimize thumbnail if available
      if (properThumbnail) {
        if (properThumbnail.includes('cloudinary.com') && lowQualityThumbnail) {
          // For Cloudinary thumbnails
          const optimizedThumb = formatCloudinaryUrl(properThumbnail, 'image', {
            width: 480,
            quality: 60
          });
          setOptimizedThumbnail(optimizedThumb);
        } else if (properThumbnail.startsWith('http') || properThumbnail.startsWith('/')) {
          // For non-Cloudinary thumbnails
          setOptimizedThumbnail(properThumbnail);
        } else if (lowQualityThumbnail) {
          // For what might be just a public ID
          const cloudName = 'droja6ntk';
          const optimizedThumb = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_60,w_480/${properThumbnail}`;
          setOptimizedThumbnail(optimizedThumb);
        } else {
          setOptimizedThumbnail(properThumbnail);
        }
      } else {
        // If no thumbnail provided, try to generate one from the video
        if (properSrc.includes('cloudinary.com')) {
          // Extract the public ID from the Cloudinary URL
          const parts = properSrc.split('/upload/');
          if (parts.length === 2) {
            const publicId = parts[1].split('/').pop();
            const cloudName = 'droja6ntk';
            const generatedThumbnail = `https://res.cloudinary.com/${cloudName}/video/upload/f_jpg,q_70,w_480/${publicId}`;
            setOptimizedThumbnail(generatedThumbnail);
          } else {
            setOptimizedThumbnail(null);
          }
        } else {
          setOptimizedThumbnail(null);
        }
      }
    } catch (error) {
      console.error('Error optimizing video source:', error);
      // Fallback to proper URLs or default placeholders
      setOptimizedSrc(getProperFileUrl(src) || '/assets/default-video.svg');
      setOptimizedThumbnail(thumbnail ? getProperFileUrl(thumbnail) : '/assets/default-image.svg');
      setIsHighQuality(true);
    }
  }, [src, thumbnail, adaptiveQuality, highQualityWidth, lowQualityWidth, lowQualityThumbnail]);

  // Detect optimal quality based on network and device
  const detectOptimalQuality = () => {
    try {
      // Check connection type if available
      if (typeof navigator !== 'undefined' && navigator.connection) {
        const connection = navigator.connection;

        // Low quality for slow connections
        if (
          connection.saveData || // Data saver is enabled
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g' ||
          connection.downlink < 1.5 // Less than 1.5 Mbps
        ) {
          return false;
        }
      }

      // Check if device is likely mobile
      const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Use lower quality for mobile devices unless they have good connection
      if (isMobile && (typeof navigator === 'undefined' || !navigator.connection || navigator.connection.downlink < 5)) {
        return false;
      }
    } catch (error) {
      console.error('Error detecting optimal quality:', error);
      return false; // Default to low quality on error
    }

    // Default to high quality
    return true;
  };

  // Toggle video quality
  const toggleQuality = () => {
    try {
      if (!src || !videoRef.current) return;

      // Get proper URL
      const properSrc = getProperFileUrl(src);
      const newQuality = !isHighQuality;
      setIsHighQuality(newQuality);

      let optimized;

      // Handle different URL types
      if (properSrc.includes('cloudinary.com')) {
        // For Cloudinary URLs, use the formatCloudinaryUrl helper
        const qualityWidth = newQuality ? highQualityWidth : lowQualityWidth;
        optimized = formatCloudinaryUrl(properSrc, 'video', {
          width: qualityWidth,
          quality: newQuality ? 90 : 70
        });
      } else if (properSrc.startsWith('http') || properSrc.startsWith('/')) {
        // For non-Cloudinary URLs, we can't change quality, so just return
        console.log('Cannot change quality for non-Cloudinary URLs');
        return;
      } else {
        // For what might be just a public ID, try to construct a Cloudinary URL
        const cloudName = 'droja6ntk';
        const qualityWidth = newQuality ? highQualityWidth : lowQualityWidth;
        optimized = `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_${newQuality ? 90 : 70},w_${qualityWidth}/${properSrc}`;
      }

      setOptimizedSrc(optimized);
      console.log(`Switching to ${newQuality ? 'high' : 'low'} quality:`, optimized);

      // Preserve current playback state
      const wasPlaying = !videoRef.current.paused;
      const currentTime = videoRef.current.currentTime;
      const volume = videoRef.current.volume;
      const muted = videoRef.current.muted;

      // Find the first source element and update its src
      const sourceElement = videoRef.current.querySelector('source');
      if (sourceElement) {
        sourceElement.src = optimized;
        videoRef.current.load();
      } else {
        // Fallback to the old method if no source element is found
        videoRef.current.src = optimized;
        videoRef.current.load();
      }

      // Restore playback state
      videoRef.current.currentTime = currentTime;
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;

      if (wasPlaying) {
        // Use a promise to handle play attempts
        const playPromise = videoRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('Error playing video after quality change:', err);
            // Try alternative playback method if the first attempt fails
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(e => {
                  console.error('Second play attempt failed:', e);
                  // If both attempts fail, show a play button to the user
                  setPlaying(false);
                });
              }
            }, 500);
          });
        }
      }
    } catch (error) {
      console.error('Error toggling video quality:', error);
      // Try to recover by using the proper original source
      if (videoRef.current) {
        try {
          const sourceElement = videoRef.current.querySelector('source');
          if (sourceElement) {
            sourceElement.src = getProperFileUrl(src);
            videoRef.current.load();
          } else {
            videoRef.current.src = getProperFileUrl(src);
            videoRef.current.load();
          }
        } catch (e) {
          console.error('Recovery attempt failed:', e);
        }
      }
    }
  };

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoadProgress(30); // Update progress indicator
      if (onLoad) onLoad();
    }
  };

  // Handle video loaded data
  const handleLoadedData = () => {
    setLoading(false);
    setLoadProgress(100);
  };

  // Handle video error
  const handleError = (e) => {
    console.error('Video error:', e?.target?.src || optimizedSrc || src);
    setLoading(false);
    setError(true);
    setLoadProgress(0);

    // Try to recover by using a different format or approach
    try {
      if (videoRef.current) {
        // If we have a source element, try updating it directly
        const sourceElement = videoRef.current.querySelector('source');
        if (sourceElement && src) {
          // Try different recovery approaches

          // 1. First try with the original source directly
          const properSrc = getProperFileUrl(src);
          console.log('Attempting to recover with direct URL:', properSrc);

          // 2. If it's a Cloudinary URL, try with different format
          if (properSrc.includes('cloudinary.com')) {
            try {
              // Try with MP4 format explicitly
              const baseUrl = properSrc.split('/upload/')[0] + '/upload/';
              let publicId = properSrc.split('/upload/')[1];

              // Clean up the public ID
              if (publicId.includes('/')) {
                publicId = publicId.split('/').slice(1).join('/');
              }

              // Check if the public ID is valid
              if (!publicId || publicId.includes('undefined') || publicId.includes('null')) {
                console.error('Invalid public ID:', publicId);
                throw new Error('Invalid public ID');
              }

              // Try with explicit MP4 format
              const mp4Url = `${baseUrl}f_mp4,q_auto/${publicId}`;
              console.log('Trying MP4 format:', mp4Url);
              sourceElement.src = mp4Url;
              videoRef.current.load();

              // Set a fallback in case this also fails
              sourceElement.onerror = () => {
                // Try with WebM format
                const webmUrl = `${baseUrl}f_webm,q_auto/${publicId}`;
                console.log('Trying WebM format:', webmUrl);
                sourceElement.src = webmUrl;
                videoRef.current.load();

                // If that also fails, use the default fallback
                sourceElement.onerror = () => {
                  console.log('Using fallback video source');
                  sourceElement.src = '/assets/default-video.svg';
                  videoRef.current.load();
                };
              };

              return; // Exit early as we've set up the recovery chain
            } catch (cloudinaryError) {
              console.error('Error with Cloudinary recovery:', cloudinaryError);
            }
          } else if (!properSrc.startsWith('http') && !properSrc.startsWith('/')) {
            // 3. If it might be just a public ID, try direct Cloudinary URL
            try {
              const cloudName = 'droja6ntk';
              const directUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${properSrc}`;
              console.log('Trying direct Cloudinary URL:', directUrl);
              sourceElement.src = directUrl;
              videoRef.current.load();

              // Set a fallback in case this also fails
              sourceElement.onerror = () => {
                console.log('Using fallback video source');
                sourceElement.src = '/assets/default-video.svg';
                videoRef.current.load();
              };

              return; // Exit early as we've set up the recovery
            } catch (directError) {
              console.error('Error with direct URL recovery:', directError);
            }
          }

          // 4. If all else fails, use the default fallback
          sourceElement.src = properSrc;
          videoRef.current.load();

          sourceElement.onerror = () => {
            console.log('Using fallback video source');
            sourceElement.src = '/assets/default-video.svg';
            videoRef.current.load();
          };
        }
      }
    } catch (recoveryError) {
      console.error('Error during video error recovery:', recoveryError);
    }

    // Use our improved error handler as a last resort
    handleVideoError(e, '/assets/default-video.svg', '/assets/default-image.svg');

    if (onError) onError(e);
  };

  // Handle video ended
  const handleEnded = () => {
    setPlaying(false);
    if (onEnded) onEnded();
    if (loop && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.error('Error playing video:', err));
      setPlaying(true);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  // Handle progress event to track loading
  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setLoadProgress(Math.min(100, Math.round((bufferedEnd / duration) * 100)));
      }
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.error('Error playing video:', err));
      }
      setPlaying(!playing);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Enter fullscreen
  const enterFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  // Show controls temporarily
  const showControlsTemporarily = () => {
    setShowControls(true);

    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Set new timeout to hide controls
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Handle mouse movement
  const handleMouseMove = () => {
    if (customControls) {
      showControlsTemporarily();
    }
  };

  // Simulate progress for better UX
  useEffect(() => {
    if (loading && loadProgress < 30) {
      const timer = setTimeout(() => {
        setLoadProgress(prev => Math.min(prev + 5, 30));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, loadProgress]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Only render video if it's visible (for lazy loading) or lazyLoad is disabled
  if (lazyLoad && !isVisible) {
    return (
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)',
          overflow: 'hidden',
          borderRadius: '2px',
          ...sx
        }}
      >
        {/* Placeholder for lazy loading */}
        {thumbnail ? (
          <img
            src={optimizedThumbnail || thumbnail}
            alt={`${alt} thumbnail`}
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              filter: 'blur(2px)',
              opacity: 0.7
            }}
          />
        ) : (
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{
              width: '100%',
              height: '100%'
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)',
        overflow: 'hidden',
        cursor: 'pointer',
        borderRadius: '2px',
        ...sx
      }}
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
    >
      {/* Loading indicator with progress */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            bgcolor: 'rgba(0,0,0,0.3)'
          }}
        >
          {/* Show thumbnail if available */}
          {(optimizedThumbnail || thumbnail) && (
            <img
              src={optimizedThumbnail || thumbnail}
              alt={`${alt} thumbnail`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit,
                zIndex: 0
              }}
            />
          )}

          <CircularProgress
            variant="determinate"
            value={loadProgress}
            size={40}
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
              position: 'relative',
              zIndex: 2
            }}
          />

          <Typography variant="caption" sx={{ color: 'white', mt: 1, position: 'relative', zIndex: 2 }}>
            {loadProgress < 100 ? 'Loading...' : 'Ready'}
          </Typography>
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            color: 'text.secondary',
            zIndex: 2
          }}
        >
          <BrokenImageIcon sx={{ fontSize: 40, mb: 1, opacity: 0.6 }} />
          <Typography variant="caption" align="center">
            Video could not be loaded
          </Typography>

          {/* Show different options based on video source */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Quality toggle for Cloudinary videos */}
            {src && src.includes('cloudinary.com') && (
              <>
                <Typography variant="caption" align="center" sx={{ fontSize: '0.7rem' }}>
                  Try switching to {isHighQuality ? 'lower' : 'higher'} quality
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleQuality();
                  }}
                  sx={{ mt: 1, color: 'text.secondary' }}
                >
                  {isHighQuality ? <LowQualityIcon fontSize="small" /> : <HighQualityIcon fontSize="small" />}
                </IconButton>
              </>
            )}

            {/* Retry button for all videos */}
            <Typography variant="caption" align="center" sx={{ mt: 2, fontSize: '0.7rem' }}>
              Or try reloading the video
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                // Reset error state
                setError(false);
                setLoading(true);
                // Reload with proper URL
                if (videoRef.current) {
                  const properSrc = getProperFileUrl(src);
                  const sourceElement = videoRef.current.querySelector('source');
                  if (sourceElement) {
                    sourceElement.src = properSrc;
                  } else {
                    videoRef.current.src = properSrc;
                  }
                  videoRef.current.load();
                }
              }}
              sx={{ mt: 1, color: 'text.secondary' }}
            >
              <PlayIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Main video element */}
      <video
        ref={videoRef}
        poster={optimizedThumbnail || thumbnail || '/assets/default-image.svg'}
        muted={isMuted}
        autoPlay={autoPlay}
        loop={loop}
        controls={controls && !customControls}
        playsInline={true}
        preload={preload}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onError={(e) => {
          handleError(e);
          // Apply direct fallback as a backup
          handleVideoError(e, '/assets/default-video.svg', '/assets/default-image.svg');
        }}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: error ? 'none' : 'block',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
        data-fallback-src="/assets/default-video.svg"
        data-fallback-poster="/assets/default-image.svg"
        {...props}
      >
        {/* Support multiple video formats with correct MIME types */}
        <source
          src={optimizedSrc || getProperFileUrl(src) || '/assets/default-video.svg'}
          type={getMimeType(src) || 'video/mp4'}
          onError={(e) => {
            console.error('Source error:', e);
            e.target.src = '/assets/default-video.svg';
          }}
        />

        {/* Add alternative format as fallback if the source is a video file */}
        {src && isVideoFile(src) && getFileExtension(src) !== 'mp4' && (
          <source
            src={getProperFileUrl(src)}
            type={`video/${getFileExtension(src)}`}
          />
        )}

        {/* Add MP4 fallback for non-MP4 videos */}
        {src && isVideoFile(src) && getFileExtension(src) !== 'mp4' && (
          <source
            src={getProperFileUrl(src.replace(`.${getFileExtension(src)}`, '.mp4'))}
            type="video/mp4"
          />
        )}

        {/* Fallback message */}
        Your browser does not support the video tag or the video format.
      </video>

      {/* Custom controls */}
      {customControls && (showControls || !playing) && (
        <>
          {/* Play/Pause button overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              opacity: 0.8,
              transition: 'opacity 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <IconButton
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)'
                },
                width: 60,
                height: 60
              }}
            >
              {playing ? <PauseIcon fontSize="large" /> : <PlayIcon fontSize="large" />}
            </IconButton>
          </Box>

          {/* Bottom controls */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 1,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 3
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar */}
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: 2,
                mb: 1,
                '& .MuiLinearProgress-bar': {
                  transition: 'none'
                }
              }}
            />

            {/* Controls row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  sx={{ color: 'white', p: 0.5 }}
                >
                  {playing ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                </IconButton>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  sx={{ color: 'white', p: 0.5, ml: 0.5 }}
                >
                  {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                </IconButton>

                <Typography variant="caption" sx={{ color: 'white', ml: 1 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Quality toggle button (only for Cloudinary videos) */}
                {src && src.includes('cloudinary.com') && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleQuality();
                    }}
                    sx={{ color: 'white', p: 0.5, mr: 0.5 }}
                    title={isHighQuality ? 'Switch to low quality' : 'Switch to high quality'}
                  >
                    {isHighQuality ? <HighQualityIcon fontSize="small" /> : <LowQualityIcon fontSize="small" />}
                  </IconButton>
                )}

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    enterFullscreen();
                  }}
                  sx={{ color: 'white', p: 0.5 }}
                >
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Optional overlay content */}
      {overlay && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 4
          }}
        >
          {overlay}
        </Box>
      )}
    </Box>
  );
};

export default EnhancedVideo;
