import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Avatar, Divider, IconButton,
  Tooltip, useTheme, useMediaQuery, Badge, alpha, Collapse,
  Switch, Menu, MenuItem, Chip, Paper, Button, Stack,
  LinearProgress, CircularProgress
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  ExploreRounded as ExploreIcon,
  VideoLibraryRounded as ReelsIcon,
  ChatRounded as MessageIcon,
  NotificationsRounded as NotificationsIcon,
  AddCircleRounded as CreateIcon,
  VideocamRounded as LiveIcon,
  ShoppingBagRounded as ShopIcon,
  DashboardRounded as DashboardIcon,
  PersonRounded as ProfileIcon,
  SettingsRounded as SettingsIcon,
  MenuRounded as MenuIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  LogoutRounded as LogoutIcon,
  BookmarkRounded as BookmarkIcon,
  TrendingUpRounded as TrendingIcon,
  ExpandMoreRounded as ExpandMoreIcon,
  ExpandLessRounded as ExpandLessIcon,
  StarRounded as StarIcon,
  EditRounded as EditIcon,
  DragIndicatorRounded as DragIcon,
  NightlightRounded as DarkModeIcon,
  WbSunnyRounded as LightModeIcon,
  MoreVertRounded as MoreIcon,
  AddRounded as AddIcon,
  FavoriteRounded as FavoriteIcon,
  DragHandleRounded as DragHandleIcon,
  DeleteRounded as DeleteIcon,
  GroupRounded as PeopleIcon,
  PhotoLibraryRounded as GalleryIcon,
  BarChartRounded as AnalyticsIcon,
  HelpRounded as HelpIcon,
  InfoRounded as InfoIcon,
  FeedbackRounded as FeedbackIcon,
  EventRounded as EventIcon,
  LocalOfferRounded as TagIcon,
  SaveRounded as SavedIcon,
  HistoryRounded as HistoryIcon,
  VerifiedRounded as VerifiedIcon,
  WorkRounded as BusinessIcon,
  StorefrontRounded as MarketplaceIcon,
  PeopleAltRounded as CommunityIcon,
  WhatshotRounded as TrendingNowIcon,
  NewReleasesRounded as NewIcon,
  EmojiEventsRounded as AchievementsIcon,
  VisibilityRounded as ViewsIcon,
  ThumbUpRounded as LikesIcon,
  CommentRounded as CommentsIcon,
  CloudUploadRounded as UploadIcon,
  ForumRounded as DiscussionsIcon,
  CampaignRounded as AnnouncementsIcon,
  SupportAgentRounded as SupportIcon
} from '@mui/icons-material';

const drawerWidth = 280;

// Animation keyframes for sidebar items
const itemEnterAnimation = {
  from: { opacity: 0, transform: 'translateX(-20px)' },
  to: { opacity: 1, transform: 'translateX(0)' }
};

// Custom styled component for animated list items
const AnimatedListItem = ({ children, delay = 0, ...props }) => {
  return (
    <ListItem
      {...props}
      sx={{
        animation: `${itemEnterAnimation} 0.3s ease-out forwards`,
        animationDelay: `${delay}ms`,
        opacity: 0,
        ...props.sx
      }}
    >
      {children}
    </ListItem>
  );
};

// Custom styled component for section headers
const SectionHeader = ({ title }) => {
  return (
    <Box sx={{ px: 2, mb: 2 }}>
      <Typography
        variant="overline"
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'text.secondary',
          letterSpacing: '0.1em',
          pl: 2,
          opacity: 0.8
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

const Sidebar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const location = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Check if this is a fresh login to ensure sidebar is open on mobile
  const [isFreshLogin, setIsFreshLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    discover: true,
    content: true,
    account: true,
    shortcuts: true
  });

  // State for user shortcuts (would typically come from user preferences in a real app)
  const [shortcuts, setShortcuts] = useState([
    { id: 1, label: 'Saved Posts', icon: <BookmarkIcon />, path: '/saved' },
    { id: 2, label: 'Trending', icon: <TrendingIcon />, path: '/trending' },
    { id: 3, label: 'Favorites', icon: <FavoriteIcon />, path: '/favorites' }
  ]);

  // State for shortcut menu
  const [shortcutMenuAnchor, setShortcutMenuAnchor] = useState(null);
  const [selectedShortcut, setSelectedShortcut] = useState(null);

  // State for drag and drop
  const [draggedShortcut, setDraggedShortcut] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Use theme mode from context
  const darkMode = mode === 'dark';

  // Effect to check for fresh login and set sidebar state
  useEffect(() => {
    // Check if this is a fresh login from sessionStorage
    const freshLogin = sessionStorage.getItem('freshLogin');
    if (freshLogin === 'true') {
      console.log('Sidebar: Detected fresh login, ensuring sidebar is visible on mobile');
      setIsFreshLogin(true);
      // For mobile, we'll open the sidebar automatically on fresh login
      if (isMobile) {
        setMobileOpen(true);
      }
      // Keep the flag for a longer time to ensure other components can react
      // Don't remove it here - we'll handle it in the other effect
    }

    // Load user preferences for sidebar sections
    const savedExpandedSections = localStorage.getItem('sidebarExpandedSections');
    if (savedExpandedSections) {
      try {
        setExpandedSections(JSON.parse(savedExpandedSections));
      } catch (error) {
        console.error('Error parsing saved sidebar sections:', error);
      }
    }

    // Load user shortcuts (would typically come from API in a real app)
    const savedShortcuts = localStorage.getItem('userShortcuts');
    if (savedShortcuts) {
      try {
        // Parse the saved shortcuts
        const parsedShortcuts = JSON.parse(savedShortcuts);

        // Add back the icon property based on the path
        const shortcutsWithIcons = parsedShortcuts.map(shortcut => {
          // Determine which icon to use based on the path or label
          let icon;
          if (shortcut.path === '/saved') {
            icon = <BookmarkIcon />;
          } else if (shortcut.path === '/trending') {
            icon = <TrendingIcon />;
          } else if (shortcut.path === '/favorites') {
            icon = <FavoriteIcon />;
          } else {
            // Default icon for new shortcuts
            icon = <StarIcon />;
          }

          return {
            ...shortcut,
            icon
          };
        });

        setShortcuts(shortcutsWithIcons);
      } catch (error) {
        console.error('Error parsing saved shortcuts:', error);
        // If there's an error, set default shortcuts
        setShortcuts([
          { id: 1, label: 'Saved Posts', icon: <BookmarkIcon />, path: '/saved' },
          { id: 2, label: 'Trending', icon: <TrendingIcon />, path: '/trending' },
          { id: 3, label: 'Favorites', icon: <FavoriteIcon />, path: '/favorites' }
        ]);
      }
    }
  }, [isMobile]); // Removed theme.palette.mode dependency since we're using ThemeContext now

  // Effect to handle fresh login state
  useEffect(() => {
    if (isFreshLogin) {
      // Clear the fresh login flag after a longer delay
      // This ensures the sidebar stays visible long enough for the user to see it
      const timer = setTimeout(() => {
        setIsFreshLogin(false);
        console.log('Sidebar: Fresh login state cleared');
        // Only now remove the session storage flag
        sessionStorage.removeItem('freshLogin');
      }, 10000); // Increased to 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isFreshLogin, isMobile]);

  // Set initial mobile drawer state based on fresh login
  useEffect(() => {
    if (isAuthenticated && isMobile) {
      // Check if we're on the home page after login
      if (location.pathname === '/' && localStorage.getItem('loginSuccess') === 'true') {
        console.log('Sidebar: On home page after login, ensuring sidebar is visible');
        setMobileOpen(true);
      }

      // Also check for the sidebarVisible flag
      if (localStorage.getItem('sidebarVisible') === 'true') {
        console.log('Sidebar: sidebarVisible flag is set, ensuring sidebar is visible');
        setMobileOpen(true);

        // Keep the flag for a while, but eventually remove it
        setTimeout(() => {
          localStorage.removeItem('sidebarVisible');
        }, 30000); // 30 seconds should be enough for the user to see the sidebar
      }
    }
  }, [isAuthenticated, isMobile, location.pathname]);

  // Save expanded sections state when it changes
  useEffect(() => {
    localStorage.setItem('sidebarExpandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  // Save shortcuts when they change
  useEffect(() => {
    try {
      // Create a serializable version of shortcuts without React elements
      const serializableShortcuts = shortcuts.map(shortcut => ({
        id: shortcut.id,
        label: shortcut.label,
        path: shortcut.path,
        // Don't include the icon property as it contains React elements
      }));
      localStorage.setItem('userShortcuts', JSON.stringify(serializableShortcuts));
    } catch (error) {
      console.error('Error saving shortcuts:', error);
    }
  }, [shortcuts]);

  // Define all hooks first, before any conditional returns
  // Handle theme toggle
  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  // Handle drag start for shortcuts
  const handleDragStart = useCallback((e, shortcut, index) => {
    setDraggedShortcut({ shortcut, index });
    // Set a ghost drag image
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('shortcut-drag-ghost');
    ghostElement.textContent = shortcut.label;
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 20, 20);
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  }, []);

  // Handle drag over for shortcuts
  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (draggedShortcut && draggedShortcut.index !== index) {
      setDragOverIndex(index);
    }
  }, [draggedShortcut]);

  // Handle drop for shortcuts
  const handleDrop = useCallback((e, index) => {
    e.preventDefault();
    if (draggedShortcut && draggedShortcut.index !== index) {
      const newShortcuts = [...shortcuts];
      const [removed] = newShortcuts.splice(draggedShortcut.index, 1);
      newShortcuts.splice(index, 0, removed);
      setShortcuts(newShortcuts);
    }
    setDraggedShortcut(null);
    setDragOverIndex(null);
  }, [draggedShortcut, shortcuts]);

  // Handle drag end for shortcuts
  const handleDragEnd = useCallback(() => {
    setDraggedShortcut(null);
    setDragOverIndex(null);
  }, []);

  // Categorized menu items
  const menuCategories = useMemo(() => ({
    discover: [
      { path: '/', label: 'Home', icon: <HomeIcon /> },
      { path: '/explore', label: 'Explore', icon: <ExploreIcon /> },
      { path: '/trending', label: 'Trending', icon: <TrendingNowIcon /> },
      { path: '/new', label: 'What\'s New', icon: <NewIcon />, badge: 3 }
    ],
    content: [
      { path: '/reels', label: 'Reels', icon: <ReelsIcon /> },
      { path: '/gallery', label: 'Gallery', icon: <GalleryIcon /> },
      {
        path: '/messages',
        label: 'Messages',
        icon: <MessageIcon />,
        badge: currentUser?.unreadMessages || 0
      },
      {
        path: '/notifications',
        label: 'Notifications',
        icon: <NotificationsIcon />,
        badge: currentUser?.unreadNotifications || 0
      },
      { path: '/discussions', label: 'Discussions', icon: <ForumIcon /> }
    ],
    create: [
      { path: '/create', label: 'Create Post', icon: <CreateIcon /> },
      { path: '/live', label: 'Go Live', icon: <LiveIcon /> },
      { path: '/upload', label: 'Upload Media', icon: <UploadIcon /> },
      { path: '/event', label: 'Create Event', icon: <EventIcon /> }
    ],
    explore: [
      { path: '/shop', label: 'Shop', icon: <ShopIcon /> },
      { path: '/marketplace', label: 'Marketplace', icon: <MarketplaceIcon /> },
      { path: '/communities', label: 'Communities', icon: <CommunityIcon /> },
      { path: '/people', label: 'Find People', icon: <PeopleIcon /> }
    ],
    analytics: [
      { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { path: '/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
      { path: '/achievements', label: 'Achievements', icon: <AchievementsIcon /> },
      {
        path: '/insights',
        label: 'Insights',
        icon: <VisibilityRounded />,
        submenu: [
          { path: '/insights/views', label: 'Views', icon: <ViewsIcon /> },
          { path: '/insights/likes', label: 'Likes', icon: <LikesIcon /> },
          { path: '/insights/comments', label: 'Comments', icon: <CommentsIcon /> }
        ]
      }
    ],
    saved: [
      { path: '/saved', label: 'Saved Items', icon: <SavedIcon /> },
      { path: '/favorites', label: 'Favorites', icon: <FavoriteIcon /> },
      { path: '/history', label: 'History', icon: <HistoryIcon /> }
    ],
    business: [
      { path: '/business', label: 'Business Tools', icon: <BusinessIcon />, badge: 'NEW' },
      { path: '/verified', label: 'Get Verified', icon: <VerifiedIcon /> }
    ],
    help: [
      { path: '/help', label: 'Help Center', icon: <HelpIcon /> },
      { path: '/support', label: 'Support', icon: <SupportIcon /> },
      { path: '/feedback', label: 'Send Feedback', icon: <FeedbackIcon /> },
      { path: '/about', label: 'About', icon: <InfoIcon /> }
    ]
  }), [currentUser?.unreadMessages, currentUser?.unreadNotifications]);

  // Don't show sidebar for non-authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path) => {
    // Handle exact matches
    if (location.pathname === path) return true;

    // Handle nested routes (e.g., /profile/username should match /profile)
    if (path !== '/' && location.pathname.startsWith(path)) return true;

    return false;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle shortcut menu open
  const handleShortcutMenuOpen = (event, shortcut) => {
    event.stopPropagation();
    setShortcutMenuAnchor(event.currentTarget);
    setSelectedShortcut(shortcut);
  };

  // Handle shortcut menu close
  const handleShortcutMenuClose = () => {
    setShortcutMenuAnchor(null);
    setSelectedShortcut(null);
  };

  // Handle shortcut edit
  const handleEditShortcut = () => {
    // In a real app, this would open a dialog to edit the shortcut
    console.log('Edit shortcut:', selectedShortcut);
    handleShortcutMenuClose();
  };

  // Handle shortcut delete
  const handleDeleteShortcut = () => {
    if (selectedShortcut) {
      setShortcuts(prev => prev.filter(s => s.id !== selectedShortcut.id));
    }
    handleShortcutMenuClose();
  };

  // Handle adding a new shortcut
  const handleAddShortcut = () => {
    // In a real app, this would open a dialog to add a new shortcut
    const newShortcut = {
      id: Date.now(),
      label: 'New Shortcut',
      icon: <StarIcon />,
      path: '/new-shortcut'
    };
    setShortcuts(prev => [...prev, newShortcut]);
  };

  // Profile menu item
  const profileMenuItem = {
    path: currentUser?.username ? `/profile/${currentUser.username}` : '/profile',
    label: 'Profile',
    icon: currentUser?.avatar ? (
      <Avatar
        src={currentUser.avatar}
        alt={currentUser?.username || 'User'}
        sx={{ width: 24, height: 24 }}
      />
    ) : <ProfileIcon />
  };

  // Legacy menu items for backward compatibility
  const menuItems = [
    { path: '/', label: 'Home', icon: <HomeIcon /> },
    { path: '/explore', label: 'Explore', icon: <ExploreIcon /> },
    { path: '/reels', label: 'Reels', icon: <ReelsIcon /> },
    {
      path: '/messages',
      label: 'Messages',
      icon: <MessageIcon />,
      badge: currentUser?.unreadMessages || 0
    },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: <NotificationsIcon />,
      badge: currentUser?.unreadNotifications || 0
    },
    { path: '/create', label: 'Create', icon: <CreateIcon /> },
    { path: '/live', label: 'Live', icon: <LiveIcon /> },
    { path: '/shop', label: 'Shop', icon: <ShopIcon /> },
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    {
      path: currentUser?.username ? `/profile/${currentUser.username}` : '/profile',
      label: 'Profile',
      icon: currentUser?.avatar ? (
        <Avatar
          src={currentUser.avatar}
          alt={currentUser?.username || 'User'}
          sx={{ width: 24, height: 24 }}
        />
      ) : <ProfileIcon />
    },
  ];

  const drawerContent = (
    <>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 3,
        mb: 2
      }}>
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            fontWeight: 'bold',
            letterSpacing: 0.5,
            background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textFillColor: 'transparent',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'inline-block',
            '&:hover': {
              transform: 'scale(1.05)',
              letterSpacing: '0.6px',
            }
          }}
        >
          Let's Talk
        </Typography>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              background: theme => alpha(theme.palette.primary.main, 0.1),
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                transform: 'rotate(-180deg) scale(1.1)',
                background: theme => alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {currentUser && (
        <Box sx={{
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          background: theme => theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)}, ${alpha(theme.palette.background.paper, 0.4)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.background.paper, 0.7)})`,
          borderRadius: 3,
          mx: 2,
          mb: 3,
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.2)'
            : '0 4px 20px rgba(99, 102, 241, 0.15)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            opacity: 0,
            transition: 'opacity 0.4s ease',
          },
          '&:hover': {
            boxShadow: theme => theme.palette.mode === 'dark'
              ? '0 8px 30px rgba(0, 0, 0, 0.3)'
              : '0 8px 30px rgba(99, 102, 241, 0.25)',
            transform: 'translateY(-5px)',
            '&::before': {
              opacity: 1,
            }
          }
        }}>
          {/* User Profile Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={currentUser?.profilePicture || currentUser?.avatar}
              alt={currentUser?.username || 'User'}
              component={Link}
              to={currentUser?.username ? `/profile/${currentUser.username}` : '/profile'}
              sx={{
                width: 56,
                height: 56,
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 4px 14px rgba(0, 0, 0, 0.4)'
                  : '0 4px 14px rgba(99, 102, 241, 0.3)',
                border: theme => `3px solid ${theme.palette.background.paper}`,
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'scale(1.15) rotate(5deg)',
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 8px 20px rgba(0, 0, 0, 0.5)'
                    : '0 8px 20px rgba(99, 102, 241, 0.4)',
                }
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                noWrap
                fontWeight="bold"
                component={Link}
                to={currentUser?.username ? `/profile/${currentUser.username}` : '/profile'}
                sx={{
                  textDecoration: 'none',
                  background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textFillColor: 'transparent',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    letterSpacing: '0.3px',
                  }
                }}
              >
                {currentUser?.username || 'User'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{
                  fontSize: '0.85rem',
                  opacity: 0.9,
                  mt: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  '&::before': {
                    content: '""',
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    marginRight: '6px'
                  }
                }}
              >
                Online
              </Typography>
            </Box>
          </Box>

          {/* User Stats Section */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            mt: 1,
            pt: 2,
            borderTop: '1px solid',
            borderColor: theme => alpha(theme.palette.divider, 0.1)
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {currentUser?.followers?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Followers
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {currentUser?.following?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Following
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {currentUser?.posts?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posts
              </Typography>
            </Box>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<CreateIcon />}
              component={Link}
              to="/create"
              sx={{
                flex: 1,
                borderRadius: 2,
                textTransform: 'none',
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  background: theme => `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              Create
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MessageIcon />}
              component={Link}
              to="/messages"
              sx={{
                flex: 1,
                borderRadius: 2,
                textTransform: 'none',
                borderColor: theme => theme.palette.primary.main,
                color: theme => theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme => theme.palette.primary.dark,
                  background: theme => alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Message
            </Button>
          </Box>
        </Box>
      )}

      <SectionHeader title="MAIN MENU" />

      <List sx={{
        px: 2,
        maxHeight: 'calc(100vh - 320px)',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px',
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
      }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              onClick={(e) => {
                // On mobile, don't close the drawer when navigating to a new page
                // if this is a fresh login or we're on the home page
                if (isMobile && (isFreshLogin || location.pathname === '/')) {
                  e.stopPropagation(); // Prevent the drawer from closing
                } else if (isMobile) {
                  // Close the drawer after a short delay to allow the navigation to start
                  setTimeout(() => {
                    setMobileOpen(false);
                  }, 150);
                }
              }}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 3,
                py: 1.5,
                px: 2,
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
                  background: theme => `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  transform: 'translateX(8px)',
                  '&::before': {
                    opacity: 1,
                  },
                },
                '&.Mui-selected': {
                  background: theme => theme.palette.mode === 'dark'
                    ? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.05)})`
                    : `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.02)})`,
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                    : '0 4px 20px rgba(99, 102, 241, 0.15)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    height: '60%',
                    width: 4,
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: theme => theme.palette.primary.main,
                  },
                  '&:hover': {
                    background: theme => theme.palette.mode === 'dark'
                      ? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.25)}, ${alpha(theme.palette.primary.main, 0.1)})`
                      : `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                    transform: 'translateX(8px) scale(1.02)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                    transform: 'scale(1.2)',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'primary.main',
                    fontWeight: 'bold',
                  },
                },
              }}
            >
              <ListItemIcon sx={{
                minWidth: 46,
                color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                transition: 'all 0.3s ease',
              }}>
                {item.badge ? (
                  <Badge
                    badgeContent={item.badge}
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
                    {item.icon}
                  </Badge>
                ) : item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 'bold' : 'medium',
                  fontSize: '1rem',
                  letterSpacing: '0.01em',
                  transition: 'all 0.3s ease',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <SectionHeader title="ACCOUNT" />

      <List sx={{ px: 2 }}>
        <ListItem disablePadding sx={{ mb: 1.5 }}>
          <ListItemButton
            component={Link}
            to="/settings"
            selected={isActive('/settings')}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 2,
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
                background: theme => `linear-gradient(90deg, ${alpha(theme.palette.tertiary.main, 0.1)}, transparent)`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover': {
                transform: 'translateX(8px)',
                '&::before': {
                  opacity: 1,
                },
              },
              '&.Mui-selected': {
                background: theme => theme.palette.mode === 'dark'
                  ? `linear-gradient(90deg, ${alpha(theme.palette.tertiary.main, 0.2)}, ${alpha(theme.palette.tertiary.main, 0.05)})`
                  : `linear-gradient(90deg, ${alpha(theme.palette.tertiary.main, 0.1)}, ${alpha(theme.palette.tertiary.main, 0.02)})`,
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                  : '0 4px 20px rgba(20, 184, 166, 0.15)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  height: '60%',
                  width: 4,
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: theme => theme.palette.tertiary.main,
                },
                '&:hover': {
                  background: theme => theme.palette.mode === 'dark'
                    ? `linear-gradient(90deg, ${alpha(theme.palette.tertiary.main, 0.25)}, ${alpha(theme.palette.tertiary.main, 0.1)})`
                    : `linear-gradient(90deg, ${alpha(theme.palette.tertiary.main, 0.15)}, ${alpha(theme.palette.tertiary.main, 0.05)})`,
                  transform: 'translateX(8px) scale(1.02)',
                },
                '& .MuiListItemIcon-root': {
                  color: 'tertiary.main',
                  transform: 'scale(1.2)',
                },
                '& .MuiListItemText-primary': {
                  color: 'tertiary.main',
                  fontWeight: 'bold',
                },
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 46,
              color: isActive('/settings') ? 'tertiary.main' : 'text.secondary',
              transition: 'all 0.3s ease',
            }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                fontWeight: isActive('/settings') ? 'bold' : 'medium',
                fontSize: '1rem',
                letterSpacing: '0.01em',
                transition: 'all 0.3s ease',
              }}
            />
          </ListItemButton>
        </ListItem>

        {currentUser && (
          <>
            <ListItem disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton
                component={Link}
                to="/remove-account"
                selected={isActive('/remove-account')}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
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
                    background: theme => `linear-gradient(90deg, ${alpha(theme.palette.warning.main, 0.1)}, transparent)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover': {
                    transform: 'translateX(8px)',
                    '&::before': {
                      opacity: 1,
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'warning.main',
                      transform: 'scale(1.2) rotate(15deg)',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'warning.main',
                      fontWeight: 'bold',
                    },
                  },
                  '&.Mui-selected': {
                    background: theme => theme.palette.mode === 'dark'
                      ? `linear-gradient(90deg, ${alpha(theme.palette.warning.main, 0.2)}, ${alpha(theme.palette.warning.main, 0.05)})`
                      : `linear-gradient(90deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.02)})`,
                    boxShadow: theme => theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 20px rgba(245, 158, 11, 0.15)',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      height: '60%',
                      width: 4,
                      borderRadius: '0 4px 4px 0',
                      backgroundColor: theme => theme.palette.warning.main,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 46,
                  color: isActive('/remove-account') ? 'warning.main' : 'text.secondary',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                  <DeleteIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Remove Account"
                  primaryTypographyProps={{
                    fontWeight: isActive('/remove-account') ? 'bold' : 'medium',
                    fontSize: '1rem',
                    letterSpacing: '0.01em',
                    transition: 'all 0.3s ease',
                  }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out?')) {
                    logout();
                  }
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
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
                    background: theme => `linear-gradient(90deg, ${alpha(theme.palette.error.main, 0.1)}, transparent)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover': {
                    transform: 'translateX(8px)',
                    '&::before': {
                      opacity: 1,
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'error.main',
                      transform: 'scale(1.2) rotate(15deg)',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'error.main',
                      fontWeight: 'bold',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 46,
                  color: 'text.secondary',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    letterSpacing: '0.01em',
                    transition: 'all 0.3s ease',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      {/* User Shortcuts Section */}
      <SectionHeader title="SHORTCUTS" />
      <Box sx={{ px: 2, mb: 2 }}>
        <List sx={{ py: 0 }}>
          {shortcuts.map((shortcut, index) => (
            <ListItem
              key={shortcut.id}
              disablePadding
              sx={{
                mb: 1,
                backgroundColor: dragOverIndex === index ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                borderRadius: 2,
                transition: 'background-color 0.2s ease'
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, shortcut, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <ListItemButton
                component={Link}
                to={shortcut.path}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 2,
                  '&:hover': {
                    '& .shortcut-drag-handle': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {shortcut.icon}
                </ListItemIcon>
                <ListItemText primary={shortcut.label} />
                <IconButton
                  size="small"
                  className="shortcut-drag-handle"
                  sx={{
                    opacity: 0.4,
                    transition: 'opacity 0.2s ease',
                    cursor: 'grab',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={(e) => handleShortcutMenuOpen(e, shortcut)}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddShortcut}
          sx={{
            mt: 1,
            borderRadius: 2,
            textTransform: 'none',
            justifyContent: 'flex-start',
            px: 2,
            py: 1,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          Add New Shortcut
        </Button>

        <Menu
          anchorEl={shortcutMenuAnchor}
          open={Boolean(shortcutMenuAnchor)}
          onClose={handleShortcutMenuClose}
          PaperProps={{
            sx: {
              minWidth: 180,
              borderRadius: 2,
              boxShadow: theme.shadows[3],
            },
          }}
        >
          <MenuItem onClick={handleEditShortcut}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteShortcut} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {/* Theme Toggle Section */}
      <SectionHeader title="APPEARANCE" />
      <Box sx={{ px: 4, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LightModeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
          <Switch
            checked={mode === 'dark'}
            onChange={handleThemeToggle}
            color="primary"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: theme.palette.primary.main,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: alpha(theme.palette.primary.main, 0.5),
              },
            }}
          />
          <DarkModeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
        </Stack>
      </Box>

      {/* Pro Upgrade Section */}
      <Box sx={{
        p: 2,
        mt: 2,
        mx: 2,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        background: theme => theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)}, ${alpha(theme.palette.secondary.dark, 0.2)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.secondary.light, 0.1)})`,
        boxShadow: theme => theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.2)'
          : '0 4px 20px rgba(99, 102, 241, 0.15)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          opacity: 0,
          transition: 'opacity 0.4s ease',
        },
        '&:hover': {
          '&::before': {
            opacity: 1,
          }
        }
      }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Let's Talk Pro
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Upgrade to access exclusive features and premium content.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          sx={{
            py: 1,
            px: 2,
            borderRadius: 2,
            fontWeight: 'bold',
            fontSize: '0.875rem',
            color: 'white',
            background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            transition: 'all 0.3s ease',
            textTransform: 'none',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }
          }}
        >
          Upgrade Now
        </Button>
      </Box>
    </>
  );

  return (
    <>
      {/* Mobile menu toggle button */}
      {isMobile && (
        <IconButton
          color="primary"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1301,
            bgcolor: theme => theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.9),
            boxShadow: theme => theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(99, 102, 241, 0.2)',
            width: 48,
            height: 48,
            borderRadius: '16px',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              bgcolor: theme => theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : alpha(theme.palette.background.paper, 1),
              transform: 'scale(1.1) rotate(90deg)',
              boxShadow: theme => theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.4)'
                : '0 8px 30px rgba(99, 102, 241, 0.3)'
            },
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <MenuIcon sx={{
            color: theme => theme.palette.primary.main,
            fontSize: '1.5rem'
          }} />
        </IconButton>
      )}

      {/* Mobile drawer */}
      {isMobile ? (
        <Drawer
          variant={isFreshLogin ? "persistent" : "temporary"} // Use persistent for fresh login
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
            // Better handling of clicks outside the drawer
            onBackdropClick: () => {
              // Don't close if this is a fresh login
              if (!isFreshLogin) {
                setMobileOpen(false);
              }
            }
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            zIndex: 1300,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRadius: '0 24px 24px 0',
              boxShadow: theme => theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(99, 102, 241, 0.2)',
              background: theme => theme.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
                : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
              height: '100%',
              overflowY: 'visible',
              backdropFilter: 'blur(8px)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop permanent drawer */
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: 'none',
              boxShadow: theme => theme.palette.mode === 'dark'
                ? '4px 0 24px rgba(0, 0, 0, 0.3)'
                : '4px 0 24px rgba(99, 102, 241, 0.15)',
              background: theme => theme.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
                : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
              height: '100%',
              overflowY: 'visible',
              backdropFilter: 'blur(8px)',
              borderRadius: '0 24px 24px 0',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
