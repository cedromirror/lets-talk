import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  IconButton, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button
} from '@mui/material';
import { 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/api';

const PostCard = ({ post, onLike, onComment, onShare, onBookmark }) => {
  const { currentUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLike = async () => {
    try {
      // Optimistic update
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      
      // Call API
      if (liked) {
        await postService.unlikePost(post._id);
      } else {
        await postService.likePost(post._id);
      }
      
      // Call parent handler if provided
      if (onLike) {
        onLike(post._id, !liked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setLiked(liked);
      setLikesCount(liked ? likesCount : likesCount - 1);
    }
  };
  
  const handleBookmark = async () => {
    try {
      // Optimistic update
      setBookmarked(!bookmarked);
      
      // Call API (implement these services if they exist)
      if (bookmarked) {
        // await postService.unsavePost(post._id);
      } else {
        // await postService.savePost(post._id);
      }
      
      // Call parent handler if provided
      if (onBookmark) {
        onBookmark(post._id, !bookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert on error
      setBookmarked(bookmarked);
    }
  };
  
  return (
    <Card sx={{ 
      mb: 3, 
      borderRadius: 3, 
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)'
      }
    }}>
      {/* Post Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={post.user?.profilePicture || '/assets/default-avatar.png'} 
            alt={post.user?.username || 'User'} 
            component={Link}
            to={`/profile/${post.user?.username}`}
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 1.5,
              border: '2px solid #f0f0f0'
            }}
          />
          <Box>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              component={Link}
              to={`/profile/${post.user?.username}`}
              sx={{ 
                textDecoration: 'none', 
                color: 'text.primary',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {post.user?.username || 'User'}
            </Typography>
            {post.location && (
              <Typography variant="caption" color="text.secondary">
                {post.location}
              </Typography>
            )}
          </Box>
        </Box>
        
        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            Report
          </MenuItem>
          {currentUser && post.user && currentUser._id === post.user._id && (
            <>
              <MenuItem onClick={handleMenuClose}>
                Edit
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                Delete
              </MenuItem>
            </>
          )}
          <MenuItem onClick={handleMenuClose}>
            Copy Link
          </MenuItem>
        </Menu>
      </Box>
      
      {/* Post Image */}
      <CardMedia
        component="img"
        image={post.image || '/assets/default-post.jpg'}
        alt={post.caption || 'Post'}
        sx={{ 
          width: '100%', 
          maxHeight: 500, 
          objectFit: 'cover' 
        }}
      />
      
      {/* Post Actions */}
      <CardActions sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={handleLike}
              color={liked ? "error" : "default"}
            >
              {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            
            <IconButton onClick={() => onComment && onComment(post)}>
              <CommentIcon />
            </IconButton>
            
            <IconButton onClick={() => onShare && onShare(post)}>
              <ShareIcon />
            </IconButton>
          </Box>
          
          <IconButton 
            onClick={handleBookmark}
            color={bookmarked ? "primary" : "default"}
          >
            {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        </Box>
      </CardActions>
      
      {/* Post Content */}
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" fontWeight="bold">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </Typography>
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" component="span">
            <Box component="span" fontWeight="bold" sx={{ mr: 1 }}>
              {post.user?.username || 'User'}
            </Box>
            {post.caption || 'No caption'}
          </Typography>
        </Box>
        
        {post.commentsCount > 0 && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mt: 1, cursor: 'pointer' }}
            onClick={() => onComment && onComment(post)}
          >
            View all {post.commentsCount} comments
          </Typography>
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {formatDistanceToNow(new Date(post.createdAt || new Date()), { addSuffix: true })}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PostCard;
