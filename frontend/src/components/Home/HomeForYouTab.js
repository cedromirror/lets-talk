import React from 'react';
import { Box, Typography, Button, Grid, CircularProgress } from '@mui/material';
import { Bookmark as BookmarkIcon, Favorite as FavoriteIcon } from '@mui/icons-material';
import PostCard from '../../components/Posts/PostCard';
import ReelPreview from '../../components/Reels/ReelPreview';
import RecommendedReelsSection from './RecommendedReelsSection';

const HomeForYouTab = ({
  posts,
  reels,
  savedReels,
  forYouLoading,
  currentUser,
  onLike,
  onComment,
  onShare,
  onBookmark,
  navigateTo
}) => {
  return (
    <Box>
      {forYouLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : posts.length > 0 || reels.length > 0 || savedReels.length > 0 ? (
        <>
          {/* Saved Reels Section */}
          {savedReels.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BookmarkIcon color="primary" />
                Your Saved Reels
              </Typography>

              <Grid container spacing={2}>
                {savedReels.map(reel => (
                  <Grid item xs={6} sm={4} key={reel._id}>
                    <ReelPreview
                      reel={reel}
                      showSavedBadge={true}
                    />
                  </Grid>
                ))}
              </Grid>

              {savedReels.length > 6 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    onClick={() => navigateTo('/profile?tab=saved')}
                    variant="outlined"
                    color="primary"
                    startIcon={<BookmarkIcon />}
                  >
                    View All Saved Items
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Followed Users' Posts */}
          {posts.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FavoriteIcon color="error" />
                From People You Follow
              </Typography>

              {posts.slice(0, 3).map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  onLike={onLike}
                  onComment={onComment}
                  onShare={onShare}
                  onBookmark={onBookmark}
                />
              ))}
            </Box>
          )}

          {/* Recommended Reels */}
          {reels.length > 0 && (
            <RecommendedReelsSection reels={reels} navigateTo={navigateTo} />
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography gutterBottom>
            No personalized content to show yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Follow users, like posts, or save reels to see personalized content here.
          </Typography>
          {currentUser && (
            <Button
              onClick={() => navigateTo('/reels')}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Explore Reels
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default HomeForYouTab;
