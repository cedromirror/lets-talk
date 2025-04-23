import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Paper
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * ShareDialog component for sharing posts
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {Object} props.post - The post to share
 */
function ShareDialog({ open, onClose, post }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [shareUrl, setShareUrl] = useState('');
  const [shareText, setShareText] = useState('');
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Initialize share URL and text when post changes
  useEffect(() => {
    if (post) {
      const url = `${window.location.origin}/posts/${post._id}`;
      setShareUrl(url);
      setShareText(`Check out this post: ${post.caption ? post.caption.substring(0, 50) + (post.caption.length > 50 ? '...' : '') : 'Post'}`);
    }
  }, [post]);

  // Fetch followers when dialog opens
  useEffect(() => {
    if (open && currentUser) {
      fetchFollowers();
    }
  }, [open, currentUser]);

  // Fetch user's followers
  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const response = await userService.getFollowers(currentUser._id);
      if (response.data && response.data.followers) {
        setFollowers(response.data.followers);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load followers. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Copy share link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setSnackbar({
      open: true,
      message: 'Link copied to clipboard!',
      severity: 'success'
    });
  };

  // Share via social media
  const shareVia = (platform) => {
    let shareLink = '';

    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${encodeURIComponent(`Check out this post`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        break;
      default:
        return;
    }

    window.open(shareLink, '_blank');
  };

  // Toggle follower selection
  const toggleFollower = (followerId) => {
    setSelectedFollowers(prev => {
      if (prev.includes(followerId)) {
        return prev.filter(id => id !== followerId);
      } else {
        return [...prev, followerId];
      }
    });
  };

  // Filter followers based on search query
  const filteredFollowers = followers.filter(follower => 
    follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (follower.fullName && follower.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Send invitations to selected followers
  const sendInvitations = async () => {
    if (selectedFollowers.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one follower',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would call an API endpoint
      // For now, just simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSnackbar({
        open: true,
        message: `Post shared with ${selectedFollowers.length} followers!`,
        severity: 'success'
      });

      // Clear selection after sending
      setSelectedFollowers([]);
      
      // Close dialog after successful share
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sharing post:', error);
      setSnackbar({
        open: true,
        message: 'Failed to share post. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Share Post</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Share Link" icon={<CopyIcon />} iconPosition="start" />
          <Tab label="Social Media" icon={<FacebookIcon />} iconPosition="start" />
          <Tab label="Share with Followers" icon={<SendIcon />} iconPosition="start" />
        </Tabs>

        <DialogContent>
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Share this link with others:
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={shareUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={copyToClipboard}
                        startIcon={<CopyIcon />}
                      >
                        Copy
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              {post && post.image && (
                <Paper elevation={2} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={post.user?.profilePicture || '/assets/default-avatar.png'} 
                      alt={post.user?.username || 'User'} 
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="subtitle2">
                      {post.user?.username || 'User'}
                    </Typography>
                  </Box>
                  <Box 
                    component="img" 
                    src={post.image} 
                    alt="Post preview"
                    sx={{ 
                      width: '100%', 
                      height: 200, 
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {post.caption || 'No caption'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Share on social media:
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => shareVia('whatsapp')}
                  sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
                >
                  WhatsApp
                </Button>

                <Button
                  variant="contained"
                  startIcon={<FacebookIcon />}
                  onClick={() => shareVia('facebook')}
                  sx={{ bgcolor: '#1877F2', '&:hover': { bgcolor: '#0E5A9E' } }}
                >
                  Facebook
                </Button>

                <Button
                  variant="contained"
                  startIcon={<TwitterIcon />}
                  onClick={() => shareVia('twitter')}
                  sx={{ bgcolor: '#1DA1F2', '&:hover': { bgcolor: '#0C85D0' } }}
                >
                  Twitter
                </Button>

                <Button
                  variant="contained"
                  startIcon={<EmailIcon />}
                  onClick={() => shareVia('email')}
                  sx={{ bgcolor: '#EA4335', '&:hover': { bgcolor: '#C5221F' } }}
                >
                  Email
                </Button>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Customize share message:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  placeholder="Enter a custom message to share with your post link"
                />
              </Box>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Share with your followers:
              </Typography>

              <TextField
                fullWidth
                placeholder="Search followers..."
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : followers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  You don't have any followers yet.
                </Typography>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {filteredFollowers.map((follower) => (
                    <ListItem 
                      key={follower._id}
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          checked={selectedFollowers.includes(follower._id)}
                          onChange={() => toggleFollower(follower._id)}
                        />
                      }
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={follower.profilePicture || '/assets/default-avatar.png'} 
                          alt={follower.username}
                        />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={follower.username} 
                        secondary={follower.fullName}
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  {selectedFollowers.length} follower{selectedFollowers.length !== 1 ? 's' : ''} selected
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={sendInvitations}
                  disabled={selectedFollowers.length === 0 || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Share'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ShareDialog;
