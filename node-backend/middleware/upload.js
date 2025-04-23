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
      return next();
    }

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

          console.log('Uploading with options:', uploadOptions);
          const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);

          console.log(`File uploaded successfully to Cloudinary: ${result.secure_url}`);

          // Add Cloudinary URL to request
          req.file.cloudinaryUrl = result.secure_url;
          req.file.cloudinaryPublicId = result.public_id;

          // If we have eager transformations, store those URLs too
          if (result.eager && result.eager.length > 0) {
            req.file.optimizedUrl = result.eager[0].secure_url;
            if (result.eager.length > 1) {
              req.file.lowQualityUrl = result.eager[1].secure_url;
            }
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
