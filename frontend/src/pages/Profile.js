import React, { useState, useEffect, useCallback, useRef } from 'react';
import { keyframes } from '@emotion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { userService, postService, reelService, liveService, savedService } from '../services/api';
import socketService from '../services/socketService';
import EditProfileDialog from '../components/EditProfileDialog';
import FollowButton from '../components/FollowButton';
import FollowersDialog from '../components/FollowersDialog';
import ProfilePictureEditor from '../components/ProfilePictureEditor';
import CoverPhotoEditor from '../components/CoverPhotoEditor';
import ProfilePicture from '../components/common/ProfilePicture';
import { getResponsiveImageUrl, getResponsiveVideoUrl } from '../utils/cloudinaryHelper';

// Material UI components
import {
  Container, Box, Avatar, Typography, Button, Grid, Tabs, Tab, Divider,
  Card, CardMedia, CardContent, IconButton, CircularProgress, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Skeleton,
  Chip, useTheme, useMediaQuery, Menu, MenuItem, Snackbar, Alert,
  TextField, FormControl, FormGroup, FormControlLabel, FormLabel, Switch
} from '@mui/material';

// Material UI icons
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Favorite as FavoriteIcon,
  ChatBubble as CommentIcon,
  Visibility as ViewIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Archive as ArchiveIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Bookmark as BookmarkIcon,
  VideoCall as LiveIcon,
  VideoLibrary as VideoIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Verified as VerifiedIcon,
  PushPin as PushPinIcon,
  BarChart as BarChartIcon,
  CameraAlt as CameraAltIcon,
  CameraAlt as CameraIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  PersonOff as PersonOffIcon,
  Person as PersonIcon,
  People as PeopleIcon
} from '@mui/icons-material';

// Additional Material UI icons
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import LinkIcon from '@mui/icons-material/Link';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Define simplified animations
const globalStyles = {
  '@keyframes fadeIn': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 }
  },
  '@keyframes pulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)' },
    '70%': { boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' }
  }
};

// Define pulse animation for follower/following counts
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    color: #1976d2;
  }
  50% {
    transform: scale(1.1);
    color: #2196f3;
  }
  100% {
    transform: scale(1);
    color: #1976d2;
  }
`;

function Profile() {
  const { username } = useParams();
  const { currentUser, updateCurrentUser } = useAuth();
  const { mode } = useThemeContext();
  const navigate = useNavigate();
  const theme = useTheme();

  // User and content states
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [livestreams, setLivestreams] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedReels, setSavedReels] = useState([]);

  // Profile statistics states
  const [profileViews, setProfileViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  // Suggested users state
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [tabValue, setTabValue] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  // Pagination states
  const [postsPage, setPostsPage] = useState(1);
  const [reelsPage, setReelsPage] = useState(1);
  const [livestreamsPage, setLivestreamsPage] = useState(1);
  const [savedPostsPage, setSavedPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreReels, setHasMoreReels] = useState(true);
  const [hasMoreLivestreams, setHasMoreLivestreams] = useState(true);
  const [hasMoreSavedPosts, setHasMoreSavedPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState(null);
  const [confirmDialogItem, setConfirmDialogItem] = useState(null);
  const [confirmDialogType, setConfirmDialogType] = useState('');

  // Profile picture editor states
  const [profilePictureEditorOpen, setProfilePictureEditorOpen] = useState(false);
  const [coverPhotoEditorOpen, setCoverPhotoEditorOpen] = useState(false);

  // Edit profile dialog state
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogType, setEditDialogType] = useState('post'); // 'post' or 'reel'
  const [editItem, setEditItem] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editIsHidden, setEditIsHidden] = useState(false);
  const [editHideLikes, setEditHideLikes] = useState(false);
  const [editHideComments, setEditHideComments] = useState(false);
  const [editAllowComments, setEditAllowComments] = useState(true);

  // Menu states
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info'); // 'success', 'error', 'warning', 'info'

  // Followers dialog states
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followersDialogTab, setFollowersDialogTab] = useState('followers');

  // Profile dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // Handle tab change with debounce to prevent unnecessary re-renders
  const tabChangeTimerRef = useRef(null);
  const isTabChangingRef = useRef(false);

  const handleTabChange = useCallback((_, newValue) => {
    // Prevent rapid tab changes
    if (isTabChangingRef.current) return;

    // Only proceed if the tab actually changed
    if (tabValue === newValue) return;

    // Set changing flag
    isTabChangingRef.current = true;

    // Clear any existing timer
    if (tabChangeTimerRef.current) {
      clearTimeout(tabChangeTimerRef.current);
    }

    // Update tab value immediately for UI feedback
    setTabValue(newValue);

    // Use a small delay before changing the active tab to prevent UI flicker
    tabChangeTimerRef.current = setTimeout(() => {
      // Map tab index to tab name
      const tabNames = ['posts', 'reels', 'livestreams', 'saved'];
      const newActiveTab = tabNames[newValue] || 'posts';

      // Only update if different to prevent unnecessary re-renders
      if (activeTab !== newActiveTab) {
        setActiveTab(newActiveTab);
      }

      // Reset changing flag after a short delay
      setTimeout(() => {
        isTabChangingRef.current = false;
      }, 300);
    }, 50);
  }, [tabValue, activeTab]);

  // Listen for follow/unfollow events
  useEffect(() => {
    if (!profileUser) return;

    // Handler for follow status changes
    const handleFollowStatusChange = (data) => {
      // Only update if this is the target user's profile
      if (data.targetUserId === profileUser._id) {
        // Update follower count with animation
        setFollowersCount(prev => {
          const newCount = prev + data.followerCount;
          return newCount >= 0 ? newCount : 0; // Ensure count doesn't go below 0
        });
      }
    };

    // Subscribe to follow status change events
    const unsubscribe = socketService.subscribeToEvent('user:follow_status_change', handleFollowStatusChange);

    return () => {
      // Cleanup subscription when component unmounts
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [profileUser]);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`Starting profile fetch for username: ${username}`);

      // Check if the username looks like an email address
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
      if (isEmail) {
        console.log('Username appears to be an email address, redirecting to search');
        // Redirect to home page with search query
        navigate('/', { state: { searchQuery: username } });
        setLoading(false);
        return null;
      }

      console.log(`Fetching profile for username: ${username}`);

      // Try to get the user profile
      try {
        // First check if this is the current user's profile
        if (currentUser && currentUser.username === username) {
          console.log('Using current user data for profile since username matches');
          setProfileUser(currentUser);
          setIsCurrentUser(true);
          setFollowersCount(currentUser.followerCount || 0);
          setFollowingCount(currentUser.followingCount || 0);
          setError(null);
          setLoading(false);
          return currentUser;
        }

        // Otherwise fetch from API
        console.log(`Fetching user data from API for username: ${username}`);
        const userResponse = await userService.getUserByUsername(username);

        if (!userResponse.data || !userResponse.data.user) {
          console.error(`Profile not found for username: ${username}`, userResponse);
          setError(`Profile "${username}" not found`);
          setLoading(false);
          return null;
        }

        const userData = userResponse.data.user;
        console.log(`Profile found for username: ${username}`, userData);
        setProfileUser(userData);

        // Check if this is the current user's profile
        const isCurrentUserProfile = currentUser?.username === username || userData.isMe;
        setIsCurrentUser(isCurrentUserProfile);

        // Set following status
        setIsFollowing(userData.isFollowing || false);

        // Set follower counts
        setFollowersCount(userData.followerCount || 0);
        setFollowingCount(userData.followingCount || 0);

        setError(null);
        return userData;
      } catch (profileError) {
        console.error(`Error fetching profile for username: ${username}`, profileError);

        // If the current user is logged in and the profile being viewed is the same as the current user
        if (currentUser && currentUser.username === username) {
          console.log('Using current user data for profile as fallback');
          setProfileUser(currentUser);
          setIsCurrentUser(true);
          setFollowersCount(currentUser.followerCount || 0);
          setFollowingCount(currentUser.followingCount || 0);
          setError(null);
          return currentUser;
        }

        // No special cases - handle error properly
        console.error('Profile not found:', profileError);

        // Otherwise, show error
        setError(`Profile "${username}" not found. ${profileError.message || ''}`);
        return null;
      }
    } catch (err) {
      console.error(`Error in profile page for username: ${username}`, err);
      setError(`Profile "${username}" not found. ${err.message || ''}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [username, currentUser, navigate]);

  // Fetch user posts with pagination
  const fetchUserPosts = useCallback(async (userId, page = 1, limit = 12) => {
    if (!userId) return;

    try {
      setLoadingMore(true);
      console.log(`Fetching posts for user ${userId}, page ${page}, limit ${limit}`);

      // No special cases for any user

      const response = await postService.getUserPosts(userId, { page, limit });

      if (page === 1) {
        setPosts(response.data.posts || []);
      } else {
        setPosts(prevPosts => [...prevPosts, ...(response.data.posts || [])]);
      }

      // Check if there are more posts to load
      const pagination = response.data.pagination || {};
      setHasMorePosts(pagination.page < pagination.pages);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      if (page === 1) {
        // Set empty posts array on error
        setPosts([]);
        setHasMorePosts(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [username, profileUser]);

  // Fetch user reels with pagination
  const fetchUserReels = useCallback(async (userId, page = 1, limit = 12) => {
    if (!userId) return;

    try {
      setLoadingMore(true);
      console.log(`Fetching reels for user ${userId}, page ${page}, limit ${limit}`);

      // No special cases for any user

      const response = await reelService.getUserReels(userId, { page, limit });

      if (page === 1) {
        setReels(response.data.reels || []);
      } else {
        setReels(prevReels => [...prevReels, ...(response.data.reels || [])]);
      }

      // Check if there are more reels to load
      const pagination = response.data.pagination || {};
      setHasMoreReels(pagination.page < pagination.pages);
    } catch (err) {
      console.error('Error fetching user reels:', err);
      if (page === 1) {
        // Set empty reels array on error
        setReels([]);
        setHasMoreReels(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [username, profileUser]);

  // Fetch user livestreams with pagination
  const fetchUserLivestreams = useCallback(async (userId, page = 1, limit = 12) => {
    if (!userId) return;

    try {
      setLoadingMore(true);
      console.log(`Fetching livestreams for user ${userId}, page ${page}, limit ${limit}`);

      // No special cases for any user

      const response = await liveService.getUserLivestreams(userId, { page, limit });

      if (page === 1) {
        setLivestreams(response.data.livestreams || []);
      } else {
        setLivestreams(prevStreams => [...prevStreams, ...(response.data.livestreams || [])]);
      }

      // Check if there are more livestreams to load
      const pagination = response.data.pagination || {};
      setHasMoreLivestreams(pagination.page < pagination.pages);
    } catch (err) {
      console.error('Error fetching user livestreams:', err);
      if (page === 1) {
        // Set empty livestreams array on error
        setLivestreams([]);
        setHasMoreLivestreams(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [username, profileUser]);

  // Fetch saved content with pagination
  const fetchSavedContent = useCallback(async (page = 1, limit = 12) => {
    if (!isCurrentUser) return;

    try {
      setLoadingMore(true);

      // Fetch saved posts
      const postsResponse = await savedService.getSavedPosts({ page, limit });

      if (page === 1) {
        setSavedPosts(postsResponse.data.posts || []);
      } else {
        setSavedPosts(prevPosts => [...prevPosts, ...(postsResponse.data.posts || [])]);
      }

      // Check if there are more saved posts to load
      const postsPagination = postsResponse.data.pagination || {};
      setHasMoreSavedPosts(postsPagination.page < postsPagination.pages);

      // Fetch saved reels
      const reelsResponse = await savedService.getSavedReels({ page, limit });

      if (page === 1) {
        setSavedReels(reelsResponse.data.reels || []);
      } else {
        setSavedReels(prevReels => [...prevReels, ...(reelsResponse.data.reels || [])]);
      }
    } catch (err) {
      if (page === 1) {
        setSavedPosts([]);
        setSavedReels([]);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [isCurrentUser]);

  // Ref to track loading state to prevent multiple simultaneous loading requests
  const isLoadingMoreRef = useRef(false);

  // Load more content based on active tab - optimized to prevent unnecessary state updates
  const loadMoreContent = useCallback(() => {
    // Use refs to check loading state to avoid dependency on state that might cause re-renders
    if (loadingMore || isLoadingMoreRef.current) return;

    if (!profileUser || !profileUser._id) return;

    // Set loading state
    isLoadingMoreRef.current = true;

    // Use a local variable to track the current tab to avoid closure issues
    const currentTab = activeTab;

    // Define an async function to handle the loading with proper error handling
    const loadContent = async () => {
      try {
        setLoadingMore(true);

        switch (currentTab) {
          case 'posts':
            if (hasMorePosts) {
              const nextPage = postsPage + 1;
              setPostsPage(nextPage);
              await fetchUserPosts(profileUser._id, nextPage);
            }
            break;
          case 'reels':
            if (hasMoreReels) {
              const nextPage = reelsPage + 1;
              setReelsPage(nextPage);
              await fetchUserReels(profileUser._id, nextPage);
            }
            break;
          case 'livestreams':
            if (hasMoreLivestreams) {
              const nextPage = livestreamsPage + 1;
              setLivestreamsPage(nextPage);
              await fetchUserLivestreams(profileUser._id, nextPage);
            }
            break;
          case 'saved':
            if (isCurrentUser) {
              if (hasMoreSavedPosts) {
                const nextPage = savedPostsPage + 1;
                setSavedPostsPage(nextPage);
                await fetchSavedContent(nextPage);
              }
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Error loading more ${currentTab}:`, error);
      } finally {
        // Reset loading states with a small delay to prevent UI flicker
        setTimeout(() => {
          setLoadingMore(false);
          isLoadingMoreRef.current = false;
        }, 300);
      }
    };

    // Execute the loading function
    loadContent();
  }, [
    // Only include essential dependencies to prevent unnecessary re-renders
    activeTab,
    profileUser?._id,
    postsPage,
    reelsPage,
    livestreamsPage,
    savedPostsPage,
    hasMorePosts,
    hasMoreReels,
    hasMoreLivestreams,
    hasMoreSavedPosts,
    isCurrentUser,
    fetchUserPosts,
    fetchUserReels,
    fetchUserLivestreams,
    fetchSavedContent
  ]);

  // Fetch suggested users from the database
  const fetchSuggestedUsers = useCallback(async () => {
    if (!currentUser || !profileUser) {
      setSnackbarMessage('Please wait while we load your profile data...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Set loading state immediately
      setLoadingSuggestions(true);
      setSuggestedUsers([]); // Clear existing suggestions to avoid stale data

      // Try to get suggestions from the backend API
      let realUsers = [];
      try {
        // Get suggestions from the API
        const response = await userService.getSuggestions(20, true);

        // Filter valid users
        realUsers = (response.data?.users || []).filter(user =>
          user && user._id && user.username &&
          user._id !== profileUser._id &&
          user._id !== currentUser._id &&
          !user.isFollowing
        ).map(user => ({
          ...user,
          suggestionReason: 'Suggested for you',
          isVerified: true
        }));
      } catch (apiError) {
        realUsers = [];
      }

      // If we don't have enough users, try to get more from search
      if (realUsers.length < 5) {
        try {
          const searchResponse = await userService.searchUsers('');
          const searchUsers = searchResponse.data?.users || [];

          // Add search users who aren't already in the suggestions
          searchUsers.forEach(user => {
            if (
              user && user._id && user.username &&
              user._id !== currentUser._id &&
              user._id !== profileUser._id &&
              !realUsers.some(u => u._id === user._id) &&
              !user.isFollowing
            ) {
              realUsers.push({
                ...user,
                suggestionReason: 'Suggested for you'
              });
            }
          });
        } catch (err) {
          // Silent error - continue with what we have
        }
      }

      // Ensure all users have the required properties
      const processedUsers = realUsers.map(user => ({
        _id: user._id,
        username: user.username,
        fullName: user.fullName || '',
        avatar: user.avatar || '/assets/default-avatar.png',
        suggestionReason: user.suggestionReason || 'Suggested for you',
        isFollowing: user.isFollowing || false,
        bio: user.bio || '',
        followerCount: user.followerCount || 0,
        followingCount: user.followingCount || 0
      }));

      // Limit to 5 suggestions
      const finalSuggestions = processedUsers.slice(0, 5);

      // Update state with the new suggestions
      setSuggestedUsers(finalSuggestions);
      setShowSuggestions(finalSuggestions.length > 0); // Only show suggestions if we have them
      setLoadingSuggestions(false);

      // Show success message if users were found
      if (finalSuggestions.length > 0) {
        setSnackbarMessage(`Found ${finalSuggestions.length} people you might want to follow`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }

      return finalSuggestions;
    } catch (error) {
      setLoadingSuggestions(false);
      setSuggestedUsers([]);
      return [];
    }
  }, [currentUser, profileUser, userService]);

  // Fetch user statistics
  // Store persistent profile stats in a ref to prevent random refreshing
  const persistentStatsRef = useRef({
    profileViews: 0,
    totalLikes: 0,
    totalComments: 0,
    lastUpdated: 0,
    userId: null // Track which user these stats belong to
  });

  const fetchUserStats = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) return;

    console.log(`Fetching stats for user ${userId}, forceRefresh: ${forceRefresh}`);

    // No special cases for any user

    // Check if we've recently updated stats and not forcing refresh
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    const isCacheValid = !forceRefresh &&
                        persistentStatsRef.current.lastUpdated > 0 &&
                        now - persistentStatsRef.current.lastUpdated < tenMinutes &&
                        persistentStatsRef.current.userId === userId;

    if (isCacheValid) {
      // Use cached stats without triggering re-renders if values haven't changed
      if (profileViews !== persistentStatsRef.current.profileViews) {
        setProfileViews(persistentStatsRef.current.profileViews);
      }
      if (totalLikes !== persistentStatsRef.current.totalLikes) {
        setTotalLikes(persistentStatsRef.current.totalLikes);
      }
      if (totalComments !== persistentStatsRef.current.totalComments) {
        setTotalComments(persistentStatsRef.current.totalComments);
      }
      return;
    }

    try {
      // Try to get stats from the API
      const response = await userService.getUserStats(userId);

      if (response?.data?.success) {
        // Update state with API data
        const { profileViews: newProfileViews, totalLikes: newTotalLikes, totalComments: newTotalComments } = response.data.stats;

        // Only update state if values have changed
        if (profileViews !== newProfileViews) setProfileViews(newProfileViews);
        if (totalLikes !== newTotalLikes) setTotalLikes(newTotalLikes);
        if (totalComments !== newTotalComments) setTotalComments(newTotalComments);

        // Update persistent ref
        persistentStatsRef.current = {
          profileViews: newProfileViews,
          totalLikes: newTotalLikes,
          totalComments: newTotalComments,
          lastUpdated: now,
          userId: userId
        };
        return;
      } else {
        console.log('API returned success: false, falling back to calculation');
      }
    } catch (err) {
      console.error('Error fetching user stats from API:', err);
      // Silent error - fall back to calculation
    }

    // If API fails, calculate stats from content
    try {
      console.log('Calculating stats from content');
      // Calculate totals from posts, reels, and livestreams
      const postsLikes = posts.reduce((sum, post) => sum + (post.likesCount || 0), 0);
      const postsComments = posts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);
      const reelsLikes = reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
      const reelsComments = reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
      const livestreamsLikes = livestreams.reduce((sum, stream) => sum + (stream.likesCount || 0), 0);
      const livestreamsComments = livestreams.reduce((sum, stream) => sum + (stream.commentsCount || 0), 0);

      // Set total likes and comments
      const calculatedTotalLikes = postsLikes + reelsLikes + livestreamsLikes;
      const calculatedTotalComments = postsComments + reelsComments + livestreamsComments;

      // Use existing profile views or set to 0
      const calculatedProfileViews = profileViews > 0 ? profileViews : 0;

      // Only update state if values have changed
      if (profileViews !== calculatedProfileViews) setProfileViews(calculatedProfileViews);
      if (totalLikes !== calculatedTotalLikes) setTotalLikes(calculatedTotalLikes);
      if (totalComments !== calculatedTotalComments) setTotalComments(calculatedTotalComments);

      // Set total views based on content
      const totalPostViews = posts.reduce((sum, post) => sum + (post.viewsCount || 0), 0);
      const totalReelViews = reels.reduce((sum, reel) => sum + (reel.viewsCount || 0), 0);
      const totalLivestreamViews = livestreams.reduce((sum, stream) => sum + (stream.viewersCount || 0), 0);
      const calculatedTotalViews = totalPostViews + totalReelViews + totalLivestreamViews;

      // Use the calculated views directly
      setTotalViews(calculatedTotalViews);

      // Update persistent ref
      persistentStatsRef.current = {
        profileViews: calculatedProfileViews,
        totalLikes: calculatedTotalLikes,
        totalComments: calculatedTotalComments,
        lastUpdated: now,
        userId: userId
      };
    } catch (err) {
      console.error('Error calculating stats from content:', err);
      // If calculation fails, set stats to 0
      setProfileViews(0);
      setTotalLikes(0);
      setTotalComments(0);
      setTotalViews(0);

      // Update persistent ref with zeros
      persistentStatsRef.current = {
        profileViews: 0,
        totalLikes: 0,
        totalComments: 0,
        lastUpdated: now,
        userId: userId
      };
    }
  }, [posts, reels, livestreams, userService, profileViews, totalLikes, totalComments, username]);

  // Optimized initial data loading to prevent unnecessary re-renders
  const initialLoadRef = useRef(false);
  const initialLoadTimerRef = useRef(null);

  useEffect(() => {
    // Clear any existing timers when username changes
    if (initialLoadTimerRef.current) {
      clearTimeout(initialLoadTimerRef.current);
    }

    // Set loading state at the beginning
    setLoading(true);
    initialLoadRef.current = true;

    const loadInitialData = async () => {
      try {
        // Reset pagination states when username changes
        setPostsPage(1);
        setReelsPage(1);
        setLivestreamsPage(1);
        setSavedPostsPage(1);
        setTabValue(0);
        setActiveTab('posts');

        // Fetch user profile first
        const userData = await fetchUserProfile();

        if (userData && userData._id) {
          // Fetch initial content based on active tab - posts first as they're most visible
          await fetchUserPosts(userData._id, 1);

          // Fetch user statistics right after posts for better perceived performance
          await fetchUserStats(userData._id, false);

          // Set loading to false after the critical data is loaded
          setLoading(false);

          // Pre-fetch other content sequentially with small delays to avoid overwhelming the API
          initialLoadTimerRef.current = setTimeout(async () => {
            await fetchUserReels(userData._id, 1);

            initialLoadTimerRef.current = setTimeout(async () => {
              await fetchUserLivestreams(userData._id, 1);

              if (isCurrentUser) {
                initialLoadTimerRef.current = setTimeout(async () => {
                  await fetchSavedContent(1);
                  initialLoadRef.current = false;
                }, 300);
              } else {
                initialLoadRef.current = false;
              }
            }, 300);
          }, 300);
        } else {
          // If no user data, just set loading to false
          setLoading(false);
          initialLoadRef.current = false;
        }
      } catch (error) {
        setLoading(false);
        initialLoadRef.current = false;
      }
    };

    loadInitialData();

    // Cleanup function to clear any pending timers
    return () => {
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
      }
    };
  }, [username]); // Only depend on username to prevent unnecessary re-renders

  // Optimized fetch for suggested users when profile is loaded
  const suggestedUsersTimerRef = useRef(null);
  const suggestedUsersFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch suggested users if we have both profile and current user data
    // and we haven't already fetched them or we're viewing a different profile
    if (profileUser && currentUser &&
        (!suggestedUsersFetchedRef.current ||
         suggestedUsersFetchedRef.current !== profileUser.username)) {

      // Clear any existing timer
      if (suggestedUsersTimerRef.current) {
        clearTimeout(suggestedUsersTimerRef.current);
      }

      // Only fetch suggested users after initial data load is complete
      if (!initialLoadRef.current && !loadingMore) {
        // Add a longer delay to ensure other critical data is loaded first
        suggestedUsersTimerRef.current = setTimeout(() => {
          // Track which profile we're fetching suggestions for
          suggestedUsersFetchedRef.current = profileUser.username;
          fetchSuggestedUsers();
        }, 1500); // Longer delay to prioritize main content loading
      }

      // Clean up the timer if the component unmounts or dependencies change
      return () => {
        if (suggestedUsersTimerRef.current) {
          clearTimeout(suggestedUsersTimerRef.current);
        }
      };
    }
  }, [profileUser?.username, currentUser?.username, initialLoadRef.current, loadingMore, fetchSuggestedUsers]);



  // Calculate analytics data - with improved debounce to prevent excessive refreshes
  const analyticsTimerRef = useRef(null);
  const lastAnalyticsUpdateRef = useRef(0);

  useEffect(() => {
    // Only fetch stats if this is the current user's profile and we have a valid user ID
    if (isCurrentUser && profileUser && profileUser._id) {
      // Check if we've recently updated stats (within last 30 seconds)
      const now = Date.now();
      const thirtySeconds = 30 * 1000;

      if (now - lastAnalyticsUpdateRef.current < thirtySeconds) {
        // Skip this update if we've recently updated
        return;
      }

      // Clear any existing timer
      if (analyticsTimerRef.current) {
        clearTimeout(analyticsTimerRef.current);
      }

      // Set a new timer with longer debounce (1 second)
      analyticsTimerRef.current = setTimeout(() => {
        fetchUserStats(profileUser._id, false); // false means don't force refresh
        lastAnalyticsUpdateRef.current = Date.now(); // Update the last update timestamp
      }, 1000); // 1 second debounce
    }

    // Cleanup function
    return () => {
      if (analyticsTimerRef.current) {
        clearTimeout(analyticsTimerRef.current);
      }
    };
  }, [isCurrentUser, profileUser?.username, fetchUserStats]); // Only depend on username, not the entire profileUser object

  // Analytics state is already defined at the top of the component

  // Handle viewing a suggested user's profile
  const handleViewSuggestedProfile = (user) => {
    // Set the selected user profile and open the dialog
    setSelectedUserProfile(user);
    setProfileDialogOpen(true);
  };

  // Handle viewing a suggested user's profile (continued)
  // Note: handleCloseProfileDialog and handleNavigateToProfile are defined later in the file

  // Handle menu open
  const handleMenuOpen = (event, item, type) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedItem(item);
    setConfirmDialogType(type);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedItem(null);
  };

  // Handle toggling post pin status
  const handleTogglePostPin = async (postId) => {
    if (!postId) return;
    handleMenuClose();

    try {
      // Find the post
      const post = posts.find(p => p._id === postId);
      if (!post) return;

      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, isPinned: !p.isPinned } : p
        )
      );

      // Show success message
      setSnackbarMessage(post.isPinned ? 'Post unpinned from profile' : 'Post pinned to profile');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await postService.togglePin(postId);
    } catch (err) {
      console.error('Error toggling post pin:', err);

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, isPinned: !p.isPinned } : p
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update post. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling reel pin status
  const handleToggleReelPin = async (reelId) => {
    if (!reelId) return;
    handleMenuClose();

    try {
      // Find the reel
      const reel = reels.find(r => r._id === reelId);
      if (!reel) return;

      // Optimistic update
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, isPinned: !r.isPinned } : r
        )
      );

      // Show success message
      setSnackbarMessage(reel.isPinned ? 'Reel unpinned from profile' : 'Reel pinned to profile');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await reelService.togglePin(reelId);
    } catch (err) {
      console.error('Error toggling reel pin:', err);

      // Revert optimistic update on error
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, isPinned: !r.isPinned } : r
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update reel. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling post likes visibility
  const handleTogglePostLikes = async (postId) => {
    if (!postId) return;
    handleMenuClose();

    try {
      // Find the post
      const post = posts.find(p => p._id === postId);
      if (!post) return;

      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, hideLikes: !p.hideLikes } : p
        )
      );

      // Show success message
      setSnackbarMessage(post.hideLikes ? 'Likes count is now visible' : 'Likes count is now hidden');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await postService.updateVisibility(postId, { hideLikes: !post.hideLikes });
    } catch (err) {
      console.error('Error toggling post likes visibility:', err);

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, hideLikes: !p.hideLikes } : p
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update post. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling post comments visibility
  const handleTogglePostComments = async (postId) => {
    if (!postId) return;
    handleMenuClose();

    try {
      // Find the post
      const post = posts.find(p => p._id === postId);
      if (!post) return;

      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, hideComments: !p.hideComments } : p
        )
      );

      // Show success message
      setSnackbarMessage(post.hideComments ? 'Comments are now visible' : 'Comments are now hidden');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await postService.updateVisibility(postId, { hideComments: !post.hideComments });
    } catch (err) {
      console.error('Error toggling post comments visibility:', err);

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, hideComments: !p.hideComments } : p
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update post. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling post commenting ability
  const handleTogglePostCommenting = async (postId) => {
    if (!postId) return;
    handleMenuClose();

    try {
      // Find the post
      const post = posts.find(p => p._id === postId);
      if (!post) return;

      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, allowComments: !p.allowComments } : p
        )
      );

      // Show success message
      setSnackbarMessage(post.allowComments ? 'Commenting disabled for this post' : 'Commenting enabled for this post');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await postService.updateSettings(postId, { allowComments: !post.allowComments });
    } catch (err) {
      console.error('Error toggling post commenting ability:', err);

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, allowComments: !p.allowComments } : p
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update post. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling reel likes visibility
  const handleToggleReelLikes = async (reelId) => {
    if (!reelId) return;
    handleMenuClose();

    try {
      // Find the reel
      const reel = reels.find(r => r._id === reelId);
      if (!reel) return;

      // Optimistic update
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, hideLikes: !r.hideLikes } : r
        )
      );

      // Show success message
      setSnackbarMessage(reel.hideLikes ? 'Likes count is now visible' : 'Likes count is now hidden');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await reelService.updateVisibility(reelId, { hideLikes: !reel.hideLikes });
    } catch (err) {
      console.error('Error toggling reel likes visibility:', err);

      // Revert optimistic update on error
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, hideLikes: !r.hideLikes } : r
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update reel. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling reel comments visibility
  const handleToggleReelComments = async (reelId) => {
    if (!reelId) return;
    handleMenuClose();

    try {
      // Find the reel
      const reel = reels.find(r => r._id === reelId);
      if (!reel) return;

      // Optimistic update
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, hideComments: !r.hideComments } : r
        )
      );

      // Show success message
      setSnackbarMessage(reel.hideComments ? 'Comments are now visible' : 'Comments are now hidden');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await reelService.updateVisibility(reelId, { hideComments: !reel.hideComments });
    } catch (err) {
      console.error('Error toggling reel comments visibility:', err);

      // Revert optimistic update on error
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, hideComments: !r.hideComments } : r
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update reel. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling reel views visibility
  const handleToggleReelViews = async (reelId) => {
    if (!reelId) return;
    handleMenuClose();

    try {
      // Find the reel
      const reel = reels.find(r => r._id === reelId);
      if (!reel) return;

      // Optimistic update
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, hideViews: !r.hideViews } : r
        )
      );

      // Show success message
      setSnackbarMessage(reel.hideViews ? 'Views count is now visible' : 'Views count is now hidden');
      setSnackbarOpen(true);

      // Make API call to update reel visibility
      await reelService.updateReel(reelId, { hideViews: !reel.hideViews });
    } catch (err) {
      console.error('Error toggling reel views visibility:', err);

      // Revert optimistic update on error
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, hideViews: !r.hideViews } : r
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update reel. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle opening profile picture editor
  const handleOpenProfilePictureEditor = () => {
    setProfilePictureEditorOpen(true);
  };

  // Handle opening edit profile dialog
  const handleOpenEditProfileDialog = () => {
    setEditProfileDialogOpen(true);
  };

  // Handle closing profile dialog
  const handleCloseProfileDialog = () => {
    setProfileDialogOpen(false);
    setSelectedUserProfile(null);
  };

  // Handle navigating to a user's profile
  const handleNavigateToProfile = (username) => {
    if (username) {
      navigate(`/profile/${username}`);
      handleCloseProfileDialog();
    }
  };

  // Handle profile update success
  const handleProfileUpdateSuccess = (updatedUser) => {
    console.log('Profile updated successfully:', updatedUser);

    // Update the profile user state with the updated user data
    setProfileUser(prev => ({
      ...prev,
      ...updatedUser
    }));

    // Update follower/following counts if they've changed
    if (updatedUser.followerCount !== undefined) {
      setFollowersCount(updatedUser.followerCount);
    }

    if (updatedUser.followingCount !== undefined) {
      setFollowingCount(updatedUser.followingCount);
    }

    // Refresh profile stats
    fetchUserStats(updatedUser._id, true);

    // Update any cached data that might be using the old username
    if (updatedUser.username !== username) {
      // Show special message for username change
      setSnackbarMessage(`Username updated to @${updatedUser.username}. Redirecting...`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Navigate to the new profile URL after a short delay
      setTimeout(() => {
        navigate(`/profile/${updatedUser.username}`, { replace: true });
      }, 1500);
    } else {
      // Show success message
      setSnackbarMessage('Profile updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }

    // Refresh profile data after a short delay
    setTimeout(() => {
      handleRefreshProfile();
    }, 1000);
  };

  // Handle opening edit dialog
  const handleOpenEditDialog = (item, type) => {
    if (!item) return;

    setEditItem(item);
    setEditDialogType(type);
    setEditCaption(item.caption || '');
    setEditIsHidden(item.isHidden || false);
    setEditHideLikes(item.hideLikes || false);
    setEditHideComments(item.hideComments || false);
    setEditAllowComments(item.allowComments !== false); // Default to true if not specified

    setEditDialogOpen(true);
    handleMenuClose();
  };

  // Handle saving edits
  const handleSaveEdit = () => {
    if (!editItem || !editDialogType) return;

    try {
      const updatedItem = {
        ...editItem,
        caption: editCaption,
        isHidden: editIsHidden,
        hideLikes: editHideLikes,
        hideComments: editHideComments,
        allowComments: editAllowComments
      };

      if (editDialogType === 'post') {
        // Update post in state
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p._id === editItem._id ? updatedItem : p
          )
        );

        // API call would go here in a real implementation
        // await postService.updatePost(editItem._id, updatedItem);
      } else if (editDialogType === 'reel') {
        // Update reel in state
        setReels(prevReels =>
          prevReels.map(r =>
            r._id === editItem._id ? updatedItem : r
          )
        );

        // API call would go here in a real implementation
        // await reelService.updateReel(editItem._id, updatedItem);
      }

      // Show success message
      setSnackbarMessage(`${editDialogType === 'post' ? 'Post' : 'Reel'} updated successfully`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Close dialog
      setEditDialogOpen(false);
    } catch (err) {
      console.error(`Error updating ${editDialogType}:`, err);
      setSnackbarMessage(`Failed to update ${editDialogType}. Please try again.`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle refreshing profile data with improved debounce and state management
  const refreshTimerRef = useRef(null);
  const lastRefreshTimeRef = useRef(0);
  const isRefreshingRef = useRef(false); // Track refresh state in a ref to avoid re-renders

  const handleRefreshProfile = async () => {
    // Prevent multiple refreshes within 10 seconds
    const now = Date.now();
    const cooldownPeriod = 10000; // 10 seconds

    // Check if we're already refreshing or in cooldown period
    if (isRefreshingRef.current) {
      setSnackbarMessage('Already refreshing profile data...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    if (now - lastRefreshTimeRef.current < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - (now - lastRefreshTimeRef.current)) / 1000);
      setSnackbarMessage(`Please wait ${remainingTime} seconds before refreshing again`);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    // Clear any existing refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    try {
      // Set refreshing state both in state and ref
      setRefreshing(true);
      isRefreshingRef.current = true;
      lastRefreshTimeRef.current = now;

      // Show refreshing message
      setSnackbarMessage('Refreshing profile data...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);

      // Fetch user profile
      const userData = await fetchUserProfile();
      if (!userData) {
        throw new Error('Failed to fetch user profile');
      }

      // Use sequential fetching instead of Promise.all to reduce concurrent requests
      // First fetch posts as they're most important
      await fetchUserPosts(userData._id, 1);

      // Then fetch stats
      await fetchUserStats(userData._id, true); // true means force refresh

      // Then fetch other content with a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchUserReels(userData._id, 1);

      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchUserLivestreams(userData._id, 1);

      // Fetch saved content if this is the current user's profile
      if (userData.isMe || (currentUser && userData._id === currentUser._id)) {
        await new Promise(resolve => setTimeout(resolve, 300));
        await fetchSavedContent(1);
      }

      setSnackbarMessage('Profile refreshed successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setSnackbarMessage('Failed to refresh profile. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      // Set a small delay before changing the refreshing state to avoid UI flicker
      setTimeout(() => {
        setRefreshing(false);
        isRefreshingRef.current = false;
      }, 500);
    }
  };

  // Handle toggling post visibility
  const handleTogglePostVisibility = async (postId) => {
    if (!postId) return;
    handleMenuClose();

    try {
      // Find the post
      const post = posts.find(p => p._id === postId);
      if (!post) return;

      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, isHidden: !p.isHidden } : p
        )
      );

      // Show success message
      setSnackbarMessage(post.isHidden ? 'Post is now visible on your profile' : 'Post is now hidden from your profile');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await postService.updateVisibility(postId, { isHidden: !post.isHidden });
    } catch (err) {
      console.error('Error toggling post visibility:', err);

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? { ...p, isHidden: !p.isHidden } : p
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update post. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling reel visibility
  const handleToggleReelVisibility = async (reelId) => {
    if (!reelId) return;
    handleMenuClose();

    try {
      // Find the reel
      const reel = reels.find(r => r._id === reelId);
      if (!reel) return;

      // Optimistic update
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, isHidden: !r.isHidden } : r
        )
      );

      // Show success message
      setSnackbarMessage(reel.isHidden ? 'Reel is now visible on your profile' : 'Reel is now hidden from your profile');
      setSnackbarOpen(true);

      // Make API call to update reel visibility
      await reelService.updateReel(reelId, { isHidden: !reel.isHidden });
    } catch (err) {
      console.error('Error toggling reel visibility:', err);

      // Revert optimistic update on error
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, isHidden: !r.isHidden } : r
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update reel. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle toggling reel commenting ability
  const handleToggleReelCommenting = async (reelId) => {
    if (!reelId) return;
    handleMenuClose();

    try {
      // Find the reel
      const reel = reels.find(r => r._id === reelId);
      if (!reel) return;

      // Optimistic update
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, allowComments: !r.allowComments } : r
        )
      );

      // Show success message
      setSnackbarMessage(reel.allowComments ? 'Commenting disabled for this reel' : 'Commenting enabled for this reel');
      setSnackbarOpen(true);

      // API call would go here in a real implementation
      // await reelService.updateSettings(reelId, { allowComments: !reel.allowComments });
    } catch (err) {
      console.error('Error toggling reel commenting ability:', err);

      // Revert optimistic update on error
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId ? { ...r, allowComments: !r.allowComments } : r
        )
      );

      // Show error message
      setSnackbarMessage('Failed to update reel. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle sharing post
  const handleSharePost = (post) => {
    if (!post) return;
    handleMenuClose();

    // In a real implementation, this would open a share dialog
    // For now, just show a success message
    setSnackbarMessage('Post sharing feature coming soon!');
    setSnackbarOpen(true);
  };

  // Handle sharing reel
  const handleShareReel = (reel) => {
    if (!reel) return;
    handleMenuClose();

    // In a real implementation, this would open a share dialog
    // For now, just show a success message
    setSnackbarMessage('Reel sharing feature coming soon!');
    setSnackbarOpen(true);
  };

  // Open confirmation dialog
  const openConfirmDialog = (action) => {
    setConfirmDialogAction(action);
    setConfirmDialogItem(selectedItem);
    setConfirmDialogOpen(true);
    handleMenuClose();
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmDialogAction(null);
    setConfirmDialogItem(null);
  };

  // Handle dialog confirm
  const handleDialogConfirm = async () => {
    if (!confirmDialogAction || !confirmDialogItem) {
      handleDialogClose();
      return;
    }

    try {
      switch (confirmDialogAction) {
        case 'delete':
          if (confirmDialogType === 'post') {
            await handleDeletePost(confirmDialogItem._id);
          } else if (confirmDialogType === 'reel') {
            await handleDeleteReel(confirmDialogItem._id);
          } else if (confirmDialogType === 'livestream') {
            await handleDeleteLivestream(confirmDialogItem._id);
          }
          break;
        case 'archive':
          if (confirmDialogType === 'post') {
            await handleArchivePost(confirmDialogItem._id);
          } else if (confirmDialogType === 'reel') {
            await handleArchiveReel(confirmDialogItem._id);
          }
          break;
        case 'unarchive':
          if (confirmDialogType === 'post') {
            await handleUnarchivePost(confirmDialogItem._id);
          } else if (confirmDialogType === 'reel') {
            await handleUnarchiveReel(confirmDialogItem._id);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Error performing ${confirmDialogAction} action:`, err);
    } finally {
      handleDialogClose();
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Handle reel deletion
  const handleDeleteReel = async (reelId) => {
    try {
      await reelService.deleteReel(reelId);
      setReels(prevReels => prevReels.filter(reel => reel._id !== reelId));
    } catch (err) {
      console.error('Error deleting reel:', err);
    }
  };

  // Handle livestream deletion
  const handleDeleteLivestream = async (livestreamId) => {
    try {
      await liveService.deleteStream(livestreamId);
      setLivestreams(prevLivestreams => prevLivestreams.filter(stream => stream._id !== livestreamId));
    } catch (err) {
      console.error('Error deleting livestream:', err);
    }
  };

  // Handle post archiving
  const handleArchivePost = async (postId) => {
    try {
      await postService.archivePost(postId);
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    } catch (err) {
      console.error('Error archiving post:', err);
    }
  };

  // Handle post unarchiving
  const handleUnarchivePost = async (postId) => {
    try {
      await postService.unarchivePost(postId);
      // Refresh posts to include the unarchived post
      if (profileUser && profileUser._id) {
        fetchUserPosts(profileUser._id, 1);
      }
    } catch (err) {
      console.error('Error unarchiving post:', err);
    }
  };

  // Handle reel archiving
  const handleArchiveReel = async (reelId) => {
    try {
      await reelService.archiveReel(reelId);
      setReels(prevReels => prevReels.filter(reel => reel._id !== reelId));
    } catch (err) {
      console.error('Error archiving reel:', err);
    }
  };

  // Handle reel unarchiving
  const handleUnarchiveReel = async (reelId) => {
    try {
      await reelService.unarchiveReel(reelId);
      // Refresh reels to include the unarchived reel
      if (profileUser && profileUser._id) {
        fetchUserReels(profileUser._id, 1);
      }
    } catch (err) {
      console.error('Error unarchiving reel:', err);
    }
  };

  // Handle saving/unsaving posts and reels
  const handleSaveItem = async (item, type) => {
    if (!item || !item._id) return;

    try {
      if (type === 'post') {
        if (item.isSaved) {
          await savedService.unsavePost(item._id);
        } else {
          await savedService.savePost(item._id);
        }

        // Update the post's saved status
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === item._id ? { ...post, isSaved: !post.isSaved } : post
          )
        );
      } else if (type === 'reel') {
        if (item.isSaved) {
          await savedService.unsaveReel(item._id);
        } else {
          await savedService.saveReel(item._id);
        }

        // Update the reel's saved status
        setReels(prevReels =>
          prevReels.map(reel =>
            reel._id === item._id ? { ...reel, isSaved: !reel.isSaved } : reel
          )
        );
      }
    } catch (err) {
      console.error(`Error saving/unsaving ${type}:`, err);
    }
  };

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // This function is already defined above, so we're removing the duplicate

  // Helper function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setSnackbarMessage('Link copied to clipboard!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        handleMenuClose();
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        setSnackbarMessage('Failed to copy link. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  };

  // Improved infinite scroll observer setup with debounce
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    // Create a more efficient observer with debounce
    const handleIntersection = (entries) => {
      // Only proceed if we're not already loading and the element is intersecting
      if (entries[0].isIntersecting && !loadingMore && !isLoadingMoreRef.current) {
        // Clear any existing timer
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }

        // Set a flag to prevent multiple triggers
        isLoadingMoreRef.current = true;

        // Add a small delay to prevent rapid firing
        scrollTimerRef.current = setTimeout(() => {
          loadMoreContent();
          // Reset the flag after a short delay to allow UI to update
          setTimeout(() => {
            isLoadingMoreRef.current = false;
          }, 500);
        }, 300);
      }
    };

    const observer = new IntersectionObserver(
      handleIntersection,
      {
        threshold: 0.2,  // Lower threshold to trigger earlier
        rootMargin: '100px' // Load more content before user reaches the end
      }
    );

    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      if (sentinel) {
        observer.unobserve(sentinel);
      }
      observer.disconnect();
    };
  }, [loadMoreContent, loadingMore, activeTab]); // Add activeTab to dependencies

  // Global cleanup function to clear all timers on unmount
  useEffect(() => {
    return () => {
      // Clear all pending timers
      if (analyticsTimerRef.current) clearTimeout(analyticsTimerRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (initialLoadTimerRef.current) clearTimeout(initialLoadTimerRef.current);
      if (suggestedUsersTimerRef.current) clearTimeout(suggestedUsersTimerRef.current);
      if (tabChangeTimerRef.current) clearTimeout(tabChangeTimerRef.current);

      // Reset all ref flags to prevent memory leaks
      if (isRefreshingRef.current) isRefreshingRef.current = false;
      if (isLoadingMoreRef.current) isLoadingMoreRef.current = false;
      if (initialLoadRef.current) initialLoadRef.current = false;
      if (isTabChangingRef.current) isTabChangingRef.current = false;
      if (suggestedUsersFetchedRef.current) suggestedUsersFetchedRef.current = false;
    };
  }, []);

  // Loading state with animated skeletons
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 3 }}>
            {/* Avatar skeleton */}
            <Skeleton
              variant="circular"
              width={150}
              height={150}
              animation="wave"
              sx={{
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}
            />

            {/* Profile info skeleton */}
            <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Skeleton variant="text" width={200} height={40} animation="wave" />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant="rounded" width={100} height={36} animation="wave" />
                  <Skeleton variant="rounded" width={100} height={36} animation="wave" />
                </Box>
              </Box>

              {/* Stats skeleton */}
              <Box sx={{
                display: 'flex',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                gap: { xs: 3, sm: 4 },
                mb: 2
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width={40} height={30} animation="wave" />
                  <Skeleton variant="text" width={60} height={20} animation="wave" />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width={40} height={30} animation="wave" />
                  <Skeleton variant="text" width={60} height={20} animation="wave" />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width={40} height={30} animation="wave" />
                  <Skeleton variant="text" width={60} height={20} animation="wave" />
                </Box>
              </Box>

              {/* Bio skeleton */}
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Skeleton variant="text" width="80%" height={20} animation="wave" />
                <Skeleton variant="text" width="60%" height={20} animation="wave" />
                <Skeleton variant="text" width="40%" height={20} animation="wave" />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Tabs skeleton */}
        <Skeleton variant="rectangular" width="100%" height={50} animation="wave" sx={{ borderRadius: 1, mb: 3 }} />

        {/* Content skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
          {[...Array(9)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width="100%"
              height={0}
              animation={index % 2 === 0 ? "wave" : "pulse"}
              sx={{
                paddingTop: '100%',
                borderRadius: 2,
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                transform: `scale(${1 - (index % 3) * 0.05})`,
                transformOrigin: 'center',
                transition: 'transform 0.3s ease'
              }}
            />
          ))}
        </Box>
      </Container>
    );
  }

  // Error state with better error handling and visual feedback
  if (error && !profileUser) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: theme => `1px solid ${theme.palette.primary.light}`,
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.05)' : 'rgba(25,118,210,0.02)',
            boxShadow: 2,
            animation: 'fadeIn 0.5s ease-in-out'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.light',
                border: '4px solid',
                borderColor: 'primary.main',
                boxShadow: 3,
                animation: 'pulse 2s infinite',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {error === 'Please use a username instead of an email address' ? (
                <AlternateEmailIcon sx={{ fontSize: 50, color: 'white' }} />
              ) : (
                <PersonOffIcon sx={{ fontSize: 50, color: 'white' }} />
              )}
            </Box>
          </Box>

          <Typography variant="h5" color="primary" gutterBottom>
            {error === 'Please use a username instead of an email address' ? 'Username Required' : 'Profile Not Found'}
          </Typography>

          {error === 'Please use a username instead of an email address' ? (
            <>
              <Typography variant="body1" color="text.primary" paragraph>
                Please use a username instead of an email address to access profiles.
              </Typography>
            </>
          ) : (
            <Typography variant="body1" color="text.primary" paragraph>
              We couldn't find the profile <strong>"{username}"</strong>. This could be because:
            </Typography>
          )}

          <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto', mb: 3, bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
            {error === 'Please use a username instead of an email address' ? (
              <>
                <Typography variant="body1" color="text.primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon color="primary" fontSize="small" /> Profile URLs: /profile/<strong>username</strong>
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon color="primary" fontSize="small" /> Search by email to find users
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1" color="text.primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorOutlineIcon color="error" fontSize="small" /> The username may be incorrect
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonOffIcon color="error" fontSize="small" /> The user may have deleted their account
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudOffIcon color="error" fontSize="small" /> There might be a temporary server issue
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RefreshIcon color="primary" fontSize="small" /> Try refreshing the page or checking your connection
                </Typography>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {error === 'Please use a username instead of an email address' ? (
              <>
                <Button
                  component={Link}
                  to="/"
                  variant="outlined"
                  color="primary"
                  startIcon={<SearchIcon />}
                  sx={{
                    mt: 2,
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 1 }
                  }}
                  onClick={() => {
                    // Focus on the search input in the navbar when redirected to home
                    setTimeout(() => {
                      const searchInput = document.getElementById('search-input');
                      if (searchInput) {
                        searchInput.focus();
                      }
                    }, 100);
                  }}
                >
                  Search for users
                </Button>
                <Button
                  component={Link}
                  to="/"
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowForwardIcon />}
                  sx={{
                    mt: 2,
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                  }}
                >
                  Go to home page
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outlined"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  sx={{
                    mt: 2,
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 1 }
                  }}
                >
                  Try again
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  color="secondary"
                  startIcon={<PersonAddIcon />}
                  sx={{
                    mt: 2,
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                  }}
                >
                  Create an account
                </Button>
                <Button
                  component={Link}
                  to="/"
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowForwardIcon />}
                  sx={{
                    mt: 2,
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                  }}
                >
                  Go to home page
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        py: { xs: 2, md: 4 },
        animation: 'fadeIn 0.5s ease-in-out',
        ...globalStyles
      }}
    >
      {/* Profile Header - Simplified */}
      <Paper
        elevation={1}
        sx={{
          mb: 3,
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Cover Image */}
        <Box
          sx={{
            height: { xs: 120, sm: 160, md: 180 },
            width: '100%',
            background: profileUser?.coverImage
              ? `url(${profileUser.coverImage}${profileUser.coverImageTimestamp ? `?t=${profileUser.coverImageTimestamp}` : ''})`
              : 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: isCurrentUser ? 'pointer' : 'default',
            '&:hover': isCurrentUser ? {
              '&::after': {
                content: '"Change Cover Photo"',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: { xs: 120, sm: 160, md: 180 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }
            } : {}
          }}
          onClick={() => isCurrentUser && setCoverPhotoEditorOpen(true)}
        >
          {isCurrentUser && (
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255,255,255,0.8)',
                color: 'text.primary'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCoverPhotoEditorOpen(true);
              }}
            >
              <CameraAltIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Box sx={{
          p: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: 2,
          mt: { xs: -6, sm: -7 },
          position: 'relative'
        }}>
          {/* Avatar */}
          <Box sx={{ position: 'relative' }}>
            <ProfilePicture
              user={profileUser}
              size={{ width: { xs: 100, sm: 120 }, height: { xs: 100, sm: 120 } }}
              linkToProfile={false}
              sx={{
                border: '3px solid white',
                bgcolor: 'white',
                cursor: isCurrentUser ? 'pointer' : 'default'
              }}
              onClick={isCurrentUser ? handleOpenProfilePictureEditor : undefined}
            />
          </Box>

          {/* Profile Info - Simplified */}
          <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
            {/* Username and Actions */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                    {profileUser?.username || 'User'}
                  </Typography>
                  {profileUser?.isOnline && (
                    <Chip
                      size="small"
                      label="Online"
                      color="success"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {isCurrentUser ? (
                  <>
                    <Button
                      onClick={handleOpenEditProfileDialog}
                      variant="contained"
                      color="primary"
                      startIcon={<EditIcon />}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      Edit Profile
                    </Button>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={handleRefreshProfile}
                      disabled={refreshing}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <FollowButton
                      user={profileUser}
                      variant="profile"
                      size="small"
                      onFollowChange={({ status, followerCount, followingCount }) => {
                        setIsFollowing(status === 'following');

                        // Update follower count if provided, otherwise use the increment/decrement logic
                        if (typeof followerCount === 'number') {
                          setFollowersCount(followerCount);
                        } else {
                          setFollowersCount(prev => status === 'following' ? prev + 1 : Math.max(0, prev - 1));
                        }

                        // Update the current user's following count in the auth context if provided
                        if (typeof followingCount === 'number' && updateCurrentUser) {
                          updateCurrentUser(prev => ({
                            ...prev,
                            followingCount: followingCount
                          }));
                        }
                      }}
                    />
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={handleRefreshProfile}
                      disabled={refreshing}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>

            {/* Stats */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                mb: 2,
                mt: 1,
                px: 2
              }}
            >
              <Box
                sx={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, color 0.2s ease',
                  '&:hover': { transform: 'translateY(-3px)' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
                onClick={() => handleTabChange(null, 0)}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: 'primary.main',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -2,
                      left: '50%',
                      width: '0%',
                      height: '2px',
                      bgcolor: 'primary.main',
                      transition: 'width 0.3s ease, left 0.3s ease',
                    },
                    '&:hover::after': {
                      width: '100%',
                      left: '0%',
                    }
                  }}
                >
                  {posts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Posts
                </Typography>
              </Box>

              <Box
                sx={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, color 0.2s ease',
                  '&:hover': { transform: 'translateY(-3px)' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
                onClick={() => {
                  setFollowersDialogTab('followers');
                  setFollowersDialogOpen(true);
                }}
              >
                <Box sx={{ position: 'relative', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -2,
                        left: '50%',
                        width: '0%',
                        height: '2px',
                        bgcolor: 'primary.main',
                        transition: 'width 0.3s ease, left 0.3s ease',
                      },
                      '&:hover::after': {
                        width: '100%',
                        left: '0%',
                      },
                      animation: followersCount > 0 ? `${pulseAnimation} 0.5s ease-out` : 'none'
                    }}
                  >
                    {followersCount.toLocaleString()}
                  </Typography>
                  {followersCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -5,
                        right: -10,
                        bgcolor: 'success.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        opacity: 0.9,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          opacity: 1
                        }
                      }}
                    >
                      <PersonIcon fontSize="inherit" />
                    </Box>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <PeopleIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                  Followers
                </Typography>
              </Box>

              <Box
                sx={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, color 0.2s ease',
                  '&:hover': { transform: 'translateY(-3px)' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
                onClick={() => {
                  setFollowersDialogTab('following');
                  setFollowersDialogOpen(true);
                }}
              >
                <Box sx={{ position: 'relative', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -2,
                        left: '50%',
                        width: '0%',
                        height: '2px',
                        bgcolor: 'primary.main',
                        transition: 'width 0.3s ease, left 0.3s ease',
                      },
                      '&:hover::after': {
                        width: '100%',
                        left: '0%',
                      },
                      animation: followingCount > 0 ? `${pulseAnimation} 0.5s ease-out` : 'none'
                    }}
                  >
                    {followingCount.toLocaleString()}
                  </Typography>
                  {followingCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -5,
                        right: -10,
                        bgcolor: 'info.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        opacity: 0.9,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          opacity: 1
                        }
                      }}
                    >
                      <PersonAddIcon fontSize="inherit" />
                    </Box>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <PersonAddIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                  Following
                </Typography>
              </Box>

              {reels.length > 0 && (
                <Box
                  sx={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, color 0.2s ease',
                    '&:hover': { transform: 'translateY(-3px)' },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                  onClick={() => handleTabChange(null, 1)}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -2,
                        left: '50%',
                        width: '0%',
                        height: '2px',
                        bgcolor: 'primary.main',
                        transition: 'width 0.3s ease, left 0.3s ease',
                      },
                      '&:hover::after': {
                        width: '100%',
                        left: '0%',
                      }
                    }}
                  >
                    {reels.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reels
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Bio */}
            {profileUser?.bio && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                {profileUser.bio}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Profile Analytics - Minimal */}
      {isCurrentUser && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 3,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1
          }}
        >
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <VisibilityIcon color="primary" fontSize="small" />
            <Typography variant="h6">{profileViews}</Typography>
            <Typography variant="caption">Views</Typography>
          </Box>

          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <FavoriteIcon color="secondary" fontSize="small" />
            <Typography variant="h6">{totalLikes}</Typography>
            <Typography variant="caption">Likes</Typography>
          </Box>

          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <CommentIcon color="info" fontSize="small" />
            <Typography variant="h6">{totalComments}</Typography>
            <Typography variant="caption">Comments</Typography>
          </Box>
        </Box>
      )}

      {/* Suggested Users - Minimal */}
      {suggestedUsers.length > 0 ? (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1">
              <PersonAddIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Suggested People
            </Typography>
            <IconButton size="small" onClick={() => fetchSuggestedUsers()} disabled={loadingSuggestions}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>

          {loadingSuggestions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {suggestedUsers.slice(0, 3).map((user) => (
                <Box
                  key={user._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    flex: '1 1 30%',
                    minWidth: '120px'
                  }}
                >
                  <ProfilePicture
                    user={user}
                    linkToProfile={true}
                    size={{ width: 32, height: 32 }}
                    sx={{ mr: 1 }}
                  />
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {user.username}
                    </Typography>
                  </Box>
                  <FollowButton
                    user={user}
                    variant="icon"
                    size="small"
                    onFollowChange={({ userId, status }) => {
                      if (status === 'following') {
                        setSuggestedUsers(prev => prev.filter(u => u._id !== userId));
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ) : loadingSuggestions ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1, mb: 3 }}>
          <CircularProgress size={20} />
        </Box>
      ) : (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={fetchSuggestedUsers}
          >
            Find People to Follow
          </Button>
        </Box>
      )}

      {/* Content Tabs - Simplified */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="profile tabs"
        >
          <Tab
            label="Posts"
            icon={<FavoriteIcon fontSize="small" />}
            iconPosition="top"
          />
          <Tab
            label="Reels"
            icon={<VideoIcon fontSize="small" />}
            iconPosition="top"
          />
          <Tab
            label="Livestreams"
            icon={<LiveIcon fontSize="small" />}
            iconPosition="top"
          />
          {isCurrentUser && (
            <Tab
              label="Saved"
              icon={<BookmarkIcon fontSize="small" />}
              iconPosition="top"
            />
          )}
        </Tabs>
      </Box>

      {/* Content Display */}
      <Box sx={{ mb: 4 }}>
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {Array.isArray(posts) && posts.length > 0 ? (
              <>
                {/* Pinned Posts Section - Simplified */}
                {posts.some(post => post.isPinned) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      <PushPinIcon sx={{ mr: 1 }} /> Pinned
                    </Typography>
                    <Grid container spacing={2}>
                      {posts
                        .filter(post => post.isPinned)
                        .map(post => (
                          <Grid item xs={6} sm={4} key={`pinned-${post._id}`}>
                            <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: 'primary.main' }}>
                              <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Chip icon={<PushPinIcon fontSize="small" />} label="Pinned" size="small" color="primary" />
                              </Box>
                              <CardMedia
                                component="img"
                                image={post.media?.[0]?.url || post.image || '/assets/default-avatar.png'}
                                alt={post.caption}
                                loading="lazy"
                                sx={{ cursor: 'pointer', aspectRatio: '1/1', objectFit: 'cover' }}
                                onClick={() => navigate(`/post/${post._id}`)}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assets/default-avatar.png';
                                }}
                              />
                              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                                  <FavoriteIcon fontSize="small" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">{post.likesCount || 0}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                                  <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">{post.commentsCount || 0}</Typography>
                                </Box>
                              </Box>
                              {isCurrentUser && (
                                <IconButton
                                  size="small"
                                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                                  onClick={(e) => handleMenuOpen(e, post, 'post')}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                )}

                {/* Regular Posts Section */}
                <Box sx={{ mb: 3 }}>
                  {posts.some(post => post.isPinned) && (
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Posts</Typography>
                  )}
                  <Grid container spacing={2}>
                    {posts
                      .filter(post => !post.isPinned)
                      .map(post => (
                        <Grid item xs={6} sm={4} key={post._id}>
                          <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                            <CardMedia
                              component="img"
                              image={post.media?.[0]?.url || post.image || '/assets/default-avatar.png'}
                              alt={post.caption}
                              loading="lazy"
                              sx={{ cursor: 'pointer', aspectRatio: '1/1', objectFit: 'cover' }}
                              onClick={() => navigate(`/post/${post._id}`)}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/default-avatar.png';
                              }}
                            />
                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                                <FavoriteIcon fontSize="small" sx={{ mr: 0.5, opacity: post.hideLikes ? 0.5 : 1 }} />
                                {!post.hideLikes ? (
                                  <Typography variant="body2">{post.likesCount || 0}</Typography>
                                ) : (
                                  <Typography variant="body2" sx={{ opacity: 0.5 }}>•••</Typography>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                                <CommentIcon fontSize="small" sx={{ mr: 0.5, opacity: post.hideComments ? 0.5 : 1 }} />
                                {!post.hideComments ? (
                                  <Typography variant="body2">{post.commentsCount || 0}</Typography>
                                ) : (
                                  <Typography variant="body2" sx={{ opacity: 0.5 }}>•••</Typography>
                                )}
                              </Box>
                            </Box>
                            {post.isHidden && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  bgcolor: 'rgba(0,0,0,0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 1
                                }}
                              >
                                <Typography variant="body1" color="white">
                                  Hidden Post
                                </Typography>
                              </Box>
                            )}
                            {isCurrentUser && (
                              <IconButton
                                size="small"
                                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                                onClick={(e) => handleMenuOpen(e, post, 'post')}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              </>
            ) : (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>No posts yet</Typography>
                {isCurrentUser && (
                  <Button
                    component={Link}
                    to="/create"
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{ mt: 1 }}
                  >
                    Create your first post
                  </Button>
                )}
              </Paper>
            )}
          </>
        )}

        {/* Reels Tab */}
        {activeTab === 'reels' && (
          <>
            {Array.isArray(reels) && reels.length > 0 ? (
              <>
                {/* Pinned Reels Section - Simplified */}
                {reels.some(reel => reel.isPinned) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      <PushPinIcon sx={{ mr: 1 }} /> Pinned Reels
                    </Typography>
                    <Grid container spacing={2}>
                      {reels
                        .filter(reel => reel.isPinned)
                        .map(reel => (
                          <Grid item xs={6} sm={4} key={`pinned-${reel._id}`}>
                            <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', aspectRatio: '9/16', border: '2px solid', borderColor: 'primary.main' }}>
                              <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Chip icon={<PushPinIcon fontSize="small" />} label="Pinned" size="small" color="primary" />
                              </Box>
                              <CardMedia
                                component="img"
                                image={reel.media?.thumbnail || reel.thumbnail || '/assets/default-avatar.png'}
                                alt={reel.caption}
                                sx={{ cursor: 'pointer', height: '100%', aspectRatio: '9/16', objectFit: 'cover' }}
                                onClick={() => navigate(`/reels/${reel._id}`)}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assets/default-avatar.png';
                                }}
                              />
                              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                                  <FavoriteIcon fontSize="small" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">{reel.likesCount || 0}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                                  <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">{reel.commentsCount || 0}</Typography>
                                </Box>
                              </Box>
                              {isCurrentUser && (
                                <IconButton
                                  size="small"
                                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                                  onClick={(e) => handleMenuOpen(e, reel, 'reel')}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                )}

                {/* Regular Reels Section */}
                <Box sx={{ mb: 3 }}>
                  {reels.some(reel => reel.isPinned) && (
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Reels</Typography>
                  )}
                  <Grid container spacing={2}>
                    {reels
                      .filter(reel => !reel.isPinned)
                      .map(reel => (
                        <Grid item xs={6} sm={4} key={reel._id}>
                          <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', aspectRatio: '9/16' }}>
                            <CardMedia
                              component="img"
                              image={reel.media?.thumbnail || reel.thumbnail || '/assets/default-avatar.png'}
                              alt={reel.caption}
                              sx={{ cursor: 'pointer', height: '100%', aspectRatio: '9/16', objectFit: 'cover' }}
                              onClick={() => navigate(`/reels/${reel._id}`)}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/default-avatar.png';
                              }}
                            />
                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                                <FavoriteIcon fontSize="small" sx={{ mr: 0.5, opacity: reel.hideLikes ? 0.5 : 1 }} />
                                {!reel.hideLikes ? (
                                  <Typography variant="body2">{reel.likesCount || 0}</Typography>
                                ) : (
                                  <Typography variant="body2" sx={{ opacity: 0.5 }}>•••</Typography>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                                <CommentIcon fontSize="small" sx={{ mr: 0.5, opacity: reel.hideComments ? 0.5 : 1 }} />
                                {!reel.hideComments ? (
                                  <Typography variant="body2">{reel.commentsCount || 0}</Typography>
                                ) : (
                                  <Typography variant="body2" sx={{ opacity: 0.5 }}>•••</Typography>
                                )}
                              </Box>
                            </Box>
                            {reel.isHidden && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  bgcolor: 'rgba(0,0,0,0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 1
                                }}
                              >
                                <Typography variant="body1" color="white">
                                  Hidden Reel
                                </Typography>
                              </Box>
                            )}
                            {isCurrentUser && (
                              <IconButton
                                size="small"
                                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                                onClick={(e) => handleMenuOpen(e, reel, 'reel')}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              </>
            ) : (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>No reels yet</Typography>
                {isCurrentUser && (
                  <Button
                    component={Link}
                    to="/create?tab=reel"
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{ mt: 1 }}
                  >
                    Create your first reel
                  </Button>
                )}
              </Paper>
            )}
          </>
        )}

        {/* Livestreams Tab */}
        {activeTab === 'livestreams' && (
          <>
            {Array.isArray(livestreams) && livestreams.length > 0 ? (
              <Grid container spacing={2}>
                {livestreams.map(stream => (
                  <Grid item xs={12} sm={6} md={4} key={stream._id}>
                    <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        image={stream.thumbnail || '/assets/default-avatar.png'}
                        alt={stream.title}
                        height={160}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/live/${stream._id}`)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/default-avatar.png';
                        }}
                      />
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                          {stream.title}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Chip
                            label={stream.status === 'live' ? 'LIVE' : 'Ended'}
                            color={stream.status === 'live' ? 'error' : 'default'}
                            size="small"
                            variant={stream.status === 'live' ? 'filled' : 'outlined'}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ViewIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">{stream.currentViewerCount || 0}</Typography>
                          </Box>
                        </Box>
                      </CardContent>

                      {isCurrentUser && (
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                          }}
                          onClick={(e) => handleMenuOpen(e, stream, 'livestream')}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>No livestreams yet</Typography>
                {isCurrentUser && (
                  <Button
                    component={Link}
                    to="/live/create"
                    variant="contained"
                    color="primary"
                    startIcon={<LiveIcon />}
                    sx={{ mt: 1 }}
                  >
                    Start a livestream
                  </Button>
                )}
              </Paper>
            )}
          </>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && isCurrentUser && (
          <>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Saved Posts</Typography>
            {Array.isArray(savedPosts) && savedPosts.length > 0 ? (
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {savedPosts.map(post => (
                  <Grid item xs={6} sm={4} key={post._id}>
                    <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        image={post.media?.[0]?.url || post.image || '/assets/default-avatar.png'}
                        alt={post.caption}
                        sx={{ cursor: 'pointer', aspectRatio: '1/1', objectFit: 'cover' }}
                        onClick={() => navigate(`/post/${post._id}`)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/default-avatar.png';
                        }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                          <FavoriteIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">{post.likesCount || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                          <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">{post.commentsCount || 0}</Typography>
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
                        onClick={() => handleSaveItem(post, 'post')}
                      >
                        <BookmarkIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2, mb: 4 }}>
                <Typography variant="body1">No saved posts yet</Typography>
              </Paper>
            )}

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Saved Reels</Typography>
            {Array.isArray(savedReels) && savedReels.length > 0 ? (
              <Grid container spacing={2}>
                {savedReels.map(reel => (
                  <Grid item xs={6} sm={4} key={reel._id}>
                    <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', aspectRatio: '9/16' }}>
                      <CardMedia
                        component="img"
                        image={reel.media?.thumbnail || reel.thumbnail || '/assets/default-avatar.png'}
                        alt={reel.caption}
                        sx={{ cursor: 'pointer', height: '100%', aspectRatio: '9/16', objectFit: 'cover' }}
                        onClick={() => navigate(`/reels/${reel._id}`)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/default-avatar.png';
                        }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                          <FavoriteIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">{reel.likesCount || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                          <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">{reel.commentsCount || 0}</Typography>
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
                        onClick={() => handleSaveItem(reel, 'reel')}
                      >
                        <BookmarkIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="body1">No saved reels yet</Typography>
              </Paper>
            )}
          </>
        )}

        {/* Loading indicator and Infinite Scroll Sentinel */}
        {loadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        <Box id="infinite-scroll-sentinel" sx={{ height: 20, mt: 4 }} />
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 180 }
          }
        }}
      >
        {confirmDialogType === 'post' && (
          <>
            <MenuItem onClick={() => handleOpenEditDialog(selectedItem, 'post')}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
            </MenuItem>
            <MenuItem onClick={() => handleTogglePostPin(selectedItem?._id)}>
              <PushPinIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.isPinned ? 'Unpin from Profile' : 'Pin to Profile'}
            </MenuItem>
            <MenuItem onClick={() => openConfirmDialog('archive')}>
              <ArchiveIcon fontSize="small" sx={{ mr: 1 }} /> Archive
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => handleTogglePostLikes(selectedItem?._id)}>
              <FavoriteIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.hideLikes ? 'Show Likes Count' : 'Hide Likes Count'}
            </MenuItem>
            <MenuItem onClick={() => handleTogglePostComments(selectedItem?._id)}>
              <CommentIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.hideComments ? 'Show Comments' : 'Hide Comments'}
            </MenuItem>
            <MenuItem onClick={() => handleTogglePostCommenting(selectedItem?._id)}>
              <CommentIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.allowComments ? 'Disable Commenting' : 'Enable Commenting'}
            </MenuItem>
            <MenuItem onClick={() => handleTogglePostVisibility(selectedItem?._id)}>
              {selectedItem?.isHidden ? (
                <>
                  <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                  Show Post
                </>
              ) : (
                <>
                  <VisibilityOffIcon fontSize="small" sx={{ mr: 1 }} />
                  Hide Post
                </>
              )}
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => handleSharePost(selectedItem)}>
              <ShareIcon fontSize="small" sx={{ mr: 1 }} /> Share
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => openConfirmDialog('delete')} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
            </MenuItem>
          </>
        )}

        {confirmDialogType === 'reel' && (
          <>
            <MenuItem onClick={() => handleOpenEditDialog(selectedItem, 'reel')}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
            </MenuItem>
            <MenuItem onClick={() => handleToggleReelPin(selectedItem?._id)}>
              <PushPinIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.isPinned ? 'Unpin from Profile' : 'Pin to Profile'}
            </MenuItem>
            <MenuItem onClick={() => openConfirmDialog('archive')}>
              <ArchiveIcon fontSize="small" sx={{ mr: 1 }} /> Archive
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => handleToggleReelLikes(selectedItem?._id)}>
              <FavoriteIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.hideLikes ? 'Show Likes Count' : 'Hide Likes Count'}
            </MenuItem>
            <MenuItem onClick={() => handleToggleReelComments(selectedItem?._id)}>
              <CommentIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.hideComments ? 'Show Comments' : 'Hide Comments'}
            </MenuItem>
            <MenuItem onClick={() => handleToggleReelViews(selectedItem?._id)}>
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.hideViews ? 'Show Views Count' : 'Hide Views Count'}
            </MenuItem>
            <MenuItem onClick={() => handleToggleReelCommenting(selectedItem?._id)}>
              <CommentIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedItem?.allowComments ? 'Disable Commenting' : 'Enable Commenting'}
            </MenuItem>
            <MenuItem onClick={() => handleToggleReelVisibility(selectedItem?._id)}>
              {selectedItem?.isHidden ? (
                <>
                  <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                  Show Reel
                </>
              ) : (
                <>
                  <VisibilityOffIcon fontSize="small" sx={{ mr: 1 }} />
                  Hide Reel
                </>
              )}
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => handleShareReel(selectedItem)}>
              <ShareIcon fontSize="small" sx={{ mr: 1 }} /> Share
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => openConfirmDialog('delete')} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
            </MenuItem>
          </>
        )}

        {confirmDialogType === 'livestream' && (
          <>
            {selectedItem?.status === 'live' && (
              <MenuItem onClick={() => navigate(`/live/${selectedItem?._id}/manage`)}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} /> Manage
              </MenuItem>
            )}
            <MenuItem onClick={() => openConfirmDialog('delete')} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleDialogClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, p: 1 }
        }}
      >
        <DialogTitle>
          {confirmDialogAction === 'delete' ? 'Delete' : confirmDialogAction === 'archive' ? 'Archive' : 'Unarchive'} {confirmDialogType}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {confirmDialogAction === 'delete' && `Are you sure you want to delete this ${confirmDialogType}? This action cannot be undone.`}
            {confirmDialogAction === 'archive' && `Are you sure you want to archive this ${confirmDialogType}? It will be hidden from your profile but you can unarchive it later.`}
            {confirmDialogAction === 'unarchive' && `Are you sure you want to unarchive this ${confirmDialogType}? It will be visible on your profile again.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogConfirm} color="error" variant="contained">
            {confirmDialogAction === 'delete' ? 'Delete' : confirmDialogAction === 'archive' ? 'Archive' : 'Unarchive'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Followers/Following Dialog */}
      <FollowersDialog
        open={followersDialogOpen}
        onClose={() => setFollowersDialogOpen(false)}
        userId={profileUser?._id}
        username={profileUser?.username}
        initialTab={followersDialogTab}
      />

      {/* User Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={handleCloseProfileDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            maxHeight: '80vh'
          }
        }}
      >
        {selectedUserProfile && (
          <>
            <DialogTitle sx={{ p: 0 }}>
              <Box
                sx={{
                  position: 'relative',
                  height: 120,
                  background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  p: 2
                }}
              >
                <ProfilePicture
                  user={selectedUserProfile}
                  linkToProfile={false}
                  size={{ width: 100, height: 100 }}
                  sx={{
                    border: '4px solid white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    position: 'relative',
                    top: 50,
                    bgcolor: 'white'
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={handleCloseProfileDialog}
                    sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.2)' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 7, pb: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1 }}>
                    {selectedUserProfile.username}
                  </Typography>
                  {selectedUserProfile.isVerified && (
                    <Tooltip title="Verified User from Database">
                      <VerifiedIcon color="primary" />
                    </Tooltip>
                  )}
                </Box>
                {selectedUserProfile.fullName && (
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {selectedUserProfile.fullName}
                  </Typography>
                )}
                {selectedUserProfile.bio && (
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {selectedUserProfile.bio}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{selectedUserProfile.followerCount || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Followers</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{selectedUserProfile.followingCount || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Following</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{selectedUserProfile.postCount || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Posts</Typography>
                </Box>
              </Box>

              {selectedUserProfile.suggestionReason && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Why suggested:</strong> {selectedUserProfile.suggestionReason}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => handleNavigateToProfile(selectedUserProfile.username)}
                startIcon={<PersonAddIcon />}
              >
                View Full Profile
              </Button>
              <FollowButton
                user={selectedUserProfile}
                variant="profile"
                size="medium"
                showIcon={true}
                onFollowChange={({ userId, status }) => {
                  // Update the suggested users list
                  setSuggestedUsers(prev =>
                    prev.map(u =>
                      u._id === userId
                        ? { ...u, isFollowing: status === 'following' }
                        : u
                    )
                  );

                  // Update the selected user profile
                  setSelectedUserProfile(prev => ({
                    ...prev,
                    isFollowing: status === 'following'
                  }));

                  // Show success message
                  if (status === 'following') {
                    setSnackbarMessage(`You are now following ${selectedUserProfile.username}. Their posts and reels will appear in your home feed.`);
                    setSnackbarOpen(true);

                    // Close the dialog after a short delay
                    setTimeout(() => {
                      handleCloseProfileDialog();
                    }, 1500);
                  }
                }}
              />
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Edit {editDialogType === 'post' ? 'Post' : 'Reel'}
        </DialogTitle>
        <DialogContent>
          {editItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
              {/* Preview of the post/reel */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Card sx={{
                  width: '100%',
                  maxWidth: 300,
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 3
                }}>
                  <CardMedia
                    component="img"
                    image={editDialogType === 'post'
                      ? (editItem.media?.[0]?.url || editItem.image || `https://picsum.photos/seed/post${editItem._id}/500/500`)
                      : (editItem.media?.thumbnail || editItem.thumbnail || `https://picsum.photos/seed/reel${editItem._id}/500/800`)
                    }
                    alt={editItem.caption || 'Media content'}
                    sx={{
                      height: editDialogType === 'post' ? 300 : 400,
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = editDialogType === 'post'
                        ? `https://picsum.photos/seed/post${editItem._id}/500/500`
                        : `https://picsum.photos/seed/reel${editItem._id}/500/800`;
                    }}
                  />
                </Card>
              </Box>

              <TextField
                label="Caption"
                multiline
                rows={4}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Write a caption..."
              />

              <FormControl component="fieldset">
                <FormLabel component="legend">Visibility Settings</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!editIsHidden}
                        onChange={() => setEditIsHidden(!editIsHidden)}
                        color="primary"
                      />
                    }
                    label={editIsHidden ? 'Hidden from your profile' : 'Visible on your profile'}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!editHideLikes}
                        onChange={() => setEditHideLikes(!editHideLikes)}
                        color="primary"
                      />
                    }
                    label={editHideLikes ? 'Hide likes count' : 'Show likes count'}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!editHideComments}
                        onChange={() => setEditHideComments(!editHideComments)}
                        color="primary"
                      />
                    }
                    label={editHideComments ? 'Hide comments' : 'Show comments'}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editAllowComments}
                        onChange={() => setEditAllowComments(!editAllowComments)}
                        color="primary"
                      />
                    }
                    label={editAllowComments ? 'Allow commenting' : 'Disable commenting'}
                  />
                </FormGroup>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Profile Picture Editor */}
      <ProfilePictureEditor
        open={profilePictureEditorOpen}
        onClose={() => setProfilePictureEditorOpen(false)}
        onSuccess={(newAvatarUrl) => {
          console.log('Profile picture updated with new URL:', newAvatarUrl);

          // Update the profile user with the new avatar and add timestamp to force refresh
          setProfileUser(prev => ({
            ...prev,
            avatar: newAvatarUrl || '/assets/default-avatar.png',
            avatarTimestamp: Date.now() // Add timestamp to force refresh
          }));

          // If this is the current user, also update the current user in context
          if (isCurrentUser && updateCurrentUser) {
            updateCurrentUser(prev => ({
              ...prev,
              avatar: newAvatarUrl || '/assets/default-avatar.png',
              avatarTimestamp: Date.now() // Add timestamp to force refresh
            }));
          }

          // Show success message
          setSnackbarMessage(newAvatarUrl ? 'Profile picture updated successfully' : 'Profile picture removed');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }}
        currentAvatar={profileUser?.avatar}
      />

      {/* Cover Photo Editor */}
      <CoverPhotoEditor
        open={coverPhotoEditorOpen}
        onClose={() => setCoverPhotoEditorOpen(false)}
        onSuccess={(newCoverImageUrl) => {
          console.log('Cover photo updated with new URL:', newCoverImageUrl);

          // Update the profile user with the new cover image
          setProfileUser(prev => ({
            ...prev,
            coverImage: newCoverImageUrl,
            coverImageTimestamp: Date.now() // Add timestamp to force refresh
          }));

          // If this is the current user, also update the current user in context
          if (isCurrentUser && updateCurrentUser) {
            updateCurrentUser(prev => ({
              ...prev,
              coverImage: newCoverImageUrl,
              coverImageTimestamp: Date.now() // Add timestamp to force refresh
            }));
          }

          // Show success message
          setSnackbarMessage(newCoverImageUrl ? 'Cover photo updated successfully' : 'Cover photo removed');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }}
        currentCoverImage={profileUser?.coverImage}
      />


      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editProfileDialogOpen}
        onClose={() => setEditProfileDialogOpen(false)}
        user={profileUser}
        onSuccess={handleProfileUpdateSuccess}
      />
    </Container>
  );
};
export default Profile;
