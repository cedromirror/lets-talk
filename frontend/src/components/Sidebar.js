import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Avatar, Divider, IconButton,
  Tooltip, useTheme, useMediaQuery, Badge
} from '@mui/material';
import {
  Home as HomeIcon,
  Explore as ExploreIcon,
  VideoLibrary as ReelsIcon,
  Chat as MessageIcon,
  Notifications as NotificationsIcon,
  Add as CreateIcon,
  Videocam as LiveIcon,
  ShoppingBag as ShopIcon,
  Dashboard as DashboardIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show sidebar for non-authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Menu items configuration
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
      path: `/profile/${currentUser?.username}`,
      label: 'Profile',
      icon: currentUser?.avatar ? (
        <Avatar
          src={currentUser.avatar}
          alt={currentUser.username}
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
        p: 2
      }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            letterSpacing: 0.5
          }}
        >
          Let's Talk
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'primary.contrastText',
                    fontWeight: 'bold',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: 'auto' }} />

      <List sx={{ px: 1 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            to="/settings"
            selected={isActive('/settings')}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': {
                  bgcolor: 'primary.light',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
                '& .MuiListItemText-primary': {
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <>
      {/* Mobile menu toggle button */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 10,
            left: 10,
            zIndex: 1199,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.paper' }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Mobile drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRadius: '0 16px 16px 0'
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
              boxShadow: 3
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
