import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon,
  Send as SendIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { userService } from '../../services/api';
import QRCode from '../common/QRCode';

/**
 * ShareDialog component for sharing livestreams
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {Object} props.stream - The livestream to share
 * @param {Object} props.currentUser - The current user
 */
function ShareDialog({ open, onClose, stream, currentUser }) {
  const [activeTab, setActiveTab] = useState(0);
  const [shareUrl, setShareUrl] = useState('');
  const [shareText, setShareText] = useState('');
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Initialize share URL and text when stream changes
  useEffect(() => {
    if (stream) {
      const url = `${window.location.origin}/live/${stream._id}`;
      setShareUrl(url);
      setShareText(`Join my livestream: ${stream.title || 'Live Stream'}`);
    }
  }, [stream]);

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
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        setFollowers([
          { _id: '1', username: 'user1', avatar: 'https://i.pravatar.cc/150?img=1', fullName: 'User One' },
          { _id: '2', username: 'user2', avatar: 'https://i.pravatar.cc/150?img=2', fullName: 'User Two' },
          { _id: '3', username: 'user3', avatar: 'https://i.pravatar.cc/150?img=3', fullName: 'User Three' },
          { _id: '4', username: 'user4', avatar: 'https://i.pravatar.cc/150?img=4', fullName: 'User Four' },
          { _id: '5', username: 'user5', avatar: 'https://i.pravatar.cc/150?img=5', fullName: 'User Five' }
        ]);
      }
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
        shareLink = `mailto:?subject=${encodeURIComponent(`Join my livestream: ${stream.title || 'Live Stream'}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        break;
      default:
        return;
    }

    window.open(shareLink, '_blank');
  };

  // Toggle follower selection
  const toggleFollowerSelection = (followerId) => {
    setSelectedFollowers(prev =>
      prev.includes(followerId)
        ? prev.filter(id => id !== followerId)
        : [...prev, followerId]
    );
  };

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
        message: `Invitations sent to ${selectedFollowers.length} followers!`,
        severity: 'success'
      });

      // Clear selection after sending
      setSelectedFollowers([]);
    } catch (error) {
      console.error('Error sending invitations:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send invitations. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter followers based on search query
  const filteredFollowers = followers.filter(follower =>
    follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (follower.fullName && follower.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
            boxShadow: 3
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Share Livestream</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
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
          <Tab label="Invite Followers" icon={<SendIcon />} iconPosition="start" />
        </Tabs>

        <DialogContent>
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Share this link with your friends to invite them to your livestream:
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={shareUrl}
                  InputProps={{
                    readOnly: true,
                    sx: { pr: 0 }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={copyToClipboard}
                  startIcon={<CopyIcon />}
                  sx={{ height: '56px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  Copy
                </Button>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" align="center" gutterBottom>
                    Scan QR Code
                  </Typography>
                  <QRCode
                    value={shareUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    renderAs="svg"
                  />
                </Paper>
              </Box>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Share your livestream on social media:
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
                  placeholder="Enter a custom message to share with your livestream link"
                />
              </Box>
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Send direct invitations to your followers:
              </Typography>

              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search followers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{ mb: 2 }}
              />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : followers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                  You don't have any followers yet.
                </Typography>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {filteredFollowers.map((follower) => (
                    <ListItem
                      key={follower._id}
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          checked={selectedFollowers.includes(follower._id)}
                          onChange={() => toggleFollowerSelection(follower._id)}
                        />
                      }
                      sx={{
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                        borderRadius: 1,
                        mb: 0.5
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={follower.avatar} alt={follower.username}>
                          {follower.username.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={follower.username}
                        secondary={follower.fullName || ''}
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedFollowers.length} followers selected
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={sendInvitations}
                  disabled={loading || selectedFollowers.length === 0}
                >
                  Send Invitations
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// Export the component
export default ShareDialog;
