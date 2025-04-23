import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemText, ListItemIcon, Typography, Divider,
  Box, Slider, IconButton, Chip, Avatar, Grid, Paper, Tooltip
} from '@mui/material';
import {
  FilterNone as NoneIcon,
  Grain as GrainIcon,
  Brightness5 as BrightnessIcon,
  Contrast as ContrastIcon,
  ColorLens as ColorLensIcon,
  BlurOn as BlurIcon,
  Tune as TuneIcon,
  Palette as PaletteIcon,
  Opacity as OpacityIcon,
  Flip as FlipIcon,
  RotateLeft as RotateLeftIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const FilterDrawer = ({ open, onClose, selectedFilter, onSelectFilter }) => {
  const [previewFilter, setPreviewFilter] = useState(selectedFilter || 'none');

  // Filter categories
  const basicFilters = [
    { id: 'none', name: 'Normal', icon: <NoneIcon /> },
    { id: 'grayscale', name: 'Grayscale', icon: <GrainIcon /> },
    { id: 'sepia', name: 'Sepia', icon: <ColorLensIcon /> },
    { id: 'invert', name: 'Invert', icon: <FlipIcon /> }
  ];

  const colorFilters = [
    { id: 'brightness', name: 'Brightness', icon: <BrightnessIcon /> },
    { id: 'contrast', name: 'Contrast', icon: <ContrastIcon /> },
    { id: 'hue-rotate', name: 'Hue Rotate', icon: <TuneIcon /> },
    { id: 'saturate', name: 'Saturate', icon: <PaletteIcon /> }
  ];

  const effectFilters = [
    { id: 'blur', name: 'Blur', icon: <BlurIcon /> },
    { id: 'opacity', name: 'Fade', icon: <OpacityIcon /> },
    { id: 'drop-shadow', name: 'Shadow', icon: <RotateLeftIcon /> },
    { id: 'vintage', name: 'Vintage', icon: <ColorLensIcon /> }
  ];

  // Get filter preview style
  const getFilterStyle = (filter) => {
    switch (filter) {
      case 'grayscale':
        return { filter: 'grayscale(1)' };
      case 'sepia':
        return { filter: 'sepia(0.7)' };
      case 'blur':
        return { filter: 'blur(2px)' };
      case 'brightness':
        return { filter: 'brightness(1.3)' };
      case 'contrast':
        return { filter: 'contrast(1.5)' };
      case 'hue-rotate':
        return { filter: 'hue-rotate(90deg)' };
      case 'saturate':
        return { filter: 'saturate(2)' };
      case 'invert':
        return { filter: 'invert(0.8)' };
      case 'opacity':
        return { filter: 'opacity(0.7)' };
      case 'drop-shadow':
        return { filter: 'drop-shadow(2px 4px 6px black)' };
      case 'vintage':
        return { filter: 'sepia(0.4) hue-rotate(-20deg) saturate(1.5)' };
      default:
        return {};
    }
  };

  // Apply filter and close drawer
  const applyFilter = () => {
    onSelectFilter(previewFilter);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: 280, sm: 320 },
          bgcolor: 'background.paper',
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Video Filters
        </Typography>
        <Box>
          <Tooltip title="Apply Filter">
            <IconButton color="primary" onClick={applyFilter}>
              <CheckIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      {/* Filter Preview */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Preview
        </Typography>
        <Paper
          elevation={3}
          sx={{
            height: 120,
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2,
            position: 'relative'
          }}
        >
          <Box
            component="img"
            src="/assets/filter-preview.jpg"
            alt="Filter Preview"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              ...getFilterStyle(previewFilter)
            }}
            onError={(e) => {
              // Fallback if image doesn't exist
              e.target.src = 'https://source.unsplash.com/random/300x200/?nature';
            }}
          />
          <Chip
            label={previewFilter === 'none' ? 'No Filter' : previewFilter}
            size="small"
            color="primary"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(25, 118, 210, 0.8)'
            }}
          />
        </Paper>
      </Box>

      <Divider />

      {/* Basic Filters */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Basic Filters
        </Typography>
        <Grid container spacing={1}>
          {basicFilters.map((filter) => (
            <Grid item xs={3} key={filter.id}>
              <Paper
                elevation={previewFilter === filter.id ? 4 : 1}
                sx={{
                  p: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: previewFilter === filter.id ? '2px solid' : '2px solid transparent',
                  borderColor: previewFilter === filter.id ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setPreviewFilter(filter.id)}
              >
                <Box sx={{ mb: 0.5 }}>
                  {filter.icon}
                </Box>
                <Typography variant="caption" display="block">
                  {filter.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Color Filters */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Color Filters
        </Typography>
        <Grid container spacing={1}>
          {colorFilters.map((filter) => (
            <Grid item xs={3} key={filter.id}>
              <Paper
                elevation={previewFilter === filter.id ? 4 : 1}
                sx={{
                  p: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: previewFilter === filter.id ? '2px solid' : '2px solid transparent',
                  borderColor: previewFilter === filter.id ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setPreviewFilter(filter.id)}
              >
                <Box sx={{ mb: 0.5 }}>
                  {filter.icon}
                </Box>
                <Typography variant="caption" display="block">
                  {filter.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Effect Filters */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Effect Filters
        </Typography>
        <Grid container spacing={1}>
          {effectFilters.map((filter) => (
            <Grid item xs={3} key={filter.id}>
              <Paper
                elevation={previewFilter === filter.id ? 4 : 1}
                sx={{
                  p: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: previewFilter === filter.id ? '2px solid' : '2px solid transparent',
                  borderColor: previewFilter === filter.id ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setPreviewFilter(filter.id)}
              >
                <Box sx={{ mb: 0.5 }}>
                  {filter.icon}
                </Box>
                <Typography variant="caption" display="block">
                  {filter.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Apply Button */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <IconButton
          color="primary"
          onClick={applyFilter}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            width: 56,
            height: 56
          }}
        >
          <CheckIcon />
        </IconButton>
      </Box>
    </Drawer>
  );
};

export default FilterDrawer;
