import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider, CircularProgress, Alert, List, ListItem, ListItemText, Chip } from '@mui/material';
import { testCloudinaryConfig } from '../../utils/cloudinaryTest';
import { getCloudinaryVideoUrl } from '../../utils/cloudinaryVideoHelper';

/**
 * Debug component for testing Cloudinary configuration
 */
const CloudinaryDebug = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('lxjk9ba9xtuwraosh6o2');

  // Run tests when requested
  const runTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const testResults = await testCloudinaryConfig();
      setResults(testResults);
      
      // Generate a video URL using our helper
      const url = getCloudinaryVideoUrl(videoId, {
        format: 'mp4',
        quality: 'auto',
        width: 720
      });
      setVideoUrl(url);
    } catch (err) {
      console.error('Error running Cloudinary tests:', err);
      setError(err.message || 'An error occurred while testing Cloudinary configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Cloudinary Configuration Debug
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This tool helps diagnose issues with Cloudinary media loading.
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={runTests}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : 'Run Cloudinary Tests'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {results && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Configuration
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Cloud Name:</strong> {results.cloudName}
            </Typography>
            <Typography variant="body2">
              <strong>API Key:</strong> {results.apiKey}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          
          <List>
            {results.testResults.map((result, index) => (
              <ListItem key={index} divider={index < results.testResults.length - 1}>
                <ListItemText
                  primary={result.label}
                  secondary={result.url}
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ 
                    sx: { 
                      wordBreak: 'break-all',
                      fontSize: '0.75rem'
                    } 
                  }}
                />
                <Chip 
                  label={`${result.status} ${result.ok ? 'OK' : 'Failed'}`}
                  color={result.ok ? 'success' : 'error'}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
          
          {videoUrl && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Generated Video URL
              </Typography>
              
              <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 2 }}>
                {videoUrl}
              </Typography>
              
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                <video
                  controls
                  width="100%"
                  src={videoUrl}
                  poster="/assets/default-image.svg"
                  style={{ maxHeight: 300 }}
                >
                  Your browser does not support the video tag.
                </video>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default CloudinaryDebug;
