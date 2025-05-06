import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { Videocam as VideocamIcon } from '@mui/icons-material';
import ReelPreview from '../../components/Reels/ReelPreview';

const HomeReelsTab = ({ reels, navigateTo }) => {
  return (
    <Box>
      {reels.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {reels.map(reel => (
              <Grid item xs={6} sm={4} key={reel._id}>
                <ReelPreview reel={reel} />
              </Grid>
            ))}
          </Grid>

          {/* View More Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              onClick={() => navigateTo('/reels')}
              variant="contained"
              color="secondary"
              startIcon={<VideocamIcon />}
            >
              View All Reels
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography gutterBottom>
            No reels to show. Follow some users to see their reels here!
          </Typography>
          <Button
            onClick={() => navigateTo('/create?tab=reel')}
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Create a Reel
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default HomeReelsTab;
