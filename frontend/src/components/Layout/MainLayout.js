import React, { useState, useEffect } from 'react';
import { Box, Paper, Container, useTheme, alpha, useMediaQuery } from '@mui/material';
// import { motion } from 'framer-motion';
// Temporarily commented out until framer-motion is installed

/**
 * MainLayout - A modern, responsive layout component for content pages
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to display
 * @param {boolean} props.fullWidth - Whether to use full width container
 * @param {string} props.maxWidth - Max width of the container ('xs', 'sm', 'md', 'lg', 'xl')
 * @param {boolean} props.disablePadding - Whether to disable padding
 * @param {boolean} props.disableAnimation - Whether to disable entrance animation
 * @param {boolean} props.disablePaper - Whether to disable the Paper wrapper
 * @param {Object} props.paperProps - Additional props for the Paper component
 * @param {Object} props.containerProps - Additional props for the Container component
 * @param {Object} props.sx - Additional styles for the root Box component
 */
const MainLayout = ({
  children,
  fullWidth = false,
  maxWidth = 'lg',
  disablePadding = false,
  disableAnimation = false,
  disablePaper = false,
  paperProps = {},
  containerProps = {},
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isVisible, setIsVisible] = useState(false);

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  };

  // Set visibility after a short delay to ensure smooth animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Render the content with or without animation
  const renderContent = () => {
    const content = disablePaper ? (
      children
    ) : (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: theme => theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.8)
            : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.2)'
            : '0 8px 32px rgba(99, 102, 241, 0.1)',
          p: disablePadding ? 0 : { xs: 2, sm: 3, md: 4 },
          ...paperProps.sx
        }}
        {...paperProps}
      >
        {children}
      </Paper>
    );

    if (disableAnimation) {
      return content;
    }

    return (
      // <motion.div
      //   initial="hidden"
      //   animate={isVisible ? "visible" : "hidden"}
      //   variants={containerVariants}
      //   style={{ width: '100%' }}
      // >
      //   {content}
      // </motion.div>
      // Temporarily using a regular div until framer-motion is installed
      <div style={{ width: '100%', opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        {content}
      </div>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        py: { xs: 2, sm: 3, md: 4 },
        ...sx
      }}
    >
      {fullWidth ? (
        renderContent()
      ) : (
        <Container
          maxWidth={maxWidth}
          disableGutters={isMobile || disablePadding}
          sx={{
            ...containerProps.sx
          }}
          {...containerProps}
        >
          {renderContent()}
        </Container>
      )}
    </Box>
  );
};

export default MainLayout;
