import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, TextField, Button, Paper, Container,
  Avatar, IconButton, InputAdornment, Alert, CircularProgress,
  Divider, useTheme, Checkbox, FormControlLabel, Fade, Zoom,
  Snackbar, Card, CardMedia, Chip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockOutlined as LockOutlinedIcon,
  Email as EmailIcon,
  Login as LoginIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { handleApiError } from '../utils/errorUtils';
import axios from 'axios';
import BackendConnectionTest from '../components/BackendConnectionTest';

const Login = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'online', 'offline', 'checking'

  // Validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formTouched, setFormTouched] = useState(false);

  // Check server status
  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      // Try to connect to the backend server
      const response = await axios.get('http://localhost:60000/health', { timeout: 5000 });
      if (response.status === 200) {
        setServerStatus('online');
        return true;
      } else {
        setServerStatus('offline');
        return false;
      }
    } catch (error) {
      console.error('Server status check failed:', error);
      setServerStatus('offline');
      return false;
    }
  };

  // Check for redirect messages and server status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    if (message) {
      setSuccessMessage(message);
      setShowSuccessSnackbar(true);
    }

    // Try to load saved email from localStorage
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Check server status on component mount
    checkServerStatus();

    // Set up interval to check server status every 10 seconds
    const intervalId = setInterval(() => {
      checkServerStatus();
    }, 10000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [location]);

  // Validation functions
  const validateEmail = (email) => {
    // Check if empty
    if (!email || email.trim() === '') {
      setEmailError('Email or username is required');
      return false;
    }

    // If it contains @ symbol, validate as email
    if (email.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address');
        return false;
      }
    } else {
      // Validate as username
      if (email.length < 3) {
        setEmailError('Username must be at least 3 characters');
        return false;
      }
    }

    setEmailError('');
    return true;
  };

  const validatePassword = (password) => {
    if (!password || password.trim() === '') {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  // Handle input changes with validation
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (formTouched) validateEmail(newEmail);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (formTouched) validatePassword(newPassword);
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormTouched(true);

    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      setError('Please correct the errors before submitting');
      return;
    }

    // Check server status before attempting login
    if (serverStatus === 'offline') {
      const isServerAvailable = await checkServerStatus();
      if (!isServerAvailable) {
        setError('Cannot connect to the server. Please check if the backend server is running on port 60000.');
        return;
      }
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('Attempting login with:', { email, password: '********', rememberMe });

      // Save email to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Attempt login
      await login(email, password);
      console.log('Login successful');

      // Show success message briefly before redirecting
      setSuccessMessage('Login successful! Redirecting...');
      setShowSuccessSnackbar(true);

      // Immediately set a flag in localStorage to indicate successful login
      localStorage.setItem('loginSuccess', 'true');

      // Set a session storage flag to indicate this is a fresh login
      // This helps with showing the sidebar immediately
      sessionStorage.setItem('freshLogin', 'true');

      // Set a flag to ensure the sidebar stays visible
      localStorage.setItem('sidebarVisible', 'true');

      console.log('Login: Set flags for successful login and fresh login');

      // Short delay for better UX and to ensure auth state is updated
      setTimeout(() => {
        // Always redirect to home page after login
        console.log('Redirecting to home page after successful login');
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Login error details:', err);

      // Use our error utility to handle the error
      const userFriendlyMessage = handleApiError(err, 'Login.handleSubmit');

      // Set the error message for the user
      setError(userFriendlyMessage);

      // Add specific guidance for authentication errors
      if (err.response?.status === 401) {
        setError('Login failed. Please check your email/username and password and try again.');
        // Focus on password field for credential errors
        setTimeout(() => document.getElementById('password').focus(), 100);
      } else if (err.message?.includes('Network Error') || err.message?.includes('backend server') || err.isNetworkError) {
        setError(err.message || 'Network error. Please check if the backend server is running on port 60000.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later or contact support if the problem persists.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccessSnackbar(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          mt: { xs: 4, sm: 8 },
          mb: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Left side - Login form */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: { xs: 2, sm: 3 },
            }}
          >
            <Zoom in={true} style={{ transitionDelay: '150ms' }}>
              <Avatar
                sx={{
                  m: 1,
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              >
                <LockOutlinedIcon fontSize="large" />
              </Avatar>
            </Zoom>

            <Fade in={true} style={{ transitionDelay: '250ms' }}>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mb: 1,
                  fontWeight: 'bold',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Let's Talk
              </Typography>
            </Fade>

            <Fade in={true} style={{ transitionDelay: '350ms' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Typography
                  component="h2"
                  variant="subtitle1"
                  sx={{
                    mb: 1,
                    color: 'text.secondary'
                  }}
                >
                  Sign in to your account
                </Typography>

                {/* Server status indicator */}
                <Chip
                  icon={serverStatus === 'online' ? <CheckCircleIcon /> :
                        serverStatus === 'offline' ? <ErrorIcon /> :
                        <CircularProgress size={16} />}
                  label={serverStatus === 'online' ? 'Server Online' :
                         serverStatus === 'offline' ? 'Server Offline' :
                         'Checking Server...'}
                  color={serverStatus === 'online' ? 'success' :
                         serverStatus === 'offline' ? 'error' :
                         'default'}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={checkServerStatus}
                />
              </Box>
            </Fade>

            {error && (
              <Fade in={!!error}>
                <Alert
                  severity="error"
                  variant="filled"
                  sx={{
                    width: '100%',
                    mb: 2,
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      width: '100%'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {error}
                    {serverStatus === 'offline' && error.includes('backend server') && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                          The backend server appears to be offline. Please make sure it's running on port 60000.
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ mt: 1 }}
                          onClick={checkServerStatus}
                        >
                          Check Server Status
                        </Button>
                      </Box>
                    )}
                  </Typography>
                </Alert>
              </Fade>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: '100%' }}
              noValidate
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email or Username"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                error={!!emailError}
                helperText={emailError || 'Enter your email address or username'}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                error={!!passwordError}
                helperText={passwordError}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
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
              />

              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                mb: 2
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={handleRememberMeChange}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">Remember me</Typography>
                  }
                />

                <Typography
                  variant="body2"
                  component={Link}
                  to="/forgot-password"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot password?
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-2px)'
                  }
                }}
                startIcon={!isLoading && <LoginIcon />}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Typography
                    component={Link}
                    to="/register"
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
                    Sign Up
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right side - Image (hidden on small screens) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              width: '40%',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '0 8px 8px 0',
            }}
          >
            <Card
              sx={{
                height: '100%',
                borderRadius: 0,
                boxShadow: 'none',
              }}
            >
              <CardMedia
                component="img"
                image="https://source.unsplash.com/random/600x800?social"
                alt="Login"
                sx={{
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

            </Card>
          </Box>
        </Paper>

        {/* Show backend connection test when server is offline */}
        {serverStatus === 'offline' && (
          <Box sx={{ mt: 4, width: '100%' }}>
            <BackendConnectionTest />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Login;
