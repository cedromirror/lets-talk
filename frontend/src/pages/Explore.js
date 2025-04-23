import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { exploreService, searchService, userService, shopService } from '../services/api';
import ProfilePicture from '../components/common/ProfilePicture';

// Material-UI imports
import {
  Box, Container, Typography, Grid, Card, CardMedia, CardContent,
  CardActions, Avatar, Button, TextField, InputAdornment, IconButton,
  Tabs, Tab, CircularProgress, Chip, Divider, Paper, Skeleton, Tooltip
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

// Material-UI icons
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PhotoIcon from '@mui/icons-material/Photo';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PeopleIcon from '@mui/icons-material/People';
import TagIcon from '@mui/icons-material/Tag';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Explore = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Content states
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [products, setProducts] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter and sort states
  const [sortBy, setSortBy] = useState('trending');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Pagination states for different content types
  const [postsPage, setPostsPage] = useState(1);
  const [reelsPage, setReelsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreReels, setHasMoreReels] = useState(true);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Following states
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followLoading, setFollowLoading] = useState({});

  // Fetch explore content
  useEffect(() => {
    const fetchExploreContent = async () => {
      try {
        setLoading(true);
        setPage(1);

        // Fetch trending content
        const trendingResponse = await exploreService.getTrending();
        console.log('Trending content:', trendingResponse.data);

        // Process posts to ensure they have all required fields
        const processedPosts = (trendingResponse.data.posts || []).map(post => ({
          ...post,
          likesCount: post.likesCount || post.likes?.length || 0,
          commentsCount: post.commentsCount || post.comments?.length || 0,
          user: post.user || {
            _id: post.user?._id || 'unknown',
            username: post.user?.username || 'unknown',
            avatar: post.user?.avatar || null,
            fullName: post.user?.fullName || ''
          },
          isLiked: post.isLiked || false,
          isSaved: post.isSaved || false
        }));

        // Process reels to ensure they have all required fields
        const processedReels = (trendingResponse.data.reels || []).map(reel => ({
          ...reel,
          likesCount: reel.likesCount || reel.likes?.length || 0,
          commentsCount: reel.commentsCount || reel.comments?.length || 0,
          user: reel.user || {
            _id: reel.user?._id || 'unknown',
            username: reel.user?.username || 'unknown',
            avatar: reel.user?.avatar || null,
            fullName: reel.user?.fullName || ''
          },
          isLiked: reel.isLiked || false,
          isSaved: reel.isSaved || false
        }));

        // Process users to ensure they have all required fields
        const processedUsers = (trendingResponse.data.users || []).map(user => ({
          ...user,
          avatar: user.avatar || null,
          fullName: user.fullName || '',
          followersCount: user.followersCount || user.followers?.length || 0,
          followingCount: user.followingCount || user.following?.length || 0,
          isFollowing: followingUsers.includes(user._id)
        }));

        setPosts(processedPosts);
        setReels(processedReels);
        setUsers(processedUsers);
        setTags(trendingResponse.data.tags || []);

        // Fetch shop products
        try {
          const productsResponse = await shopService.getProducts(1, 10);
          console.log('Shop products:', productsResponse.data);
          setProducts(productsResponse.data.products || []);
        } catch (productError) {
          console.error('Error fetching shop products:', productError);
          setProducts([]);
        }

        setError(null);
        setHasMore(processedPosts.length >= 10 || processedReels.length >= 10);
      } catch (err) {
        console.error('Error fetching explore content:', err);
        setError('Failed to load explore content. Please try again.');
        setPosts([]);
        setReels([]);
        setUsers([]);
        setTags([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExploreContent();
  }, [followingUsers]);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setIsSearching(true);

      const response = await searchService.searchAll(searchQuery);
      console.log('Search results:', response.data);

      // Process search results to ensure they have all required fields
      const processedResults = {
        users: (response.data.users || []).map(user => ({
          ...user,
          avatar: user.avatar || null,
          fullName: user.fullName || '',
          followersCount: user.followersCount || user.followers?.length || 0,
          followingCount: user.followingCount || user.following?.length || 0,
          isFollowing: followingUsers.includes(user._id)
        })),
        posts: (response.data.posts || []).map(post => ({
          ...post,
          likesCount: post.likesCount || post.likes?.length || 0,
          commentsCount: post.commentsCount || post.comments?.length || 0,
          user: post.user || {
            _id: post.user?._id || 'unknown',
            username: post.user?.username || 'unknown',
            avatar: post.user?.avatar || null,
            fullName: post.user?.fullName || ''
          }
        })),
        tags: response.data.tags || []
      };

      setSearchResults(processedResults);
      setIsSearching(false);
    } catch (err) {
      console.error('Error searching:', err);
      setSearchResults({
        users: [],
        posts: [],
        tags: []
      });
      setIsSearching(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // Fetch following users
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!currentUser) return;

      try {
        const response = await userService.getFollowing(currentUser._id);
        console.log('Following users:', response.data);

        // Extract user IDs from the following list
        const followingIds = (response.data.following || []).map(follow => follow.user._id || follow.user);
        setFollowingUsers(followingIds);
      } catch (err) {
        console.error('Error fetching following users:', err);
      }
    };

    fetchFollowing();
  }, [currentUser]);

  // Load more posts
  const loadMorePosts = async () => {
    if (!hasMorePosts || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = postsPage + 1;
      const response = await exploreService.getExplorePosts(nextPage, 12);

      const newPosts = response.data.posts || [];
      if (newPosts.length > 0) {
        // Process posts to ensure they have all required fields
        const processedPosts = newPosts.map(post => ({
          ...post,
          likesCount: post.likesCount || post.likes?.length || 0,
          commentsCount: post.commentsCount || post.comments?.length || 0,
          user: post.user || {
            _id: post.user?._id || 'unknown',
            username: post.user?.username || 'unknown',
            avatar: post.user?.avatar || null,
            fullName: post.user?.fullName || ''
          },
          isLiked: post.isLiked || false,
          isSaved: post.isSaved || false
        }));

        setPosts(prev => [...prev, ...processedPosts]);
        setPostsPage(nextPage);
        setHasMorePosts(newPosts.length >= 12);
      } else {
        setHasMorePosts(false);
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load more reels
  const loadMoreReels = async () => {
    if (!hasMoreReels || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = reelsPage + 1;
      const response = await exploreService.getExploreReels(nextPage, 12);

      const newReels = response.data.reels || [];
      if (newReels.length > 0) {
        // Process reels to ensure they have all required fields
        const processedReels = newReels.map(reel => ({
          ...reel,
          likesCount: reel.likesCount || reel.likes?.length || 0,
          commentsCount: reel.commentsCount || reel.comments?.length || 0,
          user: reel.user || {
            _id: reel.user?._id || 'unknown',
            username: reel.user?.username || 'unknown',
            avatar: reel.user?.avatar || null,
            fullName: reel.user?.fullName || ''
          },
          isLiked: reel.isLiked || false,
          isSaved: reel.isSaved || false
        }));

        setReels(prev => [...prev, ...processedReels]);
        setReelsPage(nextPage);
        setHasMoreReels(newReels.length >= 12);
      } else {
        setHasMoreReels(false);
      }
    } catch (err) {
      console.error('Error loading more reels:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load more users
  const loadMoreUsers = async () => {
    if (!hasMoreUsers || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = usersPage + 1;
      const response = await exploreService.getExploreUsers(nextPage, 12);

      const newUsers = response.data.users || [];
      if (newUsers.length > 0) {
        // Process users to ensure they have all required fields
        const processedUsers = newUsers.map(user => ({
          ...user,
          avatar: user.avatar || null,
          fullName: user.fullName || '',
          followersCount: user.followersCount || user.followers?.length || 0,
          followingCount: user.followingCount || user.following?.length || 0,
          isFollowing: followingUsers.includes(user._id)
        }));

        setUsers(prev => [...prev, ...processedUsers]);
        setUsersPage(nextPage);
        setHasMoreUsers(newUsers.length >= 12);
      } else {
        setHasMoreUsers(false);
      }
    } catch (err) {
      console.error('Error loading more users:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load more products
  const loadMoreProducts = async () => {
    if (!hasMoreProducts || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = productsPage + 1;
      const response = await shopService.getProducts(nextPage, 12);

      const newProducts = response.data.products || [];
      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        setProductsPage(nextPage);
        setHasMoreProducts(newProducts.length >= 12);
      } else {
        setHasMoreProducts(false);
      }
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle follow/unfollow user
  const handleFollowUser = async (userId) => {
    if (!currentUser) return;

    // Set loading state for this specific user
    setFollowLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const isFollowing = followingUsers.includes(userId);

      if (isFollowing) {
        // Unfollow user
        await userService.unfollowUser(userId);
        setFollowingUsers(prev => prev.filter(id => id !== userId));
      } else {
        // Follow user
        await userService.followUser(userId);
        setFollowingUsers(prev => [...prev, userId]);
      }

      // Update users list
      setUsers(prev =>
        prev.map(user =>
          user._id === userId
            ? {
                ...user,
                isFollowing: !user.isFollowing,
                followersCount: user.isFollowing ? user.followersCount - 1 : user.followersCount + 1
              }
            : user
        )
      );

      // Update search results if they exist
      if (searchResults && searchResults.users) {
        setSearchResults(prev => ({
          ...prev,
          users: prev.users.map(user =>
            user._id === userId
              ? {
                  ...user,
                  isFollowing: !user.isFollowing,
                  followersCount: user.isFollowing ? user.followersCount - 1 : user.followersCount + 1
                }
              : user
          )
        }));
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Loading skeletons
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header skeleton */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              <Skeleton width={150} />
            </Typography>
          </Box>
          <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: '50px' }} />
        </Paper>

        {/* Tabs skeleton */}
        <Skeleton variant="rounded" width="100%" height={70} sx={{ mb: 3, borderRadius: 1 }} />

        {/* Section header skeleton */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
            <Skeleton width={180} height={32} />
          </Box>
          <Skeleton width={100} height={36} />
        </Box>

        {/* Content skeletons */}
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(item => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
              <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2, height: '100%', transition: 'transform 0.3s' }}>
                <Skeleton variant="rectangular" width="100%" height={240} />
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
                    <Skeleton width="70%" height={24} />
                  </Box>
                  <Skeleton width="90%" height={16} sx={{ mb: 0.5 }} />
                  <Skeleton width="60%" height={16} sx={{ mb: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Skeleton width={60} height={24} />
                    <Skeleton width={60} height={24} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            maxWidth: 600,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'error.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}
          >
            <ClearIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We couldn't load the explore content. This might be due to a network issue or server problem.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              sx={{ borderRadius: '50px', px: 3 }}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              onClick={() => setError(null)}
              sx={{ borderRadius: '50px', px: 3 }}
            >
              Dismiss
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon fontSize="large" color="primary" />
            Explore
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', width: '100%', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <TextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for people, posts, or tags"
            variant="outlined"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchQuery('')} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '50px',
                pr: searchQuery ? 0.5 : 2
              }
            }}
          />
          <Box sx={{ display: 'flex', ml: { xs: 0, sm: 1 }, mt: { xs: 1, sm: 0 } }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSearching}
              sx={{
                borderRadius: '50px',
                px: 3,
                minWidth: { xs: '100%', sm: 120 }
              }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            {searchResults && (
              <Button
                variant="outlined"
                onClick={clearSearch}
                sx={{
                  ml: 1,
                  borderRadius: '50px',
                  minWidth: { xs: 'auto', sm: 100 }
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {searchResults ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            Search Results for "{searchQuery}"
          </Typography>

          {/* Users */}
          {searchResults.users && searchResults.users.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon color="primary" />
                People ({searchResults.users.length})
              </Typography>
              <Grid container spacing={2}>
                {searchResults.users.map(user => (
                  <Grid item xs={12} sm={6} md={4} key={user._id}>
                    <Card sx={{ display: 'flex', p: 2, height: '100%' }}>
                      <ProfilePicture
                        user={user}
                        alt={user.username}
                        linkToProfile={true}
                        size={{ width: 60, height: 60 }}
                      />
                      <Box sx={{ ml: 2, flexGrow: 1 }}>
                        <Typography
                          variant="subtitle1"
                          component={Link}
                          to={`/profile/${user.username}`}
                          sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 'bold' }}
                        >
                          {user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {user.followersCount} followers
                        </Typography>
                        <Button
                          variant={user.isFollowing ? "outlined" : "contained"}
                          size="small"
                          sx={{ mt: 1 }}
                          // Removed startIcon to simplify the UI
                          onClick={(e) => {
                            e.preventDefault();
                            handleFollowUser(user._id);
                          }}
                          disabled={followLoading[user._id]}
                        >
                          {followLoading[user._id] ? 'Loading...' : (user.isFollowing ? 'Unfollow' : 'Follow')}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Posts */}
          {searchResults.posts && searchResults.posts.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoIcon color="primary" />
                Posts ({searchResults.posts.length})
              </Typography>
              <Grid container spacing={2}>
                {searchResults.posts.map(post => (
                  <Grid item xs={12} sm={6} md={4} key={post._id}>
                    <Card
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          '& .MuiCardMedia-overlay': {
                            opacity: 1
                          }
                        }
                      }}
                      component={Link}
                      to={`/post/${post._id}`}
                    >
                      <CardMedia
                        component="img"
                        image={post.image || '/assets/default-post.jpg'}
                        alt={post.caption}
                        sx={{ height: 240, objectFit: 'cover' }}
                      />
                      <Box
                        className="MuiCardMedia-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 3, color: 'white' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2">{post.likesCount} likes</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2">{post.commentsCount} comments</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Tags */}
          {searchResults.tags && searchResults.tags.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TagIcon color="primary" />
                Tags ({searchResults.tags.length})
              </Typography>
              <Grid container spacing={2}>
                {searchResults.tags.map(tag => (
                  <Grid item xs={12} sm={6} md={4} key={tag._id || tag.name}>
                    <Card
                      sx={{ p: 2, height: '100%' }}
                      component={Link}
                      to={`/explore/tags/${tag.name}`}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        #{tag.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tag.postsCount || 0} posts
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* No results */}
          {(!searchResults.users || searchResults.users.length === 0) &&
           (!searchResults.posts || searchResults.posts.length === 0) &&
           (!searchResults.tags || searchResults.tags.length === 0) && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                mt: 2
              }}
            >
              <Typography variant="h6" gutterBottom>
                No results found for "{searchQuery}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try searching with different keywords or check your spelling.
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 3, borderRadius: 1, p: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 1 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    minWidth: 100,
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }
                }}
              >
              <Tab
                value="all"
                label="All"
                icon={<HomeIcon />}
                iconPosition="start"
              />
              <Tab
                value="posts"
                label="Posts"
                icon={<PhotoIcon />}
                iconPosition="start"
              />
              <Tab
                value="reels"
                label="Reels"
                icon={<VideoLibraryIcon />}
                iconPosition="start"
              />
              <Tab
                value="people"
                label="People"
                icon={<PeopleIcon />}
                iconPosition="start"
              />
              <Tab
                value="tags"
                label="Tags"
                icon={<TagIcon />}
                iconPosition="start"
              />
              <Tab
                value="shop"
                label="Shop"
                icon={<ShoppingBagIcon />}
                iconPosition="start"
              />
              </Tabs>

              <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 }, justifyContent: { xs: 'center', md: 'flex-end' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <SortIcon fontSize="small" sx={{ mr: 0.5 }} /> Sort:
                  </Typography>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper
                    }}
                  >
                    <option value="trending">Trending</option>
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} /> Filter:
                  </Typography>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper
                    }}
                  >
                    <option value="all">All</option>
                    <option value="following">Following</option>
                    <option value="suggested">Suggested</option>
                  </select>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <Tooltip title="Grid View">
                    <IconButton
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                      onClick={() => setViewMode('grid')}
                      size="small"
                    >
                      <ViewModuleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="List View">
                    <IconButton
                      color={viewMode === 'list' ? 'primary' : 'default'}
                      onClick={() => setViewMode('list')}
                      size="small"
                    >
                      <ViewListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Box>
            {/* All Content */}
            {activeTab === 'all' && (
              <>
                {/* Suggested People */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon color="primary" />
                      Suggested People to Follow
                      <Chip
                        label={users.length}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Button
                      variant="text"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        setLoading(true);
                        exploreService.getExploreUsers(1, 12)
                          .then(response => {
                            const newUsers = response.data.users || [];
                            const processedUsers = newUsers.map(user => ({
                              ...user,
                              avatar: user.avatar || null,
                              fullName: user.fullName || '',
                              followersCount: user.followersCount || user.followers?.length || 0,
                              followingCount: user.followingCount || user.following?.length || 0,
                              isFollowing: followingUsers.includes(user._id)
                            }));
                            setUsers(processedUsers);
                          })
                          .finally(() => setLoading(false));
                      }}
                    >
                      Refresh
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {users.map(user => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={user._id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <ProfilePicture
                            user={user}
                            alt={user.username}
                            linkToProfile={true}
                            size={{ width: 80, height: 80 }}
                            sx={{ mx: 'auto', mb: 1 }}
                          />
                          <Typography
                            variant="subtitle1"
                            component={Link}
                            to={`/profile/${user.username}`}
                            sx={{
                              textDecoration: 'none',
                              color: 'text.primary',
                              fontWeight: 'bold',
                              display: 'block',
                              mb: 0.5
                            }}
                          >
                            {user.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {user.fullName}
                          </Typography>
                          <Button
                            variant={user.isFollowing ? "outlined" : "contained"}
                            size="small"
                            fullWidth
                            sx={{ mt: 1 }}
                            // Removed startIcon to simplify the UI
                            onClick={(e) => {
                              e.preventDefault();
                              handleFollowUser(user._id);
                            }}
                            disabled={followLoading[user._id]}
                          >
                            {followLoading[user._id] ? 'Loading...' : (user.isFollowing ? 'Unfollow' : 'Follow')}
                          </Button>
                        </Box>
                      </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {hasMoreUsers && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        onClick={loadMoreUsers}
                        disabled={loadingMore}
                        sx={{ minWidth: 150 }}
                      >
                        {loadingMore ? (
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                        ) : 'Load More Users'}
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Popular Posts */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhotoIcon color="primary" />
                      Popular Posts
                      <Chip
                        label={posts.length}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Button
                      variant="text"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        setLoading(true);
                        exploreService.getExplorePosts(1, 12)
                          .then(response => {
                            const newPosts = response.data.posts || [];
                            const processedPosts = newPosts.map(post => ({
                              ...post,
                              likesCount: post.likesCount || post.likes?.length || 0,
                              commentsCount: post.commentsCount || post.comments?.length || 0,
                              user: post.user || {
                                _id: post.user?._id || 'unknown',
                                username: post.user?.username || 'unknown',
                                avatar: post.user?.avatar || null,
                                fullName: post.user?.fullName || ''
                              },
                              isLiked: post.isLiked || false,
                              isSaved: post.isSaved || false
                            }));
                            setPosts(processedPosts);
                          })
                          .finally(() => setLoading(false));
                      }}
                    >
                      Refresh
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {posts.map(post => (
                      <Grid item xs={12} sm={6} md={4} key={post._id}>
                        <Card
                          sx={{
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              '& .MuiCardMedia-overlay': {
                                opacity: 1
                              }
                            }
                          }}
                          component={Link}
                          to={`/post/${post._id}`}
                        >
                          <CardMedia
                            component="img"
                            image={post.image || '/assets/default-post.jpg'}
                            alt={post.caption}
                            sx={{ height: 240, objectFit: 'cover' }}
                          />
                          <Box
                            className="MuiCardMedia-overlay"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              bgcolor: 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.3s'
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 3, color: 'white' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2">{post.likesCount} likes</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2">{post.commentsCount} comments</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {hasMorePosts && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        onClick={loadMorePosts}
                        disabled={loadingMore}
                        sx={{ minWidth: 150 }}
                      >
                        {loadingMore ? (
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                        ) : 'Load More Posts'}
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Trending Reels */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideoLibraryIcon color="primary" />
                      Trending Reels
                      <Chip
                        label={reels.length}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Button
                      variant="text"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        setLoading(true);
                        exploreService.getExploreReels(1, 12)
                          .then(response => {
                            const newReels = response.data.reels || [];
                            const processedReels = newReels.map(reel => ({
                              ...reel,
                              likesCount: reel.likesCount || reel.likes?.length || 0,
                              commentsCount: reel.commentsCount || reel.comments?.length || 0,
                              user: reel.user || {
                                _id: reel.user?._id || 'unknown',
                                username: reel.user?.username || 'unknown',
                                avatar: reel.user?.avatar || null,
                                fullName: reel.user?.fullName || ''
                              },
                              isLiked: reel.isLiked || false,
                              isSaved: reel.isSaved || false
                            }));
                            setReels(processedReels);
                          })
                          .finally(() => setLoading(false));
                      }}
                    >
                      Refresh
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {reels.map(reel => (
                      <Grid item xs={12} sm={6} md={4} key={reel._id}>
                        <Card
                          sx={{
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              '& .MuiCardMedia-overlay': {
                                opacity: 1
                              }
                            }
                          }}
                          component={Link}
                          to={`/reels/${reel._id}`}
                        >
                          <CardMedia
                            component="video"
                            src={reel.video || '/assets/default-video.mp4'}
                            sx={{ height: 240, objectFit: 'cover' }}
                          />
                          <Box
                            className="MuiCardMedia-overlay"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              bgcolor: 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.3s'
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 3, color: 'white' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2">{reel.likesCount} likes</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2">{reel.commentsCount} comments</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {hasMoreReels && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        onClick={loadMoreReels}
                        disabled={loadingMore}
                        sx={{ minWidth: 150 }}
                      >
                        {loadingMore ? (
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                        ) : 'Load More Reels'}
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Popular Tags */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TagIcon color="primary" />
                      Popular Tags
                      <Chip
                        label={tags.length}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    {tags.map(tag => (
                      <Grid item xs={6} sm={4} md={3} key={tag._id || tag.name}>
                        <Card
                          sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: 2,
                            transition: 'all 0.3s',
                            boxShadow: 2,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4
                            }
                          }}
                          component={Link}
                          to={`/explore/tags/${tag.name}`}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            #{tag.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {tag.postsCount || 0} posts
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Shop Products */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingBagIcon color="primary" />
                      Shop Products
                      <Chip
                        label={products.length}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    {products.length > 0 ? (
                      products.map(product => (
                        <Grid item xs={12} sm={6} md={4} key={product._id}>
                          <Card sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 2,
                            transition: 'all 0.3s',
                            boxShadow: 2,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4
                            }
                          }}>
                            <CardMedia
                              component="img"
                              image={product.images?.[0] || '/assets/default-product.jpg'}
                              alt={product.name}
                              sx={{ height: 200, objectFit: 'cover' }}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" gutterBottom>
                                {product.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {product.description?.substring(0, 100)}...
                              </Typography>
                              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                ${product.price?.toFixed(2)}
                              </Typography>
                            </CardContent>
                            <CardActions>
                              <Button size="small" color="primary">
                                View Details
                              </Button>
                              <Button size="small" color="primary">
                                Add to Cart
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`
                          }}
                        >
                          <Typography variant="body1" color="text.secondary">
                            No products available at the moment. Check back later for exciting products from our shop!
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>

                  {products.length > 0 && hasMoreProducts && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        onClick={loadMoreProducts}
                        disabled={loadingMore}
                        sx={{ minWidth: 150 }}
                      >
                        {loadingMore ? (
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                        ) : 'Load More Products'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhotoIcon color="primary" />
                    Explore Posts
                    <Chip
                      label={posts.length}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setLoading(true);
                      exploreService.getExplorePosts(1, 12)
                        .then(response => {
                          const newPosts = response.data.posts || [];
                          const processedPosts = newPosts.map(post => ({
                            ...post,
                            likesCount: post.likesCount || post.likes?.length || 0,
                            commentsCount: post.commentsCount || post.comments?.length || 0,
                            user: post.user || {
                              _id: post.user?._id || 'unknown',
                              username: post.user?.username || 'unknown',
                              avatar: post.user?.avatar || null,
                              fullName: post.user?.fullName || ''
                            },
                            isLiked: post.isLiked || false,
                            isSaved: post.isSaved || false
                          }));
                          setPosts(processedPosts);
                        })
                        .finally(() => setLoading(false));
                    }}
                  >
                    Refresh
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {posts.map(post => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={post._id}>
                      <Card
                        sx={{
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.3s',
                          boxShadow: 2,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                            '& .MuiCardMedia-overlay': {
                              opacity: 1
                            }
                          }
                        }}
                        component={Link}
                        to={`/post/${post._id}`}
                      >
                        <CardMedia
                          component="img"
                          image={post.media?.[0]?.url || post.image || `https://picsum.photos/seed/post${post._id}/500/500`}
                          alt={post.caption}
                          sx={{ height: 240, objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://picsum.photos/seed/post${post._id}/500/500`;
                          }}
                        />
                        <Box
                          className="MuiCardMedia-overlay"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s'
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 3, color: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2">{post.likesCount} likes</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2">{post.commentsCount} comments</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {posts.length === 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No posts available at the moment. Check back later for exciting content!
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Reels Tab */}
            {activeTab === 'reels' && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VideoLibraryIcon color="primary" />
                    Explore Reels
                    <Chip
                      label={reels.length}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setLoading(true);
                      exploreService.getExploreReels(1, 12)
                        .then(response => {
                          const newReels = response.data.reels || [];
                          const processedReels = newReels.map(reel => ({
                            ...reel,
                            likesCount: reel.likesCount || reel.likes?.length || 0,
                            commentsCount: reel.commentsCount || reel.comments?.length || 0,
                            user: reel.user || {
                              _id: reel.user?._id || 'unknown',
                              username: reel.user?.username || 'unknown',
                              avatar: reel.user?.avatar || null,
                              fullName: reel.user?.fullName || ''
                            },
                            isLiked: reel.isLiked || false,
                            isSaved: reel.isSaved || false
                          }));
                          setReels(processedReels);
                        })
                        .finally(() => setLoading(false));
                    }}
                  >
                    Refresh
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {reels.map(reel => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={reel._id}>
                      <Card
                        sx={{
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.3s',
                          boxShadow: 2,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                            '& .MuiCardMedia-overlay': {
                              opacity: 1
                            }
                          }
                        }}
                        component={Link}
                        to={`/reels/${reel._id}`}
                      >
                        {reel.media?.thumbnail ? (
                          <CardMedia
                            component="img"
                            image={reel.media.thumbnail || `https://picsum.photos/seed/reel${reel._id}/500/500`}
                            alt={reel.caption}
                            sx={{ height: 240, objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://picsum.photos/seed/reel${reel._id}/500/500`;
                            }}
                          />
                        ) : (
                          <CardMedia
                            component="img"
                            image={`https://picsum.photos/seed/reel${reel._id}/500/500`}
                            alt={reel.caption}
                            sx={{ height: 240, objectFit: 'cover' }}
                          />
                        )}
                        <Box
                          className="MuiCardMedia-overlay"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s'
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 3, color: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2">{reel.likesCount} likes</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CommentIcon sx={{ mr: 0.5 }} />
                              <Typography variant="body2">{reel.commentsCount}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {reels.length === 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No reels available at the moment. Check back later for exciting video content!
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* People Tab */}
            {activeTab === 'people' && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon color="primary" />
                    Discover People
                    <Chip
                      label={users.length}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setLoading(true);
                      exploreService.getExploreUsers(1, 12)
                        .then(response => {
                          const newUsers = response.data.users || [];
                          const processedUsers = newUsers.map(user => ({
                            ...user,
                            avatar: user.avatar || null,
                            fullName: user.fullName || '',
                            followersCount: user.followersCount || user.followers?.length || 0,
                            followingCount: user.followingCount || user.following?.length || 0,
                            isFollowing: followingUsers.includes(user._id)
                          }));
                          setUsers(processedUsers);
                        })
                        .finally(() => setLoading(false));
                    }}
                  >
                    Refresh
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {users.map(user => (
                    <Grid item xs={12} sm={6} md={4} key={user._id}>
                      <Card sx={{
                        display: 'flex',
                        p: 2,
                        height: '100%',
                        borderRadius: 2,
                        transition: 'all 0.3s',
                        boxShadow: 2,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}>
                        <ProfilePicture
                          user={user}
                          alt={user.username}
                          linkToProfile={true}
                          size={{ width: 60, height: 60 }}
                        />
                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                          <Typography
                            variant="subtitle1"
                            component={Link}
                            to={`/profile/${user.username}`}
                            sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 'bold' }}
                          >
                            {user.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {user.followersCount} followers
                          </Typography>
                          <Button
                            variant={user.isFollowing ? "outlined" : "contained"}
                            size="small"
                            sx={{ mt: 1 }}
                            startIcon={user.isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                            onClick={(e) => {
                              e.preventDefault();
                              handleFollowUser(user._id);
                            }}
                            disabled={followLoading[user._id]}
                          >
                            {followLoading[user._id] ? 'Loading...' : (user.isFollowing ? 'Unfollow' : 'Follow')}
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {users.length === 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No users available at the moment. Check back later to discover new people to follow!
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TagIcon color="primary" />
                    Explore Tags
                    <Chip
                      label={tags.length}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {tags.map(tag => (
                    <Grid item xs={6} sm={4} md={3} key={tag._id || tag.name}>
                      <Card
                        sx={{ p: 2, height: '100%' }}
                        component={Link}
                        to={`/explore/tags/${tag.name}`}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          #{tag.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tag.postsCount || 0} posts
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {tags.length === 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No tags available at the moment. Check back later for trending hashtags!
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Shop Tab */}
            {activeTab === 'shop' && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingBagIcon color="primary" />
                    Shop Products
                    <Chip
                      label={products.length}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {products.length > 0 ? (
                    products.map(product => (
                      <Grid item xs={12} sm={6} md={4} key={product._id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardMedia
                            component="img"
                            image={product.images?.[0] || `https://picsum.photos/seed/product${product._id}/500/500`}
                            alt={product.name}
                            sx={{ height: 200, objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://picsum.photos/seed/product${product._id}/500/500`;
                            }}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {product.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {product.description?.substring(0, 100)}...
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                              ${product.price?.toFixed(2)}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button size="small" color="primary">
                              View Details
                            </Button>
                            <Button size="small" color="primary">
                              Add to Cart
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`
                        }}
                      >
                        <Typography variant="body1" color="text.secondary">
                          No products available at the moment. Check back later for exciting products from our shop!
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

// Make sure the component is properly exported
const ExploreComponent = Explore;
export default ExploreComponent;
