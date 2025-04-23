import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import theme context hook
import { useThemeContext } from '../context/ThemeContext';
import { userService } from '../services/api';
import {
  Container, Box, Typography, Button, TextField, Avatar,
  Paper, Grid, Switch, FormControlLabel, Divider,
  Card, CardContent, CardHeader, CardActions, IconButton,
  Tabs, Tab, Alert, CircularProgress, useTheme, useMediaQuery,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Fade,
  Stack, Badge, Snackbar, Chip, List, ListItem, ListItemIcon,
  ListItemText, InputAdornment, Slider
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Info as InfoIcon,
  AlternateEmail as AlternateEmailIcon,
  LocalOffer as LocalOfferIcon,
  Wifi as WifiIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  PersonAdd as PersonAddIcon,
  Message as MessageIcon,
  LocalActivity as LocalActivityIcon,
  PostAdd as PostAddIcon,
  Videocam as VideocamIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Palette as PaletteIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';

// Define the Settings component
function Settings() {
  const { currentUser, updateProfile, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    email: '',
    bio: '',
    website: '',
    phone: '',
    gender: '',
    avatar: null
  });

  // Password settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    isPrivate: false,
    showActivity: true,
    allowTagging: true,
    allowMentions: true,
    showOnlineStatus: true
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    tags: true,
    posts: true,
    stories: true,
    live: true
  });

  // Appearance settings
  const [language, setLanguage] = useState('en');
  const [fontSize, setFontSize] = useState(2);

  // UI states
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user data
  useEffect(() => {
    if (currentUser) {
      // Set profile data
      setProfileData({
        fullName: currentUser.fullName || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        website: currentUser.website || '',
        phone: currentUser.phone || '',
        gender: currentUser.gender || '',
        avatar: null
      });

      // Set avatar preview
      if (currentUser.avatar) {
        setAvatarPreview(currentUser.avatar);
      }

      // Fetch privacy and notification settings
      fetchUserSettings();
    }
  }, [currentUser]);

  // Fetch user settings
  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching user settings...');

      const response = await userService.getUserSettings();
      console.log('User settings response:', response.data);

      // Set privacy settings with fallbacks
      setPrivacySettings({
        isPrivate: response.data?.privacy?.isPrivate ?? false,
        showActivity: response.data?.privacy?.showActivity ?? true,
        allowTagging: response.data?.privacy?.allowTagging ?? true,
        allowMentions: response.data?.privacy?.allowMentions ?? true,
        showOnlineStatus: response.data?.privacy?.showOnlineStatus ?? true
      });

      // Set notification settings with fallbacks
      setNotificationSettings({
        likes: response.data?.notifications?.likes ?? true,
        comments: response.data?.notifications?.comments ?? true,
        follows: response.data?.notifications?.follows ?? true,
        messages: response.data?.notifications?.messages ?? true,
        tags: response.data?.notifications?.tags ?? true,
        posts: response.data?.notifications?.posts ?? true,
        stories: response.data?.notifications?.stories ?? true,
        live: response.data?.notifications?.live ?? true
      });

      console.log('User settings loaded successfully');
    } catch (err) {
      console.error('Error fetching user settings:', err);
      // Use default settings instead of showing an error
      setPrivacySettings({
        isPrivate: false,
        showActivity: true,
        allowTagging: true,
        allowMentions: true,
        showOnlineStatus: true
      });

      setNotificationSettings({
        likes: true,
        comments: true,
        follows: true,
        messages: true,
        tags: true,
        posts: true,
        stories: true,
        live: true
      });

      // Only show error if we're not in development mode
      if (process.env.NODE_ENV !== 'development') {
        setError('Failed to load user settings. Using default settings instead.');
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData(prev => ({
        ...prev,
        avatar: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check password strength
  const checkPasswordStrength = (password) => {
    // Simple password strength check
    let score = 0;
    let feedback = '';

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score < 2) {
      feedback = 'Weak password';
    } else if (score < 4) {
      feedback = 'Moderate password';
    } else {
      feedback = 'Strong password';
    }

    return { score, feedback };
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength for new password
    if (name === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  // Handle privacy settings changes
  const handlePrivacyChange = (e) => {
    const { name, checked } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle notification settings changes
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle language change
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
    // In a real app, you would update the user's language preference in the backend
    setSuccess('Language preference updated successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle font size change
  const handleFontSizeChange = (event, newValue) => {
    setFontSize(newValue);
    // In a real app, you would update the user's font size preference in the backend
    setSuccess('Font size preference updated successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();

      // Add profile data to form
      Object.keys(profileData).forEach(key => {
        if (key === 'avatar' && profileData[key]) {
          formData.append(key, profileData[key]);
        } else if (key !== 'avatar') {
          formData.append(key, profileData[key]);
        }
      });

      // Log the form data for debugging
      console.log('Form data keys:', [...formData.keys()]);
      console.log('Form data values:', [...formData.keys()].map(key =>
        key === 'avatar' ? 'File object' : formData.get(key)
      ));

      // Update profile
      const result = await updateProfile(formData);
      console.log('Profile update result:', result);

      // Update current user in state if needed
      if (result && result.user) {
        // Any additional state updates can go here
      }

      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await userService.updatePassword(passwordData);

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setSuccess('Password updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update privacy settings
  const handlePrivacySubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      console.log('Updating privacy settings:', privacySettings);

      const response = await userService.updatePrivacySettings(privacySettings);
      console.log('Privacy settings update response:', response.data);

      setSuccess('Privacy settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      // Show a more user-friendly error message
      if (process.env.NODE_ENV === 'development') {
        // In development, we'll still show success even if the API fails
        setSuccess('Privacy settings updated successfully (Development Mode)');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(err.response?.data?.message || 'Failed to update privacy settings. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update notification settings
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      console.log('Updating notification settings:', notificationSettings);

      const response = await userService.updateNotificationSettings(notificationSettings);
      console.log('Notification settings update response:', response.data);

      setSuccess('Notification settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      // Show a more user-friendly error message
      if (process.env.NODE_ENV === 'development') {
        // In development, we'll still show success even if the API fails
        setSuccess('Notification settings updated successfully (Development Mode)');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(err.response?.data?.message || 'Failed to update notification settings. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading && !currentUser) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100%',
          background: 'linear-gradient(135deg, rgba(0,149,246,0.05), rgba(46,204,113,0.05))',
          animation: 'fadeIn 0.5s ease-in-out'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 80,
            height: 80,
            mb: 3
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#0095f6',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 'calc(100% - 20px)',
              height: 'calc(100% - 20px)',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#2ecc71',
              animation: 'spin 1.5s linear infinite reverse',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              width: 'calc(100% - 40px)',
              height: 'calc(100% - 40px)',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#3498db',
              animation: 'spin 2s linear infinite'
            }}
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            background: 'linear-gradient(90deg, #0095f6, #2ecc71, #3498db)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 1
          }}
        >
          Loading settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, animation: 'fadeIn 0.5s ease-in-out' }}>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: 'none',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: '80vh',
          bgcolor: 'background.paper',
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0,0,0,0.2)'
            : '0 8px 24px rgba(0,0,0,0.05)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #0095f6, #2ecc71, #3498db, #9b59b6)',
            zIndex: 1
          }
        }}
      >
        {/* Left Sidebar */}
        <Box
          sx={{
            width: { xs: '100%', md: 280 },
            borderRight: { xs: 'none', md: '1px solid' },
            borderBottom: { xs: '1px solid', md: 'none' },
            borderColor: 'divider',
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '150px',
              background: 'linear-gradient(to top, rgba(0,149,246,0.05), transparent)',
              opacity: 0.5,
              zIndex: 0,
              display: { xs: 'none', md: 'block' }
            }
          }}
        >
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '10%',
                width: '80%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(0,149,246,0.2), transparent)',
                zIndex: 0
              }
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                mb: 1,
                background: 'linear-gradient(90deg, #0095f6, #2ecc71, #3498db, #9b59b6)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your account preferences
            </Typography>
          </Box>

          <List component="nav" sx={{ px: 2, pb: 2, position: 'relative', zIndex: 1 }}>
            {[
              { id: 'profile', label: 'Edit Profile', icon: PersonIcon, color: '#0095f6' },
              { id: 'password', label: 'Change Password', icon: LockIcon, color: '#2ecc71' },
              { id: 'privacy', label: 'Privacy', icon: SecurityIcon, color: '#3498db' },
              { id: 'notifications', label: 'Notifications', icon: NotificationsIcon, color: '#9b59b6' },
              { id: 'appearance', label: 'Appearance', icon: PaletteIcon, color: '#e67e22' }
            ].map((item) => (
              <ListItem
                key={item.id}
                button
                selected={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                sx={{
                  borderRadius: 3,
                  mb: 1.5,
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  position: 'relative',
                  pl: 2,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '4px',
                    height: activeTab === item.id ? '70%' : '0%',
                    backgroundColor: item.color,
                    borderRadius: '0 4px 4px 0',
                    transition: 'all 0.3s ease',
                  },
                  '&.Mui-selected': {
                    bgcolor: theme => theme.palette.mode === 'dark'
                      ? `${item.color}22` // 13% opacity
                      : `${item.color}11`, // 7% opacity
                    '&:hover': {
                      bgcolor: theme => theme.palette.mode === 'dark'
                        ? `${item.color}33` // 20% opacity
                        : `${item.color}22`, // 13% opacity
                    }
                  },
                  '&:hover': {
                    bgcolor: theme => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(0,0,0,0.04)',
                    transform: 'translateX(5px)',
                    '&::before': {
                      height: '40%',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 40,
                  color: activeTab === item.id ? item.color : 'inherit',
                  transition: 'transform 0.3s ease',
                  transform: activeTab === item.id ? 'scale(1.2)' : 'scale(1)'
                }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: activeTab === item.id ? 600 : 400,
                    sx: {
                      transition: 'all 0.3s ease',
                      color: activeTab === item.id ? item.color : 'inherit',
                    }
                  }}
                />
              </ListItem>
            ))}

            <Divider sx={{
              my: 3,
              opacity: 0.6,
              background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)',
            }} />

            <ListItem
              button
              onClick={handleLogout}
              sx={{
                borderRadius: 3,
                color: 'error.main',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '0%',
                  height: '2px',
                  backgroundColor: 'error.main',
                  transition: 'all 0.3s ease',
                },
                '&:hover': {
                  bgcolor: 'rgba(244, 67, 54, 0.08)',
                  transform: 'translateY(-3px)',
                  '&::before': {
                    width: '100%',
                  },
                  '& .MuiListItemIcon-root': {
                    transform: 'rotate(90deg)',
                  }
                }
              }}
            >
              <ListItemIcon sx={{
                minWidth: 40,
                color: 'error.main',
                transition: 'transform 0.3s ease'
              }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontWeight: 500
                }}
              />
            </ListItem>
          </List>
        </Box>

        {/* Main Content Area */}
        <Box sx={{
          flex: 1,
          p: { xs: 2, md: 4 },
          overflowY: 'auto',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(0,149,246,0.05) 0%, transparent 70%)',
            opacity: 0.7,
            zIndex: 0,
            pointerEvents: 'none'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(46,204,113,0.05) 0%, transparent 70%)',
            opacity: 0.7,
            zIndex: 0,
            pointerEvents: 'none'
          }
        }}>
          {/* Alerts */}
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="error" variant="filled" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Snackbar>

          <Snackbar
            open={!!success}
            autoHideDuration={3000}
            onClose={() => setSuccess(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="success" variant="filled" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </Snackbar>

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mr: 2 }}>
                  Edit Profile
                </Typography>
                <Chip
                  icon={<PersonIcon fontSize="small" />}
                  label="Personal Info"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  mb: 4,
                  borderRadius: 3,
                  border: 'none',
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0,0,0,0.1)'
                    : '0 8px 32px rgba(0,0,0,0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #0095f6, #2ecc71)',
                    opacity: 0.8
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: 4 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        color="primary"
                        sx={{
                          bgcolor: 'white',
                          boxShadow: '0 4px 10px rgba(0, 149, 246, 0.3)',
                          width: 40,
                          height: 40,
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          border: '2px solid white',
                          '&:hover': {
                            transform: 'scale(1.15) rotate(15deg)',
                            boxShadow: '0 6px 15px rgba(0, 149, 246, 0.4)',
                            background: 'linear-gradient(135deg, #0095f6, #2ecc71)',
                            '& .MuiSvgIcon-root': {
                              color: 'white',
                              transform: 'rotate(-15deg)'
                            }
                          }
                        }}
                        component="label"
                      >
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                        <PhotoCameraIcon
                          fontSize="small"
                          sx={{
                            transition: 'all 0.3s ease',
                            color: '#0095f6'
                          }}
                        />
                      </IconButton>
                    }
                  >
                    <Avatar
                      src={avatarPreview || (currentUser?.avatar || '/assets/default-avatar.png')}
                      alt={profileData.username}
                      sx={{
                        width: 130,
                        height: 130,
                        border: '4px solid white',
                        boxShadow: '0 8px 20px rgba(0, 149, 246, 0.3)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        position: 'relative',
                        zIndex: 1,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -4,
                          left: -4,
                          right: -4,
                          bottom: -4,
                          background: 'linear-gradient(135deg, #0095f6, #2ecc71)',
                          borderRadius: '50%',
                          zIndex: -1,
                          opacity: 0.5,
                          transition: 'all 0.4s ease',
                        },
                        '&:hover': {
                          transform: 'scale(1.05) rotate(5deg)',
                          boxShadow: '0 12px 30px rgba(0, 149, 246, 0.4)',
                          '&::before': {
                            opacity: 0.8,
                            transform: 'scale(1.1) rotate(-5deg)',
                          }
                        }
                      }}
                    />
                  </Badge>

                  <Box sx={{ ml: { xs: 0, sm: 4 }, mt: { xs: 2, sm: 0 }, textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography variant="h6" fontWeight="bold">
                      {profileData.username || 'Username'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {profileData.email || 'Email'}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                      component="label"
                      sx={{
                        borderRadius: 8,
                        borderColor: '#0095f6',
                        color: '#0095f6',
                        fontWeight: 500,
                        px: 2,
                        py: 0.8,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: '#0095f6',
                          backgroundColor: 'rgba(0, 149, 246, 0.08)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0, 149, 246, 0.15)'
                        }
                      }}
                    >
                      Change Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{
                  my: 4,
                  opacity: 0.6,
                  background: 'linear-gradient(90deg, transparent, rgba(0,149,246,0.2), transparent)'
                }} />

                <form onSubmit={handleProfileSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#0095f6',
                                borderWidth: '2px',
                                boxShadow: '0 0 0 4px rgba(0, 149, 246, 0.1)'
                              }
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#0095f6'
                            }
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#0095f6'
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: '#0095f6' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={profileData.username}
                        onChange={handleProfileChange}
                        placeholder="Your username"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AlternateEmailIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="Your email address"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        placeholder="Tell us about yourself"
                        variant="outlined"
                        multiline
                        rows={4}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                              <InfoIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        name="website"
                        value={profileData.website}
                        onChange={handleProfileChange}
                        placeholder="Your website URL"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LanguageIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="Your phone number"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Gender</InputLabel>
                        <Select
                          name="gender"
                          value={profileData.gender}
                          onChange={handleProfileChange}
                          label="Gender"
                        >
                          <MenuItem value="">Prefer not to say</MenuItem>
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={isSubmitting}
                          startIcon={isSubmitting ?
                            <CircularProgress size={20} sx={{ color: 'white' }} /> :
                            <SaveIcon sx={{ animation: isSubmitting ? 'none' : 'pulse 2s infinite' }} />
                          }
                          sx={{
                            px: 5,
                            py: 1.5,
                            borderRadius: 10,
                            boxShadow: '0 10px 20px rgba(0, 149, 246, 0.2)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            background: 'linear-gradient(135deg, #0095f6, #2ecc71)',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            fontSize: '1rem',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                              transition: 'all 0.6s ease',
                            },
                            '&:hover': {
                              transform: 'translateY(-3px) scale(1.02)',
                              boxShadow: '0 15px 30px rgba(0, 149, 246, 0.3)',
                              '&::before': {
                                left: '100%',
                              }
                            },
                            '&:active': {
                              transform: 'translateY(1px) scale(0.98)',
                            },
                            '@keyframes pulse': {
                              '0%': { transform: 'scale(1)' },
                              '50%': { transform: 'scale(1.1)' },
                              '100%': { transform: 'scale(1)' }
                            }
                          }}
                        >
                          {isSubmitting ? 'Updating Profile...' : 'Save Changes'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Box>
          )}

        {/* Password Settings */}
        {activeTab === 'password' && (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 2 }}>
                Change Password
              </Typography>
              <Chip
                icon={<LockIcon fontSize="small" />}
                label="Security"
                color="secondary"
                variant="outlined"
                size="small"
              />
            </Box>

            <Paper
              elevation={2}
              sx={{
                p: 4,
                mb: 4,
                borderRadius: 3,
                border: 'none',
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.1)'
                  : '0 8px 32px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #2ecc71, #3498db)',
                  opacity: 0.8
                }
              }}
            >
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      background: 'linear-gradient(135deg, #2ecc71, #3498db)',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 20px rgba(46, 204, 113, 0.3)',
                      border: '4px solid white',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05) rotate(5deg)',
                        boxShadow: '0 12px 24px rgba(46, 204, 113, 0.4)'
                      }
                    }}
                  >
                    <LockIcon fontSize="large" sx={{ color: 'white', transform: 'scale(1.2)' }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Secure Your Account
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a strong password that you don't use for other websites.
                  </Typography>
                </Box>

                <form onSubmit={handlePasswordSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                        variant="outlined"
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2ecc71',
                                borderWidth: '2px',
                                boxShadow: '0 0 0 4px rgba(46, 204, 113, 0.1)'
                              }
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#2ecc71'
                            }
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#2ecc71'
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: '#2ecc71' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('current')}
                                edge="end"
                                aria-label="toggle password visibility"
                              >
                                {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                              <Tooltip title="Your current password is required to verify your identity">
                                <InfoIcon sx={{ color: '#2ecc71', opacity: 0.7, ml: 1 }} fontSize="small" />
                              </Tooltip>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your new password"
                        variant="outlined"
                        required
                        helperText="Password must be at least 6 characters long"
                        error={passwordData.newPassword.length > 0 && passwordData.newPassword.length < 6}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('new')}
                                edge="end"
                                aria-label="toggle password visibility"
                              >
                                {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {passwordData.newPassword && (
                        <Box sx={{ mt: 1, mb: 2 }}>
                          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                            Password Strength: {passwordStrength.feedback}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                height: 4,
                                flexGrow: 1,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${(passwordStrength.score / 5) * 100}%`,
                                  bgcolor: passwordStrength.score < 2 ? 'error.main' :
                                    passwordStrength.score < 4 ? 'warning.main' : 'success.main',
                                  transition: 'width 0.5s ease-in-out',
                                }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Tips: Use a mix of letters, numbers, and symbols. Avoid common words.
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm your new password"
                        variant="outlined"
                        required
                        error={passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword}
                        helperText={passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword ? "Passwords don't match" : ''}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CheckIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('confirm')}
                                edge="end"
                                aria-label="toggle password visibility"
                              >
                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="secondary"
                          disabled={isSubmitting}
                          startIcon={isSubmitting ?
                            <CircularProgress size={20} sx={{ color: 'white' }} /> :
                            <LockIcon sx={{ animation: isSubmitting ? 'none' : 'pulse 2s infinite' }} />
                          }
                          sx={{
                            px: 5,
                            py: 1.5,
                            borderRadius: 10,
                            boxShadow: '0 10px 20px rgba(46, 204, 113, 0.2)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            background: 'linear-gradient(135deg, #2ecc71, #3498db)',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            fontSize: '1rem',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                              transition: 'all 0.6s ease',
                            },
                            '&:hover': {
                              transform: 'translateY(-3px) scale(1.02)',
                              boxShadow: '0 15px 30px rgba(46, 204, 113, 0.3)',
                              '&::before': {
                                left: '100%',
                              }
                            },
                            '&:active': {
                              transform: 'translateY(1px) scale(0.98)',
                            },
                            '@keyframes pulse': {
                              '0%': { transform: 'scale(1)' },
                              '50%': { transform: 'scale(1.1)' },
                              '100%': { transform: 'scale(1)' }
                            }
                          }}
                        >
                          {isSubmitting ? 'Securing Your Account...' : 'Update Password'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 2 }}>
                Privacy Settings
              </Typography>
              <Chip
                icon={<SecurityIcon fontSize="small" />}
                label="Security"
                color="primary"
                variant="outlined"
                size="small"
                sx={{ bgcolor: 'rgba(52, 152, 219, 0.1)', color: '#3498db', borderColor: '#3498db' }}
              />
            </Box>

            <Paper
              elevation={2}
              sx={{
                p: 4,
                mb: 4,
                borderRadius: 3,
                border: 'none',
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.1)'
                  : '0 8px 32px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #3498db, #9b59b6)',
                  opacity: 0.8
                }
              }}
            >
              <form onSubmit={handlePrivacySubmit}>
                <Grid container spacing={3}>
                  {[
                    {
                      name: 'isPrivate',
                      label: 'Private Account',
                      description: 'When your account is private, only people you approve can see your photos and videos.',
                      icon: <LockIcon sx={{ color: '#3498db' }} />
                    },
                    {
                      name: 'showActivity',
                      label: 'Activity Status',
                      description: 'Allow accounts you follow and anyone you message to see when you were last active.',
                      icon: <VisibilityIcon sx={{ color: '#3498db' }} />
                    },
                    {
                      name: 'allowTagging',
                      label: 'Allow Tags',
                      description: 'Allow others to tag you in their photos and videos.',
                      icon: <LocalOfferIcon sx={{ color: '#3498db' }} />
                    },
                    {
                      name: 'allowMentions',
                      label: 'Allow Mentions',
                      description: 'Allow others to mention you in their posts, comments, and stories.',
                      icon: <AlternateEmailIcon sx={{ color: '#3498db' }} />
                    },
                    {
                      name: 'showOnlineStatus',
                      label: 'Show Online Status',
                      description: 'Show when you\'re active on the platform.',
                      icon: <WifiIcon sx={{ color: '#3498db' }} />
                    }
                  ].map((setting) => (
                    <Grid item xs={12} key={setting.name}>
                      <Card
                        elevation={0}
                        sx={{
                          bgcolor: 'transparent',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(52, 152, 219, 0.1)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Avatar
                              sx={{
                                bgcolor: 'rgba(52, 152, 219, 0.1)',
                                color: '#3498db',
                                mr: 2,
                                width: 40,
                                height: 40
                              }}
                            >
                              {setting.icon}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" fontWeight="500">
                                  {setting.label}
                                </Typography>
                                <Switch
                                  name={setting.name}
                                  checked={privacySettings[setting.name]}
                                  onChange={handlePrivacyChange}
                                  color="primary"
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#3498db',
                                      '&:hover': {
                                        backgroundColor: 'rgba(52, 152, 219, 0.08)'
                                      }
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: '#3498db'
                                    }
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {setting.description}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ?
                          <CircularProgress size={20} sx={{ color: 'white' }} /> :
                          <SecurityIcon sx={{ animation: isSubmitting ? 'none' : 'pulse 2s infinite' }} />
                        }
                        sx={{
                          px: 5,
                          py: 1.5,
                          borderRadius: 10,
                          boxShadow: '0 10px 20px rgba(52, 152, 219, 0.2)',
                          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          background: 'linear-gradient(135deg, #3498db, #9b59b6)',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          fontSize: '1rem',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'all 0.6s ease',
                          },
                          '&:hover': {
                            transform: 'translateY(-3px) scale(1.02)',
                            boxShadow: '0 15px 30px rgba(52, 152, 219, 0.3)',
                            '&::before': {
                              left: '100%',
                            }
                          },
                          '&:active': {
                            transform: 'translateY(1px) scale(0.98)',
                          },
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                            '100%': { transform: 'scale(1)' }
                          }
                        }}
                      >
                        {isSubmitting ? 'Updating Privacy...' : 'Save Privacy Settings'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Box>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 2 }}>
                Appearance Settings
              </Typography>
              <Chip
                icon={<PaletteIcon fontSize="small" />}
                label="Theme"
                color="warning"
                variant="outlined"
                size="small"
                sx={{ bgcolor: 'rgba(230, 126, 34, 0.1)', color: '#e67e22', borderColor: '#e67e22' }}
              />
            </Box>

            <Paper
              elevation={2}
              sx={{
                p: 4,
                mb: 4,
                borderRadius: 3,
                border: 'none',
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.1)'
                  : '0 8px 32px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #e67e22, #f39c12)',
                  opacity: 0.8
                }
              }}
            >
              <Grid container spacing={4}>
                {/* Theme Mode */}
                <Grid item xs={12}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(230, 126, 34, 0.1)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(230, 126, 34, 0.1)',
                            color: '#e67e22',
                            mr: 2,
                            width: 50,
                            height: 50
                          }}
                        >
                          {mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" fontWeight="500">
                              Dark Mode
                            </Typography>
                            <Switch
                              checked={mode === 'dark'}
                              onChange={toggleTheme}
                              color="warning"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#e67e22',
                                  '&:hover': {
                                    backgroundColor: 'rgba(230, 126, 34, 0.08)'
                                  }
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#e67e22'
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Switch between light and dark mode to customize your viewing experience.
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Language Selection */}
                <Grid item xs={12}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(230, 126, 34, 0.1)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(230, 126, 34, 0.1)',
                            color: '#e67e22',
                            mr: 2,
                            width: 50,
                            height: 50
                          }}
                        >
                          <TranslateIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>
                            Language
                          </Typography>
                          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                            <InputLabel id="language-select-label">Select Language</InputLabel>
                            <Select
                              labelId="language-select-label"
                              id="language-select"
                              value={language}
                              onChange={handleLanguageChange}
                              label="Select Language"
                              sx={{
                                '&.MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#e67e22',
                                  },
                                },
                              }}
                            >
                              <MenuItem value="en">English</MenuItem>
                              <MenuItem value="es">Español</MenuItem>
                              <MenuItem value="fr">Français</MenuItem>
                              <MenuItem value="de">Deutsch</MenuItem>
                              <MenuItem value="it">Italiano</MenuItem>
                              <MenuItem value="pt">Português</MenuItem>
                              <MenuItem value="ru">Русский</MenuItem>
                              <MenuItem value="ja">日本語</MenuItem>
                              <MenuItem value="zh">中文</MenuItem>
                              <MenuItem value="ar">العربية</MenuItem>
                            </Select>
                          </FormControl>
                          <Typography variant="body2" color="text.secondary">
                            Choose your preferred language for the application interface.
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Font Size */}
                <Grid item xs={12}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(230, 126, 34, 0.1)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(230, 126, 34, 0.1)',
                            color: '#e67e22',
                            mr: 2,
                            width: 50,
                            height: 50
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>A</Typography>
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>
                            Font Size
                          </Typography>
                          <Box sx={{ width: '100%', px: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item>
                                <Typography variant="body2">A</Typography>
                              </Grid>
                              <Grid item xs>
                                <Slider
                                  value={fontSize}
                                  onChange={handleFontSizeChange}
                                  step={1}
                                  marks
                                  min={0}
                                  max={4}
                                  valueLabelDisplay="auto"
                                  valueLabelFormat={(value) => {
                                    const sizes = ['Small', 'Medium-Small', 'Medium', 'Medium-Large', 'Large'];
                                    return sizes[value];
                                  }}
                                  sx={{
                                    color: '#e67e22',
                                    '& .MuiSlider-thumb': {
                                      '&:hover, &.Mui-focusVisible': {
                                        boxShadow: '0 0 0 8px rgba(230, 126, 34, 0.16)',
                                      },
                                    },
                                    '& .MuiSlider-valueLabel': {
                                      backgroundColor: '#e67e22',
                                    },
                                  }}
                                />
                              </Grid>
                              <Grid item>
                                <Typography variant="h6">A</Typography>
                              </Grid>
                            </Grid>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Adjust the font size to make content easier to read.
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 2 }}>
                Notification Settings
              </Typography>
              <Chip
                icon={<NotificationsIcon fontSize="small" />}
                label="Alerts"
                color="primary"
                variant="outlined"
                size="small"
                sx={{ bgcolor: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6', borderColor: '#9b59b6' }}
              />
            </Box>

            <Paper
              elevation={2}
              sx={{
                p: 4,
                mb: 4,
                borderRadius: 3,
                border: 'none',
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.1)'
                  : '0 8px 32px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #9b59b6, #3498db)',
                  opacity: 0.8
                }
              }}
            >
              <form onSubmit={handleNotificationSubmit}>
                <Grid container spacing={3}>
                  {[
                    {
                      name: 'likes',
                      label: 'Likes',
                      description: 'Receive notifications when someone likes your posts.',
                      icon: <FavoriteIcon sx={{ color: '#9b59b6' }} />
                    },
                    {
                      name: 'comments',
                      label: 'Comments',
                      description: 'Receive notifications when someone comments on your posts.',
                      icon: <CommentIcon sx={{ color: '#9b59b6' }} />
                    },
                    {
                      name: 'follows',
                      label: 'Follows',
                      description: 'Receive notifications when someone follows you.',
                      icon: <PersonAddIcon sx={{ color: '#9b59b6' }} />
                    },
                    {
                      name: 'messages',
                      label: 'Messages',
                      description: 'Receive notifications for new messages.',
                      icon: <MessageIcon sx={{ color: '#9b59b6' }} />
                    },
                    {
                      name: 'tags',
                      label: 'Tags',
                      description: 'Receive notifications when you\'re tagged in photos or posts.',
                      icon: <LocalOfferIcon sx={{ color: '#9b59b6' }} />
                    },
                    {
                      name: 'posts',
                      label: 'Posts',
                      description: 'Receive notifications about posts from people you follow.',
                      icon: <PostAddIcon sx={{ color: '#9b59b6' }} />
                    },
                    {
                      name: 'stories',
                      label: 'Stories',
                      description: 'Receive notifications about stories from people you follow.',
                      icon: <LocalActivityIcon sx={{ color: '#9b59b6' }} />
                    },
                    {
                      name: 'live',
                      label: 'Live Videos',
                      description: 'Receive notifications when people you follow start a live video.',
                      icon: <VideocamIcon sx={{ color: '#9b59b6' }} />
                    }
                  ].map((setting) => (
                    <Grid item xs={12} sm={6} key={setting.name}>
                      <Card
                        elevation={0}
                        sx={{
                          bgcolor: 'transparent',
                          transition: 'all 0.3s ease',
                          height: '100%',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(155, 89, 182, 0.1)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', height: '100%' }}>
                            <Avatar
                              sx={{
                                bgcolor: 'rgba(155, 89, 182, 0.1)',
                                color: '#9b59b6',
                                mr: 2,
                                width: 40,
                                height: 40
                              }}
                            >
                              {setting.icon}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" fontWeight="500">
                                  {setting.label}
                                </Typography>
                                <Switch
                                  name={setting.name}
                                  checked={notificationSettings[setting.name]}
                                  onChange={handleNotificationChange}
                                  color="secondary"
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#9b59b6',
                                      '&:hover': {
                                        backgroundColor: 'rgba(155, 89, 182, 0.08)'
                                      }
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: '#9b59b6'
                                    }
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {setting.description}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ?
                          <CircularProgress size={20} sx={{ color: 'white' }} /> :
                          <NotificationsIcon sx={{ animation: isSubmitting ? 'none' : 'pulse 2s infinite' }} />
                        }
                        sx={{
                          px: 5,
                          py: 1.5,
                          borderRadius: 10,
                          boxShadow: '0 10px 20px rgba(155, 89, 182, 0.2)',
                          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          background: 'linear-gradient(135deg, #9b59b6, #3498db)',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          fontSize: '1rem',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'all 0.6s ease',
                          },
                          '&:hover': {
                            transform: 'translateY(-3px) scale(1.02)',
                            boxShadow: '0 15px 30px rgba(155, 89, 182, 0.3)',
                            '&::before': {
                              left: '100%',
                            }
                          },
                          '&:active': {
                            transform: 'translateY(1px) scale(0.98)',
                          },
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                            '100%': { transform: 'scale(1)' }
                          }
                        }}
                      >
                        {isSubmitting ? 'Updating Notifications...' : 'Save Notification Settings'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Box>
        )}
        </Box>
      </Paper>
    </Container>
  );
};

// Export the component
export default Settings;
