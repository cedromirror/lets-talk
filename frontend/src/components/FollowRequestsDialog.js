import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Check as CheckIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { userService } from '../services/api';

const FollowRequestsDialog = ({ open, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch follow requests
  useEffect(() => {
    if (!open) return;
    
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await userService.getFollowRequests();
        setRequests(response.data.requests || []);
      } catch (err) {
        console.error('Error fetching follow requests:', err);
        setError('Failed to load follow requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [open]);
  
  // Handle accept request
  const handleAcceptRequest = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'accept' }));
    
    try {
      await userService.acceptFollowRequest(userId);
      
      // Remove from requests list
      setRequests(prev => prev.filter(request => request._id !== userId));
    } catch (err) {
      console.error('Error accepting follow request:', err);
      setError('Failed to accept request. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };
  
  // Handle reject request
  const handleRejectRequest = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'reject' }));
    
    try {
      await userService.rejectFollowRequest(userId);
      
      // Remove from requests list
      setRequests(prev => prev.filter(request => request._id !== userId));
    } catch (err) {
      console.error('Error rejecting follow request:', err);
      setError('Failed to reject request. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
        p: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Follow Requests
          </Typography>
          {requests.length > 0 && (
            <Badge 
              badgeContent={requests.length} 
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <IconButton edge="end" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" paragraph>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <List disablePadding>
            {requests.length > 0 ? (
              requests.map((user, index) => (
                <React.Fragment key={user._id}>
                  <ListItem 
                    sx={{ 
                      py: 1.5,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<ClearIcon />}
                          onClick={() => handleRejectRequest(user._id)}
                          disabled={actionLoading[user._id] === 'reject'}
                          sx={{ minWidth: 100 }}
                        >
                          {actionLoading[user._id] === 'reject' ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : 'Reject'}
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<CheckIcon />}
                          onClick={() => handleAcceptRequest(user._id)}
                          disabled={actionLoading[user._id] === 'accept'}
                          sx={{ minWidth: 100 }}
                        >
                          {actionLoading[user._id] === 'accept' ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : 'Accept'}
                        </Button>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={user.avatar || '/assets/default-avatar.png'} 
                        alt={user.username}
                        component={Link}
                        to={`/profile/${user.username}`}
                        sx={{ 
                          width: 44, 
                          height: 44,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="subtitle2" 
                          component={Link}
                          to={`/profile/${user.username}`}
                          sx={{ 
                            textDecoration: 'none', 
                            color: 'text.primary',
                            fontWeight: 600,
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          {user.username}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {user.fullName}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < requests.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No pending follow requests
                </Typography>
              </Box>
            )}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FollowRequestsDialog;
