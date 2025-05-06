import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  useTheme,
  alpha,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  HomeRounded as HomeIcon,
  NavigateNextRounded as NavigateNextIcon,
  HelpOutlineRounded as HelpIcon
} from '@mui/icons-material';
// import { motion } from 'framer-motion';
// Temporarily commented out until framer-motion is installed

/**
 * PageHeader - A modern, attractive header component for pages
 *
 * @param {Object} props
 * @param {string} props.title - The page title
 * @param {string} props.subtitle - The page subtitle or description
 * @param {React.ReactNode} props.icon - Icon to display next to the title
 * @param {React.ReactNode} props.action - Action component to display (e.g., button)
 * @param {Array} props.breadcrumbs - Array of breadcrumb items [{label, path, icon}]
 * @param {string} props.helpText - Help text to display in a tooltip
 * @param {boolean} props.gradient - Whether to use gradient background
 * @param {string} props.tag - Optional tag to display (e.g., "New", "Beta")
 * @param {string} props.tagColor - Color of the tag (primary, secondary, error, etc.)
 * @param {boolean} props.disableAnimation - Whether to disable animations
 * @param {Object} props.sx - Additional styles
 */
const PageHeader = ({
  title,
  subtitle,
  icon,
  action,
  breadcrumbs = [],
  helpText,
  gradient = false,
  tag,
  tagColor = 'primary',
  disableAnimation = false,
  sx = {},
}) => {
  const theme = useTheme();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  };

  const renderContent = () => (
    <>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        // Temporarily using a regular div until framer-motion is installed
        <div>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 1.5 }}
          >
            <Link
              component={RouterLink}
              to="/"
              color="inherit"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
            >
              <HomeIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
              Home
            </Link>

            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return isLast ? (
                <Typography
                  key={index}
                  color="text.primary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 500,
                  }}
                >
                  {crumb.icon && (
                    <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                      {crumb.icon}
                    </Box>
                  )}
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={index}
                  component={RouterLink}
                  to={crumb.path}
                  color="inherit"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  {crumb.icon && (
                    <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                      {crumb.icon}
                    </Box>
                  )}
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        </div>
      )}

      {/* Title and Actions Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Temporarily using a regular div until framer-motion is installed */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Title with Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && (
              <Box
                sx={{
                  mr: 2,
                  display: 'flex',
                  color: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {icon}
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                  lineHeight: 1.2,
                  background: gradient
                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    : 'inherit',
                  backgroundClip: gradient ? 'text' : 'inherit',
                  WebkitBackgroundClip: gradient ? 'text' : 'inherit',
                  WebkitTextFillColor: gradient ? 'transparent' : 'inherit',
                  textFillColor: gradient ? 'transparent' : 'inherit',
                }}
              >
                {title}
              </Typography>

              {tag && (
                <Chip
                  label={tag}
                  color={tagColor}
                  size="small"
                  sx={{
                    ml: 2,
                    fontWeight: 'bold',
                    height: 24,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${theme.palette[tagColor].main}, ${theme.palette[tagColor].dark})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(theme.palette[tagColor].main, 0.3)}`,
                  }}
                />
              )}

              {helpText && (
                <Tooltip
                  title={helpText}
                  arrow
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
                        color: theme.palette.text.primary,
                        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(99, 102, 241, 0.2)',
                        borderRadius: 2,
                        p: 1.5,
                        maxWidth: 300,
                        backdropFilter: 'blur(8px)',
                        '& .MuiTooltip-arrow': {
                          color: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha(theme.palette.background.paper, 0.9),
                        }
                      }
                    }
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      ml: 1,
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      }
                    }}
                  >
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </div>

        {/* Action Buttons */}
        {action && (
          // Temporarily using a regular div until framer-motion is installed
          <div>
            {action}
          </div>
        )}
      </Box>

      {/* Subtitle */}
      {subtitle && (
        // Temporarily using a regular div until framer-motion is installed
        <div>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{
              mt: 1,
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
              maxWidth: '800px',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </Typography>
        </div>
      )}
    </>
  );

  return (
    // Temporarily using a regular div until framer-motion is installed
    <div
      style={{
        opacity: disableAnimation ? 1 : 1,
        transition: 'opacity 0.5s ease',
      }}
      sx={{
        mb: 4,
        ...sx
      }}
    >
      {renderContent()}
    </div>
  );
};

export default PageHeader;
