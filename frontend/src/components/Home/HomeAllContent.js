import React from 'react';
import { Box, Typography } from '@mui/material';
import { Photo as PhotoIcon } from '@mui/icons-material';
import PostCard from '../../components/Posts/PostCard';
import TrendingReelsSection from './TrendingReelsSection';

const HomeAllContent = ({ posts, reels, onLike, onComment, onShare, onBookmark, navigateTo }) => {
  return (
    <Box>
      {/* Trending Reels Section */}
      {reels.length > 0 && (
        <TrendingReelsSection reels={reels} navigateTo={navigateTo} />
      )}

      {/* Posts Section */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PhotoIcon color="primary" />
        Latest Posts
      </Typography>

      {posts.length > 0 ? (
        posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onBookmark={onBookmark}
          />
        ))
      ) : (
        <Typography align="center" sx={{ py: 4 }}>
          No posts to show. Follow some users to see their content here!
        </Typography>
      )}
    </Box>
  );
};

export default HomeAllContent;
