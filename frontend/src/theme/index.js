import { createTheme, alpha } from '@mui/material/styles';

// Define custom animations
const animations = {
  fadeIn: '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }',
  slideUp: '@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }',
  pulse: '@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }',
  shimmer: '@keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }',
  rotate: '@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
  bounce: '@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }',
};

// Common theme settings
const commonSettings = {
  typography: {
    fontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.01em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0.01em',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.01em',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy effect
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
  // Global animations
  animations,
};

// Light theme
export const lightTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#fff',
    },
    secondary: {
      main: '#EC4899', // Pink
      light: '#F472B6',
      dark: '#DB2777',
      contrastText: '#fff',
    },
    tertiary: {
      main: '#14B8A6', // Teal
      light: '#2DD4BF',
      dark: '#0D9488',
      contrastText: '#fff',
    },
    accent: {
      main: '#F59E0B', // Amber
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#fff',
    },
    error: {
      main: '#EF4444', // Red
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#fff',
    },
    warning: {
      main: '#F97316', // Orange
      light: '#FB923C',
      dark: '#EA580C',
      contrastText: '#fff',
    },
    info: {
      main: '#3B82F6', // Blue
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#fff',
    },
    success: {
      main: '#10B981', // Emerald
      light: '#34D399',
      dark: '#059669',
      contrastText: '#fff',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      A100: '#F3F4F6',
      A200: '#E5E7EB',
      A400: '#9CA3AF',
      A700: '#374151',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
      chat: '#ECFDF5', // Mint green for chat areas
      dark: '#111827',
      light: '#F9FAFB',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
      subtle: '#F3F4F6',
    },
    text: {
      primary: '#1F2937',
      secondary: '#4B5563',
      disabled: '#9CA3AF',
      hint: '#6B7280',
    },
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(99, 102, 241, 0.04)',
      selected: 'rgba(99, 102, 241, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      focus: 'rgba(99, 102, 241, 0.12)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 400,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
    caption: {
      fontSize: '0.75rem',
    },
    overline: {
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        '@global': {
          ...Object.values(theme.animations).join('\n'),
          body: {
            transition: 'background-color 0.3s ease',
          },
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.05),
            borderRadius: '10px',
          },
          '::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.2) : alpha(theme.palette.common.black, 0.2),
            borderRadius: '10px',
            '&:hover': {
              background: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.3) : alpha(theme.palette.common.black, 0.3),
            },
          },
        },
      }),
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 20px',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.3s ease',
          },
          '&:hover::before': {
            transform: 'translateX(0)',
          },
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
            transform: 'translateY(-3px)',
          },
          '&:active': {
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            transform: 'translateY(-3px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
          },
        },
        text: {
          '&:hover': {
            transform: 'translateY(-2px)',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #DB2777 0%, #E879F9 100%)',
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 30px rgba(99, 102, 241, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
        },
        elevation4: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
        },
        elevation6: {
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.16)',
        },
        elevation8: {
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
        },
        elevation12: {
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)',
        },
        elevation16: {
          boxShadow: '0 24px 56px rgba(0, 0, 0, 0.22)',
        },
        elevation24: {
          boxShadow: '0 28px 64px rgba(0, 0, 0, 0.24)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.3s ease',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
            },
            '&:hover': {
              borderColor: '#6366F1',
            },
          },
          '& .MuiInputLabel-root': {
            transition: 'all 0.3s ease',
          },
          '& .MuiInputBase-input': {
            padding: '14px 16px',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.3s ease',
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
          },
        },
        input: {
          '&::placeholder': {
            opacity: 0.7,
            transition: 'opacity 0.3s ease',
          },
          '&:focus::placeholder': {
            opacity: 0.4,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#FFFFFF', 0.85),
          backgroundImage: 'none',
          '& .MuiToolbar-root': {
            minHeight: '64px',
          },
        },
        colorDefault: {
          backgroundColor: alpha('#FFFFFF', 0.85),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)',
          backgroundImage: 'none',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          transition: 'all 0.3s ease',
          '&.Mui-selected': {
            backgroundColor: alpha('#6366F1', 0.08),
            '&:hover': {
              backgroundColor: alpha('#6366F1', 0.12),
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '25%',
              height: '50%',
              width: 4,
              borderRadius: '0 4px 4px 0',
              backgroundColor: '#6366F1',
            },
          },
          '&:hover': {
            backgroundColor: alpha('#6366F1', 0.04),
            transform: 'translateX(4px)',
          },
        },
        button: {
          '&:hover': {
            backgroundColor: alpha('#6366F1', 0.04),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: 'inherit',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #FFFFFF',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
          },
        },
        colorDefault: {
          backgroundColor: '#6366F1',
          color: '#FFFFFF',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          color: '#FFFFFF',
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
          color: '#FFFFFF',
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
        deleteIcon: {
          color: 'inherit',
          opacity: 0.7,
          '&:hover': {
            opacity: 1,
            color: 'inherit',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
          backgroundImage: 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: 24,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'visible',
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: 3,
          },
        },
        indicator: {
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: 'auto',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          borderRadius: 12,
          padding: '12px 16px',
          '&.Mui-selected': {
            color: '#6366F1',
          },
          '&:hover': {
            backgroundColor: alpha('#6366F1', 0.04),
            color: '#6366F1',
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 'bold',
          borderRadius: 8,
          padding: '0 6px',
          minWidth: 20,
          height: 20,
          fontSize: '0.75rem',
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
        },
        colorError: {
          background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 12px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(4px)',
          background: alpha('#1F2937', 0.9),
        },
        arrow: {
          color: alpha('#1F2937', 0.9),
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 6,
          backgroundColor: alpha('#6366F1', 0.12),
        },
        bar: {
          borderRadius: 8,
          background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        circle: {
          strokeLinecap: 'round',
        },
        colorPrimary: {
          color: '#6366F1',
        },
        colorSecondary: {
          color: '#EC4899',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
          width: 58,
          height: 38,
        },
        switchBase: {
          padding: 11,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: '#6366F1',
            },
          },
        },
        thumb: {
          width: 16,
          height: 16,
          boxShadow: 'none',
          backgroundColor: '#FFFFFF',
        },
        track: {
          opacity: 1,
          borderRadius: 13,
          backgroundColor: '#E5E7EB',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#000000', 0.08),
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'all 0.3s ease',
          position: 'relative',
          '&:hover': {
            textDecoration: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: 2,
            bottom: -2,
            left: 0,
            backgroundColor: 'currentColor',
            transform: 'scaleX(0)',
            transformOrigin: 'right',
            transition: 'transform 0.3s ease',
          },
          '&:hover::after': {
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha('#FFFFFF', 0.9),
          padding: '8px 0',
          minWidth: 180,
        },
        list: {
          padding: '8px 0',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          padding: '10px 16px',
          borderRadius: 8,
          margin: '2px 8px',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: alpha('#6366F1', 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#6366F1', 0.12),
            '&:hover': {
              backgroundColor: alpha('#6366F1', 0.16),
            },
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0 16px',
          minHeight: 56,
          '&.Mui-expanded': {
            minHeight: 56,
          },
        },
        content: {
          margin: '12px 0',
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '8px 16px 16px',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          borderRadius: 12,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        rectangular: {
          borderRadius: 12,
        },
        circular: {
          borderRadius: '50%',
        },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: 'dark',
    primary: {
      main: '#818CF8', // Lighter Indigo for dark mode
      light: '#A5B4FC',
      dark: '#6366F1',
      contrastText: '#fff',
    },
    secondary: {
      main: '#F472B6', // Lighter Pink for dark mode
      light: '#F9A8D4',
      dark: '#EC4899',
      contrastText: '#fff',
    },
    tertiary: {
      main: '#2DD4BF', // Lighter Teal for dark mode
      light: '#5EEAD4',
      dark: '#14B8A6',
      contrastText: '#fff',
    },
    accent: {
      main: '#FBBF24', // Lighter Amber for dark mode
      light: '#FCD34D',
      dark: '#F59E0B',
      contrastText: '#111827',
    },
    error: {
      main: '#F87171', // Lighter Red for dark mode
      light: '#FCA5A5',
      dark: '#EF4444',
      contrastText: '#fff',
    },
    warning: {
      main: '#FB923C', // Lighter Orange for dark mode
      light: '#FDBA74',
      dark: '#F97316',
      contrastText: '#111827',
    },
    info: {
      main: '#60A5FA', // Lighter Blue for dark mode
      light: '#93C5FD',
      dark: '#3B82F6',
      contrastText: '#fff',
    },
    success: {
      main: '#34D399', // Lighter Emerald for dark mode
      light: '#6EE7B7',
      dark: '#10B981',
      contrastText: '#111827',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      A100: '#F3F4F6',
      A200: '#E5E7EB',
      A400: '#9CA3AF',
      A700: '#374151',
    },
    background: {
      default: '#0F172A', // Slate 900
      paper: '#1E293B', // Slate 800
      chat: '#064E3B', // Dark teal for chat areas
      dark: '#0F172A',
      light: '#1E293B',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)',
      subtle: '#1E293B',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#E5E7EB',
      disabled: '#9CA3AF',
      hint: '#D1D5DB',
    },
    action: {
      active: 'rgba(255, 255, 255, 0.8)',
      hover: 'rgba(129, 140, 248, 0.12)',
      selected: 'rgba(129, 140, 248, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      focus: 'rgba(129, 140, 248, 0.24)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        '@global': {
          ...Object.values(theme.animations).join('\n'),
          body: {
            transition: 'background-color 0.3s ease',
          },
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: alpha(theme.palette.common.white, 0.05),
            borderRadius: '10px',
          },
          '::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.common.white, 0.2),
            borderRadius: '10px',
            '&:hover': {
              background: alpha(theme.palette.common.white, 0.3),
            },
          },
        },
      }),
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 20px',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.3s ease',
          },
          '&:hover::before': {
            transform: 'translateX(0)',
          },
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(129, 140, 248, 0.4)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(129, 140, 248, 0.6)',
            transform: 'translateY(-3px)',
          },
          '&:active': {
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            transform: 'translateY(-3px)',
            boxShadow: '0 4px 12px rgba(129, 140, 248, 0.3)',
          },
        },
        text: {
          '&:hover': {
            transform: 'translateY(-2px)',
            backgroundColor: 'rgba(129, 140, 248, 0.12)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #818CF8 0%, #A5B4FC 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #F472B6 0%, #F9A8D4 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden',
          background: '#1E293B',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 30px rgba(129, 140, 248, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1E293B',
        },
        rounded: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        },
        elevation3: {
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
        },
        elevation4: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#0F172A', 0.85),
          backgroundImage: 'none',
        },
        colorDefault: {
          backgroundColor: alpha('#0F172A', 0.85),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)',
          backgroundImage: 'none',
          background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          transition: 'all 0.3s ease',
          '&.Mui-selected': {
            backgroundColor: alpha('#818CF8', 0.16),
            '&:hover': {
              backgroundColor: alpha('#818CF8', 0.24),
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '25%',
              height: '50%',
              width: 4,
              borderRadius: '0 4px 4px 0',
              backgroundColor: '#818CF8',
            },
          },
          '&:hover': {
            backgroundColor: alpha('#818CF8', 0.08),
            transform: 'translateX(4px)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #1E293B',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
        },
        colorDefault: {
          backgroundColor: '#818CF8',
          color: '#FFFFFF',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-2px)',
          },
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #818CF8 0%, #A5B4FC 100%)',
          color: '#FFFFFF',
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, #F472B6 0%, #F9A8D4 100%)',
          color: '#FFFFFF',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 12px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          background: alpha('#F9FAFB', 0.9),
          color: '#0F172A',
        },
        arrow: {
          color: alpha('#F9FAFB', 0.9),
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 6,
          backgroundColor: alpha('#818CF8', 0.16),
        },
        bar: {
          borderRadius: 8,
          background: 'linear-gradient(90deg, #818CF8 0%, #A5B4FC 100%)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha('#1E293B', 0.9),
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          padding: '10px 16px',
          borderRadius: 8,
          margin: '2px 8px',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: alpha('#818CF8', 0.16),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#818CF8', 0.24),
            '&:hover': {
              backgroundColor: alpha('#818CF8', 0.32),
            },
          },
        },
      },
    },
  },
});

// Default theme (for backward compatibility)
const theme = lightTheme;

export default theme;
