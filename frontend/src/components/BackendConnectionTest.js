import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  NetworkCheck as NetworkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import testBackendConnection from '../utils/backendTest';

const BackendConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);
    
    try {
      // Create a console capture to record all console output
      const consoleOutput = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      console.log = (...args) => {
        consoleOutput.push({ type: 'log', message: args.join(' ') });
        originalConsoleLog(...args);
      };
      
      console.error = (...args) => {
        consoleOutput.push({ type: 'error', message: args.join(' ') });
        originalConsoleError(...args);
      };
      
      console.warn = (...args) => {
        consoleOutput.push({ type: 'warn', message: args.join(' ') });
        originalConsoleWarn(...args);
      };
      
      // Run the test
      await testBackendConnection();
      
      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      
      // Analyze results
      const healthEndpointWorking = consoleOutput.some(item => 
        item.message.includes('Health endpoint is working'));
      
      const corsIssues = consoleOutput.some(item => 
        item.type === 'error' && item.message.includes('CORS'));
      
      const networkErrors = consoleOutput.some(item => 
        item.type === 'error' && (
          item.message.includes('Failed to fetch') || 
          item.message.includes('Network Error')
        ));
      
      setTestResults({
        success: healthEndpointWorking && !corsIssues && !networkErrors,
        healthEndpointWorking,
        corsIssues,
        networkErrors,
        consoleOutput
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Run the test automatically on component mount
  useEffect(() => {
    runTest();
  }, []);
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        maxWidth: 800,
        mx: 'auto',
        mb: 4
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NetworkIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" component="h2" fontWeight="bold">
          Backend Connection Test
        </Typography>
      </Box>
      
      <Typography variant="body1" paragraph>
        This tool tests the connection to your backend server and checks for common issues.
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runTest} 
        disabled={isLoading}
        sx={{ mb: 3 }}
      >
        {isLoading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
        {isLoading ? 'Testing...' : 'Run Test Again'}
      </Button>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {testResults && (
        <Box>
          <Alert 
            severity={testResults.success ? 'success' : 'error'}
            variant="filled"
            sx={{ mb: 3 }}
          >
            <AlertTitle>
              {testResults.success ? 'Connection Successful' : 'Connection Issues Detected'}
            </AlertTitle>
            {testResults.success 
              ? 'Your backend connection is working properly.' 
              : 'There are issues with your backend connection. See details below.'}
          </Alert>
          
          <List>
            <ListItem>
              <ListItemIcon>
                {testResults.healthEndpointWorking ? 
                  <CheckIcon color="success" /> : 
                  <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText 
                primary="Health Endpoint" 
                secondary={testResults.healthEndpointWorking 
                  ? "The backend health endpoint is responding correctly." 
                  : "The backend health endpoint is not responding. Make sure your backend server is running on port 60000."}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {!testResults.corsIssues ? 
                  <CheckIcon color="success" /> : 
                  <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText 
                primary="CORS Configuration" 
                secondary={!testResults.corsIssues 
                  ? "No CORS issues detected." 
                  : "CORS issues detected. Your backend needs to allow requests from your frontend."}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {!testResults.networkErrors ? 
                  <CheckIcon color="success" /> : 
                  <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText 
                primary="Network Connectivity" 
                secondary={!testResults.networkErrors 
                  ? "Network connectivity is good." 
                  : "Network errors detected. Check if your backend server is running."}
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Button 
              onClick={() => setExpanded(!expanded)}
              startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mb: 1 }}
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </Button>
            
            <Collapse in={expanded}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default', 
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                {testResults.consoleOutput.map((item, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 0.5, 
                      color: item.type === 'error' ? 'error.main' : 
                             item.type === 'warn' ? 'warning.main' : 'text.primary'
                    }}
                  >
                    [{item.type}] {item.message}
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default BackendConnectionTest;
