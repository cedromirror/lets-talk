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
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Mail as MailIcon,
  AccountCircle,
  MoreVert as MoreIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Photo as PhotoIcon,
  Tag as TagIcon,
  ArrowBack as ArrowBackIcon,
  VerifiedUser as VerifiedIcon
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
          border: '1px solid',
          borderColor: 'divider'
        }}
      />

      {user?.isVerified && (
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Box
              sx={{
                bgcolor: 'primary.main',
                borderRadius: '50%',
                width: avatarSize.width > 40 ? 16 : 14,
                height: avatarSize.width > 40 ? 16 : 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid white'
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
        elevation: 3,
        sx: { mt: 1, borderRadius: 2, minWidth: 180 }
      }}
    >
      <MenuItem
        component={Link}
        to={`/profile/${currentUser?.username}`}
        onClick={handleMenuClose}
        sx={{ py: 1.5 }}
      >
        <PersonIcon sx={{ mr: 2 }} />
        Profile
      </MenuItem>
      <MenuItem
        component={Link}
        to="/dashboard"
        onClick={handleMenuClose}
        sx={{ py: 1.5 }}
      >
        <PersonIcon sx={{ mr: 2 }} />
        Dashboard
      </MenuItem>
      <MenuItem
        component={Link}
        to="/settings"
        onClick={handleMenuClose}
        sx={{ py: 1.5 }}
      >
        <PersonIcon sx={{ mr: 2 }} />
        Settings
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        Logout
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
        elevation: 3,
        sx: { mt: 1, borderRadius: 2, minWidth: 200 }
      }}
    >
      <MenuItem onClick={() => {
        handleMobileMenuClose();
        navigate('/notifications');
      }}>
        <IconButton
          size="large"
          color="inherit"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem>
      <MenuItem onClick={() => {
        handleMobileMenuClose();
        navigate('/messages');
      }}>
        <IconButton
          size="large"
          color="inherit"
        >
          <Badge badgeContent={currentUser?.unreadMessages || 0} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <NavProfilePicture
            user={currentUser}
            size={{ width: 32, height: 32 }}
            linkToProfile={false}
          />
        </IconButton>
        <p>Profile</p>
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
        elevation={3}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          mt: 1,
          borderRadius: 2,
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 1200
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
        elevation={1}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 1
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
                color: 'inherit',
                textDecoration: 'none',
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
                color: 'inherit',
                textDecoration: 'none',
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
                borderRadius: 2,
                bgcolor: alpha(theme.palette.common.black, 0.04),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.black, 0.08),
                },
                mr: 2,
                ml: expandedSearch && isSmall ? 0 : 'auto',
                width: expandedSearch && isSmall ? '100%' : 'auto',
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
                    width: expandedSearch && isSmall ? '100%' : '30ch',
                    '& .MuiInputBase-input': {
                      padding: theme.spacing(1, 1, 1, 0),
                      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                      transition: theme.transitions.create('width'),
                      width: '100%',
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
              sx={{ ml: 'auto' }}
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
                  <Badge badgeContent={currentUser?.unreadMessages || 0} color="error">
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
                sx={{ borderRadius: 2 }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{ borderRadius: 2 }}
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
