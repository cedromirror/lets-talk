const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

// Log Cloudinary configuration (without showing the full secret)
const sanitizedConfig = {
  ...cloudinaryConfig,
  api_secret: cloudinaryConfig.api_secret ? '****' + cloudinaryConfig.api_secret.substr(-4) : undefined
};
console.log('Cloudinary Configuration:', sanitizedConfig);

// Apply configuration
cloudinary.config(cloudinaryConfig);

// Configure local storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath = path.join(__dirname, '../uploads');

    // Determine the specific folder based on file type or route
    if (req.baseUrl.includes('/posts')) {
      uploadPath = path.join(uploadPath, 'posts');
    } else if (req.baseUrl.includes('/reels')) {
      uploadPath = path.join(uploadPath, 'reels');
    } else if (req.baseUrl.includes('/stories')) {
      uploadPath = path.join(uploadPath, 'stories');
    } else if (req.baseUrl.includes('/profile')) {
      uploadPath = path.join(uploadPath, 'profile');
    } else if (req.baseUrl.includes('/products')) {
      uploadPath = path.join(uploadPath, 'products');
    } else {
      uploadPath = path.join(uploadPath, 'misc');
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types based on route or purpose
  let allowedTypes = [];

  if (req.baseUrl.includes('/posts') || req.baseUrl.includes('/profile') || req.baseUrl.includes('/products')) {
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  } else if (req.baseUrl.includes('/reels') || req.baseUrl.includes('/stories')) {
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
  } else {
    // Default allowed types
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4'];
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Helper function to determine if file should be optimized
const shouldOptimizeFile = (file) => {
  // Skip optimization for small files (less than 100KB)
  if (file.size < 100 * 1024) {
    return false;
  }

  // Optimize images
  if (file.mimetype.startsWith('image/')) {
    return true;
  }

  // Optimize videos if they're large
  if (file.mimetype.startsWith('video/') && file.size > 1024 * 1024) {
    return true;
  }

  return false;
};

// Middleware to upload to Cloudinary with optimization
const uploadToCloudinary = (folderName) => {
  return async (req, res, next) => {
    // Skip if no file was uploaded
    if (!req.file && (!req.files || req.files.length === 0)) {
      console.log('No file uploaded, skipping Cloudinary upload');
      return next();
    }

    // Log Cloudinary configuration status
    console.log('Cloudinary configuration status:', {
      cloudName: cloudinaryConfig.cloud_name ? 'Configured' : 'Missing',
      apiKey: cloudinaryConfig.api_key ? 'Configured' : 'Missing',
      apiSecret: cloudinaryConfig.api_secret ? 'Configured' : 'Missing'
    });

    try {
      console.log(`Attempting to upload file(s) to Cloudinary folder: ${folderName}`);

      // Handle single file upload
      if (req.file) {
        console.log(`Uploading single file: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);
        try {
          // Determine upload options based on file type
          const uploadOptions = {
            folder: folderName,
            resource_type: 'auto'
          };

          // Add optimization parameters based on file type
          if (shouldOptimizeFile(req.file)) {
            if (req.file.mimetype.startsWith('image/')) {
              // Image optimization
              if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg') {
                uploadOptions.quality = 'auto';
                uploadOptions.fetch_format = 'auto';
                uploadOptions.flags = 'lossy';
              } else if (req.file.mimetype === 'image/png') {
                uploadOptions.quality = 'auto';
                uploadOptions.fetch_format = 'auto';
                uploadOptions.flags = 'lossy';
              } else if (req.file.mimetype === 'image/gif') {
                // For GIFs, maintain animation but optimize
                uploadOptions.quality = 'auto';
              } else {
                // For other image types
                uploadOptions.quality = 'auto';
                uploadOptions.fetch_format = 'auto';
              }

              // Resize very large images
              if (req.file.size > 5 * 1024 * 1024) { // > 5MB
                uploadOptions.transformation = [
                  { width: 2000, crop: 'limit' }
                ];
              }
            } else if (req.file.mimetype.startsWith('video/')) {
              // Video optimization
              uploadOptions.resource_type = 'video';

              // Check if this is a story video
              if (folderName === 'stories') {
                console.log('Processing video for story with enhanced settings');

                // For stories, we want to ensure the video is properly formatted
                uploadOptions.eager = [
                  // High quality version
                  { quality: 'auto', format: 'mp4', streaming_profile: 'hd' },
                  // Medium quality version for slower connections
                  { quality: 80, width: 720, format: 'mp4' },
                  // Low quality version for very slow connections
                  { quality: 60, width: 480, format: 'mp4' },
                  // WebM format for better compatibility
                  { quality: 'auto', format: 'webm' },
                  // Thumbnail for preview
                  { format: 'jpg', transformation: [{ width: 320, height: 320, crop: 'fill', gravity: 'auto' }] }
                ];

                // Add special flags for better video processing
                uploadOptions.chunk_size = 6000000; // 6MB chunks for better upload reliability
                uploadOptions.timeout = 180000; // 3 minute timeout for larger videos
                uploadOptions.eager_async = true; // Process eager transformations asynchronously
                uploadOptions.eager_notification_url = req.headers.origin || 'http://localhost:30000'; // Notify when eager transformations are done

                // Add video-specific transformations
                uploadOptions.transformation = [
                  { duration: 15 } // Limit to 15 seconds max for stories
                ];
              } else {
                // Standard video optimization for non-story videos
                uploadOptions.eager = [
                  { quality: 'auto', format: 'mp4' }
                ];

                // For very large videos, create a lower quality version
                if (req.file.size > 50 * 1024 * 1024) { // > 50MB
                  uploadOptions.eager.push({
                    quality: 70,
                    width: 720,
                    format: 'mp4'
                  });
                }
              }
            }
          }

          console.log('Uploading with options:', uploadOptions);
          const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);

          console.log(`File uploaded successfully to Cloudinary: ${result.secure_url}`);

          // Add Cloudinary URL to request
          req.file.cloudinaryUrl = result.secure_url;
          req.file.cloudinaryPublicId = result.public_id;

          // Add these URLs to the request object for easier access in routes
          req.cloudinaryUrl = result.secure_url;
          req.cloudinaryPublicId = result.public_id;

          // If we have eager transformations, store those URLs too
          if (result.eager && result.eager.length > 0) {
            // Store all eager transformations
            req.file.eager = result.eager;

            // Store specific URLs for common use cases
            req.file.optimizedUrl = result.eager[0].secure_url;
            req.optimizedCloudinaryUrl = result.eager[0].secure_url;

            if (result.eager.length > 1) {
              req.file.lowQualityUrl = result.eager[1].secure_url;
              req.lowQualityCloudinaryUrl = result.eager[1].secure_url;
            }

            // Store thumbnail URL if available (usually the last eager transformation for videos)
            if (req.file.mimetype.startsWith('video/') && result.eager.length > 2) {
              const thumbnailTransform = result.eager.find(t => t.format === 'jpg');
              if (thumbnailTransform) {
                req.file.thumbnailUrl = thumbnailTransform.secure_url;
                req.thumbnailUrl = thumbnailTransform.secure_url;
              }
            }
          }

          // For videos, also create a direct thumbnail URL
          if (req.file.mimetype.startsWith('video/')) {
            // Create a thumbnail URL directly from the video URL
            const videoId = result.public_id;
            const thumbnailUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/video/upload/f_jpg,q_auto,w_720/${videoId}.jpg`;
            req.file.directThumbnailUrl = thumbnailUrl;
            req.thumbnailUrl = req.thumbnailUrl || thumbnailUrl;
          }

          // Delete local file after upload to Cloudinary
          fs.unlinkSync(req.file.path);
          console.log(`Local file deleted: ${req.file.path}`);
        } catch (singleFileError) {
          console.error(`Error uploading single file to Cloudinary:`, singleFileError);
          throw new Error(`Failed to upload ${req.file.originalname}: ${singleFileError.message}`);
        }
      }

      // Handle multiple files upload
      if (req.files && req.files.length > 0) {
        console.log(`Uploading ${req.files.length} files to Cloudinary`);

        for (const file of req.files) {
          try {
            console.log(`Uploading file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

            // Determine upload options based on file type
            const uploadOptions = {
              folder: folderName,
              resource_type: 'auto'
            };

            // Add optimization parameters based on file type
            if (shouldOptimizeFile(file)) {
              if (file.mimetype.startsWith('image/')) {
                // Image optimization
                if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                  uploadOptions.quality = 'auto';
                  uploadOptions.fetch_format = 'auto';
                  uploadOptions.flags = 'lossy';
                } else if (file.mimetype === 'image/png') {
                  uploadOptions.quality = 'auto';
                  uploadOptions.fetch_format = 'auto';
                  uploadOptions.flags = 'lossy';
                } else if (file.mimetype === 'image/gif') {
                  // For GIFs, maintain animation but optimize
                  uploadOptions.quality = 'auto';
                } else {
                  // For other image types
                  uploadOptions.quality = 'auto';
                  uploadOptions.fetch_format = 'auto';
                }

                // Resize very large images
                if (file.size > 5 * 1024 * 1024) { // > 5MB
                  uploadOptions.transformation = [
                    { width: 2000, crop: 'limit' }
                  ];
                }
              } else if (file.mimetype.startsWith('video/')) {
                // Video optimization
                uploadOptions.resource_type = 'video';

                // Check if this is a story video
                if (folderName === 'stories') {
                  console.log('Processing video for story with enhanced settings');

                  // For stories, we want to ensure the video is properly formatted
                  uploadOptions.eager = [
                    // High quality version
                    { quality: 'auto', format: 'mp4' },
                    // Medium quality version for slower connections
                    { quality: 80, width: 720, format: 'mp4' },
                    // Thumbnail for preview
                    { format: 'jpg', transformation: [{ width: 320, height: 320, crop: 'fill', gravity: 'auto' }] }
                  ];

                  // Add special flags for better video processing
                  uploadOptions.chunk_size = 6000000; // 6MB chunks for better upload reliability
                  uploadOptions.timeout = 120000; // 2 minute timeout

                  // Add video-specific transformations
                  uploadOptions.transformation = [
                    { duration: 15 } // Limit to 15 seconds max for stories
                  ];
                } else {
                  // Standard video optimization for non-story videos
                  uploadOptions.eager = [
                    { quality: 'auto', format: 'mp4' }
                  ];

                  // For very large videos, create a lower quality version
                  if (file.size > 50 * 1024 * 1024) { // > 50MB
                    uploadOptions.eager.push({
                      quality: 70,
                      width: 720,
                      format: 'mp4'
                    });
                  }
                }
              }
            }

            console.log('Uploading with options:', uploadOptions);
            const result = await cloudinary.uploader.upload(file.path, uploadOptions);

            console.log(`File uploaded successfully to Cloudinary: ${result.secure_url}`);

            // Add Cloudinary URL to file object
            file.cloudinaryUrl = result.secure_url;
            file.cloudinaryPublicId = result.public_id;

            // If we have eager transformations, store those URLs too
            if (result.eager && result.eager.length > 0) {
              file.optimizedUrl = result.eager[0].secure_url;
              if (result.eager.length > 1) {
                file.lowQualityUrl = result.eager[1].secure_url;
              }
            }

            // Delete local file after upload to Cloudinary
            fs.unlinkSync(file.path);
            console.log(`Local file deleted: ${file.path}`);
          } catch (multiFileError) {
            console.error(`Error uploading file ${file.originalname} to Cloudinary:`, multiFileError);
            throw new Error(`Failed to upload ${file.originalname}: ${multiFileError.message}`);
          }
        }
      }

      console.log('All files uploaded to Cloudinary successfully');

      // Log the URLs that will be used in the request
      console.log('Cloudinary URLs available in request:', {
        cloudinaryUrl: req.cloudinaryUrl || 'Not set',
        optimizedCloudinaryUrl: req.optimizedCloudinaryUrl || 'Not set',
        lowQualityCloudinaryUrl: req.lowQualityCloudinaryUrl || 'Not set',
        thumbnailUrl: req.thumbnailUrl || 'Not set'
      });

      next();
    } catch (error) {
      console.error('Error in Cloudinary upload middleware:', error);

      // Clean up any remaining local files
      try {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log(`Cleaned up local file after error: ${req.file.path}`);
        }

        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
              console.log(`Cleaned up local file after error: ${file.path}`);
            }
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up local files:', cleanupError);
      }

      return res.status(500).json({
        success: false,
        message: 'Error uploading file to cloud storage',
        error: error.message
      });
    }
  };
};

module.exports = {
  upload,
  uploadToCloudinary
};
