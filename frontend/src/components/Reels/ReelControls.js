import React, { useState, useEffect } from 'react';
import {
  Box, IconButton, Tooltip, Paper, Tabs, Tab, Badge, Zoom, Chip
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  FilterList as FilterListIcon,
  Repeat as RepeatIcon,
  RepeatOne as RepeatOneIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  HighQuality as QualityIcon
} from '@mui/icons-material';

const ReelControls = ({
  isMuted,
  onToggleMute,
  showFilters,
  onToggleFilters,
  autoplay,
  onToggleAutoplay,
  activeTab,
  onTabChange,
  showTabs,
  isPlaying,
  onPlayPause,
  selectedFilter
}) => {
  // Animation for autoplay indicator
  const [showAutoplayBadge, setShowAutoplayBadge] = useState(false);

  // Show badge when autoplay changes
  useEffect(() => {
    if (autoplay) {
      setShowAutoplayBadge(true);
      const timer = setTimeout(() => setShowAutoplayBadge(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [autoplay]);
  return (
    <>
      {/* Top Controls */}
      {showTabs && (
        <Box sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <Paper sx={{ borderRadius: 3, bgcolor: 'rgba(0,0,0,0.5)' }}>
            <Tabs
              value={activeTab}
              onChange={onTabChange}
              variant="fullWidth"
              sx={{
                minWidth: 200,
                '& .MuiTab-root': { color: 'white', fontWeight: 'bold' },
                '& .Mui-selected': { color: 'primary.main' }
              }}
            >
              <Tab label="For You" />
              <Tab label="Following" />
            </Tabs>
          </Paper>
        </Box>
      )}

      {/* Bottom Controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {/* Main Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Play/Pause Button */}
          {onPlayPause && (
            <Tooltip title={isPlaying ? "Pause" : "Play"}>
              <IconButton
                onClick={onPlayPause}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
          )}

          {/* Mute/Unmute Button */}
          <Tooltip title={isMuted ? "Unmute" : "Mute"}>
            <IconButton
              onClick={onToggleMute}
              sx={{
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
          </Tooltip>

          {/* Filters Button */}
          <Tooltip title={selectedFilter && selectedFilter !== 'none' ? `Filter: ${selectedFilter}` : "Filters"}>
            <Badge
              variant="dot"
              color="secondary"
              invisible={!selectedFilter || selectedFilter === 'none'}
            >
              <IconButton
                onClick={onToggleFilters}
                sx={{
                  bgcolor: showFilters ? 'primary.main' : 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: showFilters ? 'primary.dark' : 'rgba(0,0,0,0.7)' }
                }}
              >
                <FilterListIcon />
              </IconButton>
            </Badge>
          </Tooltip>

          {/* Autoplay Button */}
          <Tooltip title={autoplay ? "Disable Autoplay" : "Enable Autoplay"}>
            <Badge
              invisible={!showAutoplayBadge}
              overlap="circular"
              badgeContent={
                <Chip
                  label="Auto"
                  size="small"
                  color="primary"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
              }
            >
              <IconButton
                onClick={onToggleAutoplay}
                sx={{
                  bgcolor: autoplay ? 'primary.main' : 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: autoplay ? 'primary.dark' : 'rgba(0,0,0,0.7)' }
                }}
              >
                {autoplay ? <RepeatIcon /> : <RepeatOneIcon />}
              </IconButton>
            </Badge>
          </Tooltip>
        </Box>

        {/* Filter Indicator */}
        {selectedFilter && selectedFilter !== 'none' && (
          <Zoom in={true}>
            <Chip
              label={`Filter: ${selectedFilter}`}
              size="small"
              color="primary"
              variant="outlined"
              onDelete={onToggleFilters}
              sx={{
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                borderColor: 'primary.main',
                '& .MuiChip-deleteIcon': {
                  color: 'white'
                }
              }}
            />
          </Zoom>
        )}
      </Box>
    </>
  );
};

export default ReelControls;
