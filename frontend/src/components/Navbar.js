import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { searchService } from '../services/api';
import NotificationDropdown from './Notifications/NotificationDropdown';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  SearchRounded as SearchIcon,
  NotificationsRounded as NotificationsIcon,
  EmailRounded as MailIcon,
  AccountCircleRounded as AccountCircle,
  MoreVertRounded as MoreIcon,
  CloseRounded as CloseIcon,
  PersonRounded as PersonIcon,
  PhotoRounded as PhotoIcon,
  TagRounded as TagIcon,
  ArrowBackRounded as ArrowBackIcon,
  VerifiedRounded as VerifiedIcon,
  LogoutRounded as LogoutIcon,
  SettingsRounded as SettingsIcon,
  DashboardRounded as DashboardIcon
} from '@mui/icons-material';

// Simple profile picture component to avoid circular dependencies
const NavProfilePicture = ({ user, size = 'small', linkToProfile = false }) => {
  const [error, setError] = useState(false);

  // Get profile picture URL with fallbacks
  const getProfilePictureUrl = (user, size) => {
    if (!user) return '/assets/default-avatar.png';

    // Try different possible profile picture fields
    const avatarUrl = user.avatar || user.profilePicture || user.profile_picture || user.image;
    if (!avatarUrl) return '/assets/default-avatar.png';

    try {
      // Check if the avatar is a Cloudinary URL
      if (avatarUrl.includes('cloudinary.com')) {
        // Extract the base URL and transformation parts
        const parts = avatarUrl.split('/upload/');
        if (parts.length !== 2) return avatarUrl;

        // Add transformation based on size
        let transformation = '';
        switch (size) {
          case 'small':
            transformation = 'c_fill,g_face,h_40,w_40,q_auto:good/';
            break;
          case 'medium':
            transformation = 'c_fill,g_face,h_80,w_80,q_auto:good/';
            break;
          case 'large':
            transformation = 'c_fill,g_face,h_150,w_150,q_auto:good/';
            break;
          default:
            // If size is an object with width and height
            if (typeof size === 'object' && size.width && size.height) {
              const width = typeof size.width === 'object' ? 80 : size.width;
              const height = typeof size.height === 'object' ? 80 : size.height;
              transformation = `c_fill,g_face,h_${height},w_${width},q_auto:good/`;
            } else {
              transformation = 'c_fill,g_face,h_80,w_80,q_auto:good/';
            }
        }

        const url = `${parts[0]}/upload/${transformation}${parts[1]}`;

        // Add cache busting parameter
        const separator = url.includes('?') ? '&' : '?';
        const timestamp = user?.avatarTimestamp || Date.now();
        return `${url}${separator}t=${timestamp}`;
      }

      // If not a Cloudinary URL, return as is with cache busting
      const separator = avatarUrl.includes('?') ? '&' : '?';
      const timestamp = user?.avatarTimestamp || Date.now();
      return `${avatarUrl}${separator}t=${timestamp}`;
    } catch (error) {
      console.error('Error processing profile picture URL:', error);
      return avatarUrl || '/assets/default-avatar.png';
    }
  };

  // Handle image loading error
  const handleError = () => {
    setError(true);
  };

  // Determine avatar size
  let avatarSize = {};
  switch (size) {
    case 'small':
      avatarSize = { width: 32, height: 32 };
      break;
    case 'medium':
      avatarSize = { width: 40, height: 40 };
      break;
    case 'large':
      avatarSize = { width: 56, height: 56 };
      break;
    default:
      // If size is an object, use it directly
      if (typeof size === 'object') {
        avatarSize = size;
      } else {
        avatarSize = { width: 32, height: 32 };
      }
  }

  // Create the avatar element
  const avatarElement = (
    <Box sx={{ position: 'relative' }}>
      <Avatar
        src={error ? '/assets/default-avatar.png' : getProfilePictureUrl(user, size)}
        alt={user?.username || 'User'}
        onError={handleError}
        sx={{
          ...avatarSize,
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

      {user?.isVerified && (
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Box
              sx={{
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderRadius: '50%',
                width: avatarSize.width > 40 ? 18 : 16,
                height: avatarSize.width > 40 ? 18 : 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
                  '70%': { boxShadow: '0 0 0 6px rgba(99, 102, 241, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' }
                }
              }}
            >
              <VerifiedIcon sx={{ fontSize: avatarSize.width > 40 ? 12 : 10, color: 'white' }} />
            </Box>
          }
        >
          <Box /> {/* Empty box needed for badge positioning */}
        </Badge>
      )}
    </Box>
  );

  // If linkToProfile is true and username is provided, wrap in Link
  if (linkToProfile && user?.username) {
    return (
      <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
        {avatarElement}
      </Link>
    );
  }

  // Otherwise, return the avatar element directly
  return avatarElement;
};

const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedSearch, setExpandedSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);

  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);

  // Refs
  const searchRef = useRef(null);

  // Derived states
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  // Hide search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset search when changing routes
  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setExpandedSearch(false);
  }, [location.pathname]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if query is an email address
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchQuery);

    try {
      setIsSearching(true);
      setSelectedResultIndex(-1); // Reset selected result index
      const response = await searchService.searchAll(searchQuery);

      // Add a warning message if searching by email
      if (isEmail && response.data) {
        response.data.emailWarning = true;
      }

      setSearchResults(response.data);
      setShowSearchResults(true);
      setIsSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length > 2) {
      handleSearch();
    } else if (e.target.value.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
    setSelectedResultIndex(-1); // Reset selected result index when typing
  };

  const handleSearchInputFocus = () => {
    // Show search results if we have any
    if (searchResults.length > 0) {
      setShowSearchResults(true);
    } else {
      // Show empty search results with helper message
      setShowSearchResults(true);
    }
  };

  // Handle keyboard navigation for search results
  const handleSearchKeyDown = (e) => {
    if (!showSearchResults) return;

    // Get all filterable results based on active filter
    const getFilteredResults = () => {
      if (activeFilter === 'all') {
        return [
          ...(searchResults.users || []),
          ...(searchResults.posts || []),
          ...(searchResults.reels || []),
          ...(searchResults.products || []),
          ...(searchResults.tags || [])
        ];
      }
      return searchResults[activeFilter] || [];
    };

    const results = getFilteredResults();
    const maxIndex = results.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedResultIndex(prev => (prev < maxIndex ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
        break;
      case 'Enter':
        if (selectedResultIndex >= 0 && selectedResultIndex <= maxIndex) {
          e.preventDefault();
          const selected = results[selectedResultIndex];

          // Navigate based on result type
          if (selected.username) { // User
            navigate(`/profile/${selected.username}`);
          } else if (selected.caption) { // Post or Reel
            navigate(selected.video ? `/reel/${selected._id}` : `/post/${selected._id}`);
          } else if (selected.name && selected.price) { // Product
            navigate(`/shop/product/${selected._id}`);
          } else if (selected.name) { // Tag
            navigate(`/explore/tags/${selected.name}`);
          }

          setShowSearchResults(false);
        }
        break;
      case 'Escape':
        setShowSearchResults(false);
        break;
      default:
        break;
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const handleToggleSearch = () => {
    setExpandedSearch(!expandedSearch);
    if (!expandedSearch) {
      setTimeout(() => {
        const searchInput = document.querySelector('#search-input');
        if (searchInput) searchInput.focus();
      }, 100);
    }
  };

  // Profile menu
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 8,
        sx: {
          mt: 1.5,
          borderRadius: 3,
          minWidth: 220,
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
      <Box sx={{
        px: 2,
        pt: 2,
        pb: 1.5,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <NavProfilePicture
          user={currentUser}
          size="medium"
          linkToProfile={false}
        />
        <Box sx={{ ml: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {currentUser?.username || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {currentUser?.email || 'user@example.com'}
          </Typography>
        </Box>
      </Box>

      <MenuItem
        component={Link}
        to={`/profile/${currentUser?.username}`}
        onClick={handleMenuClose}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 2,
          mx: 1,
          mt: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
            transform: 'translateX(4px)'
          }
        }}
      >
        <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="body2">Profile</Typography>
      </MenuItem>

      <MenuItem
        component={Link}
        to="/dashboard"
        onClick={handleMenuClose}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 2,
          mx: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme => alpha(theme.palette.tertiary.main, 0.08),
            transform: 'translateX(4px)'
          }
        }}
      >
        <DashboardIcon sx={{ mr: 2, color: 'tertiary.main' }} />
        <Typography variant="body2">Dashboard</Typography>
      </MenuItem>

      <MenuItem
        component={Link}
        to="/settings"
        onClick={handleMenuClose}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 2,
          mx: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme => alpha(theme.palette.info.main, 0.08),
            transform: 'translateX(4px)'
          }
        }}
      >
        <SettingsIcon sx={{ mr: 2, color: 'info.main' }} />
        <Typography variant="body2">Settings</Typography>
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      <MenuItem
        onClick={handleLogout}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 2,
          mx: 1,
          mb: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme => alpha(theme.palette.error.main, 0.08),
            transform: 'translateX(4px)'
          }
        }}
      >
        <LogoutIcon sx={{ mr: 2, color: 'error.main' }} />
        <Typography variant="body2" color="error.main">Logout</Typography>
      </MenuItem>
    </Menu>
  );

  // Mobile menu
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
      PaperProps={{
        elevation: 8,
        sx: {
          mt: 1.5,
          borderRadius: 3,
          minWidth: 220,
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
        onClick={() => {
          handleMobileMenuClose();
          navigate('/notifications');
        }}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 2,
          mx: 1,
          mt: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme => alpha(theme.palette.error.main, 0.08),
            transform: 'translateX(4px)'
          }
        }}
      >
        <Box sx={{
          mr: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: theme => alpha(theme.palette.error.main, 0.1),
        }}>
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 20,
                minWidth: 20,
                padding: '0 6px',
                borderRadius: '10px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)'
                  : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              }
            }}
          >
            <NotificationsIcon sx={{ color: 'error.main' }} />
          </Badge>
        </Box>
        <Typography variant="body2">Notifications</Typography>
      </MenuItem>

      <MenuItem
        onClick={() => {
          handleMobileMenuClose();
          navigate('/messages');
        }}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 2,
          mx: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
            transform: 'translateX(4px)'
          }
        }}
      >
        <Box sx={{
          mr: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
        }}>
          <Badge
            badgeContent={currentUser?.unreadMessages || 0}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 20,
                minWidth: 20,
                padding: '0 6px',
                borderRadius: '10px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)'
                  : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              }
            }}
          >
            <MailIcon sx={{ color: 'primary.main' }} />
          </Badge>
        </Box>
        <Typography variant="body2">Messages</Typography>
      </MenuItem>

      <MenuItem
        onClick={handleProfileMenuOpen}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 2,
          mx: 1,
          mb: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme => alpha(theme.palette.secondary.main, 0.08),
            transform: 'translateX(4px)'
          }
        }}
      >
        <Box sx={{
          mr: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: theme => alpha(theme.palette.secondary.main, 0.1),
        }}>
          <NavProfilePicture
            user={currentUser}
            size={{ width: 32, height: 32 }}
            linkToProfile={false}
          />
        </Box>
        <Typography variant="body2">Profile</Typography>
      </MenuItem>
    </Menu>
  );

  // Search results
  const renderSearchResults = () => {
    if (!showSearchResults) return null;

    // Check if we have any results
    const hasResults = (
      (searchResults.users && searchResults.users.length > 0) ||
      (searchResults.posts && searchResults.posts.length > 0) ||
      (searchResults.reels && searchResults.reels.length > 0) ||
      (searchResults.products && searchResults.products.length > 0) ||
      (searchResults.tags && searchResults.tags.length > 0)
    );

    // Get all results for keyboard navigation
    const getAllResults = () => {
      return [
        ...(searchResults.users || []),
        ...(searchResults.posts || []),
        ...(searchResults.reels || []),
        ...(searchResults.products || []),
        ...(searchResults.tags || [])
      ];
    };

    // Get filtered results based on active filter
    const getFilteredResults = (type) => {
      if (activeFilter === 'all' || activeFilter === type) {
        return searchResults[type] || [];
      }
      return [];
    };

    return (
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          mt: 1.5,
          borderRadius: 3,
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 1200,
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 12px 32px rgba(0, 0, 0, 0.4)'
            : '0 12px 32px rgba(99, 102, 241, 0.2)',
          backdropFilter: 'blur(8px)',
          backgroundColor: theme => theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.9)
            : alpha(theme.palette.background.paper, 0.95),
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme => alpha(theme.palette.primary.main, 0.2),
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme => alpha(theme.palette.primary.main, 0.4),
          },
        }}
      >
        {isSearching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : hasResults ? (
          <Box sx={{ p: 2 }}>
            {/* Email warning message */}
            {searchResults.emailWarning && (
              <Box sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'warning.light',
                color: 'warning.dark',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <SearchIcon fontSize="small" />
                <Typography variant="body2">
                  <strong>Tip:</strong> You're searching with an email address. For better results, try searching by username instead. Username search is the most reliable way to find users.
                </Typography>
              </Box>
            )}
            {/* Search Filters */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 1 }}>
              <Chip
                label="All"
                onClick={() => setActiveFilter('all')}
                color={activeFilter === 'all' ? 'primary' : 'default'}
                variant={activeFilter === 'all' ? 'filled' : 'outlined'}
              />
              {searchResults.users && searchResults.users.length > 0 && (
                <Chip
                  label={`People (${searchResults.users.length})`}
                  onClick={() => setActiveFilter('users')}
                  color={activeFilter === 'users' ? 'primary' : 'default'}
                  variant={activeFilter === 'users' ? 'filled' : 'outlined'}
                />
              )}
              {searchResults.posts && searchResults.posts.length > 0 && (
                <Chip
                  label={`Posts (${searchResults.posts.length})`}
                  onClick={() => setActiveFilter('posts')}
                  color={activeFilter === 'posts' ? 'primary' : 'default'}
                  variant={activeFilter === 'posts' ? 'filled' : 'outlined'}
                />
              )}
              {searchResults.reels && searchResults.reels.length > 0 && (
                <Chip
                  label={`Reels (${searchResults.reels.length})`}
                  onClick={() => setActiveFilter('reels')}
                  color={activeFilter === 'reels' ? 'primary' : 'default'}
                  variant={activeFilter === 'reels' ? 'filled' : 'outlined'}
                />
              )}
              {searchResults.products && searchResults.products.length > 0 && (
                <Chip
                  label={`Products (${searchResults.products.length})`}
                  onClick={() => setActiveFilter('products')}
                  color={activeFilter === 'products' ? 'primary' : 'default'}
                  variant={activeFilter === 'products' ? 'filled' : 'outlined'}
                />
              )}
              {searchResults.tags && searchResults.tags.length > 0 && (
                <Chip
                  label={`Tags (${searchResults.tags.length})`}
                  onClick={() => setActiveFilter('tags')}
                  color={activeFilter === 'tags' ? 'primary' : 'default'}
                  variant={activeFilter === 'tags' ? 'filled' : 'outlined'}
                />
              )}
            </Box>

            {/* Users */}
            {getFilteredResults('users').length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  People
                </Typography>
                <List disablePadding>
                  {getFilteredResults('users').map((user, index) => {
                    // Calculate the overall index for keyboard navigation
                    const allResults = getAllResults();
                    const overallIndex = allResults.findIndex(item => item._id === user._id);
                    const isSelected = selectedResultIndex === overallIndex;

                    return (
                      <ListItem
                        key={user._id}
                        button
                        component={Link}
                        to={`/profile/${user.username}`}
                        onClick={() => setShowSearchResults(false)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: isSelected ? 'action.selected' : 'transparent'
                        }}
                      >
                        <ListItemAvatar>
                          <NavProfilePicture
                            user={user}
                            size="small"
                            linkToProfile={false}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography
                                variant="body1"
                                component="span"
                                sx={{
                                  fontWeight: searchQuery && user.username.toLowerCase() === searchQuery.toLowerCase() ? 'bold' : 'normal',
                                  color: searchQuery && user.username.toLowerCase() === searchQuery.toLowerCase() ? 'primary.main' : 'text.primary'
                                }}
                              >
                                {user.username}
                              </Typography>
                              {searchQuery && user.username.toLowerCase() === searchQuery.toLowerCase() && (
                                <Chip
                                  size="small"
                                  label="Exact match"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              {user.fullName}
                              {user.isVerified && (
                                <Box component="span" sx={{ ml: 0.5, verticalAlign: 'middle' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1976d2">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                </Box>
                              )}
                            </>
                          }
                        />
                        {user.isFollowing && (
                          <Chip size="small" label="Following" variant="outlined" sx={{ ml: 1 }} />
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {/* Posts */}
            {getFilteredResults('posts').length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Posts
                </Typography>
                <List disablePadding>
                  {getFilteredResults('posts').map((post, index) => {
                    // Calculate the overall index for keyboard navigation
                    const allResults = getAllResults();
                    const overallIndex = allResults.findIndex(item => item._id === post._id);
                    const isSelected = selectedResultIndex === overallIndex;

                    return (
                      <ListItem
                        key={post._id}
                        button
                        component={Link}
                        to={`/post/${post._id}`}
                        onClick={() => setShowSearchResults(false)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: isSelected ? 'action.selected' : 'transparent'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            variant="rounded"
                            src={post.image || undefined}
                            alt={post.caption}
                            sx={{ width: 56, height: 56 }}
                          >
                            <PhotoIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={post.caption ? (post.caption.substring(0, 50) + (post.caption.length > 50 ? '...' : '')) : 'No caption'}
                          secondary={`By ${post.user?.username || 'Unknown'} • ${post.likes?.length || 0} likes`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {/* Reels */}
            {getFilteredResults('reels').length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Reels
                </Typography>
                <List disablePadding>
                  {getFilteredResults('reels').map((reel, index) => {
                    // Calculate the overall index for keyboard navigation
                    const allResults = getAllResults();
                    const overallIndex = allResults.findIndex(item => item._id === reel._id);
                    const isSelected = selectedResultIndex === overallIndex;

                    return (
                      <ListItem
                        key={reel._id}
                        button
                        component={Link}
                        to={`/reel/${reel._id}`}
                        onClick={() => setShowSearchResults(false)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: isSelected ? 'action.selected' : 'transparent'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            variant="rounded"
                            src={reel.thumbnail || undefined}
                            alt={reel.caption}
                            sx={{ width: 56, height: 56 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                              <path d="M9 16.5V7.5L16.5 12L9 16.5Z" fill="white"/>
                            </svg>
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={reel.caption ? (reel.caption.substring(0, 50) + (reel.caption.length > 50 ? '...' : '')) : 'No caption'}
                          secondary={`By ${reel.user?.username || 'Unknown'} • ${reel.views || 0} views`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {/* Products */}
            {getFilteredResults('products').length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Products
                </Typography>
                <List disablePadding>
                  {getFilteredResults('products').map((product, index) => {
                    // Calculate the overall index for keyboard navigation
                    const allResults = getAllResults();
                    const overallIndex = allResults.findIndex(item => item._id === product._id);
                    const isSelected = selectedResultIndex === overallIndex;

                    return (
                      <ListItem
                        key={product._id}
                        button
                        component={Link}
                        to={`/shop/product/${product._id}`}
                        onClick={() => setShowSearchResults(false)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: isSelected ? 'action.selected' : 'transparent'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            variant="rounded"
                            src={(product.images && product.images[0]) || undefined}
                            alt={product.name}
                            sx={{ width: 56, height: 56 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                              <path d="M19 6H17C17 3.24 14.76 1 12 1S7 3.24 7 6H5C3.9 6 3 6.9 3 8V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V8C21 6.9 20.1 6 19 6ZM12 3C13.66 3 15 4.34 15 6H9C9 4.34 10.34 3 12 3ZM19 20H5V8H19V20ZM12 12C10.34 12 9 10.66 9 9H7C7 11.76 9.24 14 12 14C14.76 14 17 11.76 17 9H15C15 10.66 13.66 12 12 12Z" fill="white"/>
                            </svg>
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={product.name}
                          secondary={
                            <>
                              {product.price} {product.currency || 'USD'}
                              {product.inventory && product.inventory.quantity === 0 && (
                                <Box component="span" sx={{ ml: 1, color: 'error.main' }}>Out of stock</Box>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {/* Tags */}
            {getFilteredResults('tags').length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {getFilteredResults('tags').map((tag, index) => {
                    // Calculate the overall index for keyboard navigation
                    const allResults = getAllResults();
                    const overallIndex = allResults.findIndex(item =>
                      item.name === tag.name && (!item.price && !item.caption && !item.username));
                    const isSelected = selectedResultIndex === overallIndex;

                    return (
                      <Chip
                        key={tag._id || index}
                        icon={<TagIcon />}
                        label={`#${tag.name} (${tag.count || 0})`}
                        component={Link}
                        to={`/explore/tags/${tag.name}`}
                        onClick={() => setShowSearchResults(false)}
                        clickable
                        sx={{
                          borderRadius: 4,
                          bgcolor: isSelected ? 'action.selected' : 'transparent'
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        ) : searchQuery.trim().length > 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No results found for "{searchQuery}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try searching by username for best results.
            </Typography>
            <Button
              component={Link}
              to="/explore"
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => setShowSearchResults(false)}
            >
              Explore
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Search for users, posts, reels, and more
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              <strong>Tip:</strong> Searching by username is the most reliable way to find users.
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          bgcolor: theme => theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.2)'
            : '0 4px 20px rgba(99, 102, 241, 0.1)',
        }}
      >
        <Toolbar>
          {/* Logo */}
          {(!expandedSearch || !isSmall) && (
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', sm: 'flex' },
                fontWeight: 700,
                letterSpacing: '.2rem',
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textFillColor: 'transparent',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  letterSpacing: '.22rem',
                }
              }}
            >
              Let's Talk
            </Typography>
          )}

          {/* Mobile Logo */}
          {(!expandedSearch || !isSmall) && (
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', sm: 'none' },
                flexGrow: 1,
                fontWeight: 700,
                letterSpacing: '.1rem',
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textFillColor: 'transparent',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  letterSpacing: '.12rem',
                }
              }}
            >
              LT
            </Typography>
          )}

          {/* Search Bar - Desktop */}
          {isAuthenticated && (!isSmall || expandedSearch) && (
            <Box
              ref={searchRef}
              sx={{
                position: 'relative',
                borderRadius: 3,
                bgcolor: theme => theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.06)
                  : alpha(theme.palette.common.black, 0.04),
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.1)
                    : alpha(theme.palette.common.black, 0.06),
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                    : '0 4px 12px rgba(99, 102, 241, 0.1)',
                },
                mr: 2,
                ml: expandedSearch && isSmall ? 0 : 'auto',
                width: expandedSearch && isSmall ? '100%' : 'auto',
                transition: 'all 0.3s ease',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.15)'
                  : '0 2px 8px rgba(99, 102, 241, 0.08)',
              }}
            >
              <Box sx={{
                padding: '0 16px',
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme => theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.7)
                  : alpha(theme.palette.common.black, 0.5),
              }}>
                {expandedSearch && isSmall ? (
                  <IconButton
                    size="small"
                    onClick={handleToggleSearch}
                    sx={{ pointerEvents: 'auto' }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                ) : (
                  <SearchIcon />
                )}
              </Box>
              <form onSubmit={handleSearch}>
                <InputBase
                  id="search-input"
                  placeholder="Search by username, posts, reels..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchInputFocus}
                  onKeyDown={handleSearchKeyDown}
                  sx={{
                    color: 'inherit',
                    width: expandedSearch && isSmall ? '100%' : '35ch',
                    '& .MuiInputBase-input': {
                      padding: theme.spacing(1.2, 1, 1.2, 0),
                      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                      transition: theme.transitions.create('width'),
                      width: '100%',
                      fontSize: '0.95rem',
                      '&::placeholder': {
                        opacity: 0.7,
                        fontStyle: 'italic',
                        fontSize: '0.9rem',
                      },
                      '&:focus': {
                        '&::placeholder': {
                          opacity: 0.5,
                        },
                      },
                    },
                  }}
                />
              </form>
              {searchQuery && (
                <IconButton
                  size="small"
                  aria-label="clear search"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: theme => theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.7)
                      : alpha(theme.palette.common.black, 0.5),
                    bgcolor: theme => theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.1)
                      : alpha(theme.palette.common.black, 0.05),
                    padding: '4px',
                    borderRadius: '50%',
                    '&:hover': {
                      bgcolor: theme => theme.palette.mode === 'dark'
                        ? alpha(theme.palette.common.white, 0.15)
                        : alpha(theme.palette.common.black, 0.1),
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              {renderSearchResults()}
            </Box>
          )}

          {/* Search Icon - Mobile */}
          {isAuthenticated && isSmall && !expandedSearch && (
            <IconButton
              size="large"
              aria-label="search"
              color="inherit"
              onClick={handleToggleSearch}
              sx={{
                ml: 'auto',
                bgcolor: theme => theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.05),
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <SearchIcon />
            </IconButton>
          )}

          {/* Desktop Nav Icons */}
          {isAuthenticated && (!isSmall || !expandedSearch) && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 'auto' }}>
              <NotificationDropdown />
              <Tooltip title="Messages">
                <IconButton
                  size="large"
                  aria-label="show messages"
                  color="inherit"
                  component={Link}
                  to="/messages"
                >
                  <Badge
                    badgeContent={currentUser?.unreadMessages || 0}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        height: 20,
                        minWidth: 20,
                        padding: '0 6px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                        background: theme => theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)'
                          : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      }
                    }}
                  >
                    <MailIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title="Account">
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="primary-search-account-menu"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <NavProfilePicture
                    user={currentUser}
                    size={{ width: 32, height: 32 }}
                    linkToProfile={false}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Mobile Nav Icons */}
          {isAuthenticated && (!isSmall || !expandedSearch) && (
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="show more"
                aria-controls="primary-search-account-menu-mobile"
                aria-haspopup="true"
                onClick={handleMobileMenuOpen}
                color="inherit"
              >
                <MoreIcon />
              </IconButton>
            </Box>
          )}

          {/* Login/Register Buttons */}
          {!isAuthenticated && (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  borderWidth: 2,
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-3px)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                  }
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.3)',
                  }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
      <Toolbar /> {/* Spacer */}
    </Box>
  );
};

export default Navbar;
