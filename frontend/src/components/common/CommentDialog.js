import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, InputAdornment, IconButton,
  Typography, Avatar, Box, Divider, CircularProgress,
  List, ListItem, ListItemAvatar, ListItemText, Tooltip,
  Snackbar, Alert
} from '@mui/material';
import ProfilePicture from '../common/ProfilePicture';
import {
  Close as CloseIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  Favorite as LikeIcon,
  FavoriteBorder as LikeBorderIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../../context/AuthContext';
import { postService, reelService } from '../../services/api';

/**
 * Unified comment dialog component that works for both posts and reels
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Object} props.content - The post or reel object
 * @param {string} props.contentType - Type of content ('post' or 'reel')
 */
const CommentDialog = ({ open, onClose, content, contentType = 'post' }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Determine which service to use based on content type
  const service = contentType === 'post' ? postService : reelService;

  // Fetch comments when dialog opens
  useEffect(() => {
    if (open && content) {
      fetchComments();
    }
  }, [open, content]);

  const fetchComments = async () => {
    if (!content || !content._id) return;

    try {
      setLoading(true);

      // Use the appropriate service method based on content type
      const response = contentType === 'post'
        ? await postService.getPostComments(content._id, { page: 1, limit: 20 })
        : await reelService.getReelComments(content._id, { page: 1, limit: 20 });

      // Process comments to ensure they have all required fields
      const processedComments = (response.data.comments || []).map(comment => ({
        ...comment,
        likesCount: comment.likesCount || comment.likes?.length || 0,
        isLiked: comment.isLiked || false,
        user: {
          ...comment.user,
          isFollowed: comment.user?.isFollowed || false,
          isVerified: comment.user?.isVerified || false
        },
        replies: (comment.replies || []).map(reply => ({
          ...reply,
          likesCount: reply.likesCount || reply.likes?.length || 0,
          isLiked: reply.isLiked || false,
          user: {
            ...reply.user,
            isFollowed: reply.user?.isFollowed || false,
            isVerified: reply.user?.isVerified || false
          }
        }))
      }));

      setComments(processedComments);
    } catch (error) {
      console.error(`Error fetching ${contentType} comments:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    if (replyingTo) {
      setReplyText((prev) => prev + emojiData.emoji);
    } else {
      setCommentText((prev) => prev + emojiData.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (replyingTo) {
      if (replyText.trim()) {
        handleAddReply();
      }
    } else if (commentText.trim()) {
      handleAddComment();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !content || !content._id) return;

    // Store the comment text before clearing it for optimistic UI update
    const commentToAdd = commentText;

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      text: commentToAdd,
      user: currentUser,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isLiked: false,
      replies: [],
      isOptimistic: true // Flag to identify optimistic updates
    };

    // Add optimistic comment to the list
    setComments(prevComments => [
      optimisticComment,
      ...prevComments
    ]);

    // Clear comment text immediately for better UX
    setCommentText('');
    setShowEmojiPicker(false);

    try {
      // Use the appropriate service method based on content type
      const response = contentType === 'post'
        ? await postService.commentOnPost(content._id, commentToAdd)
        : await reelService.addComment(content._id, { text: commentToAdd });

      // Replace optimistic comment with real one from server
      if (response.data && response.data.comment) {
        setComments(prevComments => prevComments.map(comment =>
          comment._id === tempId ? {
            ...response.data.comment,
            likesCount: 0,
            isLiked: false,
            replies: []
          } : comment
        ));

        // Update comment count in the content
        if (typeof content.commentsCount === 'number') {
          content.commentsCount += 1;
        }
      }
    } catch (error) {
      console.error(`Error adding comment to ${contentType}:`, error);

      // Remove optimistic comment on error
      setComments(prevComments => prevComments.filter(comment => comment._id !== tempId));

      // Restore the comment text so user doesn't lose their input
      setCommentText(commentToAdd);

      // Show error message in a more user-friendly way
      setSnackbar({
        open: true,
        message: `Failed to add comment: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setReplyText(`@${comment.user.username} `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleAddReply = async () => {
    if (!replyText.trim() || !replyingTo || !content || !content._id) return;

    // Store the reply text before clearing it for optimistic UI update
    const replyToAdd = replyText;

    // Optimistic UI update
    const tempId = `temp-reply-${Date.now()}`;
    const optimisticReply = {
      _id: tempId,
      text: replyToAdd,
      user: currentUser,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isLiked: false,
      isOptimistic: true // Flag to identify optimistic updates
    };

    // Add optimistic reply to the list
    setComments(prevComments =>
      prevComments.map(comment => {
        if (comment._id === replyingTo._id) {
          // Automatically expand replies when adding a new one
          setExpandedReplies(prev => ({ ...prev, [comment._id]: true }));

          // Add the optimistic reply to this comment's replies
          return {
            ...comment,
            replies: [...(comment.replies || []), optimisticReply]
          };
        }
        return comment;
      })
    );

    // Clear reply text and reset replyingTo immediately for better UX
    setReplyText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);

    try {
      // Use the appropriate service method based on content type
      const response = contentType === 'post'
        ? await postService.replyToComment(content._id, replyingTo._id, { text: replyToAdd })
        : await reelService.replyToComment(content._id, replyingTo._id, { text: replyToAdd });

      // Replace optimistic reply with real one from server
      if (response.data && response.data.reply) {
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment._id === replyingTo._id) {
              // Replace the optimistic reply with the real one
              return {
                ...comment,
                replies: (comment.replies || []).map(reply =>
                  reply._id === tempId ? response.data.reply : reply
                )
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error(`Error replying to comment on ${contentType}:`, error);

      // Remove optimistic reply on error
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment._id === replyingTo._id) {
            return {
              ...comment,
              replies: (comment.replies || []).filter(reply => reply._id !== tempId)
            };
          }
          return comment;
        })
      );

      // Show error message in a more user-friendly way
      setSnackbar({
        open: true,
        message: `Failed to add reply: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleLikeComment = async (comment) => {
    if (!content || !content._id || !comment || !comment._id) return;

    try {
      const isLiked = comment.isLiked;
      const isReply = comment.parentId !== undefined;
      const parentCommentId = comment.parentId;

      // Check if this is a top-level comment or a reply
      if (isReply) {
        // Handle liking a reply
        setComments(prevComments =>
          prevComments.map(c => {
            if (c._id === parentCommentId) {
              // Find the reply within this comment's replies
              return {
                ...c,
                replies: (c.replies || []).map(reply =>
                  reply._id === comment._id ? {
                    ...reply,
                    isLiked: !isLiked,
                    likesCount: isLiked ? Math.max(0, reply.likesCount - 1) : reply.likesCount + 1
                  } : reply
                )
              };
            }
            return c;
          })
        );
      } else {
        // Handle liking a top-level comment
        setComments(prevComments =>
          prevComments.map(c => {
            if (c._id === comment._id) {
              return {
                ...c,
                isLiked: !isLiked,
                likesCount: isLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1
              };
            }
            return c;
          })
        );
      }

      // API call using the appropriate service method
      if (isLiked) {
        contentType === 'post'
          ? await postService.unlikeComment(content._id, comment._id)
          : await reelService.unlikeComment(content._id, comment._id);
      } else {
        contentType === 'post'
          ? await postService.likeComment(content._id, comment._id)
          : await reelService.likeComment(content._id, comment._id);
      }
    } catch (error) {
      console.error(`Error liking/unliking comment on ${contentType}:`, error);
      // Revert optimistic update on error by refreshing all comments
      fetchComments();
      // Show error message in a more user-friendly way
      setSnackbar({
        open: true,
        message: `Failed to like/unlike comment: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }
      }}
      TransitionProps={{
        timeout: 300
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          {contentType === 'post' ? 'Post' : 'Reel'} Comments
          {comments.length > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({comments.length})
            </Typography>
          )}
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            {comments.map((comment) => (
              <React.Fragment key={comment._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 2,
                    py: 1.5,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    },
                    ...(comment.isOptimistic ? {
                      bgcolor: 'action.selected',
                      animation: 'pulse 1s infinite'
                    } : {})
                  }}
                >
                  <ListItemAvatar>
                    <ProfilePicture
                      user={comment.user}
                      linkToProfile={true}
                      size={{ width: 40, height: 40 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          component={Link}
                          to={`/profile/${comment.user.username}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'text.primary',
                            fontWeight: 600,
                            mr: 0.5
                          }}
                        >
                          {comment.user.username}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 'auto' }}
                        >
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ whiteSpace: 'pre-wrap', mb: 1 }}
                        >
                          {comment.text}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Button
                            size="small"
                            sx={{ minWidth: 'auto', p: 0.5, mr: 1.5, color: 'text.secondary' }}
                            onClick={() => handleLikeComment(comment)}
                          >
                            {comment.isLiked ? (
                              <LikeIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                            ) : (
                              <LikeBorderIcon fontSize="small" sx={{ mr: 0.5 }} />
                            )}
                            <Typography variant="caption">
                              {comment.likesCount > 0 ? comment.likesCount : ''} {comment.isLiked ? 'Liked' : 'Like'}
                            </Typography>
                          </Button>
                          <Button
                            size="small"
                            sx={{ minWidth: 'auto', p: 0.5, mr: 1.5, color: 'text.secondary' }}
                            onClick={() => handleReply(comment)}
                          >
                            <ReplyIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption">Reply</Typography>
                          </Button>
                          {comment.replies && comment.replies.length > 0 && (
                            <Button
                              size="small"
                              sx={{ minWidth: 'auto', p: 0.5, color: 'text.secondary' }}
                              onClick={() => toggleReplies(comment._id)}
                            >
                              <Typography variant="caption">
                                {expandedReplies[comment._id] ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                              </Typography>
                            </Button>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>

                {/* Replies */}
                {expandedReplies[comment._id] && comment.replies && comment.replies.length > 0 && (
                  <Box sx={{
                    pl: 7,
                    pr: 2,
                    pb: 1,
                    borderLeft: '2px solid',
                    borderColor: 'divider',
                    ml: 3,
                    mt: -1
                  }}>
                    {comment.replies.map((reply) => (
                      <Box
                        key={reply._id}
                        sx={{
                          mb: 2,
                          p: 1,
                          borderRadius: 1,
                          transition: 'background-color 0.2s',
                          '&:hover': { bgcolor: 'action.hover' },
                          ...(reply.isOptimistic ? {
                            bgcolor: 'action.selected',
                            animation: 'pulse 1s infinite'
                          } : {})
                        }}
                      >
                        <Box sx={{ display: 'flex', mb: 1 }}>
                          <ProfilePicture
                            user={reply.user}
                            linkToProfile={true}
                            size={{ width: 32, height: 32 }}
                            sx={{ mr: 1.5 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Typography
                                variant="subtitle2"
                                component={Link}
                                to={`/profile/${reply.user.username}`}
                                sx={{
                                  textDecoration: 'none',
                                  color: 'text.primary',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  mr: 0.5
                                }}
                              >
                                {reply.user.username}
                              </Typography>
                              {reply.user.isVerified && (
                                <Tooltip title="Verified Account">
                                  <Box component="span" sx={{ color: 'primary.main', display: 'inline-flex', ml: 0.5 }}>
                                    <VerifiedIcon sx={{ fontSize: 14 }} />
                                  </Box>
                                </Tooltip>
                              )}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ml: 'auto', fontSize: '0.75rem' }}
                              >
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}
                            >
                              {reply.text}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                              <Button
                                size="small"
                                sx={{
                                  minWidth: 'auto',
                                  p: 0.5,
                                  color: reply.isLiked ? 'error.main' : 'text.secondary',
                                  borderRadius: '20px',
                                  '&:hover': { bgcolor: reply.isLiked ? 'error.light' : 'action.hover' }
                                }}
                                onClick={() => handleLikeComment({...reply, parentId: comment._id})}
                              >
                                {reply.isLiked ? (
                                  <LikeIcon fontSize="small" color="error" sx={{ mr: 0.5, fontSize: '0.85rem' }} />
                                ) : (
                                  <LikeBorderIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.85rem' }} />
                                )}
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: reply.isLiked ? 500 : 400
                                  }}
                                >
                                  {reply.likesCount > 0 ? reply.likesCount : ''} {reply.isLiked ? 'Liked' : 'Like'}
                                </Typography>
                              </Button>
                              <Button
                                size="small"
                                sx={{
                                  minWidth: 'auto',
                                  p: 0.5,
                                  color: 'text.secondary',
                                  borderRadius: '20px'
                                }}
                                onClick={() => handleReply(comment)}
                              >
                                <ReplyIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.85rem' }} />
                                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                  Reply
                                </Typography>
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{
        p: 2,
        position: 'relative',
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        boxShadow: '0 -1px 3px rgba(0,0,0,0.05)'
      }}>
        {replyingTo && (
          <Box
            sx={{
              position: 'absolute',
              top: -36,
              left: 0,
              right: 0,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid',
              borderColor: 'primary.main'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Replying to <strong>{replyingTo.user.username}</strong>
            </Typography>
            <IconButton size="small" onClick={handleCancelReply} sx={{ color: 'inherit' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Box sx={{ width: '100%', position: 'relative' }}>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              fullWidth
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              value={replyingTo ? replyText : commentText}
              onChange={(e) => replyingTo ? setReplyText(e.target.value) : setCommentText(e.target.value)}
              variant="outlined"
              size="small"
              autoFocus={!!replyingTo}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  bgcolor: 'action.hover',
                  '&.Mui-focused': {
                    bgcolor: 'background.paper'
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      color={showEmojiPicker ? 'primary' : 'default'}
                      size="small"
                    >
                      <EmojiIcon />
                    </IconButton>
                    <IconButton
                      type="submit"
                      disabled={replyingTo ? !replyText.trim() : !commentText.trim()}
                      color="primary"
                      size="small"
                      sx={{
                        ml: 0.5,
                        transition: 'all 0.2s',
                        transform: (replyingTo ? replyText.trim() : commentText.trim()) ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </form>
          {showEmojiPicker && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                zIndex: 1,
                boxShadow: 3,
                borderRadius: 2,
                overflow: 'hidden',
                mb: 1,
                maxHeight: '300px',
                '@media (max-height: 600px)': {
                  maxHeight: '200px'
                }
              }}
            >
              <EmojiPicker onEmojiClick={handleEmojiClick} height={300} />
            </Box>
          )}
        </Box>
      </DialogActions>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CommentDialog;
