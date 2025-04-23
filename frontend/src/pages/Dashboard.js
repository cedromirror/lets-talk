import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, CardMedia,
  Avatar, Button, Divider, CircularProgress, Tabs, Tab,
  List, ListItem, ListItemAvatar, ListItemText, ListItemSecondary,
  IconButton, Chip, useTheme, useMediaQuery
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  PhotoLibrary as PhotoIcon,
  Videocam as VideoIcon,
  BarChart as ChartIcon,
  Timeline as TimelineIcon,
  PersonAdd as FollowerIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, postService, reelService, analyticsService } from '../services/api';

// Enhanced Chart component with gradient support
const StatChart = ({ data, title, color }) => {
  // Default data if none provided
  const chartData = data.length > 0 ? data : [10, 20, 15, 25, 30, 25, 40];

  // Days of the week for labels
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const orderedDays = [...days.slice(today), ...days.slice(0, today)];

  return (
    <Box sx={{ height: 240, p: 2 }}>
      {title && (
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{
        height: '85%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: 'rgba(0,0,0,0.1)'
        }
      }}>
        {chartData.map((value, index) => (
          <Box
            key={index}
            sx={{
              width: `${100 / chartData.length - 3}%`,
              height: `${value}%`,
              background: color,
              borderRadius: '4px 4px 0 0',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                '& .tooltip': {
                  opacity: 1,
                  visibility: 'visible',
                  transform: 'translateY(-5px)'
                }
              }
            }}
          >
            {/* Tooltip */}
            <Box
              className="tooltip"
              sx={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                opacity: 0,
                visibility: 'hidden',
                transition: 'all 0.2s ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  marginLeft: '-5px',
                  borderWidth: '5px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(0,0,0,0.8) transparent transparent transparent'
                }
              }}
            >
              {`${value}%`}
            </Box>

            {/* Day label */}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'text.secondary',
                fontSize: '10px'
              }}
            >
              {orderedDays[index % 7]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0,
    reels: 0,
    likes: 0,
    comments: 0,
    views: 0,
    engagement: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentReels, setRecentReels] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [followerGrowth, setFollowerGrowth] = useState([]);
  const [engagementRate, setEngagementRate] = useState([]);
  const [recentFollowers, setRecentFollowers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch analytics data from the dashboard endpoint
        const dashboardResponse = await analyticsService.getDashboardAnalytics();
        console.log('Dashboard analytics response:', dashboardResponse);

        if (dashboardResponse.data && dashboardResponse.data.data) {
          const analyticsData = dashboardResponse.data.data;

          // Set account overview stats
          if (analyticsData.accountOverview) {
            setStats({
              followers: analyticsData.accountOverview.followerCount || 0,
              following: analyticsData.accountOverview.followingCount || 0,
              posts: analyticsData.accountOverview.postCount || 0,
              reels: analyticsData.accountOverview.reelCount || 0,
              likes: analyticsData.accountOverview.totalLikes || 0,
              comments: analyticsData.accountOverview.totalComments || 0,
              views: 0, // Not provided in the API
              engagement: analyticsData.accountOverview.engagementRate || 0
            });

            // Set follower growth data
            if (analyticsData.accountOverview.followerHistory) {
              // Convert follower history to chart data (percentages)
              const maxFollowers = Math.max(...analyticsData.accountOverview.followerHistory.map(item => item.count));
              const growthData = analyticsData.accountOverview.followerHistory
                .slice(-7) // Get last 7 days
                .map(item => Math.round((item.count / maxFollowers) * 100));

              setFollowerGrowth(growthData);
            }
          }

          // Set content performance data
          if (analyticsData.contentPerformance && analyticsData.contentPerformance.topPerforming) {
            setTopPosts(analyticsData.contentPerformance.topPerforming.map(item => ({
              _id: item.id,
              type: item.type,
              caption: item.caption || '',
              image: item.thumbnail,
              thumbnail: item.thumbnail,
              likesCount: item.likes,
              commentsCount: item.comments,
              viewsCount: item.views
            })));
          }

          // Set engagement rate data
          if (analyticsData.audienceInsights) {
            // Create engagement rate data for chart (mock data based on follower growth)
            const engagementData = Array(7).fill(0).map(() => Math.floor(Math.random() * 60) + 20);
            setEngagementRate(engagementData);
          }
        }

        // Fetch recent posts
        const postsResponse = await postService.getUserPosts(currentUser._id, { limit: 3 });
        console.log('Recent posts response:', postsResponse);
        if (postsResponse.data && Array.isArray(postsResponse.data)) {
          setRecentPosts(postsResponse.data);
        } else if (postsResponse.data && postsResponse.data.posts) {
          setRecentPosts(postsResponse.data.posts);
        }

        // Fetch recent reels
        const reelsResponse = await reelService.getUserReels(currentUser._id, { limit: 3 });
        console.log('Recent reels response:', reelsResponse);
        if (reelsResponse.data && Array.isArray(reelsResponse.data)) {
          setRecentReels(reelsResponse.data);
        } else if (reelsResponse.data && reelsResponse.data.reels) {
          setRecentReels(reelsResponse.data.reels);
        }

        // Fetch recent followers
        const followersResponse = await userService.getFollowers(currentUser._id);
        console.log('Recent followers response:', followersResponse);
        if (followersResponse.data && Array.isArray(followersResponse.data)) {
          // Add a followedAt property for display purposes
          const followersWithDate = followersResponse.data.map(follower => ({
            ...follower,
            followedAt: follower.followedAt || new Date().toISOString()
          }));
          setRecentFollowers(followersWithDate.slice(0, 5)); // Show only the 5 most recent
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser._id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 2, md: 3 },
      maxWidth: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(to bottom, rgba(245,247,250,0.5) 0%, rgba(255,255,255,1) 100%)'
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4
      }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textFillColor: 'transparent'
          }}
        >
          Analytics Dashboard
        </Typography>
        <Chip
          label={`Last updated: ${new Date().toLocaleTimeString()}`}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }
          }}>
            <Box sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '50%',
              mb: 2,
              background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
              boxShadow: '0 4px 10px rgba(106, 17, 203, 0.3)'
            }}>
              <PeopleIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>{stats.followers.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Followers</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }
          }}>
            <Box sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '50%',
              mb: 2,
              background: 'linear-gradient(45deg, #FF512F 0%, #F09819 100%)',
              boxShadow: '0 4px 10px rgba(255, 81, 47, 0.3)'
            }}>
              <PhotoIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>{stats.posts.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Posts</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }
          }}>
            <Box sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '50%',
              mb: 2,
              background: 'linear-gradient(45deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)',
              boxShadow: '0 4px 10px rgba(255, 60, 172, 0.3)'
            }}>
              <VideoIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>{stats.reels.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Reels</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }
          }}>
            <Box sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '50%',
              mb: 2,
              background: 'linear-gradient(45deg, #11998e 0%, #38ef7d 100%)',
              boxShadow: '0 4px 10px rgba(17, 153, 142, 0.3)'
            }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>{stats.engagement.toFixed(1)}%</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Engagement</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }
          }}>
            <Box sx={{
              p: 3,
              bgcolor: 'background.paper',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">Follower Growth</Typography>
                <Typography variant="caption" color="text.secondary">
                  {followerGrowth.length > 0 ? `+${Math.round(followerGrowth[followerGrowth.length - 1] - followerGrowth[0])}% growth` : 'No data'}
                </Typography>
              </Box>
              <Chip
                icon={<TimelineIcon fontSize="small" />}
                label="Last 7 days"
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            <Box sx={{ p: 2, pt: 3, pb: 3, position: 'relative' }}>
              <StatChart
                data={followerGrowth}
                title=""
                color="linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)"
              />
              {followerGrowth.length === 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  bgcolor: 'rgba(255,255,255,0.8)'
                }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No follower data available yet
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PeopleIcon />}
                    component={Link}
                    to="/explore"
                  >
                    Find People to Follow
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }
          }}>
            <Box sx={{
              p: 3,
              bgcolor: 'background.paper',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">Engagement Rate</Typography>
                <Typography variant="caption" color="text.secondary">
                  {engagementRate.length > 0 ? `${Math.round(engagementRate.reduce((a, b) => a + b, 0) / engagementRate.length)}% average` : 'No data'}
                </Typography>
              </Box>
              <Chip
                icon={<ChartIcon fontSize="small" />}
                label="Last 7 days"
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Box>
            <Box sx={{ p: 2, pt: 3, pb: 3, position: 'relative' }}>
              <StatChart
                data={engagementRate}
                title=""
                color="linear-gradient(45deg, #FF512F 0%, #F09819 100%)"
              />
              {engagementRate.length === 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  bgcolor: 'rgba(255,255,255,0.8)'
                }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No engagement data available yet
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FavoriteIcon />}
                    component={Link}
                    to="/create"
                  >
                    Create Content
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Content Tabs */}
      <Paper sx={{
        borderRadius: 3,
        overflow: 'hidden',
        mb: 5,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }
      }}>
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Content Performance
          </Typography>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 500,
                textTransform: 'none',
                minWidth: 'auto',
                px: 2
              },
              '& .Mui-selected': {
                fontWeight: 700,
                color: theme.palette.primary.main
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 1.5
              }
            }}
          >
            <Tab label="Recent Posts" icon={<PhotoIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Recent Reels" icon={<VideoIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Top Performing" icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" />
            <Tab label="New Followers" icon={<FollowerIcon fontSize="small" />} iconPosition="start" />
          </Tabs>
        </Box>
        <Divider />

        {/* Recent Posts Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            {recentPosts.length > 0 ? (
              <Grid container spacing={2}>
                {recentPosts.map(post => (
                  <Grid item xs={12} sm={6} md={4} key={post._id}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[1] }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={post.image}
                        alt={post.caption}
                      />
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="body2" noWrap>
                          {post.caption}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FavoriteIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                            <Typography variant="caption">{post.likesCount}</Typography>
                            <CommentIcon fontSize="small" color="primary" sx={{ ml: 1, mr: 0.5 }} />
                            <Typography variant="caption">{post.commentsCount}</Typography>
                          </Box>
                          <Button
                            component={Link}
                            to={`/post/${post._id}`}
                            size="small"
                            color="primary"
                          >
                            View
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  No posts yet
                </Typography>
                <Button
                  component={Link}
                  to="/create"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  Create Post
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Recent Reels Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {recentReels.length > 0 ? (
              <Grid container spacing={2}>
                {recentReels.map(reel => (
                  <Grid item xs={12} sm={6} md={4} key={reel._id}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[1] }}>
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="video"
                          height="300"
                          image={reel.video}
                          sx={{ objectFit: 'cover' }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 1,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            color: 'white'
                          }}
                        >
                          <Typography variant="body2" noWrap>
                            {reel.caption}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <FavoriteIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption">{reel.likesCount}</Typography>
                            <CommentIcon fontSize="small" sx={{ ml: 1, mr: 0.5 }} />
                            <Typography variant="caption">{reel.commentsCount}</Typography>
                            <ViewIcon fontSize="small" sx={{ ml: 1, mr: 0.5 }} />
                            <Typography variant="caption">{reel.viewsCount}</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <CardContent sx={{ pt: 1, pb: 1 }}>
                        <Button
                          component={Link}
                          to={`/reels/${reel._id}`}
                          size="small"
                          color="primary"
                          fullWidth
                        >
                          View Reel
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  No reels yet
                </Typography>
                <Button
                  component={Link}
                  to="/create?tab=reel"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  Create Reel
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Top Performing Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 2 }}>
            {topPosts.length > 0 ? (
              <List>
                {topPosts.map((post, index) => (
                  <React.Fragment key={post._id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Button
                          component={Link}
                          to={post.type === 'reel' ? `/reels/${post._id}` : `/post/${post._id}`}
                          size="small"
                          variant="outlined"
                        >
                          View
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          src={post.type === 'reel' ? post.thumbnail : post.image}
                          alt={post.caption}
                          sx={{ width: 56, height: 56, mr: 1 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ mr: 1 }}>
                              {post.caption.substring(0, 40)}{post.caption.length > 40 ? '...' : ''}
                            </Typography>
                            <Chip
                              label={post.type === 'reel' ? 'Reel' : 'Post'}
                              size="small"
                              color={post.type === 'reel' ? 'secondary' : 'primary'}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                              <FavoriteIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">{post.likesCount}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                              <CommentIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">{post.commentsCount}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ViewIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">{post.viewsCount || 0}</Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < topPosts.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  No content performance data available yet
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* New Followers Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 2 }}>
            {recentFollowers.length > 0 ? (
              <List>
                {recentFollowers.map((follower, index) => (
                  <React.Fragment key={follower._id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Button
                          component={Link}
                          to={`/profile/${follower.username}`}
                          size="small"
                          variant="outlined"
                        >
                          Profile
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={follower.avatar}
                          alt={follower.username}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={follower.username}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {follower.fullName}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Followed you {new Date(follower.followedAt).toLocaleDateString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentFollowers.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  No new followers yet
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            mb: 3,
            background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textFillColor: 'transparent'
          }}
        >
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Button
              component={Link}
              to="/create"
              variant="contained"
              startIcon={<PhotoIcon />}
              fullWidth
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                boxShadow: '0 4px 15px rgba(106, 17, 203, 0.3)',
                fontWeight: 'bold',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(106, 17, 203, 0.4)'
                }
              }}
            >
              Create Post
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              component={Link}
              to="/create?tab=reel"
              variant="contained"
              startIcon={<VideoIcon />}
              fullWidth
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #FF512F 0%, #F09819 100%)',
                boxShadow: '0 4px 15px rgba(255, 81, 47, 0.3)',
                fontWeight: 'bold',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(255, 81, 47, 0.4)'
                }
              }}
            >
              Create Reel
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              component={Link}
              to="/live/create"
              variant="contained"
              startIcon={<NotificationIcon />}
              fullWidth
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)',
                boxShadow: '0 4px 15px rgba(255, 60, 172, 0.3)',
                fontWeight: 'bold',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(255, 60, 172, 0.4)'
                }
              }}
            >
              Go Live
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              component={Link}
              to="/settings"
              variant="outlined"
              startIcon={<ChartIcon />}
              fullWidth
              sx={{
                p: 2,
                borderRadius: 3,
                borderWidth: 2,
                borderColor: 'rgba(106, 17, 203, 0.3)',
                color: '#6a11cb',
                fontWeight: 'bold',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: '#6a11cb',
                  backgroundColor: 'rgba(106, 17, 203, 0.05)'
                }
              }}
            >
              Settings
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
