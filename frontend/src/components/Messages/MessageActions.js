import React, { useState } from 'react';
import {
  Box, IconButton, Menu, MenuItem, Typography, Tooltip,
  Popover, Grid, Badge, Avatar, AvatarGroup, Dialog,
  DialogTitle, DialogContent, DialogActions, Button,
  Slide, Zoom, Fade
} from '@mui/material';
import ProfilePicture from '../common/ProfilePicture';
import {
  ReplyOutlined as ReplyIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  ForwardOutlined as ForwardIcon,
  MoreVert as MoreIcon,
  AddReaction as AddReactionIcon,
  MarkChatRead as MarkReadIcon,
  MarkChatUnread as MarkUnreadIcon,
  DoneAll as ReadIcon,
  Done as DeliveredIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Reply as ReplyFilledIcon,
  Delete as DeleteFilledIcon,
  Edit as EditFilledIcon,
  Forward as ForwardFilledIcon
} from '@mui/icons-material';

// Common emoji reactions
const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉'];

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MessageActions = ({
  message,
  onReply,
  onReact,
  onDelete,
  onEdit,
  onForward,
  onMarkRead,
  onMarkUnread,
  isSender,
  currentUser,
  isRead
}) => {
  // Initialize all hooks at the top level
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [reactionsAnchorEl, setReactionsAnchorEl] = useState(null);
  const [reactionsDetailsAnchorEl, setReactionsDetailsAnchorEl] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ show: false, type: '', message: '' });

  // Validate required props
  if (!message) {
    console.error('MessageActions: message prop is required');
    return null;
  }

  const handleActionsClick = (event) => {
    setActionsAnchorEl(event.currentTarget);
  };

  const handleActionsClose = () => {
    setActionsAnchorEl(null);
  };

  const handleReactionsClick = (event) => {
    event.stopPropagation();
    setReactionsAnchorEl(event.currentTarget);
    handleActionsClose();
  };

  const handleReactionsClose = () => {
    setReactionsAnchorEl(null);
  };

  const handleReactionSelect = (emoji) => {
    onReact(message, emoji);
    handleReactionsClose();
  };

  const handleReactionsDetailsClick = (event) => {
    event.stopPropagation();
    setReactionsDetailsAnchorEl(event.currentTarget);
  };

  const handleReactionsDetailsClose = () => {
    setReactionsDetailsAnchorEl(null);
  };

  // Handle delete confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    handleActionsClose();
  };

  const handleDeleteConfirm = () => {
    onDelete(message);
    setShowDeleteConfirm(false);
    showActionFeedback('success', 'Message deleted');
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Handle forward dialog
  const handleForwardClick = () => {
    setShowForwardDialog(true);
    handleActionsClose();
  };

  const handleForwardConfirm = () => {
    onForward(message);
    setShowForwardDialog(false);
    showActionFeedback('success', 'Message forwarded');
  };

  const handleForwardCancel = () => {
    setShowForwardDialog(false);
  };

  // Show action feedback
  const showActionFeedback = (type, message) => {
    setActionFeedback({ show: true, type, message });
    setTimeout(() => {
      setActionFeedback({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Handle quick actions
  const handleQuickReply = () => {
    onReply(message);
    showActionFeedback('info', 'Replying to message');
  };

  const handleQuickEdit = () => {
    onEdit(message);
    handleActionsClose();
    showActionFeedback('info', 'Editing message');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text);
    handleActionsClose();
    showActionFeedback('success', 'Message copied to clipboard');
  };

  // Group reactions by emoji
  const groupedReactions = message.reactions && Array.isArray(message.reactions) ?
    message.reactions.reduce((acc, reaction) => {
      if (!reaction || !reaction.emoji || !reaction.user) return acc;

      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction.user);
      return acc;
    }, {}) : {};

  // Get total reactions count
  const totalReactions = message.reactions && Array.isArray(message.reactions) ? message.reactions.length : 0;

  return (
    <>
      {/* Read status indicator for sender */}
      {isSender && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -18,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 1
          }}
        >
          <Tooltip title={isRead ? 'Read' : 'Delivered'}>
            {isRead ?
              <ReadIcon fontSize="small" color="primary" sx={{ fontSize: 14 }} /> :
              <DeliveredIcon fontSize="small" color="action" sx={{ fontSize: 14 }} />
            }
          </Tooltip>
        </Box>
      )}

      {/* Message hover actions */}
      <Zoom in={true}>
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            [isSender ? 'left' : 'right']: 0,
            opacity: 0,
            transition: 'all 0.3s ease',
            '&:hover': {
              opacity: 1,
              transform: 'translateY(-2px)'
            },
            '.MuiPaper-root:hover &': {
              opacity: 0.9,
            },
            zIndex: 2,
            display: 'flex',
            bgcolor: 'background.paper',
            borderRadius: 5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            p: 0.5,
            gap: 0.5
          }}
        >
          <Tooltip title="Reply" arrow placement="top">
            <IconButton
              size="small"
              onClick={handleQuickReply}
              color="primary"
              sx={{
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {isSender && (
            <Tooltip title="Edit" arrow placement="top">
              <IconButton
                size="small"
                onClick={handleQuickEdit}
                color="info"
                sx={{
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="React" arrow placement="top">
            <IconButton
              size="small"
              onClick={handleReactionsClick}
              color="secondary"
              sx={{
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              <AddReactionIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="More actions" arrow placement="top">
            <IconButton
              size="small"
              onClick={handleActionsClick}
              sx={{
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Zoom>

      {/* Reactions display */}
      {totalReactions > 0 && (
        <Box
          onClick={handleReactionsDetailsClick}
          sx={{
            position: 'absolute',
            bottom: -8,
            [isSender ? 'left' : 'right']: 8,
            bgcolor: 'background.paper',
            borderRadius: 10,
            boxShadow: 1,
            px: 1,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            zIndex: 1
          }}
        >
          <Box sx={{ display: 'flex', mr: totalReactions > 0 ? 0.5 : 0 }}>
            {Object.keys(groupedReactions).slice(0, 3).map(emoji => (
              <Typography key={emoji} variant="body2" sx={{ fontSize: '0.8rem', mr: 0.25 }}>
                {emoji}
              </Typography>
            ))}
          </Box>
          {totalReactions > 0 && (
            <Typography variant="caption" color="text.secondary">
              {totalReactions}
            </Typography>
          )}
        </Box>
      )}

      {/* More actions menu */}
      <Menu
        anchorEl={actionsAnchorEl}
        open={Boolean(actionsAnchorEl)}
        onClose={handleActionsClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: isSender ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isSender ? 'right' : 'left',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: isSender ? 'auto' : 14,
              left: isSender ? 14 : 'auto',
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <MenuItem onClick={handleCopyText} sx={{
          py: 1.5,
          '&:hover': { bgcolor: 'action.hover' }
        }}>
          <CopyIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
          <Typography variant="body2">Copy text</Typography>
        </MenuItem>

        <MenuItem onClick={handleForwardClick} sx={{
          py: 1.5,
          '&:hover': { bgcolor: 'action.hover' }
        }}>
          <ForwardIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
          <Typography variant="body2">Forward message</Typography>
        </MenuItem>

        <MenuItem onClick={handleQuickReply} sx={{
          py: 1.5,
          '&:hover': { bgcolor: 'action.hover' }
        }}>
          <ReplyIcon fontSize="small" sx={{ mr: 1.5, color: 'info.main' }} />
          <Typography variant="body2">Reply to message</Typography>
        </MenuItem>

        {!isSender && (
          <MenuItem onClick={() => {
            if (isRead && onMarkUnread) {
              onMarkUnread(message);
              showActionFeedback('info', 'Marked as unread');
            } else if (!isRead && onMarkRead) {
              onMarkRead(message);
              showActionFeedback('info', 'Marked as read');
            }
            handleActionsClose();
          }} sx={{
            py: 1.5,
            '&:hover': { bgcolor: 'action.hover' }
          }}>
            {isRead ?
              <MarkUnreadIcon fontSize="small" sx={{ mr: 1.5, color: 'warning.main' }} /> :
              <MarkReadIcon fontSize="small" sx={{ mr: 1.5, color: 'success.main' }} />
            }
            <Typography variant="body2">
              {isRead ? 'Mark as unread' : 'Mark as read'}
            </Typography>
          </MenuItem>
        )}

        {isSender && (
          <>
            <MenuItem onClick={handleQuickEdit} sx={{
              py: 1.5,
              '&:hover': { bgcolor: 'action.hover' }
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'info.main' }} />
              <Typography variant="body2">Edit message</Typography>
            </MenuItem>

            <MenuItem onClick={handleDeleteClick} sx={{
              py: 1.5,
              color: 'error.main',
              '&:hover': { bgcolor: 'error.lighter' }
            }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
              <Typography variant="body2">Delete message</Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Reactions picker */}
      <Popover
        open={Boolean(reactionsAnchorEl)}
        anchorEl={reactionsAnchorEl}
        onClose={handleReactionsClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{ mt: -1 }}
      >
        <Box sx={{ display: 'flex', p: 1 }}>
          {commonReactions.map(emoji => (
            <Box
              key={emoji}
              onClick={() => handleReactionSelect(emoji)}
              sx={{
                p: 0.5,
                fontSize: '1.2rem',
                cursor: 'pointer',
                borderRadius: '50%',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'transform 0.2s',
                '&:active': {
                  transform: 'scale(0.9)',
                }
              }}
            >
              {emoji}
            </Box>
          ))}
        </Box>
      </Popover>

      {/* Reactions details */}
      <Popover
        open={Boolean(reactionsDetailsAnchorEl)}
        anchorEl={reactionsDetailsAnchorEl}
        onClose={handleReactionsDetailsClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: isSender ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: isSender ? 'left' : 'right',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            Reactions
          </Typography>

          <Grid container spacing={1} sx={{ mb: 1 }}>
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <Grid item key={emoji}>
                <Tooltip title={`${users.length} ${users.length === 1 ? 'person' : 'people'}`}>
                  <Badge badgeContent={users.length} color="primary">
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        fontSize: '1.2rem'
                      }}
                    >
                      {emoji}
                    </Box>
                  </Badge>
                </Tooltip>
              </Grid>
            ))}
          </Grid>

          <Typography variant="caption" color="text.secondary" gutterBottom>
            {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
          </Typography>

          <Box sx={{ mt: 1 }}>
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <Box key={emoji} sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                  {emoji} · {users.length}
                </Typography>
                <AvatarGroup max={5} sx={{ mt: 0.5 }}>
                  {users.map(user => (
                    <Tooltip key={user._id} title={user.username}>
                      <ProfilePicture
                        user={user}
                        linkToProfile={false}
                        size={{ width: 24, height: 24 }}
                      />
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            ))}
          </Box>
        </Box>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleDeleteCancel}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            <Typography variant="h6">Delete Message</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this message? This action cannot be undone.
          </Typography>
          <Box sx={{
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1,
            mt: 2,
            borderLeft: '4px solid',
            borderColor: 'primary.main'
          }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {message.text || 'Attachment'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<DeleteFilledIcon />}
            sx={{ ml: 1 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog
        open={showForwardDialog}
        onClose={handleForwardCancel}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ForwardFilledIcon color="primary" />
            <Typography variant="h6">Forward Message</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Forward this message to another conversation?
          </Typography>
          <Box sx={{
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1,
            mt: 2,
            borderLeft: '4px solid',
            borderColor: 'primary.main'
          }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {message.text || 'Attachment'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleForwardCancel}
            variant="outlined"
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleForwardConfirm}
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            sx={{ ml: 1 }}
          >
            Forward
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Feedback */}
      <Fade in={actionFeedback.show}>
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: actionFeedback.type === 'error' ? 'error.main' :
                    actionFeedback.type === 'success' ? 'success.main' :
                    actionFeedback.type === 'info' ? 'info.main' : 'primary.main',
            color: '#fff',
            px: 2,
            py: 0.75,
            borderRadius: 10,
            zIndex: 10,
            boxShadow: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {actionFeedback.type === 'success' && <CheckIcon fontSize="small" />}
          {actionFeedback.type === 'error' && <WarningIcon fontSize="small" />}
          <Typography variant="body2">{actionFeedback.message}</Typography>
        </Box>
      </Fade>
    </>
  );
};

export default MessageActions;
