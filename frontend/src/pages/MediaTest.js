import React from 'react';
import { Container, Typography, Grid, Paper, Box, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EnhancedImage from '../components/common/EnhancedImage';
import EnhancedVideo from '../components/common/EnhancedVideo';

// Test images and videos
const testMedia = {
  images: [
    {
      id: 'valid-image',
      title: 'Valid Image',
      src: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714',
      description: 'This image should load correctly'
    },
    {
      id: 'missing-cloudinary-1',
      title: 'Missing Cloudinary Image 1',
      src: 'https://res.cloudinary.com/droja6ntk/image/upload/v1744628405/pnbvzl5zys2xhbshavzo.jpg',
      description: 'This image should show a fallback'
    },
    {
      id: 'missing-cloudinary-2',
      title: 'Missing Cloudinary Image 2',
      src: 'https://res.cloudinary.com/droja6ntk/image/upload/v1744728143/hue6mi92jj1ujwmcw52e.jpg',
      description: 'This image should show a fallback'
    },
    {
      id: 'missing-cloudinary-3',
      title: 'Missing Cloudinary Image 3',
      src: 'https://res.cloudinary.com/droja6ntk/image/upload/v1744695585/knjjmg98ieetsfxdo5kg.png',
      description: 'This image should show a fallback'
    },
    {
      id: 'invalid-url',
      title: 'Invalid URL',
      src: 'https://example.com/nonexistent-image.jpg',
      description: 'This image should show a fallback'
    },
    {
      id: 'empty-src',
      title: 'Empty Source',
      src: '',
      description: 'This should show a default image'
    }
  ],
  videos: [
    {
      id: 'valid-video',
      title: 'Valid Video',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      description: 'This video should load correctly'
    },
    {
      id: 'missing-cloudinary',
      title: 'Missing Cloudinary Video',
      src: 'https://res.cloudinary.com/droja6ntk/video/upload/v1744694357/reels/lxjk9ba9xtuwraosh6o2.mp4',
      description: 'This video should show a fallback'
    },
    {
      id: 'video-as-image',
      title: 'Video Used as Image',
      src: 'https://res.cloudinary.com/droja6ntk/image/upload/f_auto,q_auto,w_480,q_60,c_fill,g_auto/lxjk9ba9xtuwraosh6o2.mp4',
      description: 'This should show a fallback image'
    },
    {
      id: 'invalid-url',
      title: 'Invalid URL',
      src: 'https://example.com/nonexistent-video.mp4',
      description: 'This video should show a fallback'
    },
    {
      id: 'empty-src',
      title: 'Empty Source',
      src: '',
      description: 'This should show a default video'
    }
  ]
};

const MediaTest = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Media Loading Test Page
      </Typography>
      <Typography variant="body1" paragraph>
        This page tests the enhanced image and video components with various scenarios to ensure proper fallback handling.
      </Typography>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Image Tests
      </Typography>
      <Grid container spacing={3}>
        {testMedia.images.map((image) => (
          <Grid item xs={12} sm={6} md={3} key={image.id}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                {image.title}
              </Typography>
              <Box sx={{ mb: 2, height: 200 }}>
                <EnhancedImage
                  src={image.src}
                  alt={image.title}
                  aspectRatio="1/1"
                  objectFit="cover"
                  sx={{ height: '100%' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {image.description}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
                Source: {image.src || '(empty)'}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Video Tests
      </Typography>
      <Grid container spacing={3}>
        {testMedia.videos.map((video) => (
          <Grid item xs={12} sm={6} key={video.id}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                {video.title}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <EnhancedVideo
                  src={video.src}
                  alt={video.title}
                  aspectRatio="16/9"
                  objectFit="cover"
                  autoPlay={false}
                  loop={true}
                  muted={true}
                  customControls={true}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {video.description}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
                Source: {video.src || '(empty)'}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Video Poster Tests
      </Typography>
      <Typography variant="body1" paragraph>
        Testing video URLs used as image posters
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Missing Video as Poster
            </Typography>
            <Box sx={{ mb: 2, height: 200 }}>
              <EnhancedImage
                src="https://res.cloudinary.com/droja6ntk/video/upload/v1744694357/reels/lxjk9ba9xtuwraosh6o2.mp4"
                alt="Missing video as poster"
                aspectRatio="16/9"
                objectFit="cover"
                sx={{ height: '100%' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              This should show a fallback image
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MediaTest;
