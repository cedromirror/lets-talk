import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Divider,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  alpha
} from '@mui/material';
import {
  WarningRounded as WarningIcon,
  DeleteForeverRounded as DeleteIcon,
  LockRounded as LockIcon,
  ArrowBackRounded as BackIcon
} from '@mui/icons-material';
import { MainLayout } from '../components/Layout';

const RemoveAccount = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type DELETE MY ACCOUNT exactly as shown');
      return;
    }
    
    if (!confirmChecked) {
      setError('Please confirm that you understand this action is permanent');
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };
  
  // Handle final account deletion
  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Call API to delete account
      await userService.deleteAccount({ password });
      
      // Log the user out
      await logout();
      
      // Redirect to login page with success message
      navigate('/login', { 
        state: { 
          message: 'Your account has been successfully deleted. We\'re sorry to see you go!' 
        } 
      });
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.response?.data?.message || 'Failed to delete account. Please try again.');
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ 
        maxWidth: 800, 
        mx: 'auto', 
        p: { xs: 2, md: 4 },
        mb: 4
      }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Go Back
        </Button>
        
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          sx={{ 
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            color: 'error.main'
          }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 32 }} />
          Remove Account
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          We're sorry to see you go. Before you proceed, please understand that this action is permanent and cannot be undone.
        </Typography>
        
        <Alert 
          severity="warning" 
          variant="filled"
          sx={{ 
            mb: 4,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 'bold' }}>Warning: This action cannot be undone</AlertTitle>
          <Typography variant="body2">
            Deleting your account will permanently remove:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>All your posts, reels, and stories</li>
            <li>Your profile information and settings</li>
            <li>All your messages and conversations</li>
            <li>Your followers and following relationships</li>
            <li>All other data associated with your account</li>
          </Box>
        </Alert>
        
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: theme => `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            background: theme => alpha(theme.palette.error.main, 0.03)
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Confirm your identity
            </Typography>
            
            <TextField
              fullWidth
              type="password"
              label="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 3 }}
            />
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Confirm deletion
            </Typography>
            
            <Typography variant="body2" paragraph>
              To confirm account deletion, please type <strong>DELETE MY ACCOUNT</strong> in the field below:
            </Typography>
            
            <TextField
              fullWidth
              label="Type DELETE MY ACCOUNT"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              margin="normal"
              required
              sx={{ mb: 3 }}
            />
            
            <FormControlLabel
              control={
                <Checkbox 
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  required
                  sx={{
                    color: 'error.main',
                    '&.Mui-checked': {
                      color: 'error.main',
                    },
                  }}
                />
              }
              label="I understand that this action is permanent and cannot be undone"
              sx={{ mb: 3, display: 'block' }}
            />
            
            <Button
              type="submit"
              variant="contained"
              color="error"
              size="large"
              fullWidth
              startIcon={<DeleteIcon />}
              disabled={loading}
              sx={{ 
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                boxShadow: theme => `0 4px 14px ${alpha(theme.palette.error.main, 0.4)}`,
                '&:hover': {
                  boxShadow: theme => `0 6px 20px ${alpha(theme.palette.error.main, 0.6)}`,
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete My Account'}
            </Button>
          </form>
        </Paper>
      </Box>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => !loading && setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 'error.main'
        }}>
          <WarningIcon sx={{ mr: 1 }} />
          Final Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you absolutely sure you want to delete your account? This action <strong>cannot</strong> be undone and all your data will be permanently lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowConfirmDialog(false)} 
            disabled={loading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            Yes, Delete My Account
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default RemoveAccount;
