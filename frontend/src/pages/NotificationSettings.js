import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';

const NotificationSettings = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Settings state
  const [settings, setSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    liveNotifications: true,
    postNotifications: true,
    storyNotifications: true,
    mentionNotifications: true,
    tagNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
    soundNotifications: true
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getSettings();
        
        if (response.data && response.data.settings) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...response.data.settings
          }));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching notification settings:', err);
        setError('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle setting change
  const handleChange = (event) => {
    const { name, checked } = event.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: checked
    }));
  };
  
  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      await notificationService.updateSettings(settings);
      
      setSnackbar({
        open: true,
        message: 'Notification settings saved successfully',
        severity: 'success'
      });
      
      setError(null);
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Failed to save notification settings');
      
      setSnackbar({
        open: true,
        message: 'Failed to save notification settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Go back
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <NotificationsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="bold">
              Notification Settings
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
        
        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Notification Types */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Notification Types
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Choose which types of notifications you want to receive
                    </Typography>
                    
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.likes} 
                            onChange={handleChange} 
                            name="likes" 
                            color="primary"
                          />
                        }
                        label="Likes"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.comments} 
                            onChange={handleChange} 
                            name="comments" 
                            color="primary"
                          />
                        }
                        label="Comments"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.follows} 
                            onChange={handleChange} 
                            name="follows" 
                            color="primary"
                          />
                        }
                        label="Follows"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.messages} 
                            onChange={handleChange} 
                            name="messages" 
                            color="primary"
                          />
                        }
                        label="Messages"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.mentionNotifications} 
                            onChange={handleChange} 
                            name="mentionNotifications" 
                            color="primary"
                          />
                        }
                        label="Mentions"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.tagNotifications} 
                            onChange={handleChange} 
                            name="tagNotifications" 
                            color="primary"
                          />
                        }
                        label="Tags"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Content Notifications */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Content Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Choose which content updates you want to be notified about
                    </Typography>
                    
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.postNotifications} 
                            onChange={handleChange} 
                            name="postNotifications" 
                            color="primary"
                          />
                        }
                        label="New posts from people you follow"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.storyNotifications} 
                            onChange={handleChange} 
                            name="storyNotifications" 
                            color="primary"
                          />
                        }
                        label="New stories from people you follow"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.liveNotifications} 
                            onChange={handleChange} 
                            name="liveNotifications" 
                            color="primary"
                          />
                        }
                        label="Live broadcasts from people you follow"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
                
                {/* Notification Delivery */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Notification Delivery
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Choose how you want to receive notifications
                    </Typography>
                    
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.pushNotifications} 
                            onChange={handleChange} 
                            name="pushNotifications" 
                            color="primary"
                          />
                        }
                        label="Push notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.emailNotifications} 
                            onChange={handleChange} 
                            name="emailNotifications" 
                            color="primary"
                          />
                        }
                        label="Email notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.soundNotifications} 
                            onChange={handleChange} 
                            name="soundNotifications" 
                            color="primary"
                          />
                        }
                        label="Sound notifications"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationSettings;
