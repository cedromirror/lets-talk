import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  useTheme,
  useMediaQuery
} from '@mui/material';
import { LockReset, Email, ArrowBack } from '@mui/icons-material';
import { authService } from '../services/api';
import { handleApiError } from '../utils/errorUtils';
import Logo from '../components/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // In a real implementation, this would call the backend
      // For now, we'll simulate a successful response
      // await authService.forgotPassword({ email });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setEmailSent(true);
      setSuccess(true);
    } catch (err) {
      const errorMessage = handleApiError(err, 'ForgotPassword.handleSubmit');
      setError(errorMessage || 'Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          Reset Your Password
        </Typography>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Password reset instructions have been sent to your email.
          </Alert>
        )}

        {!emailSent ? (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              InputProps={{
                startAdornment: <Email color="action" sx={{ mr: 1 }} />,
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
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="body1" paragraph>
              Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setEmailSent(false)}
              startIcon={<Email />}
              sx={{ mt: 2 }}
            >
              Resend Email
            </Button>
          </Box>
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

export default ForgotPassword;
