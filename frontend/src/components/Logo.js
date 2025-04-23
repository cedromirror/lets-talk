import React from 'react';
import { Typography, Box, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * Logo component for the Let's Talk application
 * @param {Object} props - Component props
 * @param {number} props.size - Size of the logo (default: 40)
 * @param {boolean} props.withText - Whether to show the text next to the logo (default: true)
 * @param {string} props.color - Color of the logo (default: theme primary color)
 * @param {Object} props.sx - Additional styles for the container
 * @param {boolean} props.linkToHome - Whether the logo should link to home page (default: true)
 */
const Logo = ({ 
  size = 40, 
  withText = true, 
  color, 
  sx = {}, 
  linkToHome = true 
}) => {
  const theme = useTheme();
  const logoColor = color || theme.palette.primary.main;
  
  const logoContent = (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        ...sx
      }}
    >
      {/* Logo Circle */}
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          mr: withText ? 1.5 : 0
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: 'white',
            fontSize: size * 0.4,
            lineHeight: 1
          }}
        >
          LT
        </Typography>
      </Box>
      
      {/* Logo Text */}
      {withText && (
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}
        >
          Let's Talk
        </Typography>
      )}
    </Box>
  );
  
  // Return with or without link
  return linkToHome ? (
    <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex' }}>
      {logoContent}
    </Link>
  ) : (
    logoContent
  );
};

export default Logo;
