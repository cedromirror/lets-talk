import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  LockReset,
  Lock,
  Visibility,
  VisibilityOff,
  ArrowBack,
  CheckCircle
} from '@mui/icons-material';
import { authService } from '../services/api';
import { handleApiError } from '../utils/errorUtils';
import Logo from '../components/Logo';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setError('Invalid or missing reset token');
        return;
      }

      try {
        setIsLoading(true);
        // In a real implementation, this would call the backend
        // const response = await authService.validateResetToken(token);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For demo purposes, we'll assume the token is valid
        setIsValidToken(true);
      } catch (err) {
        setIsValidToken(false);
        setError('This password reset link is invalid or has expired');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

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

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // In a real implementation, this would call the backend
      // await authService.resetPassword({ token, password });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);

      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorMessage = handleApiError(err, 'ResetPassword.handleSubmit');
      setError(errorMessage || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const { score } = passwordStrength;
    if (score < 2) return 'error';
    if (score < 4) return 'warning';
    return 'success';
  };

  if (isLoading && !isValidToken) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Validating your reset link...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Logo size={isMobile ? 40 : 50} />
        </Box>

        <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
          {success ? 'Password Reset Successful' : 'Create New Password'}
        </Typography>

        {!success && (
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Please enter a new password for your account.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!isValidToken && !isLoading ? (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              This password reset link is invalid or has expired.
            </Alert>
            <Button
              component={Link}
              to="/forgot-password"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Request New Reset Link
            </Button>
          </Box>
        ) : success ? (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Alert severity="success" sx={{ mb: 3 }}>
              Your password has been successfully reset. You will be redirected to the login page.
            </Alert>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              required
              InputProps={{
                startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            {password && (
              <Alert severity={getPasswordStrengthColor()} sx={{ mb: 2 }}>
                {passwordStrength.feedback}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Confirm New Password"
              variant="outlined"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockReset />}
              sx={{
                py: 1.5,
                mb: 2,
                borderRadius: 2,
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #833AB4, #C13584, #E1306C, #FD1D1D, #405DE6, #5851DB)',
                }
              }}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Button
            component={Link}
            to="/login"
            startIcon={<ArrowBack />}
            sx={{ textTransform: 'none' }}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword;
