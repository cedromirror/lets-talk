import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Divider,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  useTheme,
  alpha,
  Container,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  DesignServicesRounded as DesignIcon,
  ColorLensRounded as ColorIcon,
  WidgetsRounded as ComponentsIcon,
  FavoriteRounded as HeartIcon,
  BookmarkRounded as BookmarkIcon,
  ShareRounded as ShareIcon,
  MoreVertRounded as MoreIcon,
  AddRounded as AddIcon,
  DarkModeRounded as DarkModeIcon,
  LightModeRounded as LightModeIcon
} from '@mui/icons-material';

// Import our custom components
import { MainLayout, ContentCard, PageHeader } from '../components/Layout';
import PostCard from '../components/Posts/PostCard';
import ReelPreview from '../components/Reels/ReelPreview';
import { postService, reelService } from '../services/api';

const UIDemo = () => {
  const theme = useTheme();
  const [favorite, setFavorite] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [elevated, setElevated] = useState(false);
  const [gradient, setGradient] = useState(false);
  const [interactive, setInteractive] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);

  // Handle actions
  const handleFavorite = () => setFavorite(!favorite);
  const handleBookmark = () => setBookmarked(!bookmarked);
  const handleShare = () => alert('Shared!');
  const handleMore = () => alert('More options clicked!');

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch posts and reels in parallel
        const [postsResponse, reelsResponse] = await Promise.all([
          postService.getPosts(),
          reelService.getReels()
        ]);

        setPosts(postsResponse.data || []);
        setReels(reelsResponse.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle post interactions
  const handleLikePost = (postId, isLiked) => {
    console.log(`Post ${postId} ${isLiked ? 'liked' : 'unliked'}`);
    // Update local state to reflect the change
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? {
              ...post,
              isLiked: isLiked,
              likesCount: isLiked ? (post.likesCount || 0) + 1 : (post.likesCount || 1) - 1
            }
          : post
      )
    );
  };

  const handleSavePost = (postId, isSaved) => {
    console.log(`Post ${postId} ${isSaved ? 'saved' : 'unsaved'}`);
    // Update local state to reflect the change
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? { ...post, isBookmarked: isSaved }
          : post
      )
    );
  };

  const handleDeletePost = (postId) => {
    console.log(`Post ${postId} deleted`);
    // Remove the post from the local state
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  // Handle reel interactions
  const handleLikeReel = (reelId, isLiked) => {
    console.log(`Reel ${reelId} ${isLiked ? 'liked' : 'unliked'}`);
    // Update local state to reflect the change
    setReels(prevReels =>
      prevReels.map(reel =>
        reel._id === reelId
          ? {
              ...reel,
              isLiked: isLiked,
              likesCount: isLiked ? (reel.likesCount || 0) + 1 : (reel.likesCount || 1) - 1
            }
          : reel
      )
    );
  };

  const handleSaveReel = (reelId, isSaved) => {
    console.log(`Reel ${reelId} ${isSaved ? 'saved' : 'unsaved'}`);
    // Update local state to reflect the change
    setReels(prevReels =>
      prevReels.map(reel =>
        reel._id === reelId
          ? { ...reel, isBookmarked: isSaved }
          : reel
      )
    );
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <MainLayout>
      <PageHeader
        title="UI Components Demo"
        subtitle="Explore the modern UI components available in the Let's Talk application"
        icon={<DesignIcon fontSize="large" color="primary" />}
        gradient={true}
        tag="New"
        tagColor="secondary"
        helpText="This page showcases the modern UI components that can be used throughout the application."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard', icon: <HomeIcon fontSize="small" /> },
          { label: 'UI Components', path: '/ui-demo', icon: <ComponentsIcon fontSize="small" /> }
        ]}
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: '12px',
              px: 3
            }}
          >
            Create New
          </Button>
        }
      />

      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Content Cards
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={<Switch checked={elevated} onChange={() => setElevated(!elevated)} />}
            label="Elevated"
          />
          <FormControlLabel
            control={<Switch checked={gradient} onChange={() => setGradient(!gradient)} />}
            label="Gradient Background"
          />
          <FormControlLabel
            control={<Switch checked={interactive} onChange={() => setInteractive(!interactive)} />}
            label="Interactive"
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ContentCard
              title="Basic Card"
              subtitle="A simple content card with title and subtitle"
              elevated={elevated}
              gradient={gradient}
              interactive={interactive}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="body1">
                  This is a basic content card that can be used to display various types of content.
                  It supports titles, subtitles, and custom content.
                </Typography>
              </Box>
            </ContentCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ContentCard
              title="Card with Icon"
              subtitle="A content card with an icon in the header"
              icon={<ColorIcon color="primary" fontSize="large" />}
              elevated={elevated}
              gradient={gradient}
              interactive={interactive}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="body1">
                  This card includes an icon in the header section. Icons can help users quickly
                  identify the purpose or category of the card.
                </Typography>
              </Box>
            </ContentCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ContentCard
              title="Interactive Card"
              subtitle="A card with interactive elements"
              elevated={elevated}
              gradient={gradient}
              interactive={interactive}
              favorite={favorite}
              bookmarked={bookmarked}
              onFavorite={handleFavorite}
              onBookmark={handleBookmark}
              onShare={handleShare}
              onMoreClick={handleMore}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="body1">
                  This card includes interactive elements like favorite, bookmark, share, and more options.
                  Try clicking on the icons in the header to see the interactions.
                </Typography>
              </Box>
            </ContentCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ContentCard
              title="Card with Footer"
              subtitle="A content card with a footer section"
              elevated={elevated}
              gradient={gradient}
              interactive={interactive}
              footer={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Last updated: 2 hours ago
                  </Typography>
                  <Button size="small" variant="outlined" color="primary">
                    Learn More
                  </Button>
                </Box>
              }
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="body1">
                  This card includes a footer section that can contain additional information or actions.
                  Footers are useful for displaying metadata or providing secondary actions.
                </Typography>
              </Box>
            </ContentCard>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 6 }} />

      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Real Data Components
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="UI Components" />
          <Tab label="Posts" />
          <Tab label="Reels" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ContentCard
                title="MainLayout Component"
                subtitle="A responsive layout component for content pages"
                icon={<ComponentsIcon color="primary" fontSize="large" />}
                elevated={true}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="body1" paragraph>
                    The <code>MainLayout</code> component provides a consistent layout for content pages.
                    It supports various options like full width, max width, padding, and animations.
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Example usage:
                  </Typography>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
                      border: '1px solid',
                      borderColor: theme => alpha(theme.palette.primary.main, 0.1),
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      mb: 3
                    }}
                  >
                    {`<MainLayout>
  <PageHeader title="Page Title" />
  <ContentCard>
    Your content here
  </ContentCard>
</MainLayout>`}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Props:
                      </Typography>
                      <ul>
                        <li><code>fullWidth</code> - Whether to use full width container</li>
                        <li><code>maxWidth</code> - Max width of the container</li>
                        <li><code>disablePadding</code> - Whether to disable padding</li>
                        <li><code>disableAnimation</code> - Whether to disable entrance animation</li>
                        <li><code>disablePaper</code> - Whether to disable the Paper wrapper</li>
                      </ul>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Benefits:
                      </Typography>
                      <ul>
                        <li>Consistent layout across pages</li>
                        <li>Responsive design for all screen sizes</li>
                        <li>Smooth entrance animations</li>
                        <li>Configurable options for different use cases</li>
                        <li>Modern styling with proper spacing</li>
                      </ul>
                    </Grid>
                  </Grid>
                </Box>
              </ContentCard>
            </Grid>

            <Grid item xs={12}>
              <ContentCard
                title="PageHeader Component"
                subtitle="A modern, attractive header component for pages"
                icon={<ComponentsIcon color="primary" fontSize="large" />}
                elevated={true}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="body1" paragraph>
                    The <code>PageHeader</code> component provides a consistent header for pages.
                    It supports titles, subtitles, icons, actions, breadcrumbs, and more.
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Example usage:
                  </Typography>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
                      border: '1px solid',
                      borderColor: theme => alpha(theme.palette.primary.main, 0.1),
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      mb: 3
                    }}
                  >
                    {`<PageHeader
  title="Page Title"
  subtitle="Page description or subtitle"
  icon={<Icon />}
  action={<Button>Action</Button>}
  breadcrumbs={[
    { label: 'Home', path: '/' },
    { label: 'Current Page', path: '/current' }
  ]}
/>`}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Props:
                      </Typography>
                      <ul>
                        <li><code>title</code> - The page title</li>
                        <li><code>subtitle</code> - The page subtitle or description</li>
                        <li><code>icon</code> - Icon to display next to the title</li>
                        <li><code>action</code> - Action component to display</li>
                        <li><code>breadcrumbs</code> - Array of breadcrumb items</li>
                        <li><code>gradient</code> - Whether to use gradient background for title</li>
                        <li><code>tag</code> - Optional tag to display (e.g., "New", "Beta")</li>
                      </ul>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Benefits:
                      </Typography>
                      <ul>
                        <li>Consistent header styling across pages</li>
                        <li>Clear visual hierarchy with title and subtitle</li>
                        <li>Support for breadcrumb navigation</li>
                        <li>Ability to add primary actions</li>
                        <li>Modern styling with animations</li>
                        <li>Support for tags and help text</li>
                      </ul>
                    </Grid>
                  </Grid>
                </Box>
              </ContentCard>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <>
            <Typography variant="h6" component="h2" gutterBottom>
              Posts ({posts.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ my: 2 }}>
                {error}
              </Alert>
            ) : posts.length === 0 ? (
              <Alert severity="info">No posts found. Create some posts to see them here.</Alert>
            ) : (
              <Grid container spacing={3}>
                {posts.map(post => (
                  <Grid item xs={12} key={post._id}>
                    <PostCard
                      post={post}
                      onLike={handleLikePost}
                      onBookmark={handleSavePost}
                      onDelete={handleDeletePost}
                      onComment={(post) => console.log('Comment on post:', post._id)}
                      onShare={(post) => console.log('Share post:', post._id)}
                      onEdit={(post) => console.log('Edit post:', post._id)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {activeTab === 2 && (
          <>
            <Typography variant="h6" component="h2" gutterBottom>
              Reels ({reels.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ my: 2 }}>
                {error}
              </Alert>
            ) : reels.length === 0 ? (
              <Alert severity="info">No reels found. Create some reels to see them here.</Alert>
            ) : (
              <Grid container spacing={3}>
                {reels.map(reel => (
                  <Grid item xs={12} sm={6} md={4} key={reel._id}>
                    <ReelPreview
                      reel={reel}
                      onLike={handleLikeReel}
                      onSave={handleSaveReel}
                      onComment={(reel) => console.log('Comment on reel:', reel._id)}
                      onShare={(reel) => console.log('Share reel:', reel._id)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>
    </MainLayout>
  );
};

export default UIDemo;
