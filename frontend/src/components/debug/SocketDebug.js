import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider, CircularProgress, Alert, List, ListItem, ListItemText, Chip, TextField } from '@mui/material';
import socketService from '../../services/socketService';

/**
 * Debug component for testing socket connection
 */
const SocketDebug = () => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [customUrl, setCustomUrl] = useState('');

  // Initialize socket connection
  const initializeSocket = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please log in first.');
        setLoading(false);
        return;
      }
      
      // Add event to log
      addEvent('info', 'Initializing socket connection...');
      
      // Initialize socket
      const socket = await socketService.connect();
      
      if (socket) {
        setConnected(true);
        setSocketId(socket.id);
        addEvent('success', `Socket connected with ID: ${socket.id}`);
        
        // Set up event listeners
        socket.on('connect', () => {
          setConnected(true);
          setSocketId(socket.id);
          addEvent('success', `Socket reconnected with ID: ${socket.id}`);
        });
        
        socket.on('disconnect', (reason) => {
          setConnected(false);
          addEvent('error', `Socket disconnected: ${reason}`);
        });
        
        socket.on('connect_error', (err) => {
          addEvent('error', `Connection error: ${err.message}`);
        });
        
        socket.on('error', (err) => {
          addEvent('error', `Socket error: ${err}`);
        });
        
        // Test ping-pong
        socket.emit('ping');
        socket.on('pong', (data) => {
          addEvent('info', `Received pong response: ${JSON.stringify(data)}`);
        });
      } else {
        setConnected(false);
        setError('Failed to initialize socket connection');
        addEvent('error', 'Failed to initialize socket connection');
      }
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError(err.message || 'An error occurred while initializing socket');
      addEvent('error', `Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Disconnect socket
  const disconnectSocket = () => {
    try {
      socketService.disconnectSocket();
      setConnected(false);
      setSocketId(null);
      addEvent('info', 'Socket disconnected manually');
    } catch (err) {
      console.error('Error disconnecting socket:', err);
      addEvent('error', `Error disconnecting: ${err.message}`);
    }
  };
  
  // Update socket URL
  const updateSocketUrl = () => {
    if (!customUrl) {
      setError('Please enter a custom URL');
      return;
    }
    
    try {
      setLoading(true);
      addEvent('info', `Updating socket URL to: ${customUrl}`);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please log in first.');
        setLoading(false);
        return;
      }
      
      // Update socket URL
      socketService.updateSocketUrl(customUrl, token);
      addEvent('info', 'Socket URL updated');
      
      // Wait a moment and check connection
      setTimeout(() => {
        const socket = socketService.getSocket();
        if (socket && socket.connected) {
          setConnected(true);
          setSocketId(socket.id);
          addEvent('success', `Socket connected with new URL, ID: ${socket.id}`);
        } else {
          setConnected(false);
          addEvent('error', 'Socket not connected after URL update');
        }
        setLoading(false);
      }, 2000);
    } catch (err) {
      console.error('Error updating socket URL:', err);
      setError(err.message || 'An error occurred while updating socket URL');
      addEvent('error', `Error: ${err.message}`);
      setLoading(false);
    }
  };
  
  // Add event to log
  const addEvent = (type, message) => {
    setEvents(prev => [
      {
        type,
        message,
        timestamp: new Date().toISOString()
      },
      ...prev
    ].slice(0, 20)); // Keep only the last 20 events
  };
  
  // Get event color
  const getEventColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Socket Connection Debug
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This tool helps diagnose issues with socket connections.
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          onClick={initializeSocket}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : 'Connect Socket'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={disconnectSocket}
          disabled={!connected || loading}
        >
          Disconnect Socket
        </Button>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          label="Custom Socket URL"
          variant="outlined"
          size="small"
          fullWidth
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="http://localhost:60000"
          disabled={loading}
        />
        
        <Button 
          variant="outlined" 
          onClick={updateSocketUrl}
          disabled={loading || !customUrl}
        >
          Update URL
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
          />
          
          {socketId && (
            <Typography variant="body2">
              Socket ID: {socketId}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        Event Log
      </Typography>
      
      <List sx={{ 
        maxHeight: 300, 
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}>
        {events.length === 0 ? (
          <ListItem>
            <ListItemText primary="No events yet" />
          </ListItem>
        ) : (
          events.map((event, index) => (
            <ListItem key={index} divider={index < events.length - 1}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={event.type}
                      color={getEventColor(event.type)}
                      size="small"
                      sx={{ minWidth: 70 }}
                    />
                    <Typography variant="body2">
                      {event.message}
                    </Typography>
                  </Box>
                }
                secondary={new Date(event.timestamp).toLocaleTimeString()}
              />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
};

export default SocketDebug;
