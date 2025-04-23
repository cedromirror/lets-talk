import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { ReplyOutlined as ReplyIcon } from '@mui/icons-material';

const MessageReply = ({ replyTo, isSender, onClick }) => {
  if (!replyTo || !replyTo.sender) return null;

  // Truncate long messages
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Get preview text based on message type
  const getPreviewText = () => {
    if (replyTo.text) {
      return truncateText(replyTo.text);
    } else if (replyTo.attachments && replyTo.attachments.length > 0) {
      const attachment = replyTo.attachments[0];
      if (attachment.type?.startsWith('image/')) {
        return '📷 Photo';
      } else if (attachment.type?.startsWith('video/')) {
        return '🎥 Video';
      } else if (attachment.type?.startsWith('audio/')) {
        return '🎵 Audio';
      } else {
        return '📎 File';
      }
    } else {
      return 'Message';
    }
  };

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        mb: 0.5,
        borderRadius: 1,
        bgcolor: isSender ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        maxWidth: '100%',
        overflow: 'hidden',
        borderLeft: '2px solid',
        borderColor: isSender ? 'primary.light' : 'secondary.light',
      }}
    >
      <ReplyIcon
        fontSize="small"
        sx={{
          mr: 1,
          color: isSender ? 'primary.light' : 'secondary.light',
          transform: 'scaleX(-1)'
        }}
      />

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 'medium',
            color: isSender ? 'primary.light' : 'secondary.main',
            display: 'block'
          }}
        >
          {replyTo.sender.username}
        </Typography>

        <Typography
          variant="caption"
          noWrap
          sx={{
            color: isSender ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
            display: 'block'
          }}
        >
          {getPreviewText()}
        </Typography>
      </Box>

      {replyTo.attachments && replyTo.attachments.length > 0 &&
       replyTo.attachments[0].type?.startsWith('image/') && (
        <Box
          component="img"
          src={replyTo.attachments[0].url}
          alt="Attachment"
          sx={{
            width: 30,
            height: 30,
            borderRadius: 0.5,
            objectFit: 'cover',
            ml: 1
          }}
        />
      )}
    </Paper>
  );
};

export default MessageReply;
