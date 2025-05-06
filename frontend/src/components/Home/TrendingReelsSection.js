import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Videocam as VideocamIcon } from '@mui/icons-material';
import ReelPreview from '../../components/Reels/ReelPreview';

const TrendingReelsSection = ({ reels, navigateTo }) => {
  return (
    <Box
      sx={{
        mb: 5,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -16,
          left: -16,
          right: -16,
          bottom: -16,
          background: 'linear-gradient(135deg, rgba(255,107,107,0.05) 0%, rgba(168,65,255,0.05) 100%)',
          borderRadius: 4,
          zIndex: -1
        }
      }}
    >
      {/* Header with gradient text */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              background: 'linear-gradient(90deg, #FF6B6B 0%, #A841FF 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textFillColor: 'transparent'
            }}
          >
            <VideocamIcon sx={{ color: '#A841FF' }} />
            Trending Reels
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Most liked and viewed videos from our community
          </Typography>
        </Box>

        <Button
          onClick={() => navigateTo('/reels')}
          variant="text"
          color="secondary"
          endIcon={<Box component="span" sx={{ fontSize: 20 }}>→</Box>}
          sx={{
            fontWeight: 'bold',
            '&:hover': {
              background: 'linear-gradient(90deg, rgba(255,107,107,0.1) 0%, rgba(168,65,255,0.1) 100%)'
            }
          }}
        >
          See All
        </Button>
      </Box>

      {/* Reels Cards with Hover Effects */}
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          pb: 2,
          mx: -1,
          px: 1,
          '&::-webkit-scrollbar': {
            height: 6
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(168,65,255,0.3)',
            borderRadius: 3
          },
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {reels.slice(0, 8).map((reel, index) => (
          <Box
            key={reel._id}
            sx={{
              minWidth: { xs: '70%', sm: '35%', md: '25%' },
              scrollSnapAlign: 'start',
              px: 1,
              transform: `scale(0.98) translateY(${index % 2 === 0 ? '0' : '10px'})`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1) translateY(0)',
                zIndex: 2
              }
            }}
          >
            <ReelPreview
              reel={reel}
              showTrendingBadge={reel.isTrending || (reel.likesCount > 10) || (reel.viewsCount > 100) || (index < 3 && reel.likesCount > 0)}
              trendingRank={index < 3 ? index + 1 : null}
            />
          </Box>
        ))}
      </Box>

      {/* Create Reel Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          onClick={() => navigateTo('/create?tab=reel')}
          variant="contained"
          color="secondary"
          startIcon={<VideocamIcon />}
          sx={{
            borderRadius: 6,
            px: 3,
            py: 1,
            background: 'linear-gradient(90deg, #FF6B6B 0%, #A841FF 100%)',
            boxShadow: '0 4px 20px rgba(168,65,255,0.3)',
            '&:hover': {
              background: 'linear-gradient(90deg, #FF5757 0%, #9B32F0 100%)',
              boxShadow: '0 6px 25px rgba(168,65,255,0.4)'
            }
          }}
        >
          Create Your Own Reel
        </Button>
      </Box>
    </Box>
  );
};

export default TrendingReelsSection;
