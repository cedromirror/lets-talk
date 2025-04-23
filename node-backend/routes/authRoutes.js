const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  updateAvatar,
  updateCoverImage,
  refreshToken,
  verifyToken,
  forgotPassword,
  validateResetToken,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/verify-token', verifyToken);

// Protected routes
router.use(protect);

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', upload.single('avatar'), uploadToCloudinary('profile'), updateProfile);
router.put('/password', changePassword);
router.put('/avatar', upload.single('avatar'), uploadToCloudinary('profile'), updateAvatar);
router.put('/cover-image', upload.single('coverImage'), uploadToCloudinary('profile'), updateCoverImage);

module.exports = router;
