/**
 * Utility functions for image compression and optimization
 */

/**
 * Compresses an image file to reduce its size
 * 
 * @param {File} file - The original image file
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels
 * @param {number} options.maxHeight - Maximum height in pixels
 * @param {number} options.quality - JPEG quality (0-1)
 * @param {string} options.format - Output format ('jpeg', 'png', 'webp')
 * @param {boolean} options.preserveExif - Whether to preserve EXIF data
 * @returns {Promise<{file: File, dataUrl: string, originalSize: number, compressedSize: number}>}
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg',
    preserveExif = false
  } = options;

  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    // Track original size
    const originalSize = file.size;

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

        // Determine mime type based on format
        let mimeType;
        switch (format.toLowerCase()) {
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'jpeg':
          case 'jpg':
          default:
            mimeType = 'image/jpeg';
            break;
        }

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Convert data URL to Blob
        const binaryString = atob(dataUrl.split(',')[1]);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        
        for (let i = 0; i < binaryLen; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: mimeType });
        
        // Create a new File object from the blob
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${format}`), {
          type: mimeType,
          lastModified: Date.now()
        });

        // Calculate compression ratio
        const compressedSize = compressedFile.size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
        
        console.log(`Image compressed: ${originalSize} bytes → ${compressedSize} bytes (${compressionRatio}% reduction)`);

        resolve({
          file: compressedFile,
          dataUrl,
          originalSize,
          compressedSize,
          compressionRatio
        });
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

/**
 * Checks if WebP format is supported by the browser
 * 
 * @returns {Promise<boolean>} Whether WebP is supported
 */
export const isWebPSupported = async () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
};

/**
 * Creates a thumbnail from an image or video file
 * 
 * @param {File} file - The original file (image or video)
 * @param {Object} options - Thumbnail options
 * @param {number} options.width - Thumbnail width
 * @param {number} options.height - Thumbnail height
 * @param {number} options.quality - JPEG quality (0-1)
 * @returns {Promise<{dataUrl: string, file: File}>}
 */
export const createThumbnail = async (file, options = {}) => {
  const {
    width = 320,
    height = 320,
    quality = 0.7
  } = options;

  return new Promise((resolve, reject) => {
    // Handle image files
    if (file.type.startsWith('image/')) {
      compressImage(file, {
        maxWidth: width,
        maxHeight: height,
        quality,
        format: 'jpeg'
      })
        .then(result => resolve(result))
        .catch(err => reject(err));
      return;
    }
    
    // Handle video files
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Seek to a frame at 25% of the video
        video.currentTime = Math.min(video.duration * 0.25, 1.0);
      };
      
      video.onseeked = () => {
        // Create a canvas and draw the video frame
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions to maintain aspect ratio
        const videoRatio = video.videoWidth / video.videoHeight;
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (width / height > videoRatio) {
          drawWidth = height * videoRatio;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawHeight = width / videoRatio;
          offsetY = (height - drawHeight) / 2;
        }
        
        // Draw black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw the video frame
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Convert data URL to File
        const binaryString = atob(dataUrl.split(',')[1]);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        
        for (let i = 0; i < binaryLen; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        const thumbnailFile = new File([blob], `${file.name.split('.')[0]}_thumbnail.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        resolve({
          dataUrl,
          file: thumbnailFile
        });
        
        // Clean up
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video'));
        URL.revokeObjectURL(video.src);
      };
      
      // Set video source
      video.src = URL.createObjectURL(file);
      return;
    }
    
    reject(new Error('Unsupported file type'));
  });
};

/**
 * Optimizes an image URL by adding Cloudinary transformations
 * 
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {number} options.quality - Image quality (1-100)
 * @param {boolean} options.autoFormat - Whether to use automatic format selection
 * @returns {string} Optimized URL
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    autoFormat = true
  } = options;
  
  // Check if it's a Cloudinary URL
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  // Extract base URL and transformations
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return url;
  }
  
  // Build transformation string
  const transformations = [];
  
  if (autoFormat) {
    transformations.push('f_auto');
  }
  
  if (quality && quality < 100) {
    transformations.push(`q_${quality}`);
  }
  
  if (width) {
    transformations.push(`w_${width}`);
  }
  
  if (height) {
    transformations.push(`h_${height}`);
  }
  
  // If no transformations, return original URL
  if (transformations.length === 0) {
    return url;
  }
  
  // Build new URL with transformations
  return `${urlParts[0]}/upload/${transformations.join(',')}/${urlParts[1]}`;
};
