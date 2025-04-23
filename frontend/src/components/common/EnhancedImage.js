import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton, Typography, CircularProgress } from '@mui/material';
import { BrokenImage as BrokenImageIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { formatCloudinaryUrl } from '../../utils/cloudinaryHelper';
import { handleImageError } from '../../utils/imageErrorHandler';

/**
 * Enhanced Image component with progressive loading, error handling, aspect ratio preservation,
 * and optimized loading with WebP support and responsive sizing
 *
 * @param {Object} props Component props
 * @param {string} props.src Image source URL
 * @param {string} props.alt Image alt text
 * @param {Object} props.sx Additional styles
 * @param {string} props.aspectRatio Aspect ratio (e.g., '1/1', '4/3', '16/9')
 * @param {string} props.objectFit Object fit style (cover, contain, etc.)
 * @param {Function} props.onLoad Callback when image loads
 * @param {Function} props.onError Callback when image fails to load
 * @param {boolean} props.lazy Whether to use lazy loading
 * @param {string} props.fallbackSrc Fallback image source if main image fails
 * @param {React.ReactNode} props.overlay Overlay content
 * @param {boolean} props.lowQualityPlaceholder Whether to show a low-quality placeholder while loading
 * @param {boolean} props.responsive Whether to use responsive sizing
 * @param {number} props.quality Image quality (1-100)
 * @param {boolean} props.useWebP Whether to use WebP format if supported
 * @param {string} props.sizes Responsive sizes attribute
 * @param {Array<{width: number, url: string}>} props.srcSet Array of source set options
 */
const EnhancedImage = ({
  src,
  alt = '',
  sx = {},
  aspectRatio = '1/1',
  objectFit = 'cover',
  onLoad,
  onError,
  lazy = true,
  fallbackSrc = null,
  overlay = null,
  lowQualityPlaceholder = false,
  responsive = true,
  quality = 80,
  useWebP = true,
  sizes = '(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw',
  srcSet = [],
  ...props
}) => {
  const theme = useTheme();
  const imgRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [placeholderSrc, setPlaceholderSrc] = useState(null);
  const [supportsWebP, setSupportsWebP] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Check WebP support on mount
  useEffect(() => {
    const checkWebPSupport = async () => {
      try {
        const webpSupported = document.createElement('canvas')
          .toDataURL('image/webp')
          .indexOf('data:image/webp') === 0;
        setSupportsWebP(webpSupported);
      } catch (e) {
        setSupportsWebP(false);
      }
    };

    checkWebPSupport();
  }, []);

  // Generate low-quality placeholder
  useEffect(() => {
    if (lowQualityPlaceholder && src) {
      try {
        // For Cloudinary URLs, we can add transformations
        if (src.includes('cloudinary.com')) {
          // Create a low-quality, blurred version for placeholder using our helper
          const lowQualityUrl = formatCloudinaryUrl(src, 'image', {
            width: 50,
            quality: 30,
            // Add blur effect - this will be handled by the browser
          });
          setPlaceholderSrc(lowQualityUrl);
        } else {
          setPlaceholderSrc(null);
        }
      } catch (error) {
        console.error('Error generating placeholder:', error);
        setPlaceholderSrc(null);
      }
    } else {
      setPlaceholderSrc(null);
    }
  }, [src, lowQualityPlaceholder]);

  // Update image source if prop changes
  useEffect(() => {
    if (src !== imageSrc && !error) {
      setImageSrc(src);
      setLoading(true);
      setError(false);
      setLoadProgress(0);
    }
  }, [src, imageSrc, error]);

  // Optimize Cloudinary URL if applicable
  useEffect(() => {
    if (src) {
      try {
        // Check if it's a Cloudinary URL
        if (src.includes('cloudinary.com')) {
          // Use our improved cloudinaryHelper with responsive options
          const optimizedUrl = formatCloudinaryUrl(src, 'image', {
            quality: quality,
            width: responsive ? (window.innerWidth < 600 ? 600 : 1200) : undefined
          });
          setImageSrc(optimizedUrl);
        } else if (src.startsWith('http') || src.startsWith('/')) {
          // For non-Cloudinary URLs, use as is
          setImageSrc(src);
        } else {
          // For what might be just a public ID, try to construct a Cloudinary URL
          const cloudName = 'droja6ntk';
          const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto:good,w_${window.innerWidth < 600 ? 600 : 1200}/${src}`;
          setImageSrc(optimizedUrl);
        }
      } catch (error) {
        console.error('Error optimizing image URL:', error);
        setImageSrc(src); // Fallback to original source
      }
    }
  }, [src, quality, responsive]);

  const handleLoad = () => {
    setLoading(false);
    setLoadProgress(100);
    if (onLoad) onLoad();
  };

  const handleError = (event) => {
    console.error('Image failed to load:', event?.target?.src || imageSrc);
    setLoading(false);
    setError(true);
    setLoadProgress(0);

    // Try fallback image if available
    if (fallbackSrc && fallbackSrc !== src && fallbackSrc !== imageSrc) {
      console.log('Using fallback image:', fallbackSrc);
      setImageSrc(fallbackSrc);
      setError(false); // Reset error state to try the fallback
      setLoading(true); // Show loading state for fallback
      return;
    }

    // Try to recover with a direct Cloudinary URL if the source might be a public ID
    if (src && !src.includes('cloudinary.com') && !src.startsWith('http') && !src.startsWith('/')) {
      try {
        const cloudName = 'droja6ntk';
        const directUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${src}`;
        console.log('Trying direct Cloudinary URL:', directUrl);
        setImageSrc(directUrl);
        setError(false);
        setLoading(true);
        return;
      } catch (e) {
        console.error('Error with direct Cloudinary URL:', e);
      }
    }

    // If the image is from Cloudinary but failed, try a different transformation
    if (src && src.includes('cloudinary.com')) {
      try {
        // Extract the public ID from the URL
        const parts = src.split('/upload/');
        if (parts.length === 2) {
          const publicId = parts[1].split('/').pop();
          const cloudName = 'droja6ntk';
          const simpleUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
          console.log('Trying simplified Cloudinary URL:', simpleUrl);
          setImageSrc(simpleUrl);
          setError(false);
          setLoading(true);
          return;
        }
      } catch (e) {
        console.error('Error with simplified Cloudinary URL:', e);
      }
    }

    // Use default fallback as last resort
    const defaultFallback = '/assets/default-image.svg';
    if (event && event.target && event.target.src !== defaultFallback) {
      event.target.src = defaultFallback;
    }

    if (onError) onError(event);
  };

  // Simulate progress for better UX
  useEffect(() => {
    if (loading && loadProgress < 90) {
      const timer = setTimeout(() => {
        setLoadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, loadProgress]);

  // Generate srcSet string for responsive images
  const generateSrcSet = () => {
    try {
      if (!responsive) return undefined;

      // If custom srcSet is provided, use it
      if (srcSet && Array.isArray(srcSet) && srcSet.length > 0) {
        return srcSet.map(item => `${item.url} ${item.width}w`).join(', ');
      }

      // For Cloudinary URLs, we can generate responsive variants
      if (src && typeof src === 'string') {
        // Generate srcSet with different widths optimized for common device sizes
        const widths = [320, 480, 640, 768, 1024, 1366, 1600, 1920];

        if (src.includes('cloudinary.com')) {
          // For Cloudinary URLs, use the formatCloudinaryUrl helper
          return widths
            .map(width => {
              const optimizedUrl = formatCloudinaryUrl(src, 'image', {
                width,
                quality: width < 768 ? quality - 10 : quality, // Lower quality for smaller screens
                dpr: 'auto'
              });
              return `${optimizedUrl} ${width}w`;
            })
            .join(', ');
        } else if (!src.startsWith('http') && !src.startsWith('/')) {
          // For what might be just a public ID, construct Cloudinary URLs
          const cloudName = 'droja6ntk';
          return widths
            .map(width => {
              const qualityValue = width < 768 ? quality - 10 : quality;
              const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_${qualityValue},w_${width},dpr_auto/${src}`;
              return `${optimizedUrl} ${width}w`;
            })
            .join(', ');
        }
      }
    } catch (error) {
      console.error('Error generating srcSet:', error);
    }

    return undefined;
  };

  return (
    <Box
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
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'
          }}
        >
          {/* Show placeholder if available */}
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit,
                filter: 'blur(10px)',
                transform: 'scale(1.1)', // Slightly larger to cover blur edges
                opacity: 0.7
              }}
            />
          ) : (
            <Skeleton
              variant="rectangular"
              animation="wave"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
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
        </Box>
      )}

      {/* Error state */}
      {error && !fallbackSrc && (
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
            Image could not be loaded
          </Typography>
        </Box>
      )}

      {/* Main image with responsive attributes */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={(e) => {
          handleError(e);
          // Apply direct fallback as a backup
          if (e.target.src !== '/assets/default-image.svg') {
            e.target.onerror = null; // Prevent infinite error loop
            e.target.src = '/assets/default-image.svg';
          }
        }}
        srcSet={generateSrcSet()}
        sizes={responsive ? sizes : undefined}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: error && !fallbackSrc ? 'none' : 'block',
          transition: 'opacity 0.3s ease',
          opacity: loading ? 0 : 1
        }}
        data-fallback-src="/assets/default-image.svg"
        {...props}
      />

      {/* Optional overlay content */}
      {overlay && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 3
          }}
        >
          {overlay}
        </Box>
      )}
    </Box>
  );
};

export default EnhancedImage;
