import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Button,
  Tooltip,
  Chip,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slide
} from '@mui/material';
import {
  FavoriteRounded as FavoriteIcon,
  FavoriteBorderRounded as FavoriteBorderIcon,
  ChatBubbleOutlineRounded as CommentIcon,
  ShareRounded as ShareIcon,
  MoreVertRounded as MoreVertIcon,
  BookmarkRounded as BookmarkIcon,
  BookmarkBorderRounded as BookmarkBorderIcon,
  VerifiedRounded as VerifiedIcon,
  SendRounded as SendIcon,
  LocationOnRounded as LocationIcon,
  ContentCopyRounded as CopyIcon,
  // WhatsAppRounded doesn't exist in Material UI icons
  WhatsApp as WhatsAppIcon,
  FacebookRounded as FacebookIcon,
  Twitter as TwitterIcon, // Using Twitter instead of TwitterRounded which doesn't exist
  EmailRounded as EmailIcon,
  LinkRounded as LinkIcon,
  ReportRounded as ReportIcon,
  EditRounded as EditIcon,
  DeleteRounded as DeleteIcon,
  CloseRounded as CloseIcon,
  VisibilityRounded as VisibilityIcon,
  TranslateRounded as TranslateIcon,
  DownloadRounded as DownloadIcon,
  TagRounded as TagIcon,
  MapRounded as MapIcon,
  AccessibilityNewRounded as AccessibilityIcon,
  BarChartRounded as AnalyticsIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/api';

// Format caption with hashtags and mentions
const formatCaption = (caption) => {
  if (!caption) return 'No caption';

  // Replace hashtags with styled spans and links
  const withHashtags = caption.replace(
    /#(\w+)/g,
    '<a href="/explore?hashtag=$1" style="color: #6366F1; font-weight: 500; text-decoration: none;">#$1</a>'
  );

  // Replace mentions with styled spans and links
  const withMentions = withHashtags.replace(
    /@(\w+)/g,
    '<a href="/profile/$1" style="color: #6366F1; font-weight: 500; text-decoration: none;">@$1</a>'
  );

  return withMentions;
};

const PostCard = memo(({ post, onLike, onComment, onShare, onBookmark, onDelete, onEdit }) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [doubleTapTimer, setDoubleTapTimer] = useState(null);
  const [doubleTapCount, setDoubleTapCount] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [viewCount, setViewCount] = useState(post.viewCount || 0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedCaption, setTranslatedCaption] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [engagementRate, setEngagementRate] = useState(0);
  const imageRef = useRef(null);

  // Reset double tap count after a delay
  useEffect(() => {
    if (doubleTapCount === 1) {
      const timer = setTimeout(() => {
        setDoubleTapCount(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [doubleTapCount]);

  // Record view count when post is viewed
  useEffect(() => {
    const recordView = async () => {
      try {
        // Only record view if not already viewed in this session
        if (!sessionStorage.getItem(`viewed-${post._id}`)) {
          // Optimistic update
          setViewCount(prev => prev + 1);

          // Call API to record view
          await postService.recordView(post._id);

          // Mark as viewed in this session
          sessionStorage.setItem(`viewed-${post._id}`, 'true');
        }
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };

    recordView();

    // Calculate engagement rate
    const totalEngagements = (post.likesCount || 0) + (post.commentsCount || 0);
    const views = viewCount || 1; // Prevent division by zero
    const rate = (totalEngagements / views) * 100;
    setEngagementRate(parseFloat(rate.toFixed(1)));

  }, [post._id, post.likesCount, post.commentsCount, viewCount]);

  const handleMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleShareMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setShareAnchorEl(event.currentTarget);
  }, []);

  const handleShareMenuClose = useCallback(() => {
    setShareAnchorEl(null);
  }, []);

  // Handle report dialog
  const handleReportOpen = useCallback(() => {
    setReportDialogOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleReportClose = useCallback(() => {
    setReportDialogOpen(false);
  }, []);

  const handleReportSubmit = useCallback(async () => {
    try {
      // Call API to report post
      // await postService.reportPost(post._id, reportReason);

      setReportDialogOpen(false);
      setReportReason('');

      // Show success message
      setSnackbarMessage('Post reported successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error reporting post:', error);

      // Show error message
      setSnackbarMessage('Failed to report post. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [post._id, reportReason]);

  // Handle delete dialog
  const handleDeleteOpen = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteSubmit = async () => {
    try {
      // Call API to delete post
      await postService.deletePost(post._id);

      setDeleteDialogOpen(false);

      // Show success message
      setSnackbarMessage('Post deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Call parent handler if provided
      if (onDelete) {
        onDelete(post._id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);

      // Show error message
      setSnackbarMessage('Failed to delete post. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle edit post
  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) {
      onEdit(post);
    } else {
      navigate(`/create?edit=${post._id}`);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleLike = useCallback(async () => {
    try {
      // Optimistic update
      setLiked(prevLiked => !prevLiked);
      setLikesCount(prevCount => liked ? prevCount - 1 : prevCount + 1);

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
      setLiked(prevLiked => prevLiked);
      setLikesCount(prevCount => liked ? prevCount : prevCount - 1);
    }
  }, [liked, likesCount, post._id, onLike]);

  const handleBookmark = async () => {
    try {
      // Optimistic update
      setBookmarked(!bookmarked);

      // Call API
      if (bookmarked) {
        await postService.unsavePost(post._id);
        console.log(`Post ${post._id} unsaved successfully`);
      } else {
        await postService.savePost(post._id);
        console.log(`Post ${post._id} saved successfully`);
      }

      // Call parent handler if provided
      if (onBookmark) {
        onBookmark(post._id, !bookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert on error
      setBookmarked(bookmarked);

      // Show error notification or toast (if you have a notification system)
      // For example: toast.error('Failed to save post. Please try again.');
    }
  };

  // Handle double-tap like
  const handleImageClick = () => {
    if (doubleTapCount === 0) {
      setDoubleTapCount(1);
    } else if (doubleTapCount === 1) {
      // Double tap detected
      setDoubleTapCount(0);
      if (!liked) {
        handleLike();
        setShowLikeAnimation(true);
        setTimeout(() => {
          setShowLikeAnimation(false);
        }, 1000);
      }
    }
  };

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Handle caption toggle
  const toggleCaption = () => {
    setShowFullCaption(!showFullCaption);
  };

  // Handle translation
  const handleTranslate = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    try {
      setIsTranslating(true);

      // Call translation API (mock implementation)
      // In a real app, you would call a translation service API
      setTimeout(() => {
        // Simulate translation result
        const translated = `${post.caption} [Translated]`;
        setTranslatedCaption(translated);
        setShowTranslation(true);
        setIsTranslating(false);
      }, 1000);

    } catch (error) {
      console.error('Error translating caption:', error);
      setIsTranslating(false);

      // Show error message
      setSnackbarMessage('Failed to translate. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle download post
  const handleDownload = async () => {
    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = post.image;
      link.download = `post-${post._id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      setSnackbarMessage('Image downloaded successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error downloading image:', error);

      // Show error message
      setSnackbarMessage('Failed to download image. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // formatCaption function moved outside component

  // Determine if caption should be truncated
  const shouldTruncateCaption = post.caption && post.caption.length > 100 && !showFullCaption;
  const truncatedCaption = shouldTruncateCaption
    ? post.caption.substring(0, 100) + '...'
    : post.caption;

  return (
    <Card sx={{
      mb: 4,
      borderRadius: 3,
      overflow: 'hidden',
      boxShadow: theme => theme.palette.mode === 'dark'
        ? '0 8px 24px rgba(0, 0, 0, 0.2)'
        : '0 8px 24px rgba(99, 102, 241, 0.12)',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: theme => theme.palette.mode === 'dark'
          ? '0 16px 40px rgba(0, 0, 0, 0.3)'
          : '0 16px 40px rgba(99, 102, 241, 0.18)',
      },
      position: 'relative',
      bgcolor: theme => theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.8)
        : theme.palette.background.paper,
    }}>
      {/* Post Header */}
      <Box sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={post.user?.profilePicture || '/assets/default-avatar.png'}
              alt={post.user?.username || 'User'}
              component={Link}
              to={`/profile/${post.user?.username}`}
              sx={{
                width: 48,
                height: 48,
                mr: 2,
                border: '2px solid',
                borderColor: theme => theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.3)
                  : alpha(theme.palette.primary.main, 0.2),
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                  : '0 4px 12px rgba(99, 102, 241, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 6px 16px rgba(0, 0, 0, 0.4)'
                    : '0 6px 16px rgba(99, 102, 241, 0.3)',
                }
              }}
            />
            {post.user?.isVerified && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 8,
                  background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
              >
                <VerifiedIcon sx={{ fontSize: 12, color: 'white' }} />
              </Box>
            )}
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                component={Link}
                to={`/profile/${post.user?.username}`}
                sx={{
                  textDecoration: 'none',
                  color: 'text.primary',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'primary.main',
                  }
                }}
              >
                {post.user?.username || 'User'}
              </Typography>

              {post.user?.isFollowing && (
                <Chip
                  label="Following"
                  size="small"
                  variant="outlined"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: '0.7rem',
                    borderRadius: '10px',
                  }}
                />
              )}
            </Box>

            {post.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <LocationIcon
                  sx={{
                    fontSize: 14,
                    mr: 0.5,
                    color: 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={() => setShowLocationMap(true)}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component={Link}
                  to={`/explore?location=${encodeURIComponent(post.location)}`}
                  sx={{
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {post.location}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Tooltip title="More options">
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
              },
              transition: 'all 0.2s ease',
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              borderRadius: 2,
              minWidth: 180,
              overflow: 'visible',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: -10,
                right: 14,
                width: 20,
                height: 20,
                bgcolor: 'background.paper',
                transform: 'rotate(45deg)',
                zIndex: 0,
                boxShadow: '-3px -3px 5px rgba(0, 0, 0, 0.04)'
              },
            }
          }}
        >
          <MenuItem
            onClick={handleReportOpen}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            <ListItemIcon>
              <ReportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Report" />
          </MenuItem>
          {currentUser && post.user && currentUser._id === post.user._id && (
            <>
              <MenuItem
                onClick={handleEdit}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: theme => alpha(theme.palette.info.main, 0.08),
                  }
                }}
              >
                <ListItemIcon>
                  <EditIcon fontSize="small" color="info" />
                </ListItemIcon>
                <ListItemText primary="Edit" />
              </MenuItem>
              <MenuItem
                onClick={handleDeleteOpen}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: theme => alpha(theme.palette.error.main, 0.08),
                  }
                }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Delete" />
              </MenuItem>
            </>
          )}
          <Divider sx={{ my: 1 }} />
          <MenuItem
            onClick={() => {
              const url = `${window.location.origin}/posts/${post._id}`;
              navigator.clipboard.writeText(url)
                .then(() => {
                  setSnackbarMessage('Link copied to clipboard');
                  setSnackbarSeverity('success');
                  setSnackbarOpen(true);
                  handleMenuClose();
                })
                .catch(err => {
                  console.error('Failed to copy link:', err);
                  setSnackbarMessage('Failed to copy link');
                  setSnackbarSeverity('error');
                  setSnackbarOpen(true);
                });
            }}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            <ListItemIcon>
              <LinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Copy Link" />
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleTranslate();
              handleMenuClose();
            }}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            <ListItemIcon>
              <TranslateIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary={showTranslation ? "Show Original" : "Translate Caption"} />
            {isTranslating && <Box sx={{ display: 'inline-flex', ml: 1 }}>
              <Box sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.main',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
              }} />
            </Box>}
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleDownload();
              handleMenuClose();
            }}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            <ListItemIcon>
              <DownloadIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Download Image" />
          </MenuItem>

          <MenuItem
            onClick={handleTranslate}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            <ListItemIcon>
              <TranslateIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary={showTranslation ? "Show Original" : "Translate Caption"} />
          </MenuItem>

          <MenuItem
            onClick={handleDownload}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            <ListItemIcon>
              <DownloadIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Download Image" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Post Image */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        {!imageLoaded && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme => theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, 0.1)'
              : 'rgba(0, 0, 0, 0.03)',
            zIndex: 1,
          }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '3px solid',
                borderColor: 'primary.main',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }}
            />
          </Box>
        )}

        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          {/* Low quality image placeholder */}
          {!imageLoaded && post.thumbnailImage && (
            <CardMedia
              component="img"
              image={post.thumbnailImage}
              alt="Loading..."
              sx={{
                width: '100%',
                maxHeight: 600,
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                filter: 'blur(10px)',
                transform: 'scale(1.05)',
                zIndex: 1
              }}
            />
          )}

          {/* Main high quality image */}
          <CardMedia
            component="img"
            image={post.image || '/assets/default-post.jpg'}
            alt={post.caption || 'Post'}
            ref={imageRef}
            onLoad={handleImageLoad}
            loading="lazy"
            sx={{
              width: '100%',
              maxHeight: 600,
              objectFit: 'cover',
              transition: 'all 0.5s ease',
              opacity: imageLoaded ? 1 : 0,
              zIndex: 2,
              position: 'relative'
            }}
          />

          {/* Accessibility enhancement */}
          <Box
            component="span"
            role="img"
            aria-label={post.caption || 'Post image'}
            sx={{ display: 'none' }}
          />
        </Box>

        {/* Double-tap like overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
          }}
          onClick={handleImageClick}
        >
          {showLikeAnimation && (
            <FavoriteIcon
              sx={{
                color: 'error.main',
                fontSize: 80,
                opacity: 0,
                animation: 'likeAnimation 1s ease-in-out',
                filter: 'drop-shadow(0 0 8px rgba(244, 67, 54, 0.5))',
                '@keyframes likeAnimation': {
                  '0%': {
                    opacity: 0,
                    transform: 'scale(0.5)',
                  },
                  '15%': {
                    opacity: 1,
                    transform: 'scale(1.2)',
                  },
                  '30%': {
                    transform: 'scale(1)',
                  },
                  '70%': {
                    opacity: 1,
                  },
                  '100%': {
                    opacity: 0,
                    transform: 'scale(1.5)',
                  },
                }
              }}
            />
          )}
        </Box>
      </Box>

      {/* Post Actions */}
      <CardActions sx={{ p: 0 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          px: 2,
          py: 1.5,
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={liked ? "Unlike" : "Like"}>
              <IconButton
                onClick={handleLike}
                color={liked ? "error" : "default"}
                sx={{
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: 'scale(1.15)',
                  },
                  animation: liked ? 'heartBeat 0.3s' : 'none',
                  '@keyframes heartBeat': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.3)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }}
              >
                {liked ? (
                  <FavoriteIcon sx={{
                    color: theme.palette.error.main,
                    filter: 'drop-shadow(0 0 2px rgba(244, 67, 54, 0.3))',
                  }} />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Comment">
              <IconButton
                onClick={() => onComment && onComment(post)}
                sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <CommentIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Share">
              <IconButton
                onClick={handleShareMenuOpen}
                sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1) rotate(15deg)',
                    color: theme.palette.info.main,
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Tooltip>

            <Popover
              open={Boolean(shareAnchorEl)}
              anchorEl={shareAnchorEl}
              onClose={handleShareMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: -2,
                  borderRadius: 2,
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    bottom: -10,
                    left: 'calc(50% - 10px)',
                    width: 20,
                    height: 20,
                    bgcolor: 'background.paper',
                    transform: 'rotate(45deg)',
                    zIndex: 0,
                    boxShadow: '3px 3px 5px rgba(0, 0, 0, 0.04)'
                  },
                }
              }}
            >
              <List sx={{ p: 1, width: 200 }}>
                <ListItem
                  button
                  onClick={() => {
                    const url = `${window.location.origin}/posts/${post._id}`;
                    navigator.clipboard.writeText(url)
                      .then(() => {
                        setSnackbarMessage('Link copied to clipboard');
                        setSnackbarSeverity('success');
                        setSnackbarOpen(true);
                        handleShareMenuClose();
                      })
                      .catch(err => {
                        console.error('Failed to copy link:', err);
                        setSnackbarMessage('Failed to copy link');
                        setSnackbarSeverity('error');
                        setSnackbarOpen(true);
                      });
                  }}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <ListItemIcon>
                    <CopyIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Copy Link" />
                </ListItem>

                <ListItem
                  button
                  onClick={() => {
                    const url = `${window.location.origin}/posts/${post._id}`;
                    const text = post.caption || 'Check out this post!';
                    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
                    handleShareMenuClose();
                  }}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <ListItemIcon>
                    <WhatsAppIcon fontSize="small" style={{ color: '#25D366', backgroundColor: 'transparent', borderRadius: '50%', padding: '2px' }} />
                  </ListItemIcon>
                  <ListItemText primary="WhatsApp" />
                </ListItem>

                <ListItem
                  button
                  onClick={() => {
                    const url = `${window.location.origin}/posts/${post._id}`;
                    const text = post.caption || 'Check out this post!';
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
                    handleShareMenuClose();
                  }}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <ListItemIcon>
                    <FacebookIcon fontSize="small" style={{ color: '#1877F2' }} />
                  </ListItemIcon>
                  <ListItemText primary="Facebook" />
                </ListItem>

                <ListItem
                  button
                  onClick={() => {
                    const url = `${window.location.origin}/posts/${post._id}`;
                    const text = post.caption || 'Check out this post!';
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
                    handleShareMenuClose();
                  }}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <ListItemIcon>
                    <TwitterIcon fontSize="small" style={{ color: '#1DA1F2' }} />
                  </ListItemIcon>
                  <ListItemText primary="Twitter" />
                </ListItem>

                <ListItem
                  button
                  onClick={() => {
                    const url = `${window.location.origin}/posts/${post._id}`;
                    const subject = 'Check out this post!';
                    const body = post.caption ? `${post.caption}\n\n${url}` : url;
                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    handleShareMenuClose();
                  }}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <ListItemIcon>
                    <EmailIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText primary="Email" />
                </ListItem>
              </List>
            </Popover>
          </Box>

          <Tooltip title={bookmarked ? "Unsave" : "Save"}>
            <IconButton
              onClick={handleBookmark}
              color={bookmarked ? "primary" : "default"}
              sx={{
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'scale(1.15)',
                },
                animation: bookmarked ? 'pop 0.3s' : 'none',
                '@keyframes pop': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.3)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              {bookmarked ? (
                <BookmarkIcon sx={{
                  color: theme.palette.primary.main,
                  filter: 'drop-shadow(0 0 2px rgba(99, 102, 241, 0.3))',
                }} />
              ) : (
                <BookmarkBorderIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      {/* Post Content */}
      <CardContent sx={{ pt: 0, px: 2.5, pb: 2.5 }}>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '50%',
              mr: 1,
              bgcolor: theme => alpha(theme.palette.error.main, 0.1),
            }}
          >
            <FavoriteIcon
              fontSize="small"
              sx={{
                color: 'error.main',
                fontSize: '0.9rem',
              }}
            />
          </Box>
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </Typography>

        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex' }}>
            <Typography
              variant="body2"
              component={Link}
              to={`/profile/${post.user?.username}`}
              sx={{
                fontWeight: 'bold',
                mr: 1,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': {
                  color: 'primary.main',
                }
              }}
            >
              {post.user?.username || 'User'}
            </Typography>

            <Box>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  color: 'text.primary',
                  lineHeight: 1.5,
                  '& a': {
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html: formatCaption(shouldTruncateCaption ? truncatedCaption : post.caption)
                }}
              />

              {showTranslation && (
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Translated caption:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.5,
                      fontStyle: 'italic'
                    }}
                  >
                    {translatedCaption}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {shouldTruncateCaption && (
            <Typography
              variant="body2"
              color="text.secondary"
              onClick={toggleCaption}
              sx={{
                mt: 0.5,
                cursor: 'pointer',
                display: 'inline-block',
                '&:hover': {
                  color: 'primary.main',
                }
              }}
            >
              more
            </Typography>
          )}
        </Box>

        {post.commentsCount > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.5,
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: 'primary.main',
              }
            }}
            onClick={() => onComment && onComment(post)}
          >
            View all {post.commentsCount.toLocaleString()} comments
          </Typography>
        )}

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1.5
        }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontSize: '0.7rem',
              letterSpacing: '0.01em',
            }}
          >
            {formatDistanceToNow(new Date(post.createdAt || new Date()), { addSuffix: true }).toUpperCase()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Views">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VisibilityIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {viewCount.toLocaleString()}
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip title="Engagement Rate">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AnalyticsIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {engagementRate}%
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>

      {/* Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={handleReportClose}
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: '100%',
            maxWidth: 500,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">Report Post</Typography>
            <IconButton onClick={handleReportClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please tell us why you're reporting this post. Your report will be kept anonymous.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="report-reason"
            label="Reason for reporting"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleReportClose}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReportSubmit}
            variant="contained"
            color="primary"
            disabled={!reportReason.trim()}
            sx={{ borderRadius: 2 }}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: '100%',
            maxWidth: 400,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">Delete Post</Typography>
            <IconButton onClick={handleDeleteClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDeleteClose}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSubmit}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Map Dialog */}
      {post.location && (
        <Dialog
          open={showLocationMap}
          onClose={() => setShowLocationMap(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              width: '100%',
              maxWidth: 600,
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">Location: {post.location}</Typography>
              <IconButton onClick={() => setShowLocationMap(false)} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0, height: 400 }}>
            <Box sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* This would be replaced with an actual map component in a real app */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(post.location)}&zoom=13&size=600x400&maptype=roadmap&markers=color:red%7C${encodeURIComponent(post.location)}&key=YOUR_API_KEY)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'grayscale(0.2)'
              }} />

              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 3,
                border: '3px solid',
                borderColor: 'primary.main',
                zIndex: 1
              }}>
                <LocationIcon color="primary" />
              </Box>

              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  bgcolor: 'background.paper',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 1
                }}
              >
                {post.location}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={() => {
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.location)}`, '_blank');
              }}
              sx={{ borderRadius: 2 }}
            >
              Open in Google Maps
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
});

export default PostCard;
