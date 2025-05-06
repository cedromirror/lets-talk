import React from 'react';
import { Box, Typography } from '@mui/material';
import PostCard from '../../components/Posts/PostCard';

const HomePostsTab = ({ posts, onLike, onComment, onShare, onBookmark }) => {
  return (
    <Box>
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
          No posts to show. Follow some users to see their posts here!
        </Typography>
      )}
    </Box>
  );
};

export default HomePostsTab;
