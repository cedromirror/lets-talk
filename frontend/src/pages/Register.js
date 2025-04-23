import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, TextField, Button, Paper, Container, Grid,
  Avatar, IconButton, InputAdornment, Alert, CircularProgress,
  Divider, Stepper, Step, StepLabel, useTheme, StepConnector,
  styled, LinearProgress, Tooltip, Zoom, Fade, Grow, Chip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAddAlt as PersonAddIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  PhotoCamera as PhotoCameraIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { handleApiError } from '../utils/errorUtils';
// Note: We're importing 'motion' but it's not actually available
// This is just to show how we would use it if it were installed
// import { motion } from 'framer-motion';

// Styled components for modern UI
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.MuiStepConnector-alternativeLabel`]: {
    top: 22,
  },
  [`&.Mui-active`]: {
    [`& .MuiStepConnector-line`]: {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
    },
  },
  [`&.Mui-completed`]: {
    [`& .MuiStepConnector-line`]: {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
    },
  },
  [`& .MuiStepConnector-line`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
    transition: 'all 0.3s ease',
  },
}));

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 10px 0 rgba(0,0,0,.1)',
  ...(ownerState.active && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
  }),
}));

// Custom step icon component
function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;

  const icons = {
    1: <PersonAddIcon />,
    2: <InfoIcon />,
    3: <SecurityIcon />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <CheckIcon /> : icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const Register = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    bio: '',
    profilePicture: null
  });

  // Form state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation state
  const [validations, setValidations] = useState({
    email: { valid: false, message: '' },
    username: { valid: false, message: '', checking: false },
    password: { valid: false, message: '', strength: 0 },
    confirmPassword: { valid: false, message: '' },
    fullName: { valid: false, message: '' }
  });

  // UI state
  const [profilePreview, setProfilePreview] = useState('');
  const [stepCompleted, setStepCompleted] = useState([false, false, false]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Effect for validating form fields when they change
  useEffect(() => {
    validateField('email', formData.email);
    validateField('username', formData.username);
    validateField('password', formData.password);
    validateField('confirmPassword', formData.confirmPassword);
    validateField('fullName', formData.fullName);
  }, [formData]);

  // Effect for checking if step is complete
  useEffect(() => {
    const newStepCompleted = [...stepCompleted];

    // Step 1: Account details
    newStepCompleted[0] = validations.email.valid && validations.fullName.valid;

    // Step 2: Personal details
    newStepCompleted[1] = validations.username.valid;

    // Step 3: Security
    newStepCompleted[2] = validations.password.valid && validations.confirmPassword.valid;

    setStepCompleted(newStepCompleted);
  }, [validations]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile picture upload with validation
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Profile picture must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);

        // Clear any previous errors
        setError('');

        // Mark the profile step as completed
        const newStepCompleted = [...stepCompleted];
        newStepCompleted[1] = true;
        setStepCompleted(newStepCompleted);
      };
      reader.readAsDataURL(file);

      console.log('Profile picture selected:', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
    }
  };

  // Validate individual form fields
  const validateField = (field, value) => {
    let isValid = false;
    let message = '';

    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(value);
        message = isValid ? '' : 'Please enter a valid email address';
        break;

      case 'username':
        isValid = value.length >= 3 && /^[a-zA-Z0-9._]+$/.test(value);
        message = isValid ? '' : 'Username must be at least 3 characters and can only contain letters, numbers, periods, and underscores';
        break;

      case 'password':
        // Calculate password strength
        let strength = 0;
        if (value.length >= 8) strength += 1;
        if (/[A-Z]/.test(value)) strength += 1;
        if (/[0-9]/.test(value)) strength += 1;
        if (/[^A-Za-z0-9]/.test(value)) strength += 1;

        isValid = value.length >= 6;
        message = isValid ? '' : 'Password must be at least 6 characters long';

        // Update password strength
        setValidations(prev => ({
          ...prev,
          password: { ...prev.password, strength, valid: isValid, message }
        }));
        return;

      case 'confirmPassword':
        isValid = value === formData.password && value !== '';
        message = isValid ? '' : 'Passwords do not match';
        break;

      case 'fullName':
        isValid = value.length >= 3;
        message = isValid ? '' : 'Please enter your full name (at least 3 characters)';
        break;

      default:
        return;
    }

    // Update validation state
    setValidations(prev => ({
      ...prev,
      [field]: { ...prev[field], valid: isValid, message }
    }));
  };

  // Navigation between steps
  const handleNext = () => {
    // Prevent moving to next step if current step is not completed
    if (stepCompleted[activeStep]) {
      setError('');
      setActiveStep(prevStep => prevStep + 1);
      console.log('Moving to next step:', activeStep + 1); // Debug log
    } else {
      // Show appropriate error message based on current step
      switch (activeStep) {
        case 0:
          if (!validations.email.valid) {
            setError(validations.email.message || 'Please enter a valid email');
          } else if (!validations.fullName.valid) {
            setError(validations.fullName.message || 'Please enter your full name');
          } else {
            setError('Please complete all required fields');
          }
          break;

        case 1:
          setError(validations.username.message || 'Please enter a valid username');
          break;

        case 2:
          if (!validations.password.valid) {
            setError(validations.password.message || 'Please enter a valid password');
          } else if (!validations.confirmPassword.valid) {
            setError(validations.confirmPassword.message || 'Passwords do not match');
          } else {
            setError('Please complete all required fields');
          }
          break;

        default:
          setError('Please complete all required fields');
      }
      console.log('Step not completed:', activeStep); // Debug log
    }
  };

  const handleBack = () => {
    setError('');
    setActiveStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log('Handling submit for step:', activeStep); // Debug log

    if (!stepCompleted[activeStep]) {
      console.log('Step not completed, showing validation errors'); // Debug log
      handleNext(); // This will show appropriate validation errors
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = formData;

      // Create form data if there's a profile picture
      if (formData.profilePicture) {
        const formDataObj = new FormData();

        // Add all text fields
        Object.keys(registerData).forEach(key => {
          if (key !== 'profilePicture') {
            // Log each field being added to FormData for debugging
            console.log(`Adding field to FormData: ${key} = ${registerData[key]}`);
            formDataObj.append(key, registerData[key]);
          }
        });

        // Ensure username is explicitly added
        if (!formDataObj.get('username') && registerData.username) {
          console.log(`Explicitly adding username: ${registerData.username}`);
          formDataObj.append('username', registerData.username);
        }

        // Add profile picture
        formDataObj.append('profilePicture', formData.profilePicture);

        // Log the FormData contents for debugging
        for (let pair of formDataObj.entries()) {
          console.log(`FormData contains: ${pair[0]}, ${pair[1]}`);
        }

        await register(formDataObj);
      } else {
        // Log the registration data for debugging
        console.log('Registering with data:', registerData);
        await register(registerData);
      }

      // Show success message
      setShowSuccessMessage(true);

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Register.handleSubmit');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const steps = ['Account Details', 'Profile Setup', 'Security'];

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          mb: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[900]} 100%)`
              : `linear-gradient(145deg, #ffffff 0%, ${theme.palette.grey[100]} 100%)`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              opacity: 0.1,
              zIndex: 0
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
            <Avatar
              sx={{
                m: 1,
                width: 70,
                height: 70,
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              <PersonAddIcon sx={{ fontSize: 40 }} />
            </Avatar>

            <Typography
              component="h1"
              variant="h4"
              sx={{
                mb: 1,
                fontWeight: 'bold',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              Let's Talk
            </Typography>

            <Typography
              component="h2"
              variant="subtitle1"
              sx={{
                mb: 3,
                color: theme.palette.text.secondary,
                textAlign: 'center'
              }}
            >
              Create an Account to Get Started
            </Typography>
          </Box>

          {/* Success message */}
          {showSuccessMessage && (
            <Grow in={showSuccessMessage}>
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  '& .MuiAlert-icon': {
                    fontSize: '2rem'
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Registration Successful!
                  </Typography>
                  <Typography variant="body2">
                    Your account has been created. Redirecting you to login...
                  </Typography>
                </Box>
              </Alert>
            </Grow>
          )}

          {/* Modern stepper */}
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            connector={<ColorlibConnector />}
            sx={{ mb: 4, position: 'relative', zIndex: 1 }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: activeStep === index ? 'bold' : 'normal',
                      color: activeStep === index ? 'primary.main' : 'text.secondary'
                    }}
                  >
                    {label}
                  </Typography>
                  {stepCompleted[index] && (
                    <Chip
                      icon={<CheckIcon />}
                      label="Complete"
                      size="small"
                      color="success"
                      sx={{ mt: 1, height: 24 }}
                    />
                  )}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Fade in={!!error}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    alignItems: 'center'
                  }
                }}
                variant="filled"
              >
                {error}
              </Alert>
            </Fade>
          )}

          <Box component="form" onSubmit={(e) => {
            e.preventDefault();
            if (activeStep === steps.length - 1) {
              handleSubmit(e);
            } else {
              handleNext();
            }
          }}>
            {activeStep === 0 && (
              <Fade in={activeStep === 0} style={{ transitionDelay: '50ms' }}>
                <Box>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoFocus
                    error={formData.email !== '' && !validations.email.valid}
                    helperText={formData.email !== '' && !validations.email.valid ? validations.email.message : ''}
                    InputProps={{
                      endAdornment: formData.email && (
                        <InputAdornment position="end">
                          {validations.email.valid ? (
                            <CheckIcon color="success" />
                          ) : (
                            <CloseIcon color="error" />
                          )}
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="fullName"
                    label="Full Name"
                    name="fullName"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isLoading}
                    error={formData.fullName !== '' && !validations.fullName.valid}
                    helperText={formData.fullName !== '' && !validations.fullName.valid ? validations.fullName.message : ''}
                    InputProps={{
                      endAdornment: formData.fullName && (
                        <InputAdornment position="end">
                          {validations.fullName.valid ? (
                            <CheckIcon color="success" />
                          ) : (
                            <CloseIcon color="error" />
                          )}
                        </InputAdornment>
                      )
                    }}
                  />

                  {/* Phone number field removed */}
                </Box>
              </Fade>
            )}

            {activeStep === 1 && (
              <Fade in={activeStep === 1} style={{ transitionDelay: '50ms' }}>
                <Box>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoFocus
                    error={formData.username !== '' && !validations.username.valid}
                    helperText={formData.username !== '' && !validations.username.valid
                      ? validations.username.message
                      : "Choose a unique username. You can use letters, numbers, periods, and underscores."}
                    InputProps={{
                      endAdornment: formData.username && (
                        <InputAdornment position="end">
                          {validations.username.valid ? (
                            <CheckIcon color="success" />
                          ) : (
                            <CloseIcon color="error" />
                          )}
                        </InputAdornment>
                      )
                    }}
                  />

                  {/* Profile picture upload */}
                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Profile Picture (Optional)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          border: `2px dashed ${theme.palette.primary.main}`,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mr: 2,
                          overflow: 'hidden',
                          backgroundColor: theme.palette.background.default
                        }}
                      >
                        {profilePreview ? (
                          <img
                            src={profilePreview}
                            alt="Profile Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <PersonAddIcon color="primary" sx={{ fontSize: 40, opacity: 0.5 }} />
                        )}
                      </Box>
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<PhotoCameraIcon />}
                          sx={{ mb: 1 }}
                        >
                          Upload Photo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            disabled={isLoading}
                          />
                        </Button>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Recommended: Square JPG or PNG, max 2MB
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <TextField
                    margin="normal"
                    fullWidth
                    id="bio"
                    label="Bio (Optional)"
                    name="bio"
                    multiline
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={isLoading}
                    helperText="Tell us a little about yourself"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>
              </Fade>
            )}

            {activeStep === 2 && (
              <Fade in={activeStep === 2} style={{ transitionDelay: '50ms' }}>
                <Box>
                  <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  error={formData.password !== '' && !validations.password.valid}
                  helperText={formData.password !== '' && !validations.password.valid
                    ? validations.password.message
                    : "Password must be at least 6 characters long"}
                />

                {/* Password strength indicator */}
                {formData.password && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      Password Strength:
                      {validations.password.strength === 0 && 'Very Weak'}
                      {validations.password.strength === 1 && 'Weak'}
                      {validations.password.strength === 2 && 'Medium'}
                      {validations.password.strength === 3 && 'Strong'}
                      {validations.password.strength === 4 && 'Very Strong'}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={validations.password.strength * 25}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          backgroundColor:
                            validations.password.strength <= 1 ? theme.palette.error.main :
                            validations.password.strength === 2 ? theme.palette.warning.main :
                            validations.password.strength === 3 ? theme.palette.success.light :
                            theme.palette.success.main
                        }
                      }}
                    />
                  </Box>
                )}

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  error={formData.confirmPassword !== '' && !validations.confirmPassword.valid}
                  helperText={formData.confirmPassword !== '' && !validations.confirmPassword.valid
                    ? validations.confirmPassword.message
                    : ''}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Security tips */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon fontSize="small" sx={{ mr: 1 }} />
                    Security Tips
                  </Typography>
                  <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                    <li>Use a unique password you don't use elsewhere</li>
                    <li>Include uppercase letters, numbers, and symbols</li>
                    <li>Avoid using personal information</li>
                  </Typography>
                </Box>
                </Box>
              </Fade>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(-5px)'
                  }
                }}
              >
                Back
              </Button>

              <Button
                variant="contained"
                onClick={(e) => {
                  e.preventDefault();
                  if (activeStep === steps.length - 1) {
                    handleSubmit();
                  } else {
                    handleNext();
                  }
                }}
                disabled={isLoading || (activeStep < steps.length - 1 && !stepCompleted[activeStep])}
                endIcon={activeStep === steps.length - 1 ? null : <ArrowForwardIcon />}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)'
                  },
                  '&:disabled': {
                    background: theme.palette.action.disabledBackground
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : activeStep === steps.length - 1 ? (
                  'Create Account'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Typography
                component={Link}
                to="/login"
                variant="body2"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign In
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
