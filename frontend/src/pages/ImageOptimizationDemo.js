import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Divider, 
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Speed as SpeedIcon,
  Image as ImageIcon,
  Movie as MovieIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import ImageUploader from '../components/common/ImageUploader';
import EnhancedImage from '../components/common/EnhancedImage';
import EnhancedVideo from '../components/common/EnhancedVideo';

const ImageOptimizationDemo = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle image upload
  const handleImageUpload = (file, dataUrl) => {
    setUploadedImage(file);
    setUploadedImageUrl(dataUrl);
  };
  
  // Sample images for demonstration
  const sampleImages = [
    {
      title: 'High Quality',
      src: 'https://res.cloudinary.com/droja6ntk/image/upload/v1624291650/sample.jpg',
      optimized: 'https://res.cloudinary.com/droja6ntk/image/upload/q_auto,f_auto,w_800/v1624291650/sample.jpg',
      thumbnail: 'https://res.cloudinary.com/droja6ntk/image/upload/w_200,h_200,c_fill,g_auto,q_auto/v1624291650/sample.jpg',
      description: 'Original high-quality image vs. optimized version'
    },
    {
      title: 'Responsive',
      src: 'https://res.cloudinary.com/droja6ntk/image/upload/v1624291650/sample.jpg',
      optimized: 'https://res.cloudinary.com/droja6ntk/image/upload/q_auto,f_auto,w_auto,dpr_auto/v1624291650/sample.jpg',
      thumbnail: 'https://res.cloudinary.com/droja6ntk/image/upload/w_200,h_200,c_fill,g_auto,q_auto/v1624291650/sample.jpg',
      description: 'Responsive image that adapts to screen size and pixel density'
    }
  ];
  
  // Sample videos for demonstration
  const sampleVideos = [
    {
      title: 'High Quality',
      src: 'https://res.cloudinary.com/droja6ntk/video/upload/v1624291650/sample.mp4',
      optimized: 'https://res.cloudinary.com/droja6ntk/video/upload/q_auto/v1624291650/sample.mp4',
      thumbnail: 'https://res.cloudinary.com/droja6ntk/video/upload/w_400,h_400,c_fill,g_auto,q_auto,so_0/v1624291650/sample.mp4',
      description: 'Original high-quality video vs. optimized version'
    },
    {
      title: 'Adaptive Quality',
      src: 'https://res.cloudinary.com/droja6ntk/video/upload/v1624291650/sample.mp4',
      optimized: 'https://res.cloudinary.com/droja6ntk/video/upload/q_70,w_720/v1624291650/sample.mp4',
      thumbnail: 'https://res.cloudinary.com/droja6ntk/video/upload/w_400,h_400,c_fill,g_auto,q_auto,so_0/v1624291650/sample.mp4',
      description: 'Video that adapts quality based on network conditions'
    }
  ];
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h4" gutterBottom>
          Image & Video Optimization Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This page demonstrates the image and video optimization features implemented in the application.
          These optimizations help improve loading times, reduce bandwidth usage, and enhance user experience.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          All optimizations work on both client-side and server-side for maximum performance benefits.
        </Alert>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SpeedIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Performance Benefits</Typography>
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Faster page load times" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Reduced bandwidth usage" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Lower server costs" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Better mobile experience" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Improved SEO rankings" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ImageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Image Optimizations</Typography>
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Client-side compression before upload" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Server-side optimization with Cloudinary" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Responsive images with srcSet" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="WebP format support" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Lazy loading with placeholders" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MovieIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Video Optimizations</Typography>
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Adaptive quality based on network" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Multiple quality versions" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Lazy loading with thumbnails" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Optimized video controls" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Preload metadata only" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Image Uploader" icon={<UploadIcon />} iconPosition="start" />
        <Tab label="Image Comparison" icon={<ImageIcon />} iconPosition="start" />
        <Tab label="Video Comparison" icon={<MovieIcon />} iconPosition="start" />
      </Tabs>
      
      {/* Image Uploader Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" gutterBottom>
                Client-side Image Compression
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload an image to see how it's compressed before being sent to the server.
                You can adjust compression settings to balance quality and file size.
              </Typography>
              
              <ImageUploader
                onImageSelect={handleImageUpload}
                maxWidth={1200}
                maxHeight={1200}
                quality={0.8}
                showPreview={true}
                showCompressionOptions={true}
                previewHeight="300px"
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" gutterBottom>
                Enhanced Image Component
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The uploaded image is displayed using our EnhancedImage component,
                which provides loading states, error handling, and optimization features.
              </Typography>
              
              {uploadedImageUrl ? (
                <Box sx={{ mt: 2 }}>
                  <EnhancedImage
                    src={uploadedImageUrl}
                    alt="Uploaded image"
                    aspectRatio="1/1"
                    objectFit="contain"
                    responsive={true}
                    quality={85}
                    useWebP={true}
                    sx={{
                      width: '100%',
                      height: '300px',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1
                    }}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Image Details:
                    </Typography>
                    <Typography variant="body2" component="div">
                      <strong>Name:</strong> {uploadedImage?.name}
                    </Typography>
                    <Typography variant="body2" component="div">
                      <strong>Size:</strong> {(uploadedImage?.size / 1024).toFixed(1)} KB
                    </Typography>
                    <Typography variant="body2" component="div">
                      <strong>Type:</strong> {uploadedImage?.type}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 1,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Upload an image to see it displayed here
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Image Comparison Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {sampleImages.map((image, index) => (
            <Grid item xs={12} key={index}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" gutterBottom>
                  {image.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {image.description}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom align="center">
                      Original Image
                    </Typography>
                    <Box
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={image.src}
                        alt="Original"
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom align="center">
                      Optimized with EnhancedImage
                    </Typography>
                    <Box
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <EnhancedImage
                        src={image.optimized}
                        alt="Optimized"
                        aspectRatio="auto"
                        objectFit="contain"
                        responsive={true}
                        quality={85}
                        useWebP={true}
                        placeholderSrc={image.thumbnail}
                        lowQualityPlaceholder={true}
                        sx={{
                          width: '100%',
                          height: 'auto'
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Video Comparison Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {sampleVideos.map((video, index) => (
            <Grid item xs={12} key={index}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" gutterBottom>
                  {video.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {video.description}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom align="center">
                      Standard Video
                    </Typography>
                    <Box
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <video
                        src={video.src}
                        poster={video.thumbnail}
                        controls
                        muted
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom align="center">
                      Optimized with EnhancedVideo
                    </Typography>
                    <Box
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <EnhancedVideo
                        src={video.optimized}
                        thumbnail={video.thumbnail}
                        alt="Optimized video"
                        aspectRatio="16/9"
                        objectFit="contain"
                        autoPlay={false}
                        loop={true}
                        muted={true}
                        customControls={true}
                        adaptiveQuality={true}
                        lowQualityWidth={480}
                        highQualityWidth={1080}
                        preload="metadata"
                        lazyLoad={true}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ImageOptimizationDemo;
