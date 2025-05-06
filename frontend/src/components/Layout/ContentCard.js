import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Chip
} from '@mui/material';
// import { motion } from 'framer-motion';
// Temporarily commented out until framer-motion is installed
import {
  MoreVertRounded as MoreIcon,
  FavoriteRounded as HeartIcon,
  BookmarkRounded as BookmarkIcon,
  ShareRounded as ShareIcon
} from '@mui/icons-material';

/**
 * ContentCard - A modern, interactive card component for displaying content
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to display
 * @param {React.ReactNode} props.title - The card title
 * @param {React.ReactNode} props.subtitle - The card subtitle
 * @param {React.ReactNode} props.icon - Icon to display next to the title
 * @param {React.ReactNode} props.action - Action component to display in the header
 * @param {React.ReactNode} props.footer - Footer content
 * @param {boolean} props.elevated - Whether to use elevated styling
 * @param {boolean} props.interactive - Whether to add hover effects
 * @param {boolean} props.gradient - Whether to use gradient background
 * @param {string} props.gradientColors - Gradient colors (if gradient is true)
 * @param {boolean} props.disableAnimation - Whether to disable animations
 * @param {boolean} props.disableHeader - Whether to hide the header
 * @param {boolean} props.disablePadding - Whether to disable padding
 * @param {boolean} props.disableDivider - Whether to disable the divider between header and content
 * @param {boolean} props.favorite - Whether the card is favorited
 * @param {boolean} props.bookmarked - Whether the card is bookmarked
 * @param {function} props.onFavorite - Callback when favorite button is clicked
 * @param {function} props.onBookmark - Callback when bookmark button is clicked
 * @param {function} props.onShare - Callback when share button is clicked
 * @param {function} props.onMoreClick - Callback when more button is clicked
 * @param {Object} props.sx - Additional styles for the card
 */
const ContentCard = ({
  children,
  title,
  subtitle,
  icon,
  action,
  footer,
  elevated = false,
  interactive = true,
  gradient = false,
  gradientColors,
  disableAnimation = false,
  disableHeader = false,
  disablePadding = false,
  disableDivider = false,
  favorite = false,
  bookmarked = false,
  onFavorite,
  onBookmark,
  onShare,
  onMoreClick,
  sx = {},
}) => {
  const theme = useTheme();
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle mouse movement for 3D effect
  const handleMouseMove = (e) => {
    if (!cardRef.current || !interactive) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) - 0.5;
    const y = ((e.clientY - rect.top) / rect.height) - 0.5;

    setMousePosition({ x, y });
  };

  // Default gradient colors based on theme
  const defaultGradient = theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)}, ${alpha(theme.palette.background.paper, 0.4)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.background.paper, 0.7)})`;

  // Card animation variants
  const cardVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1]
      }
    },
    hover: {
      scale: interactive ? 1.02 : 1,
      y: interactive ? -5 : 0,
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  };

  return (
    // Temporarily using a regular div until framer-motion is installed
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      style={{
        width: '100%',
        opacity: disableAnimation ? 1 : (isHovered ? 1 : 0.98),
        transform: `translateY(${disableAnimation ? 0 : (isHovered ? -5 : 0)}px) scale(${disableAnimation ? 1 : (isHovered ? 1.02 : 1)})`,
        transition: 'opacity 0.4s ease, transform 0.3s ease',
      }}
    >
      <Paper
        elevation={elevated ? 8 : 0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: gradient
            ? gradientColors || defaultGradient
            : 'transparent',
          bgcolor: theme => !gradient && (theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.8)
            : theme.palette.background.paper),
          backdropFilter: 'blur(10px)',
          boxShadow: theme => elevated
            ? (theme.palette.mode === 'dark'
              ? '0 16px 40px rgba(0, 0, 0, 0.3)'
              : '0 16px 40px rgba(99, 102, 241, 0.15)')
            : (theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0, 0, 0, 0.2)'
              : '0 8px 24px rgba(99, 102, 241, 0.1)'),
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&::before': interactive ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 0,
            pointerEvents: 'none',
          } : {},
          ...sx
        }}
      >
        {/* Card Header */}
        {!disableHeader && (title || subtitle || icon || action) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: disablePadding ? 2 : 3,
              pb: disablePadding ? 1 : 2,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {icon && (
                <Box
                  sx={{
                    mr: 2,
                    display: 'flex',
                    color: 'primary.main'
                  }}
                >
                  {icon}
                </Box>
              )}

              <Box>
                {title && (
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      fontSize: '1.1rem',
                      lineHeight: 1.2,
                      mb: subtitle ? 0.5 : 0
                    }}
                  >
                    {title}
                  </Typography>
                )}

                {subtitle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.85rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {action}

              {onFavorite && (
                <Tooltip title={favorite ? "Remove from favorites" : "Add to favorites"}>
                  <IconButton
                    size="small"
                    onClick={onFavorite}
                    sx={{
                      color: favorite ? 'error.main' : 'text.secondary',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <HeartIcon
                      fontSize="small"
                      sx={{
                        animation: favorite ? 'heartBeat 1.5s infinite' : 'none',
                        '@keyframes heartBeat': {
                          '0%': { transform: 'scale(1)' },
                          '14%': { transform: 'scale(1.3)' },
                          '28%': { transform: 'scale(1)' },
                          '42%': { transform: 'scale(1.3)' },
                          '70%': { transform: 'scale(1)' },
                        }
                      }}
                    />
                  </IconButton>
                </Tooltip>
              )}

              {onBookmark && (
                <Tooltip title={bookmarked ? "Remove from saved" : "Save"}>
                  <IconButton
                    size="small"
                    onClick={onBookmark}
                    sx={{
                      color: bookmarked ? 'primary.main' : 'text.secondary',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <BookmarkIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {onShare && (
                <Tooltip title="Share">
                  <IconButton
                    size="small"
                    onClick={onShare}
                    sx={{
                      color: 'text.secondary',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1) rotate(15deg)',
                        color: 'info.main',
                      },
                    }}
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {onMoreClick && (
                <Tooltip title="More options">
                  <IconButton
                    size="small"
                    onClick={onMoreClick}
                    sx={{
                      color: 'text.secondary',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}

        {/* Divider */}
        {!disableHeader && !disableDivider && (title || subtitle || icon || action) && (
          <Divider sx={{ opacity: 0.6 }} />
        )}

        {/* Card Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: disablePadding ? 0 : 3,
            pt: disablePadding || disableHeader ? 0 : 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children}
        </Box>

        {/* Card Footer */}
        {footer && (
          <>
            {!disableDivider && <Divider sx={{ opacity: 0.6 }} />}
            <Box
              sx={{
                p: disablePadding ? 2 : 3,
                pt: disablePadding ? 1 : 2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {footer}
            </Box>
          </>
        )}
      </Paper>
    </div>
  );
};

export default ContentCard;
