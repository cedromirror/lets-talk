import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getResponsiveImageUrl } from '../utils/cloudinaryHelper';
import ProfilePicture from './common/ProfilePicture';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Avatar,
  Grid,
  Divider,
  Tooltip,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  Wc as GenderIcon,
  Info as InfoIcon,
  Web as WebsiteIcon,
  Lock as LockIcon,
  Public as PublicIcon
} from '@mui/icons-material';

const EditProfileDialog = ({ open, onClose, user, onSuccess }) => {
  const { updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    bio: '',
    website: '',
    phone: '',
    gender: ''
  });

  // Remove redundant state
  const [validation, setValidation] = useState({
    username: { valid: true, message: '' },
    email: { valid: true, message: '' }
  });

  useEffect(() => {
    if (open && user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        website: user.website || '',
        phone: user.phone || '',
        gender: user.gender || ''
      });
    }
  }, [open, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      // Validate required fields
      const validationErrors = validateForm(formData);
      if (validationErrors) {
        setError(validationErrors);
        return;
      }

      const updatedUser = await updateProfile(formData);
      onSuccess(updatedUser);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data) => {
    // Reset validation state
    setValidation({
      username: { valid: true, message: '' },
      email: { valid: true, message: '' }
    });

    // Validate required fields
    if (!data.fullName?.trim()) return 'Full name is required';

    // Validate username
    if (!data.username?.trim()) {
      setValidation(prev => ({
        ...prev,
        username: { valid: false, message: 'Username is required' }
      }));
      return 'Username is required';
    }

    // Username format validation (alphanumeric, underscore, period)
    if (!/^[a-zA-Z0-9_.]+$/.test(data.username)) {
      setValidation(prev => ({
        ...prev,
        username: { valid: false, message: 'Username can only contain letters, numbers, underscores, and periods' }
      }));
      return 'Invalid username format';
    }

    // Validate email
    if (!data.email?.trim()) {
      setValidation(prev => ({
        ...prev,
        email: { valid: false, message: 'Email is required' }
      }));
      return 'Email is required';
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setValidation(prev => ({
        ...prev,
        email: { valid: false, message: 'Invalid email format' }
      }));
      return 'Invalid email format';
    }

    // Website validation (if provided)
    if (data.website && !/^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[\/\w\-\._~:/?#[\]@!$&'()*+,;=]*$/.test(data.website)) {
      return 'Invalid website URL format';
    }

    // Phone validation (if provided)
    if (data.phone && !/^\+?[0-9\s\-\(\)]{7,20}$/.test(data.phone)) {
      return 'Invalid phone number format';
    }

    return null;
  };

  return (
    <Dialog open={open} onClose={loading ? null : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit Profile
        <IconButton
          onClick={onClose}
          disabled={loading}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          <Grid container spacing={2}>
            {/* Full Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  fullName: e.target.value
                }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            {/* Username */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  username: e.target.value
                }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
                required
                error={!validation.username.valid}
                helperText={!validation.username.valid ? validation.username.message : ''}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                required
                error={!validation.email.valid}
                helperText={!validation.email.valid ? validation.email.message : ''}
              />
            </Grid>

            {/* Bio */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  bio: e.target.value
                }))}
                multiline
                rows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InfoIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Website */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  website: e.target.value
                }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WebsiteIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  phone: e.target.value
                }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Gender */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  id="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    gender: e.target.value
                  }))}
                  startAdornment={
                    <InputAdornment position="start">
                      <GenderIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Prefer not to say</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProfileDialog;

