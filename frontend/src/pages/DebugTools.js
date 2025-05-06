import React from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper, Button, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import CloudinaryDebug from '../components/debug/CloudinaryDebug';
import SocketDebug from '../components/debug/SocketDebug';
import { AutoStories as StoryIcon } from '@mui/icons-material';

/**
 * Debug Tools page for troubleshooting common issues
 */
const DebugTools = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Debug Tools
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Use these tools to diagnose and fix common issues with the application.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item>
          <Button
            component={Link}
            to="/debug/story"
            variant="contained"
            color="primary"
            startIcon={<StoryIcon />}
          >
            Story Debug Tool
          </Button>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Cloudinary Media" />
          <Tab label="Socket Connection" />
        </Tabs>
      </Paper>

      <Box role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && <CloudinaryDebug />}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && <SocketDebug />}
      </Box>
    </Container>
  );
};

export default DebugTools;
